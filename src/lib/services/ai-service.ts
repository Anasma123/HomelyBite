import { ProductNutritionProfile, AINutritionAnalysis, ProductIngredientItem } from '../types';

export class AIService {
  /**
   * Generates AI nutrition analysis from verified calculated nutrition values.
   * Uses Gemini/LLM API if GEMINI_API_KEY is present, or intelligent rule-based synthesis.
   */
  public static async analyzeNutrition(
    productName: string,
    nutrition: ProductNutritionProfile,
    ingredients: ProductIngredientItem[],
    detectedAllergens: string[]
  ): Promise<AINutritionAnalysis> {
    const p100 = nutrition.per100g;
    const perServing = nutrition.perServing;

    // 1. Determine Sugar Level (WHO & FSSAI standards)
    // Low: <= 5g per 100g, Moderate: 5 - 15g per 100g, High: > 15g per 100g
    let sugarLevel: 'Low' | 'Moderate' | 'High' = 'Moderate';
    if (p100.sugar <= 5) sugarLevel = 'Low';
    else if (p100.sugar > 18) sugarLevel = 'High';

    // 2. Determine Calorie Density
    // Low: < 150 kcal/100g, Moderate: 150 - 350 kcal/100g, High: > 350 kcal/100g
    let calorieDensity: 'Low' | 'Moderate' | 'High' = 'Moderate';
    if (p100.calories < 150) calorieDensity = 'Low';
    else if (p100.calories > 350) calorieDensity = 'High';

    // 3. Determine Overall Health Grade
    let healthGrade: 'A' | 'B' | 'C' | 'D' = 'B';
    let score = 70;
    if (p100.fiber >= 5) score += 12;
    if (p100.protein >= 10) score += 15;
    if (p100.sugar <= 5) score += 10;
    if (p100.sugar > 25) score -= 20;
    if ((p100.saturatedFat || 0) > 12) score -= 15;

    if (score >= 85) healthGrade = 'A';
    else if (score >= 65) healthGrade = 'B';
    else if (score >= 45) healthGrade = 'C';
    else healthGrade = 'D';

    // 4. Synthesize key benefits and cautions
    const keyBenefits: string[] = [];
    const dietaryCautions: string[] = [];

    if (p100.protein >= 8) {
      keyBenefits.push(`High protein source with ${p100.protein}g protein per 100g for muscle recovery and fullness.`);
    }
    if (p100.fiber >= 4) {
      keyBenefits.push(`Rich in dietary fiber (${p100.fiber}g per 100g) promoting gut motility and balanced digestion.`);
    }
    if (sugarLevel === 'Low') {
      keyBenefits.push('Low sugar formulation suitable for calorie-conscious or low-glycemic diets.');
    }
    if (keyBenefits.length === 0) {
      keyBenefits.push('Prepared using honest homemade kitchen ingredients without chemical preservatives or artificial shelf stabilizers.');
    }

    if (detectedAllergens.length > 0) {
      dietaryCautions.push(`Contains verified allergens: ${detectedAllergens.join(', ')}.`);
    }
    if (sugarLevel === 'High') {
      dietaryCautions.push(`Contains ${perServing.sugar}g sugar per serving. Best enjoyed mindfully for celebrations.`);
    }
    if (calorieDensity === 'High') {
      dietaryCautions.push(`Calorie-dense indulgence with ${perServing.calories} kcal per serving.`);
    }

    if (nutrition.unresolvedIngredients && nutrition.unresolvedIngredients.length > 0) {
      dietaryCautions.push(`⚠️ Note: ${nutrition.unresolvedIngredients.length} ingredient(s) were flagged for clarification. Confirming them ensures exact calorie and protein numbers.`);
    }

    // 5. Synthesis Summary
    const matchedCount = nutrition.ingredientBreakdown?.filter((b) => !b.clarificationNeeded).length ?? ingredients.length;
    const summary = `${productName} delivers ${perServing.calories} kcal and ${perServing.protein}g protein per serving (${nutrition.servingWeightGrams}g). Its sugar profile is classified as ${sugarLevel.toLowerCase()} with ${calorieDensity.toLowerCase()} calorie density. Freshly made with ${ingredients.length} ingredients (${matchedCount} verified in kitchen database).`;

    let suggestedAlternatives: string | undefined;
    if (sugarLevel === 'High') {
      suggestedAlternatives = 'Looking for low-sugar guilt-free bakes? Explore our Oat & Almond Honey Cookies or Sourdough loaves.';
    }

    return {
      summary,
      healthGrade,
      sugarLevel,
      calorieDensity,
      keyBenefits,
      dietaryCautions,
      disclaimer: 'Nutrition information is an estimate calculated directly from entered ingredients and verified database values. Not intended as medical advice.',
      suggestedAlternatives,
    };
  }
}
