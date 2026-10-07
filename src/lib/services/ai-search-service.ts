import { Product, CookerProfile, ProductNutritionProfile } from '../types';

export interface BodyGoalParams {
  prompt?: string;
  goal?: 'MUSCLE_GAIN' | 'WEIGHT_LOSS' | 'DIABETIC_SAFE' | 'LOW_CARB' | 'HIGH_FIBER' | 'CLEAN_EATING' | 'RECOVERY' | 'GENERAL';
  minProtein?: number; // in grams
  maxCalories?: number; // in kcal
  maxSugar?: number; // in grams
  maxFat?: number; // in grams
  dietary?: string[];
  allergensAvoid?: string[];
}

export interface AIInterpretation {
  detectedGoal: string;
  goalLabel: string;
  minProteinTarget: number;
  maxCaloriesTarget: number;
  maxSugarTarget: number;
  extractedDietary: string[];
  extractedAvoidAllergens: string[];
  intentSummary: string;
}

export interface RankedAISearchResult {
  product: Product;
  cooker?: CookerProfile;
  matchScore: number; // 0 to 100%
  fitnessGrade: 'EXCELLENT' | 'GREAT' | 'GOOD' | 'MODERATE';
  aiRecommendationReason: string;
  macroHighlights: {
    calories: number;
    protein: number;
    carbs: number;
    sugar: number;
    fat: number;
    fiber: number;
  };
  goalFitBadges: string[];
}

export class AISearchService {
  /**
   * Intelligently interprets the user's natural language prompt and extracts fitness & macro targets
   */
  public static interpretUserPrompt(prompt: string = '', explicitParams?: Partial<BodyGoalParams>): AIInterpretation {
    const text = prompt.toLowerCase();

    let detectedGoal: BodyGoalParams['goal'] = explicitParams?.goal || 'GENERAL';
    let minProtein = explicitParams?.minProtein ?? 0;
    let maxCalories = explicitParams?.maxCalories ?? 1000;
    let maxSugar = explicitParams?.maxSugar ?? 50;
    const extractedDietary: string[] = [...(explicitParams?.dietary || [])];
    const extractedAvoidAllergens: string[] = [...(explicitParams?.allergensAvoid || [])];

    // 1. Goal Detection from Natural Language
    if (/muscle|gym|workout|bicep|bodybuild|bulk|gains|high[- ]?protein|protein[- ]?rich/i.test(text)) {
      detectedGoal = 'MUSCLE_GAIN';
      if (!explicitParams?.minProtein) minProtein = 18;
    } else if (/weight[- ]?loss|fat[- ]?loss|diet|slim|cut|shred|low[- ]?cal|low[- ]?calorie|calorie[- ]?deficit/i.test(text)) {
      detectedGoal = 'WEIGHT_LOSS';
      if (!explicitParams?.maxCalories) maxCalories = 380;
    } else if (/diabet|sugar[- ]?free|low[- ]?sugar|glycemic|insulin|blood[- ]?sugar/i.test(text)) {
      detectedGoal = 'DIABETIC_SAFE';
      if (!explicitParams?.maxSugar) maxSugar = 6;
    } else if (/keto|low[- ]?carb|no[- ]?carb|ketogenic/i.test(text)) {
      detectedGoal = 'LOW_CARB';
    } else if (/digestion|gut|fiber|high[- ]?fiber|constipat/i.test(text)) {
      detectedGoal = 'HIGH_FIBER';
    } else if (/recovery|post[- ]?run|marathon|stamina|energy/i.test(text)) {
      detectedGoal = 'RECOVERY';
    } else if (/clean|healthy|wholesome|organic|nutritious/i.test(text)) {
      detectedGoal = 'CLEAN_EATING';
    }

    // 2. Numerical Extraction (e.g. "under 400 cal", "20g protein", "sugar less than 5g")
    const calMatch = text.match(/(?:under|below|less than|max)\s*(\d{2,4})\s*(?:cal|kcal|calories)/i) ||
                     text.match(/(\d{2,4})\s*(?:cal|kcal|calories)/i);
    if (calMatch && calMatch[1]) {
      maxCalories = parseInt(calMatch[1], 10);
    }

    const proteinMatch = text.match(/(\d{1,3})\s*(?:g|gm|grams)?\s*(?:protein)/i) ||
                         text.match(/(?:at least|min|minimum)\s*(\d{1,3})\s*(?:g|gm)?\s*(?:protein)/i);
    if (proteinMatch && proteinMatch[1]) {
      minProtein = parseInt(proteinMatch[1], 10);
      if (detectedGoal === 'GENERAL') detectedGoal = 'MUSCLE_GAIN';
    }

    const sugarMatch = text.match(/(?:under|below|less than|max)\s*(\d{1,2})\s*(?:g|gm)?\s*(?:sugar)/i);
    if (sugarMatch && sugarMatch[1]) {
      maxSugar = parseInt(sugarMatch[1], 10);
      if (detectedGoal === 'GENERAL') detectedGoal = 'DIABETIC_SAFE';
    }

    // 3. Dietary preferences extraction
    if (/eggless/i.test(text) && !extractedDietary.includes('eggless')) extractedDietary.push('eggless');
    if (/vegan/i.test(text) && !extractedDietary.includes('vegan')) extractedDietary.push('vegan');
    if (/vegetarian|veg\b/i.test(text) && !extractedDietary.includes('vegetarian')) extractedDietary.push('vegetarian');
    if (/gluten[- ]?free/i.test(text) && !extractedDietary.includes('gluten-free')) extractedDietary.push('gluten-free');

    // 4. Allergen exclusions extraction
    if (/no dairy|dairy[- ]?free|no milk|lactose[- ]?free/i.test(text)) extractedAvoidAllergens.push('Milk', 'Dairy');
    if (/no nut|nut[- ]?free|peanut[- ]?free/i.test(text)) extractedAvoidAllergens.push('Peanuts', 'Tree Nuts');
    if (/no gluten/i.test(text)) extractedAvoidAllergens.push('Gluten', 'Wheat');

    const goalLabels: Record<string, string> = {
      MUSCLE_GAIN: 'High-Protein Muscle Building',
      WEIGHT_LOSS: 'Calorie-Controlled Fat Loss',
      DIABETIC_SAFE: 'Low-Glycemic & Diabetic Friendly',
      LOW_CARB: 'Keto & Low-Carb Nutrition',
      HIGH_FIBER: 'Gut-Health & High Fiber',
      CLEAN_EATING: 'Wholesome Clean Nutrition',
      RECOVERY: 'Endurance & Active Recovery',
      GENERAL: 'Balanced Body Health',
    };

    return {
      detectedGoal,
      goalLabel: goalLabels[detectedGoal] || 'Balanced Body Health',
      minProteinTarget: minProtein,
      maxCaloriesTarget: maxCalories,
      maxSugarTarget: maxSugar,
      extractedDietary,
      extractedAvoidAllergens,
      intentSummary: `Targeting: ${goalLabels[detectedGoal]} with Min Protein ≥ ${minProtein}g, Max Calories ≤ ${maxCalories} kcal, Max Sugar ≤ ${maxSugar}g.`,
    };
  }

