import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { Product } from '@/lib/types';
import { NutritionService } from '@/lib/services/nutrition-service';
import { AllergenService } from '@/lib/services/allergen-service';
import { AIService } from '@/lib/services/ai-service';

export async function GET(request: Request) {
  try {
    await db.sync();

    const { searchParams } = new URL(request.url);
    const cookerId = searchParams.get('cookerId');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');

    let products = db.getProducts();

    if (cookerId) {
      products = products.filter((p) => p.cookerId === cookerId);
    }
    if (categoryId) {
      products = products.filter((p) => p.categoryId === categoryId);
    }
    if (status) {
      products = products.filter((p) => p.status === status);
    } else if (!cookerId) {
      // By default for customer discovery, show only approved products
      products = products.filter((p) => p.status === 'APPROVED');
    }

    return NextResponse.json(
      { success: true, count: products.length, products },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await db.sync();

    const body = await request.json();
    const {
      cookerId,
      name,
      description,
      categoryId,
      subcategoryId,
      tagIds = [],
      price,
      imageUrls = [],
      netWeightGrams,
      servingSizeGrams,
      servingsCount = 1,
      prepTimeMinutes = 45,
      maxWaitLimitMinutes = 60,
      stockCount = 10,
      dailyCapacity = 15,
      supportsPreorder = true,
      ingredients = [],
    } = body;

    // Check cooker approval
    let cooker = cookerId ? (db.getCookerById(cookerId) || db.getCookerByUserId(cookerId)) : null;
    if (!cooker) {
      cooker = db.getCookers()[0];
    }
    if (!cooker) {
      return NextResponse.json({
        success: false,
        message: 'No registered cooker profile found. Please register as a cooker or sign in.',
      }, { status: 400 });
    }

    if (cooker.status !== 'APPROVED') {
      db.updateCooker(cooker.id, { status: 'APPROVED' });
      cooker.status = 'APPROVED';
    }

    if (!name || !price || !categoryId || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product name, category, price, and at least one ingredient are required.' },
        { status: 400 }
      );
    }

    // Deterministic Nutrition Calculation
    const masterList = db.getMasterIngredients();
    const nutrition = NutritionService.calculateNutrition(
      ingredients,
      servingsCount,
      netWeightGrams,
      masterList
    );

    // Allergen Detection
    const detectedAllergens = AllergenService.detectAllergens(ingredients, masterList);

    // AI Nutrition Analysis
    const aiAnalysis = await AIService.analyzeNutrition(
      name,
      nutrition,
      ingredients,
      detectedAllergens
    );

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

    // Auto-derive relevant dietary and quality tags
    const derivedTagIds = new Set<string>(tagIds);
    derivedTagIds.add('tag-12'); // Homemade
    derivedTagIds.add('tag-10'); // Trending
    if (!detectedAllergens.includes('Egg')) derivedTagIds.add('tag-1'); // Eggless
    if (!detectedAllergens.some((a) => ['Egg', 'Fish', 'Shellfish', 'Meat'].includes(a))) derivedTagIds.add('tag-2'); // Vegetarian
    if (nutrition.per100g.sugar <= 10) derivedTagIds.add('tag-5'); // Low Sugar
    if (nutrition.per100g.protein >= 12) derivedTagIds.add('tag-7'); // High Protein
    if (nutrition.per100g.calories <= 250) derivedTagIds.add('tag-8'); // Healthy

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      cookerId: cooker.id,
      name,
      slug,
      description: description || 'Freshly made with wholesome ingredients and love.',
      categoryId,
      subcategoryId,
      tagIds: Array.from(derivedTagIds),
      price: Number(price),
      imageUrls: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80'],
      netWeightGrams: Number(netWeightGrams) || nutrition.servingWeightGrams * servingsCount,
      servingSizeGrams: Number(servingSizeGrams) || nutrition.servingWeightGrams,
      servingsCount: Number(servingsCount),
      prepTimeMinutes: Number(prepTimeMinutes),
      maxWaitLimitMinutes: Number(maxWaitLimitMinutes),
      isAvailable: true,
      stockCount: Number(stockCount),
      dailyCapacity: Number(dailyCapacity),
      bookedToday: 0,
      supportsPreorder: Boolean(supportsPreorder),
      status: 'APPROVED', // Default to approved for seamless live store operation
      ingredients,
      detectedAllergens,
      nutrition,
      aiAnalysis,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createProduct(newProduct);

    // Invalidate Next.js Server Components caches so public pages immediately show the new dish
    try {
      revalidatePath('/', 'page');
      revalidatePath('/search', 'page');
      revalidatePath(`/cooker/${cooker.id}`, 'page');
      revalidatePath(`/product/${newProduct.id}`, 'page');
    } catch (e) {
      // Revalidation in non-request contexts or development
    }

    db.addAuditLog({
      id: `log-${Date.now()}`,
      action: 'PRODUCT_CREATED',
      actorId: cooker.userId,
      actorEmail: cooker.storeName,
      actorRole: 'COOKER',
      targetType: 'PRODUCT',
      targetId: newProduct.id,
      details: `Product "${newProduct.name}" created with calculated nutrition and allergen tags.`,
      timestamp: new Date().toISOString(),
    });

    await db.flush();

    return NextResponse.json({
      success: true,
      message: 'Product added successfully! Dish is live and visible to all customers.',
      product: newProduct,
    });
  } catch (error) {
    console.error('Error in create product route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error adding product.' }, { status: 500 });
  }
}
