import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AISearchService, BodyGoalParams } from '@/lib/services/ai-search-service';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const params: BodyGoalParams = {
      prompt: body.prompt || '',
      goal: body.goal,
      minProtein: body.minProtein !== undefined ? Number(body.minProtein) : undefined,
      maxCalories: body.maxCalories !== undefined ? Number(body.maxCalories) : undefined,
      maxSugar: body.maxSugar !== undefined ? Number(body.maxSugar) : undefined,
      dietary: body.dietary || [],
      allergensAvoid: body.allergensAvoid || [],
    };

    const products = db.getProducts();
    const cookers = db.getCookers();

    const { interpretation, results } = AISearchService.searchByBodyGoals(products, cookers, params);

    return NextResponse.json({
      success: true,
      count: results.length,
      interpretation,
      results,
    });
  } catch (error) {
    console.error('Error in AI Body Search API (POST):', error);
    return NextResponse.json(
      { success: false, message: 'AI search calculation failed.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const prompt = searchParams.get('q') || searchParams.get('prompt') || '';
    const goal = (searchParams.get('goal') as any) || undefined;
    const minProtein = searchParams.get('minProtein') ? Number(searchParams.get('minProtein')) : undefined;
    const maxCalories = searchParams.get('maxCalories') ? Number(searchParams.get('maxCalories')) : undefined;
    const maxSugar = searchParams.get('maxSugar') ? Number(searchParams.get('maxSugar')) : undefined;

    const dietaryParam = searchParams.get('dietary');
    const dietary = dietaryParam ? dietaryParam.split(',') : [];

    const allergensParam = searchParams.get('allergens');
    const allergensAvoid = allergensParam ? allergensParam.split(',') : [];

    const params: BodyGoalParams = {
      prompt,
      goal,
      minProtein,
      maxCalories,
      maxSugar,
      dietary,
      allergensAvoid,
    };

    const products = db.getProducts();
    const cookers = db.getCookers();

    const { interpretation, results } = AISearchService.searchByBodyGoals(products, cookers, params);

    return NextResponse.json({
      success: true,
      count: results.length,
      interpretation,
      results,
    });
  } catch (error) {
    console.error('Error in AI Body Search API (GET):', error);
    return NextResponse.json(
      { success: false, message: 'AI search calculation failed.' },
      { status: 500 }
    );
  }
}