  /**
   * Scores and ranks foods according to their actual measured macros and body goal alignment
   */
  public static searchByBodyGoals(
    products: Product[],
    cookers: CookerProfile[],
    params: BodyGoalParams
  ): {
    interpretation: AIInterpretation;
    results: RankedAISearchResult[];
  } {
    const interpretation = this.interpretUserPrompt(params.prompt, params);
    const cookerMap = new Map(cookers.map((c) => [c.id, c]));

    // Extract specific food query terms (excluding fitness & generic stop words)
    const promptText = (params.prompt || '').toLowerCase();
    const rawTokens = promptText
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3);

    const goalStopWords = new Set([
      'food', 'foods', 'dish', 'dishes', 'give', 'want', 'with', 'without', 'healthy', 'best',
      'good', 'diet', 'meal', 'meals', 'under', 'less', 'more', 'than', 'rich', 'high', 'low',
      'protein', 'calorie', 'calories', 'sugar', 'carb', 'carbs', 'fat', 'fats', 'gram', 'grams',
      'body', 'gym', 'workout', 'loss', 'gain', 'diabetic', 'keto', 'pure', 'fresh', 'recommend',
      'search', 'find', 'home', 'cook', 'baker', 'kitchen', 'order', 'please', 'make'
    ]);

    const specificFoodKeywords = rawTokens.filter((t) => !goalStopWords.has(t));

    const isExplicitGoalSearch = Boolean(params.goal && params.goal !== 'GENERAL');
    const isSpecificKeywordSearch = specificFoodKeywords.length > 0;

    const scoredItems: RankedAISearchResult[] = [];

