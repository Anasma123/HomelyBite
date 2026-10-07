import {
  MasterIngredient,
  ProductIngredientItem,
  ProductNutritionProfile,
  NutritionData,
  IngredientResolution,
} from '../types';
import { MASTER_INGREDIENTS } from '../initial-data';

// Comprehensive culinary aliases mapping common English, Malayalam, Hindi & colloquial terms
const CULINARY_ALIASES: Record<string, string> = {
  // Atta / Wheat
  wheat: 'ing-2',
  atta: 'ing-2',
  godhambu: 'ing-2',
  gehu: 'ing-2',
  'wheat flour': 'ing-2',
  'whole wheat': 'ing-2',
  'whole wheat flour': 'ing-2',

  // Maida / Flour
  maida: 'ing-1',
  flour: 'ing-1',
  'all purpose': 'ing-1',
  'all-purpose': 'ing-1',
  'all purpose flour': 'ing-1',
  'all-purpose flour': 'ing-1',
  'white flour': 'ing-1',

  // Sugar & Sweeteners
  sugar: 'ing-3',
  panchasara: 'ing-3',
  cheeni: 'ing-3',
  'white sugar': 'ing-3',
  'cane sugar': 'ing-3',
  'granulated sugar': 'ing-3',
  jaggery: 'ing-jaggery',
  sharkkara: 'ing-jaggery',
  gur: 'ing-jaggery',
  vellam: 'ing-jaggery',
  'palm jaggery': 'ing-jaggery',
  honey: 'ing-11',
  then: 'ing-11',
  'organic honey': 'ing-11',

  // Fats & Oils
  butter: 'ing-4',
  makhan: 'ing-4',
  'dairy butter': 'ing-4',
  'salted butter': 'ing-4',
  'unsalted butter': 'ing-4',
  ghee: 'ing-ghee',
  neyy: 'ing-ghee',
  ney: 'ing-ghee',
  'clarified butter': 'ing-ghee',
  'cow ghee': 'ing-ghee',
  'coconut oil': 'ing-coconutoil',
  velichenna: 'ing-coconutoil',
  'olive oil': 'ing-14',
  'extra virgin olive oil': 'ing-14',
  oil: 'ing-coconutoil',
  'cooking oil': 'ing-coconutoil',
  'sunflower oil': 'ing-coconutoil',

  // Poultry & Meats
  chicken: 'ing-chicken-curry',
  'chicken breast': 'ing-chicken-breast',
  'boneless chicken': 'ing-chicken-breast',
  kozhi: 'ing-chicken-curry',
  murgh: 'ing-chicken-curry',
  meat: 'ing-meat',
  beef: 'ing-meat',
  mutton: 'ing-meat',
  irachi: 'ing-meat',
  gosht: 'ing-meat',

  // Seafood
  fish: 'ing-fish',
  meen: 'ing-fish',
  salmon: 'ing-fish',
  ayala: 'ing-fish',
  mathi: 'ing-fish',
  kingfish: 'ing-fish',
  'fish fillet': 'ing-fish',
  prawns: 'ing-prawns',
  chemmeen: 'ing-prawns',
  shrimp: 'ing-prawns',

  // Dairy & Eggs
  egg: 'ing-7',
  eggs: 'ing-7',
  mutta: 'ing-7',
  anda: 'ing-7',
  'egg white': 'ing-7',
  'egg yolk': 'ing-7',
  milk: 'ing-6',
  paal: 'ing-6',
  doodh: 'ing-6',
  'whole milk': 'ing-6',
  curd: 'ing-curd',
  thayir: 'ing-curd',
  yogurt: 'ing-curd',
  dahi: 'ing-curd',
  paneer: 'ing-12',
  'cottage cheese': 'ing-12',

  // Grains & Flours
  rice: 'ing-15',
  ari: 'ing-15',
  choru: 'ing-15',
  basmati: 'ing-15',
  'basmati rice': 'ing-15',
  'biryani rice': 'ing-15',
  oats: 'ing-9',
  'rolled oats': 'ing-9',
  rava: 'ing-rava',
  semolina: 'ing-rava',
  sooji: 'ing-rava',
  suji: 'ing-rava',

  // Bakery & Chocolate
  cocoa: 'ing-5',
  'cocoa powder': 'ing-5',
  chocolate: 'ing-8',
  'dark chocolate': 'ing-8',
  'baking powder': 'ing-bakingpowder',
  yeast: 'ing-bakingpowder',
  sourdough: 'ing-13',

  // Coconut
  coconut: 'ing-coconut',
  thenga: 'ing-coconut',
  'grated coconut': 'ing-coconut',
  'coconut milk': 'ing-coconutmilk',
  thengapal: 'ing-coconutmilk',

  // Vegetables
  onion: 'ing-onion',
  onions: 'ing-onion',
  ulli: 'ing-onion',
  savola: 'ing-onion',
  shallots: 'ing-onion',
  tomato: 'ing-tomato',
  tomatoes: 'ing-tomato',
  thakkali: 'ing-tomato',
  potato: 'ing-potato',
  potatoes: 'ing-potato',
  urulakizhangu: 'ing-potato',
  garlic: 'ing-garlic',
  veluthulli: 'ing-garlic',
  ginger: 'ing-ginger',
  inji: 'ing-ginger',

  // Spices & Condiments
  salt: 'ing-salt',
  uppu: 'ing-salt',
  namak: 'ing-salt',
  'sea salt': 'ing-salt',
  'table salt': 'ing-salt',
  pepper: 'ing-pepper',
  'black pepper': 'ing-pepper',
  kurumulaku: 'ing-pepper',
  turmeric: 'ing-turmeric',
  manjal: 'ing-turmeric',
  haldi: 'ing-turmeric',
  chilli: 'ing-chilli',
  chili: 'ing-chilli',
  'chilli powder': 'ing-chilli',
  mulaku: 'ing-chilli',
  mulakupodi: 'ing-chilli',
  cardamom: 'ing-cardamom',
  elakka: 'ing-cardamom',
  elaichi: 'ing-cardamom',
  'garam masala': 'ing-garammasala',

  // Nuts & Dry Fruits
  cashew: 'ing-cashew',
  cashews: 'ing-cashew',
  andiparippu: 'ing-cashew',
  kaju: 'ing-cashew',
  almond: 'ing-10',
  almonds: 'ing-10',
  badam: 'ing-10',
  raisins: 'ing-raisins',
  kismis: 'ing-raisins',
};

