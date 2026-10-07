import { MasterIngredient, ProductIngredientItem } from '../types';
import { MASTER_INGREDIENTS } from '../initial-data';

export const COMMON_ALLERGENS = [
  'Milk',
  'Egg',
  'Gluten',
  'Wheat',
  'Peanuts',
  'Tree nuts',
  'Soy',
  'Sesame',
  'Fish',
  'Shellfish',
] as const;

export class AllergenService {
  /**
   * Scans a list of ingredients and extracts all detected allergens
   */
  public static detectAllergens(
    ingredients: ProductIngredientItem[],
    masterList: MasterIngredient[] = MASTER_INGREDIENTS
  ): string[] {
    const detectedSet = new Set<string>();

    for (const item of ingredients) {
      // 1. Check against master ingredient allergen array
      const master =
        masterList.find((m) => m.id === item.ingredientId) ||
        masterList.find((m) => m.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(m.name.toLowerCase()));

      if (master && master.allergens) {
        master.allergens.forEach((a) => detectedSet.add(a));
      }

      // 2. Fallback heuristic keyword detection on ingredient name
      const name = item.name.toLowerCase();
      if (/flour|maida|atta|wheat|barley|rye|semolina|rava/i.test(name)) {
        detectedSet.add('Gluten');
        detectedSet.add('Wheat');
      }
      if (/milk|butter|cream|cheese|paneer|curd|yogurt|whey|ghee/i.test(name)) {
        detectedSet.add('Milk');
      }
      if (/egg|albumin|yolk/i.test(name)) {
        detectedSet.add('Egg');
      }
      if (/almond|walnut|cashew|pistachio|hazelnut|pecan/i.test(name)) {
        detectedSet.add('Tree nuts');
      }
      if (/peanut|groundnut/i.test(name)) {
        detectedSet.add('Peanuts');
      }
      if (/soy|tofu|edamame/i.test(name)) {
        detectedSet.add('Soy');
      }
      if (/sesame|til/i.test(name)) {
        detectedSet.add('Sesame');
      }
      if (/fish|salmon|tuna|prawn|crab|shrimp/i.test(name)) {
        detectedSet.add('Fish');
      }
    }

    return Array.from(detectedSet);
  }
}
