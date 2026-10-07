import { NextResponse } from 'next/server';
import { NutritionService } from '@/lib/services/nutrition-service';
import { AllergenService } from '@/lib/services/allergen-service';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ingredients = [], servingsCount = 1, customTotalWeightGrams } = body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please add at least one ingredient to calculate nutrition.' },
        { status: 400 }
      );
    }

    const masterIngredients = db.getMasterIngredients();
    const calculatedNutrition = NutritionService.calculateNutrition(
      ingredients,
      servingsCount,
      customTotalWeightGrams,
      masterIngredients
    );

    const detectedAllergens = AllergenService.detectAllergens(ingredients, masterIngredients);

    return NextResponse.json({
      success: true,
      nutrition: calculatedNutrition,
      detectedAllergens,
      unresolvedIngredients: calculatedNutrition.unresolvedIngredients || [],
      ingredientBreakdown: calculatedNutrition.ingredientBreakdown || [],
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in calculate nutrition route:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to calculate nutrition values.' },
      { status: 500 }
    );
  }
}
