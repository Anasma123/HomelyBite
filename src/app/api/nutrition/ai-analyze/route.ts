import { NextResponse } from 'next/server';
import { AIService } from '@/lib/services/ai-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productName, nutrition, ingredients = [], detectedAllergens = [] } = body;

    if (!productName || !nutrition) {
      return NextResponse.json(
        { success: false, message: 'Product name and calculated nutrition profile are required.' },
        { status: 400 }
      );
    }

    const analysis = await AIService.analyzeNutrition(
      productName,
      nutrition,
      ingredients,
      detectedAllergens
    );

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error in ai-analyze route:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate AI nutrition analysis.' },
      { status: 500 }
    );
  }
}
