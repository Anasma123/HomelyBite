import {
  MasterIngredient,
  ProductIngredientItem,
  ProductNutritionProfile,
  NutritionData,
} from '../types';
import { MASTER_INGREDIENTS } from '../initial-data';

export class NutritionService {
  /**
   * Normalizes any input unit to grams for deterministic calculations
   */
  public static convertToGrams(quantity: number, unit: ProductIngredientItem['unit'], ingredientName?: string): number {
    switch (unit) {
      case 'g':
        return quantity;
      case 'kg':
        return quantity * 1000;
      case 'ml':
        return quantity * 1.0; // Standard culinary density ~ 1.0 g/ml
      case 'litre':
        return quantity * 1000;
      case 'mg':
        return quantity / 1000;
      case 'tsp':
        return quantity * 5.0; // ~5g per metric teaspoon
      case 'tbsp':
        return quantity * 15.0; // ~15g per tablespoon
      case 'pieces':
        // Standard large egg ~50g, otherwise ~40g per unit
        if (ingredientName && /egg/i.test(ingredientName)) {
          return quantity * 50;
        }
        return quantity * 40;
      default:
        return quantity;
    }
  }

  /**
   * Deterministically calculates total, per 100g, and per serving nutrition
   */
  public static calculateNutrition(
    ingredients: ProductIngredientItem[],
    servingsCount: number = 1,
    customTotalWeightGrams?: number,
    masterList: MasterIngredient[] = MASTER_INGREDIENTS
  ): ProductNutritionProfile {
    let totalWeight = 0;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalSaturatedFat = 0;
    let totalSugar = 0;
    let totalFiber = 0;
    let totalSodium = 0;

    for (const item of ingredients) {
      const weightGrams = this.convertToGrams(item.quantity, item.unit, item.name);
      totalWeight += weightGrams;

      // Find matching master ingredient
      const master =
        masterList.find((m) => m.id === item.ingredientId) ||
        masterList.find((m) => m.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(m.name.toLowerCase()));

      if (master) {
        const factor = weightGrams / 100;
        totalCalories += master.caloriesPer100 * factor;
        totalProtein += master.proteinPer100 * factor;
        totalCarbs += master.carbsPer100 * factor;
        totalFat += master.fatPer100 * factor;
        totalSaturatedFat += (master.saturatedFatPer100 || master.fatPer100 * 0.4) * factor;
        totalSugar += master.sugarPer100 * factor;
        totalFiber += master.fiberPer100 * factor;
        totalSodium += (master.sodiumPer100 || 5) * factor;
      } else {
        // Fallback realistic baseline if custom unmapped ingredient is used (approx 200 kcal/100g)
        const factor = weightGrams / 100;
        totalCalories += 200 * factor;
        totalProtein += 4 * factor;
        totalCarbs += 25 * factor;
        totalFat += 8 * factor;
        totalSaturatedFat += 3 * factor;
        totalSugar += 5 * factor;
        totalFiber += 2 * factor;
        totalSodium += 15 * factor;
      }
    }

    // Use cooking water evaporation / shrinkage weight if specified, else raw sum
    const finalProductWeight = customTotalWeightGrams && customTotalWeightGrams > 0 ? customTotalWeightGrams : Math.max(totalWeight, 1);
    const validServings = Math.max(1, servingsCount);
    const servingWeightGrams = Math.round(finalProductWeight / validServings);

    const round1 = (val: number) => Math.round(val * 10) / 10;
    const round0 = (val: number) => Math.round(val);

    const total: NutritionData = {
      calories: round0(totalCalories),
      protein: round1(totalProtein),
      carbs: round1(totalCarbs),
      fat: round1(totalFat),
      saturatedFat: round1(totalSaturatedFat),
      sugar: round1(totalSugar),
      fiber: round1(totalFiber),
      sodium: round0(totalSodium),
    };

    const factor100g = 100 / finalProductWeight;
    const per100g: NutritionData = {
      calories: round0(totalCalories * factor100g),
      protein: round1(totalProtein * factor100g),
      carbs: round1(totalCarbs * factor100g),
      fat: round1(totalFat * factor100g),
      saturatedFat: round1(totalSaturatedFat * factor100g),
      sugar: round1(totalSugar * factor100g),
      fiber: round1(totalFiber * factor100g),
      sodium: round0(totalSodium * factor100g),
    };

    const factorServing = 1 / validServings;
    const perServing: NutritionData = {
      calories: round0(totalCalories * factorServing),
      protein: round1(totalProtein * factorServing),
      carbs: round1(totalCarbs * factorServing),
      fat: round1(totalFat * factorServing),
      saturatedFat: round1(totalSaturatedFat * factorServing),
      sugar: round1(totalSugar * factorServing),
      fiber: round1(totalFiber * factorServing),
      sodium: round0(totalSodium * factorServing),
    };

    return {
      total,
      per100g,
      perServing,
      servingWeightGrams,
      servingsPerPackage: validServings,
    };
  }
}