export class NutritionService {
  /**
   * Normalizes any input unit to grams for deterministic calculations
   */
  public static convertToGrams(
    quantity: number,
    unit: ProductIngredientItem['unit'],
    ingredientName?: string
  ): number {
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
        if (ingredientName && /egg|mutta|anda/i.test(ingredientName)) {
          return quantity * 50;
        }
        return quantity * 40;
      default:
        return quantity;
    }
  }

  /**
   * Intelligently resolves an ingredient query text into a matching master ingredient,
   * returning confidence score, candidate suggestions, and whether clarification is needed.
   */
  public static resolveIngredient(
    query: string,
    ingredientId?: string,
    masterList: MasterIngredient[] = MASTER_INGREDIENTS
  ): IngredientResolution {
    if (!query && !ingredientId) {
      return {
        matched: null,
        confidence: 0,
        isExactOrHighConfidence: false,
        suggestions: masterList.slice(0, 4),
        clarificationNeeded: true,
      };
    }

    // 1. Direct ingredientId match
    if (ingredientId) {
      const byId = masterList.find((m) => m.id === ingredientId);
      if (byId) {
        return {
          matched: byId,
          confidence: 1.0,
          isExactOrHighConfidence: true,
          suggestions: [byId],
          clarificationNeeded: false,
          suggestedName: byId.name,
        };
      }
    }

    const clean = query
      .toLowerCase()
      .replace(/[0-9]+/g, '')
      .replace(/[\(\)\[\],.:;!?'"-]/g, ' ')
      .trim();

    // 2. Direct name match (exact case-insensitive)
    const exactNameMatch = masterList.find(
      (m) => m.name.toLowerCase().trim() === clean
    );
    if (exactNameMatch) {
      return {
        matched: exactNameMatch,
        confidence: 1.0,
        isExactOrHighConfidence: true,
        suggestions: [exactNameMatch],
        clarificationNeeded: false,
        suggestedName: exactNameMatch.name,
      };
    }

    // 3. Known Culinary Synonyms / Aliases match (longest phrase first)
    const words = clean.split(/\s+/).filter(Boolean);
    const sortedAliases = Object.entries(CULINARY_ALIASES).sort((a, b) => b[0].length - a[0].length);
    for (const [alias, targetId] of sortedAliases) {
      if (clean === alias || clean.startsWith(alias + ' ') || clean.endsWith(' ' + alias) || clean.includes(' ' + alias + ' ')) {
        const target = masterList.find((m) => m.id === targetId);
        if (target) {
          return {
            matched: target,
            confidence: 0.95,
            isExactOrHighConfidence: true,
            suggestions: [target, ...masterList.filter((m) => m.id !== target.id).slice(0, 3)],
            clarificationNeeded: false,
            suggestedName: target.name,
          };
        }
      }
    }

    // Single word alias lookup
    for (const word of words) {
      if (CULINARY_ALIASES[word]) {
        const target = masterList.find((m) => m.id === CULINARY_ALIASES[word]);
        if (target) {
          return {
            matched: target,
            confidence: 0.9,
            isExactOrHighConfidence: true,
            suggestions: [target, ...masterList.filter((m) => m.id !== target.id).slice(0, 3)],
            clarificationNeeded: false,
            suggestedName: target.name,
          };
        }
      }
    }

    // 4. Substring and token overlap scoring
    const scored = masterList.map((m) => {
      const mName = m.name.toLowerCase();
      let score = 0;

      // Full substring check
      if (mName.includes(clean)) score += 0.8;
      if (clean.includes(mName)) score += 0.8;

      // Word match
      const mWords = mName.replace(/[\(\)\[\],.:;!?'"-]/g, ' ').split(/\s+/).filter(Boolean);
      for (const w of words) {
        if (w.length < 2) continue;
        if (mWords.some((mw) => mw === w)) {
          score += 0.4;
        } else if (mWords.some((mw) => mw.includes(w) || w.includes(mw))) {
          score += 0.25;
        }
      }

      return { item: m, score: Math.min(score, 1.0) };
    });

    scored.sort((a, b) => b.score - a.score);

    const top = scored[0];
    const suggestions = scored.slice(0, 4).map((s) => s.item);

    if (top && top.score >= 0.6) {
      return {
        matched: top.item,
        confidence: top.score,
        isExactOrHighConfidence: top.score >= 0.75,
        suggestions,
        clarificationNeeded: top.score < 0.75,
        suggestedName: top.item.name,
      };
    }

    // 5. Unrecognized / Ambiguous: clarification needed
    return {
      matched: top?.item || null,
      confidence: top?.score || 0.2,
      isExactOrHighConfidence: false,
      suggestions: suggestions.length > 0 ? suggestions : masterList.slice(0, 4),
      clarificationNeeded: true,
      suggestedName: top?.item?.name,
    };
  }

  /**
   * Deterministically calculates total, per 100g, and per serving nutrition,
   * returning exact item breakdowns and flagging any ingredients that need cook clarification.
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

    const breakdown: NonNullable<ProductNutritionProfile['ingredientBreakdown']> = [];
    const unresolved: NonNullable<ProductNutritionProfile['unresolvedIngredients']> = [];

    for (let i = 0; i < ingredients.length; i++) {
      const item = ingredients[i];
      const weightGrams = this.convertToGrams(item.quantity, item.unit, item.name);
      totalWeight += weightGrams;

      // Resolve ingredient intelligently
      const resolution = this.resolveIngredient(item.name, item.ingredientId, masterList);
      const master = resolution.matched;

      let itemCalories = 0;
      let itemProtein = 0;
      let itemCarbs = 0;
      let itemFat = 0;

      if (master) {
        const factor = weightGrams / 100;
        itemCalories = master.caloriesPer100 * factor;
        itemProtein = master.proteinPer100 * factor;
        itemCarbs = master.carbsPer100 * factor;
        itemFat = master.fatPer100 * factor;

        totalCalories += itemCalories;
        totalProtein += itemProtein;
        totalCarbs += itemCarbs;
        totalFat += itemFat;
        totalSaturatedFat += (master.saturatedFatPer100 || master.fatPer100 * 0.4) * factor;
        totalSugar += master.sugarPer100 * factor;
        totalFiber += master.fiberPer100 * factor;
        totalSodium += (master.sodiumPer100 || 5) * factor;
      } else {
        // Fallback realistic baseline if completely unknown
        const factor = weightGrams / 100;
        itemCalories = 180 * factor;
        itemProtein = 4 * factor;
        itemCarbs = 20 * factor;
        itemFat = 6 * factor;

        totalCalories += itemCalories;
        totalProtein += itemProtein;
        totalCarbs += itemCarbs;
        totalFat += itemFat;
        totalSaturatedFat += 2 * factor;
        totalSugar += 3 * factor;
        totalFiber += 2 * factor;
        totalSodium += 20 * factor;
      }

      breakdown.push({
        inputId: item.id,
        inputName: item.name,
        quantity: item.quantity,
        unit: item.unit,
        weightGrams: Math.round(weightGrams * 10) / 10,
        matchedMaster: master,
        confidence: resolution.confidence,
        clarificationNeeded: resolution.clarificationNeeded,
        suggestions: resolution.suggestions,
        calories: Math.round(itemCalories),
        protein: Math.round(itemProtein * 10) / 10,
        carbs: Math.round(itemCarbs * 10) / 10,
        fat: Math.round(itemFat * 10) / 10,
      });

      if (resolution.clarificationNeeded) {
        unresolved.push({
          index: i,
          inputId: item.id,
          inputName: item.name,
          suggestions: resolution.suggestions,
        });
      }
    }

    // Use cooking water evaporation / shrinkage weight if specified, else raw sum
    const finalProductWeight =
      customTotalWeightGrams && customTotalWeightGrams > 0
        ? customTotalWeightGrams
        : Math.max(totalWeight, 1);
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
      ingredientBreakdown: breakdown,
      unresolvedIngredients: unresolved,
    };
  }
}
