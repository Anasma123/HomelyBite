import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Product } from '@/lib/types';
import { NutritionService } from '@/lib/services/nutrition-service';
import { AllergenService } from '@/lib/services/allergen-service';
import { AIService } from '@/lib/services/ai-service';

export async function GET(request: Request) {
  try {
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

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
    const cooker = db.getCookerById(cookerId);
    if (!cooker) {
      return NextResponse.json({ success: false, message: 'Cooker profile not found.' }, { status: 404 });
    }

    if (cooker.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, message: 'Your cooker profile is not yet approved by Admin. You cannot publish dishes yet.' },
        { status: 403 }
      );
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

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      cookerId,
      name,
      slug,
      description: description || 'Freshly made with wholesome ingredients and love.',
      categoryId,
      subcategoryId,
      tagIds,
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
      status: 'APPROVED', // Default to approved for seamless live store operation, admin can suspend
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

    return NextResponse.json({
      success: true,
      message: 'Product added successfully!',
      product: newProduct,
    });
  } catch (error) {
    console.error('Error in create product route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error adding product.' }, { status: 500 });
  }
}
