import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MasterIngredient } from '@/lib/types';

export async function GET() {
  try {
    const ingredients = db.getMasterIngredients();
    return NextResponse.json({ success: true, count: ingredients.length, ingredients });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch ingredients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      standardUnit = 'g',
      caloriesPer100,
      proteinPer100,
      carbsPer100,
      fatPer100,
      saturatedFatPer100,
      sugarPer100,
      fiberPer100,
      sodiumPer100,
      allergens = [],
    } = body;

    if (!name || caloriesPer100 === undefined) {
      return NextResponse.json({ success: false, message: 'Ingredient name and calories are required' }, { status: 400 });
    }

    const newIng: MasterIngredient = {
      id: `ing-${Date.now()}`,
      name,
      standardUnit,
      caloriesPer100: Number(caloriesPer100),
      proteinPer100: Number(proteinPer100) || 0,
      carbsPer100: Number(carbsPer100) || 0,
      fatPer100: Number(fatPer100) || 0,
      saturatedFatPer100: saturatedFatPer100 !== undefined ? Number(saturatedFatPer100) : undefined,
      sugarPer100: Number(sugarPer100) || 0,
      fiberPer100: Number(fiberPer100) || 0,
      sodiumPer100: sodiumPer100 !== undefined ? Number(sodiumPer100) : undefined,
      allergens,
    };

    db.createMasterIngredient(newIng);
    return NextResponse.json({ success: true, ingredient: newIng });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to add ingredient' }, { status: 500 });
  }
}
