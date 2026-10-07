import { NextResponse } from 'next/server';
import { AIRecipeService } from '@/lib/services/ai-recipe-service';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      type = 'CUSTOM_RECIPE',
      prompt = '',
      goal,
      targetProtein,
      targetCalories,
      targetSugar,
      dietary,
      ingredientsOnHand,
      cycle = 0,
    } = body;

    if (type === 'PANTRY') {
      const recipe = await AIRecipeService.generateFromPantry({
        ingredientsOnHand: Array.isArray(ingredientsOnHand) ? ingredientsOnHand : (ingredientsOnHand || '').split(','),
        goal,
        cycle: Number(cycle) || 0,
      });

      return NextResponse.json({
        success: true,
        type: 'PANTRY',
        recipe,
      });
    }

    // Default: Custom AI Recipe
    const recipe = await AIRecipeService.generateCustomRecipe({
      prompt,
      goal,
      targetProtein: targetProtein ? Number(targetProtein) : undefined,
      targetCalories: targetCalories ? Number(targetCalories) : undefined,
      targetSugar: targetSugar ? Number(targetSugar) : undefined,
      dietary,
      cycle: Number(cycle) || 0,
    });

    return NextResponse.json({
      success: true,
      type: 'CUSTOM_RECIPE',
      recipe,
    });
  } catch (error) {
    console.error('Error in AI Recipe Route:', error);
    return NextResponse.json(
      { success: false, message: 'AI recipe generation failed.' },
      { status: 500 }
    );
  }
}