    for (const product of products) {
      if (product.status !== 'APPROVED') continue;

      const prodNameLower = product.name.toLowerCase();
      const prodDescLower = (product.description || '').toLowerCase();
      const prodTags = (product.tagIds || []).map((t: string) => t.toLowerCase());
      const prodIngredients = (product.ingredients || []).map((i: any) => (i.name || '').toLowerCase());

      // 1. Strict Keyword Relevance: If user searched for specific food terms (e.g. chicken, soup, bread, biryani, salad),
      // the product MUST match at least one keyword in name, description, tags, or ingredients.
      if (isSpecificKeywordSearch) {
        const matchesKeyword = specificFoodKeywords.some((kw: string) =>
          prodNameLower.includes(kw) ||
          prodDescLower.includes(kw) ||
          prodTags.some((tag: string) => tag.includes(kw)) ||
          prodIngredients.some((ing: string) => ing.includes(kw))
        );
        if (!matchesKeyword) {
          continue; // Skip irrelevant dishes
        }
      }

      const pServing = product.nutrition?.perServing || {
        calories: 300,
        protein: 5,
        carbs: 40,
        fat: 10,
        sugar: 15,
        fiber: 2,
      };

      // 2. Strict Macro Disqualification ONLY when user explicitly activated a specific body goal AND didn't search for a named dish
      if (isExplicitGoalSearch && !isSpecificKeywordSearch) {
        if (params.goal === 'MUSCLE_GAIN' && interpretation.minProteinTarget > 0) {
          const minAcceptableProtein = Math.max(10, Math.round(interpretation.minProteinTarget * 0.6));
          if (pServing.protein < minAcceptableProtein) {
            continue; // Disqualify low protein foods
          }
        }

        if (params.goal === 'DIABETIC_SAFE' && interpretation.maxSugarTarget < 20) {
          const maxAcceptableSugar = Math.max(10, Math.round(interpretation.maxSugarTarget * 1.5));
          if (pServing.sugar > maxAcceptableSugar) {
            continue; // Disqualify high sugar foods
          }
        }

        if (params.goal === 'WEIGHT_LOSS' && interpretation.maxCaloriesTarget < 800) {
          const maxAcceptableCal = Math.max(450, Math.round(interpretation.maxCaloriesTarget * 1.3));
          if (pServing.calories > maxAcceptableCal) {
            continue; // Disqualify calorie dense foods
          }
        }
      }

      // Filter: Avoid specified allergens
      if (interpretation.extractedAvoidAllergens.length > 0) {
        const containsExcluded = product.detectedAllergens.some((a) =>
          interpretation.extractedAvoidAllergens.some((ex) =>
            a.toLowerCase().includes(ex.toLowerCase())
          )
        );
        if (containsExcluded) continue;
      }

      // Dietary preferences check
      if (interpretation.extractedDietary.includes('eggless') && product.detectedAllergens.includes('Egg')) {
        continue;
      }

      // Base Score
      let score = 70;
      const badges: string[] = [];

      // 1. Protein Evaluation
      const proteinServing = pServing.protein;
      if (interpretation.minProteinTarget > 0) {
        if (proteinServing >= interpretation.minProteinTarget) {
          const bonus = Math.min(25, (proteinServing - interpretation.minProteinTarget) * 2 + 15);
          score += bonus;
          badges.push(`💪 ${proteinServing}g Protein (Meets ${interpretation.minProteinTarget}g Target)`);
        } else {
          const penalty = (interpretation.minProteinTarget - proteinServing) * 2;
          score -= penalty;
        }
      } else if (proteinServing >= 15) {
        score += 10;
        badges.push(`💪 High Protein (${proteinServing}g/srv)`);
      }

      // 2. Calorie Evaluation
      const caloriesServing = pServing.calories;
      if (interpretation.maxCaloriesTarget < 1000) {
        if (caloriesServing <= interpretation.maxCaloriesTarget) {
          score += 15;
          badges.push(`🥗 ${caloriesServing} kcal (Under ${interpretation.maxCaloriesTarget} kcal Limit)`);
        } else {
          const overagePenalty = Math.min(25, (caloriesServing - interpretation.maxCaloriesTarget) * 0.15);
          score -= overagePenalty;
        }
      }

      // 3. Sugar Evaluation
      const sugarServing = pServing.sugar;
      if (sugarServing <= interpretation.maxSugarTarget) {
        score += 12;
        if (sugarServing <= 5) {
          badges.push(`🩸 Low Sugar (${sugarServing}g/srv)`);
        }
      } else {
        const sugarPenalty = Math.min(25, (sugarServing - interpretation.maxSugarTarget) * 1.5);
        score -= sugarPenalty;
      }

      // 4. Fiber Bonus
      if (pServing.fiber >= 4) {
        score += 8;
        badges.push(`🌾 High Fiber (${pServing.fiber}g/srv)`);
      }

      // 5. Health Grade Bonus from AI Profile
      if (product.aiAnalysis?.healthGrade === 'A') score += 8;
      else if (product.aiAnalysis?.healthGrade === 'B') score += 4;

      // 6. Availability Bonus
      if (product.isAvailable) score += 5;

      // Disqualify low match scores
      if (score < 65) continue;

      const finalMatchScore = Math.max(65, Math.min(99, Math.round(score)));

      let fitnessGrade: RankedAISearchResult['fitnessGrade'] = 'GOOD';
      if (finalMatchScore >= 90) fitnessGrade = 'EXCELLENT';
      else if (finalMatchScore >= 78) fitnessGrade = 'GREAT';
      else if (finalMatchScore >= 60) fitnessGrade = 'GOOD';
      else fitnessGrade = 'MODERATE';

      // 7. Dynamic AI Recommendation Narrative tailored to body goal
      let recommendationReason = '';
      switch (interpretation.detectedGoal) {
        case 'MUSCLE_GAIN':
          recommendationReason =
            proteinServing >= (interpretation.minProteinTarget || 15)
              ? `Delivers ${proteinServing}g bioavailable protein per serving with clean wholesome ingredients to optimize muscle protein synthesis and post-workout repair.`
              : `Contains ${proteinServing}g protein per serving (${caloriesServing} kcal). Pair with extra protein to fulfill your gym recovery target.`;
          break;
        case 'WEIGHT_LOSS':
          recommendationReason =
            caloriesServing <= (interpretation.maxCaloriesTarget || 400)
              ? `Provides a satisfying serving at only ${caloriesServing} kcal with high dietary satiety, keeping you in an effortless calorie deficit without hunger spikes.`
              : `Provides ${caloriesServing} kcal per serving. Suitable as an energizing meal; monitor portions for strict deficit phases.`;
          break;
        case 'DIABETIC_SAFE':
          recommendationReason =
            sugarServing <= (interpretation.maxSugarTarget || 6)
              ? `Formulated with low sugar (${sugarServing}g per serving) and balanced complex carbs, preventing glycemic spikes for sustained, stable blood sugar.`
              : `Contains ${sugarServing}g sugar per serving. Best enjoyed occasionally or in small portions for glycemic management.`;
          break;
        case 'LOW_CARB':
          recommendationReason =
            pServing.carbs <= 25
              ? `Low in processed carbohydrates (${pServing.carbs}g carbs) and rich in healthy culinary fats, maintaining your body in a stable low-insulin metabolic state.`
              : `Contains ${pServing.carbs}g carbs per serving; consider portion moderation for ketogenic targets.`;
          break;
        case 'HIGH_FIBER':
          recommendationReason =
            pServing.fiber >= 4
              ? `Rich in natural plant fiber (${pServing.fiber}g/srv), nurturing gut microbiome diversity and ensuring light, smooth digestive motility.`
              : `Contains ${pServing.fiber}g fiber per serving with wholesome kitchen ingredients.`;
          break;
        default:
          recommendationReason = `Wholesome homemade meal offering ${caloriesServing} kcal, ${proteinServing}g protein, and honest nutrition with 0 chemical shelf-extenders.`;
          break;
      }

      scoredItems.push({
        product,
        cooker: cookerMap.get(product.cookerId) || ({
          id: product.cookerId,
          userId: 'usr-default',
          storeName: 'Verified Home Chef',
          bio: 'Freshly prepared homemade food with pure ingredients.',
          logoUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400',
          coverImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200',
          status: 'APPROVED',
          rating: 5.0,
          totalReviews: 0,
          totalOrders: 0,
          fssaiLicenseNumber: 'Verified Kitchen',
          address: 'Kochi, Kerala',
          latitude: 9.9675,
          longitude: 76.2995,
          platformDeliveryEnabled: true,
          selfDeliveryEnabled: true,
          customerPickupEnabled: true,
          selfDeliveryRadiusKm: 6.0,
          platformDeliveryRadiusKm: 12.0,
          minimumOrderValue: 200,
          averagePrepTimeMinutes: 45,
          maxDailyCapacity: 20,
          isOpenToday: true,
          openingHours: '09:00 AM - 09:00 PM',
        } as any),
        matchScore: finalMatchScore,
        fitnessGrade,
        aiRecommendationReason: recommendationReason,
        macroHighlights: {
          calories: pServing.calories,
          protein: pServing.protein,
          carbs: pServing.carbs,
          sugar: pServing.sugar,
          fat: pServing.fat,
          fiber: pServing.fiber,
        },
        goalFitBadges: badges.slice(0, 3),
      });
    }

    // Sort descending by match score
    scoredItems.sort((a, b) => b.matchScore - a.matchScore);

    return {
      interpretation,
      results: scoredItems,
    };
  }
}
