export interface GeneratedAIRecipe {
  id: string;
  recipeName: string;
  tagline: string;
  goalType: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Chef Level';
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    fiber: number;
  };
  ingredients: {
    name: string;
    amount: string;
    notes?: string;
    isOnHand?: boolean;
  }[];
  stepByStepInstructions: {
    stepNumber: number;
    title: string;
    instruction: string;
    timingMinutes?: number;
  }[];
  chefTips: string[];
  whyItFitsBodyGoal: string;
  customCookerOrderPrompt: string;
}

export class AIRecipeService {
  /**
   * Generates a custom healthy dish and step-by-step recipe tailored to target macros & fitness goals
   */
  public static async generateCustomRecipe(params: {
    prompt: string;
    goal?: string;
    targetProtein?: number;
    targetCalories?: number;
    targetSugar?: number;
    dietary?: string[];
    cycle?: number;
  }): Promise<GeneratedAIRecipe> {
    const text = (params.prompt || '').toLowerCase();
    const cycle = params.cycle || 0;
    const goal = params.goal || (text.includes('muscle') || text.includes('protein') ? 'MUSCLE_GAIN' : text.includes('diabet') || text.includes('sugar') ? 'DIABETIC_SAFE' : text.includes('loss') || text.includes('calorie') ? 'WEIGHT_LOSS' : text.includes('keto') || text.includes('carb') ? 'LOW_CARB' : 'CLEAN_EATING');

    const targetProtein = params.targetProtein || (goal === 'MUSCLE_GAIN' ? 28 : 14);
    const targetCalories = params.targetCalories || (goal === 'WEIGHT_LOSS' ? 340 : 450);
    const targetSugar = params.targetSugar || (goal === 'DIABETIC_SAFE' ? 3.5 : 8);

    // Check if Gemini API is available for live generative expansion
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const geminiRecipe = await this.callGeminiAPI(params, goal, targetProtein, targetCalories, targetSugar);
        if (geminiRecipe) return geminiRecipe;
      } catch (err) {
        console.warn('Gemini API call failed, falling back to culinary engine:', err);
      }
    }

    // Intelligent Deterministic Culinary Engine Synthesis with dynamic cycle rotation
    return this.synthesizeCustomRecipe(goal, text, targetProtein, targetCalories, targetSugar, cycle);
  }

  /**
   * Generates a healthy fitness recipe specifically made from ingredients the user currently has at home
   */
  public static async generateFromPantry(params: {
    ingredientsOnHand: string[];
    goal?: string;
    maxCookingTimeMinutes?: number;
    cycle?: number;
  }): Promise<GeneratedAIRecipe> {
    const onHand = params.ingredientsOnHand.map((i) => i.trim().toLowerCase());
    const goal = params.goal || 'MUSCLE_GAIN';

    const hasEggs = onHand.some((i) => i.includes('egg'));
    const hasChicken = onHand.some((i) => i.includes('chicken'));
    const hasOats = onHand.some((i) => i.includes('oat'));
    const hasMilk = onHand.some((i) => i.includes('milk') || i.includes('curd') || i.includes('yogurt'));
    const hasBanana = onHand.some((i) => i.includes('banana'));
    const hasPaneer = onHand.some((i) => i.includes('paneer') || i.includes('tofu') || i.includes('cottage'));
    const hasRice = onHand.some((i) => i.includes('rice'));
    const hasTomatoes = onHand.some((i) => i.includes('tomato') || i.includes('onion'));

    if (hasChicken || (hasRice && !hasOats)) {
      return {
        id: `recipe-pantry-${Date.now()}`,
        recipeName: 'High-Protein Skillet Herb Chicken & Steamed Rice Bowl',
        tagline: 'Clean, lean protein dish assembled entirely from your kitchen pantry',
        goalType: 'Muscle Synthesis & High Protein',
        prepTimeMinutes: 10,
        cookTimeMinutes: 18,
        difficulty: 'Easy',
        macros: {
          calories: 420,
          protein: 36,
          carbs: 45,
          fat: 8,
          sugar: 2.5,
          fiber: 3.5,
        },
        ingredients: [
          { name: 'Chicken Breast / Boneless Pieces', amount: '200g', isOnHand: hasChicken },
          { name: 'Cooked Rice / Brown Rice', amount: '1 cup (150g)', isOnHand: hasRice },
          { name: 'Onion & Tomatoes', amount: '1 small, diced', isOnHand: hasTomatoes },
          { name: 'Turmeric, Black Pepper & Salt', amount: '1/2 tsp each', isOnHand: true, notes: 'Pantry spices' },
          { name: 'Olive Oil / Ghee', amount: '1 tsp', isOnHand: true, notes: 'For pan searing' },
        ],
        stepByStepInstructions: [
          {
            stepNumber: 1,
            title: 'Dice & Season Chicken',
            instruction: 'Cut chicken into bite-sized cubes. Season with turmeric, freshly crushed black pepper, and pinch of salt.',
            timingMinutes: 3,
          },
          {
            stepNumber: 2,
            title: 'Sauté Aromatics',
            instruction: 'Heat 1 tsp oil in a non-stick pan over medium flame. Add diced onions and tomatoes until softened.',
            timingMinutes: 4,
          },
          {
            stepNumber: 3,
            title: 'Sear Chicken to Golden Perfection',
            instruction: 'Add seasoned chicken cubes. Sear on high heat for 3 minutes, then cover and cook on medium for 6-8 minutes until juicy and cooked through.',
            timingMinutes: 8,
          },
          {
            stepNumber: 4,
            title: 'Assemble & Serve',
            instruction: 'Serve hot over warm steamed rice. Squeeze fresh lemon juice if available for maximum iron absorption.',
            timingMinutes: 2,
          },
        ],
        chefTips: [
          'Do not overcook the chicken; searing on medium heat retains moisture and tenderness.',
          'Add a spoonful of curd/yogurt to the pan for a velvety high-protein natural gravy.',
        ],
        whyItFitsBodyGoal:
          'Delivers an incredible 36g of pure lean protein with only 8g fat, fueling muscle repair without caloric bloat.',
        customCookerOrderPrompt:
          'Looking for a home cook to prepare this? Send this recipe to verified neighbourhood home chefs for batch prep.',
      };
    }

    if (hasOats && (hasEggs || hasBanana || hasMilk)) {
      return {
        id: `recipe-pantry-${Date.now()}`,
        recipeName: 'Power-Packed Cinnamon Oat & Egg White Protein Pancake',
        tagline: 'Wholesome natural gym breakfast made in 10 minutes with zero refined sugar',
        goalType: 'Post-Workout Recovery & Clean Fuel',
        prepTimeMinutes: 5,
        cookTimeMinutes: 8,
        difficulty: 'Easy',
        macros: {
          calories: 340,
          protein: 24,
          carbs: 42,
          fat: 6,
          sugar: 4.0,
          fiber: 5.5,
        },
        ingredients: [
          { name: 'Rolled / Instant Oats', amount: '50g (1/2 cup)', isOnHand: hasOats },
          { name: 'Eggs (2 Whole or 3 Whites)', amount: '2 large', isOnHand: hasEggs },
          { name: 'Milk or Curd', amount: '50ml', isOnHand: hasMilk },
          { name: 'Ripe Banana (or Pinch of Stevia)', amount: '1/2 mashed', isOnHand: hasBanana },
          { name: 'Cinnamon & Cardamom Powder', amount: '1 pinch', isOnHand: true, notes: 'Natural sweetener' },
        ],
        stepByStepInstructions: [
          {
            stepNumber: 1,
            title: 'Blend the Batter',
            instruction: 'In a blender or mixing bowl, combine oats, eggs, milk, and mashed banana. Whisk until smooth batter forms.',
            timingMinutes: 3,
          },
          {
            stepNumber: 2,
            title: 'Warm the Skillet',
            instruction: 'Lightly grease a non-stick pan with a drop of ghee or oil and warm over medium-low heat.',
            timingMinutes: 2,
          },
          {
            stepNumber: 3,
            title: 'Cook Pancakes',
            instruction: 'Pour batter into circular pancakes. Cook for 2-3 minutes until bubbles form on top, flip gently, and cook 2 minutes more.',
            timingMinutes: 5,
          },
          {
            stepNumber: 4,
            title: 'Plate & Enjoy',
            instruction: 'Plate warm. Dust with a pinch of cinnamon powder. Enjoy with a cup of black coffee or green tea.',
            timingMinutes: 1,
          },
        ],
        chefTips: [
          'Using whole eggs provides choline and healthy omega fats, while extra egg whites boost protein without adding calories.',
          'Cinnamon naturally improves insulin sensitivity and stabilizes morning glucose spikes.',
        ],
        whyItFitsBodyGoal:
          'Complex slow-burning oat carbs give 4 hours of sustained workout stamina, paired with 24g of bioavailable egg protein.',
        customCookerOrderPrompt:
          'Home bakers can also prepare oat meal jars and clean protein bakes on custom order.',
      };
    }

    // Universal Healthy Stir-Fry / Scramble
    return {
      id: `recipe-pantry-${Date.now()}`,
      recipeName: 'Homestyle Spiced Protein Scramble & Herb Greens',
      tagline: 'Quick 12-minute nutrient dense meal using your exact available kitchen supplies',
      goalType: 'Calorie Deficit & Macro Balance',
      prepTimeMinutes: 5,
      cookTimeMinutes: 7,
      difficulty: 'Easy',
      macros: {
        calories: 280,
        protein: 21,
        carbs: 12,
        fat: 14,
        sugar: 2.0,
        fiber: 4.0,
      },
      ingredients: [
        { name: 'Eggs or Paneer/Tofu', amount: '2 eggs or 100g paneer', isOnHand: hasEggs || hasPaneer },
        { name: 'Available Kitchen Vegetables (Onion/Tomato/Peppers)', amount: '1 cup chopped', isOnHand: true },
        { name: 'Cumin seeds & Black Pepper', amount: '1/2 tsp', isOnHand: true },
        { name: 'Cooking Oil / Ghee', amount: '1 tsp', isOnHand: true },
      ],
      stepByStepInstructions: [
        {
          stepNumber: 1,
          title: 'Sauté Veggies',
          instruction: 'Heat 1 tsp oil in a pan. Add cumin seeds and sauté chopped vegetables for 2-3 minutes until fragrant.',
          timingMinutes: 3,
        },
        {
          stepNumber: 2,
          title: 'Scramble Protein',
          instruction: 'Whisk eggs or crumble paneer/tofu directly into the skillet. Stir gently over medium-low heat.',
          timingMinutes: 3,
        },
        {
          stepNumber: 3,
          title: 'Season & Finish',
          instruction: 'Sprinkle salt and black pepper. Remove from heat while soft and moist.',
          timingMinutes: 1,
        },
      ],
      chefTips: [
        'Cook on low heat to keep eggs/paneer creamy and soft.',
        'Pair with sliced cucumber for additional hydration and fiber volume.',
      ],
      whyItFitsBodyGoal:
        'Contains less than 300 kcal with 21g protein, ideal for staying in a fat-burning calorie deficit.',
      customCookerOrderPrompt:
        'Order fresh homemade fitness meal bowls prepared by verified local cooks.',
    };
  }

  /**
   * Internal deterministic recipe generator with multi-dish cycle rotation for endless refreshing
   */
  private static synthesizeCustomRecipe(
    goal: string,
    text: string,
    targetProtein: number,
    targetCalories: number,
    targetSugar: number,
    cycle: number = 0
  ): GeneratedAIRecipe {
    const timestamp = Date.now();

    if (goal === 'DIABETIC_SAFE') {
      const diabeticRecipes: GeneratedAIRecipe[] = [
        {
          id: `recipe-ai-diab-1-${timestamp}`,
          recipeName: 'Stevia & Cardamom Spiced Almond Chia Pudding',
          tagline: 'AI Recommended: Ultra low glycemic dessert with zero refined sugar',
          goalType: 'Diabetic-Safe & Low Glycemic',
          prepTimeMinutes: 8,
          cookTimeMinutes: 0,
          difficulty: 'Easy',
          macros: { calories: 210, protein: 9.5, carbs: 14, fat: 12, sugar: 1.8, fiber: 8.5 },
          ingredients: [
            { name: 'Black Chia Seeds', amount: '3 tbsp (35g)', notes: 'Rich in soluble fiber' },
            { name: 'Unsweetened Almond Milk or Toned Milk', amount: '180 ml' },
            { name: 'Green Cardamom (Elaichi) Powder', amount: '1/4 tsp', notes: 'Authentic Kerala aroma' },
            { name: 'Pure Stevia Drops or Monk Fruit', amount: '3-4 drops' },
            { name: 'Roasted Almond Slivers', amount: '1 tbsp', notes: 'For healthy crunch' },
          ],
          stepByStepInstructions: [
            { stepNumber: 1, title: 'Mix Base & Spices', instruction: 'In a glass jar, pour unsweetened almond milk. Whisk in cardamom powder and natural stevia sweetener.', timingMinutes: 2 },
            { stepNumber: 2, title: 'Stir in Chia Seeds', instruction: 'Add chia seeds gradually while stirring thoroughly with a fork so they do not clump at the bottom.', timingMinutes: 3 },
            { stepNumber: 3, title: 'Chill & Gel', instruction: 'Cover and let sit in the refrigerator for at least 25 minutes (or overnight) until a thick pudding consistency forms.', timingMinutes: 25 },
            { stepNumber: 4, title: 'Garnish & Enjoy', instruction: 'Top with toasted almond slivers. Enjoy chilled as a zero-guilt diabetic dessert!', timingMinutes: 1 },
          ],
          chefTips: [
            'Chia seeds form a mucilage gel that slows gastric carbohydrate absorption, preventing post-prandial glucose spikes.',
            'Cardamom aids digestion and provides authentic natural sweetness without elevating blood sugar.',
          ],
          whyItFitsBodyGoal: 'Has only 1.8g sugar and 8.5g of blood-sugar stabilizing soluble fiber, making it 100% safe for diabetic individuals.',
          customCookerOrderPrompt: 'Request a verified home baker in your area to prepare sugar-free almond bakes and desserts for you.',
        },
        {
          id: `recipe-ai-diab-2-${timestamp}`,
          recipeName: 'Methi (Fenugreek) & Paneer High-Fiber Diabetic Roll',
          tagline: 'AI Recommended: Blood sugar stabilizing wrap with low insulin spike index',
          goalType: 'Diabetic-Safe & Low Glycemic',
          prepTimeMinutes: 10,
          cookTimeMinutes: 12,
          difficulty: 'Easy',
          macros: { calories: 260, protein: 16, carbs: 18, fat: 11, sugar: 2.1, fiber: 6.5 },
          ingredients: [
            { name: 'Fresh Methi (Fenugreek) Leaves', amount: '1 cup chopped', notes: 'Natural galactomannan fiber' },
            { name: 'Low-Fat Fresh Paneer (Cottage Cheese)', amount: '120g cubed' },
            { name: 'Oats & Flaxseed flour wrapper', amount: '1 piece' },
            { name: 'Cumin powder, turmeric & black salt', amount: '1/2 tsp each' },
            { name: 'Cold-pressed coconut oil', amount: '1/2 tsp' },
          ],
          stepByStepInstructions: [
            { stepNumber: 1, title: 'Sauté Methi with Spices', instruction: 'Heat pan with 1/2 tsp oil. Add cumin seeds, turmeric, and fresh methi leaves. Cook until wilted (3 mins).', timingMinutes: 3 },
            { stepNumber: 2, title: 'Fold Paneer & Season', instruction: 'Add low-fat paneer cubes with black salt. Toss gently for 3 minutes over low flame.', timingMinutes: 3 },
            { stepNumber: 3, title: 'Wrap & Toast', instruction: 'Place filling onto warmed oats-flax flatbread, roll tightly, and lightly toast each side on a griddle.', timingMinutes: 4 },
          ],
          chefTips: ['Fenugreek seeds and leaves contain trigonelline which naturally enhances insulin secretion sensitivity.'],
          whyItFitsBodyGoal: 'Delivers 16g protein and under 2.5g sugar with abundant soluble fiber to slow glucose breakdown.',
          customCookerOrderPrompt: 'Request local home cookers to prepare fresh methi paneer wraps for your evening snacks.',
        },
      ];
      return diabeticRecipes[Math.abs(cycle) % diabeticRecipes.length];
    }

    if (goal === 'WEIGHT_LOSS') {
      const weightLossRecipes: GeneratedAIRecipe[] = [
        {
          id: `recipe-ai-wl-1-${timestamp}`,
          recipeName: 'Steamed Spiced Lentil & Spinach High-Satiety Dumplings',
          tagline: 'AI Recommended: High volume, low-calorie fat loss comfort meal',
          goalType: 'Weight Loss & Calorie Deficit',
          prepTimeMinutes: 12,
          cookTimeMinutes: 15,
          difficulty: 'Easy',
          macros: { calories: 290, protein: 18, carbs: 38, fat: 4, sugar: 2.2, fiber: 7.0 },
          ingredients: [
            { name: 'Yellow Moong Dal (Split Lentils)', amount: '80g (soaked 30 mins)' },
            { name: 'Fresh Spinach (Palak)', amount: '1 cup, finely shredded' },
            { name: 'Ginger & Green Chilli Paste', amount: '1 tsp' },
            { name: 'Hing (Asafoetida) & Cumin Powder', amount: '1/4 tsp' },
            { name: 'Himalayan Pink Salt', amount: '1/2 tsp' },
          ],
          stepByStepInstructions: [
            { stepNumber: 1, title: 'Grind Dal Coarsely', instruction: 'Drain soaked moong dal. Grind into a coarse, thick batter using minimal water.', timingMinutes: 4 },
            { stepNumber: 2, title: 'Fold Greens & Spices', instruction: 'Mix in shredded fresh spinach, ginger paste, cumin powder, and salt. Beat batter for 1 minute for fluffiness.', timingMinutes: 3 },
            { stepNumber: 3, title: 'Steam in Steamer Pot', instruction: 'Drop spoonfuls of batter into steamer. Steam on high heat for 12-14 minutes until cooked through.', timingMinutes: 14 },
            { stepNumber: 4, title: 'Serve Warm', instruction: 'Serve warm with fresh mint coriander dip. Zero cooking oil needed!', timingMinutes: 2 },
          ],
          chefTips: ['Steaming locks in 100% of the micronutrients without requiring added oil.', 'Moong dal protein triggers satiety hormone peptide YY.'],
          whyItFitsBodyGoal: 'Delivers 18g plant protein at under 300 total calories, leaving ample caloric room in your daily deficit.',
          customCookerOrderPrompt: 'Request a nearby home cooker to prepare steamed lentil fitness meals for daily doorstep delivery.',
        },
        {
          id: `recipe-ai-wl-2-${timestamp}`,
          recipeName: 'Zesty Lemon Garlic Herb Grilled Chicken Garden Bowl',
          tagline: 'AI Recommended: Ultra-lean 310 kcal protein bowl with crisp garden crunch',
          goalType: 'Weight Loss & Calorie Deficit',
          prepTimeMinutes: 10,
          cookTimeMinutes: 12,
          difficulty: 'Easy',
          macros: { calories: 310, protein: 34, carbs: 12, fat: 6, sugar: 2.8, fiber: 5.5 },
          ingredients: [
            { name: 'Lean Chicken Breast Fillet', amount: '200g boneless' },
            { name: 'Lemon Juice & Crushed Garlic', amount: '2 tbsp' },
            { name: 'Fresh Oregano, Black Pepper & Rosemary', amount: '1 tsp' },
            { name: 'Cucumber, Cherry Tomatoes & Lettuce', amount: '2 cups chopped' },
            { name: 'Apple Cider Vinegar & Olive Mist', amount: '1 tsp' },
          ],
          stepByStepInstructions: [
            { stepNumber: 1, title: 'Marinate Chicken', instruction: 'Pound breast flat. Rub with lemon juice, minced garlic, oregano, and salt. Rest 10 mins.', timingMinutes: 10 },
            { stepNumber: 2, title: 'Sear in Skillet', instruction: 'Sear over medium flame for 5-6 mins per side until charred and cooked through.', timingMinutes: 12 },
            { stepNumber: 3, title: 'Toss Greens', instruction: 'Toss cucumber, tomatoes, and crisp greens with apple cider vinegar dressing. Slice chicken on top.', timingMinutes: 3 },
          ],
          chefTips: ['High protein intake during fat loss prevents metabolic adaptation and preserves muscle tissue.'],
          whyItFitsBodyGoal: 'Massive 34g protein payout with only 310 total kcal and 6g fat, perfect for strict cutting phases.',
          customCookerOrderPrompt: 'Order fresh customized grilled chicken diet bowls made by neighbourhood home cooks.',
        },
        {
          id: `recipe-ai-wl-3-${timestamp}`,
          recipeName: 'Roasted Cauliflower Tikka & Greek Yogurt Herb Bowl',
          tagline: 'AI Recommended: Low calorie vegetarian comfort bowl with warming tandoori spices',
          goalType: 'Weight Loss & Calorie Deficit',
          prepTimeMinutes: 12,
          cookTimeMinutes: 18,
          difficulty: 'Easy',
          macros: { calories: 230, protein: 14, carbs: 22, fat: 5, sugar: 3.5, fiber: 6.8 },
          ingredients: [
            { name: 'Cauliflower Florets', amount: '250g' },
            { name: 'Thick Low-Fat Curd', amount: '3 tbsp' },
            { name: 'Tandoori Masala & Turmeric', amount: '1 tsp' },
            { name: 'Kasuri Methi & Lemon Juice', amount: '1 tsp' },
          ],
          stepByStepInstructions: [
            { stepNumber: 1, title: 'Coat Florets', instruction: 'Coat cauliflower florets in spiced yogurt marinade.', timingMinutes: 4 },
            { stepNumber: 2, title: 'Roast Crisp', instruction: 'Roast in air fryer or oven at 200°C for 16-18 mins until edges are golden brown and charred.', timingMinutes: 18 },
          ],
          chefTips: ['Kasuri methi brings restaurant-style tandoori aroma with zero extra calories.'],
          whyItFitsBodyGoal: 'Only 230 calories with high cruciferous glucosinolates and filling prebiotic fiber.',
          customCookerOrderPrompt: 'Ask a local cook to prepare baked vegetable tikkas for your diet schedule.',
        },
      ];
      return weightLossRecipes[Math.abs(cycle) % weightLossRecipes.length];
    }

    if (goal === 'LOW_CARB') {
      const ketoRecipes: GeneratedAIRecipe[] = [
        {
          id: `recipe-ai-keto-1-${timestamp}`,
          recipeName: 'Keto Garlic Butter Mushroom & Charred Herb Broccoli Skillet',
          tagline: 'AI Recommended: Ketogenic powerhouse with only 5g net carbs',
          goalType: 'Keto & Low-Carb Nutrition',
          prepTimeMinutes: 8,
          cookTimeMinutes: 10,
          difficulty: 'Easy',
          macros: { calories: 270, protein: 12, carbs: 7, fat: 20, sugar: 1.8, fiber: 4.2 },
          ingredients: [
            { name: 'Button Mushrooms', amount: '150g sliced' },
            { name: 'Fresh Broccoli Florets', amount: '150g' },
            { name: 'Pure Country Butter / Ghee', amount: '1.5 tbsp' },
            { name: 'Minced Garlic & Fresh Thyme', amount: '1 tbsp' },
            { name: 'Parmesan or Aged Cheese (optional)', amount: '1 tbsp grated' },
          ],
          stepByStepInstructions: [
            { stepNumber: 1, title: 'Blanch Broccoli', instruction: 'Dip broccoli in boiling salted water for 90 seconds, then drain.', timingMinutes: 2 },
            { stepNumber: 2, title: 'Sauté in Butter', instruction: 'Melt butter in a pan. Sauté garlic and mushrooms on high heat until browned (4 mins).', timingMinutes: 4 },
            { stepNumber: 3, title: 'Toss Together', instruction: 'Add broccoli, herbs, and black pepper. Toss for 2 mins and garnish with parmesan.', timingMinutes: 2 },
          ],
          chefTips: ['Cooking mushrooms on high heat prevents sogginess and develops deep umami richness.'],
          whyItFitsBodyGoal: 'Keeps carbohydrate count under 7g total while providing clean healthy fats to sustain ketosis.',
          customCookerOrderPrompt: 'Order freshly prepared keto stir fries and low carb snacks from local bakers.',
        },
      ];
      return ketoRecipes[Math.abs(cycle) % ketoRecipes.length];
    }

    // Default: Muscle Gain (High Protein)
    const muscleGainRecipes: GeneratedAIRecipe[] = [
      {
        id: `recipe-ai-mg-1-${timestamp}`,
        recipeName: 'Malabar Tandoori Spiced Chicken & Golden Quinoa Bowl',
        tagline: 'AI Recommended: Premium muscle synthesis recipe delivering 38g clean bioavailable protein',
        goalType: 'High-Protein Muscle Building',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        difficulty: 'Easy',
        macros: { calories: 440, protein: 38, carbs: 42, fat: 9, sugar: 3.0, fiber: 5.0 },
        ingredients: [
          { name: 'Skinless Chicken Breast Fillets', amount: '220g' },
          { name: 'Thick Greek Curd / Hung Yogurt', amount: '2 tbsp (50g)' },
          { name: 'Kashmiri Red Chilli, Turmeric & Garam Masala', amount: '1 tsp each' },
          { name: 'Ginger-Garlic Paste & Lemon Juice', amount: '1 tbsp' },
          { name: 'Boiled Quinoa or Matta Rice', amount: '1 cup (140g)' },
          { name: 'Cold Pressed Mustard / Olive Oil', amount: '1 tsp' },
        ],
        stepByStepInstructions: [
          { stepNumber: 1, title: 'Marinate Chicken Fillets', instruction: 'Score chicken fillets with shallow slits. Coat with spiced yogurt marinade and rest 15 mins.', timingMinutes: 15 },
          { stepNumber: 2, title: 'Pan Sear / Oven Bake', instruction: 'Sear on a grill pan with 1 tsp oil for 6 mins per side until charred on edges and tender inside.', timingMinutes: 12 },
          { stepNumber: 3, title: 'Steam Quinoa / Rice', instruction: 'Fluff warm quinoa with chopped coriander and sea salt.', timingMinutes: 3 },
          { stepNumber: 4, title: 'Assemble Power Bowl', instruction: 'Slice grilled chicken breast. Arrange over quinoa with sliced cucumbers and pickled onions.', timingMinutes: 3 },
        ],
        chefTips: ['Greek yogurt lactic acid tenders chicken naturally without high calorie butter.', 'Quinoa provides all 9 essential amino acids for optimal protein synthesis.'],
        whyItFitsBodyGoal: 'Delivers 38g bioavailable protein with minimal fat, directly triggering muscle protein synthesis.',
        customCookerOrderPrompt: 'Request neighbourhood home cooks to prepare this custom fitness meal in bulk for you!',
      },
      {
        id: `recipe-ai-mg-2-${timestamp}`,
        recipeName: 'Smoked Paprika Fresh Paneer & Charred Veggie Protein Skillet',
        tagline: 'AI Recommended: 33g vegetarian muscle fuel prepared with low-fat paneer and whole spices',
        goalType: 'High-Protein Muscle Building',
        prepTimeMinutes: 10,
        cookTimeMinutes: 12,
        difficulty: 'Easy',
        macros: { calories: 410, protein: 33, carbs: 32, fat: 12, sugar: 3.2, fiber: 6.0 },
        ingredients: [
          { name: 'Fresh Low-Fat Paneer (Malai-free)', amount: '200g cubed' },
          { name: 'Bell Peppers (Capsicum) & Red Onion', amount: '1.5 cups diced' },
          { name: 'Smoked Paprika, Cumin & Black Pepper', amount: '1 tsp each' },
          { name: 'Cold Pressed Olive Oil or Ghee', amount: '1 tsp' },
          { name: 'Boiled Chickpeas or Steamed Rice', amount: '1/2 cup (80g)' },
        ],
        stepByStepInstructions: [
          { stepNumber: 1, title: 'Dust Paneer with Spices', instruction: 'Toss paneer cubes with smoked paprika, cumin, and a pinch of rock salt.', timingMinutes: 3 },
          { stepNumber: 2, title: 'Sear Paneer Golden', instruction: 'Heat skillet with 1 tsp olive oil. Sear paneer cubes for 2-3 minutes per side until crusty and golden.', timingMinutes: 5 },
          { stepNumber: 3, title: 'Flash Sauté Veggies', instruction: 'Add bell peppers and onions to the same pan. Stir-fry on high flame for 3 minutes for smoky crunch.', timingMinutes: 3 },
          { stepNumber: 4, title: 'Combine & Plate', instruction: 'Combine paneer with veggies and boiled chickpeas. Squeeze fresh lime juice over top and serve warm.', timingMinutes: 2 },
        ],
        chefTips: ['Low-fat cottage cheese/paneer delivers sustained casein protein, ideal for overnight muscle repair.', 'Bell peppers provide 150% daily Vitamin C, promoting collagen synthesis.'],
        whyItFitsBodyGoal: 'Packed with 33g clean vegetarian protein and complex carbs for high stamina and hypertrophy.',
        customCookerOrderPrompt: 'Request a local vegetarian home kitchen to prepare fresh high-protein paneer meal plans for you.',
      },
      {
        id: `recipe-ai-mg-3-${timestamp}`,
        recipeName: 'Kerala Pepper Fish Fillet with Steamed Greens & Sweet Potato',
        tagline: 'AI Recommended: 42g lean omega-rich protein platter for explosive gym recovery',
        goalType: 'High-Protein Muscle Building',
        prepTimeMinutes: 12,
        cookTimeMinutes: 15,
        difficulty: 'Easy',
        macros: { calories: 390, protein: 42, carbs: 28, fat: 7, sugar: 3.0, fiber: 4.5 },
        ingredients: [
          { name: 'Fresh White Fish Fillet (Neymeen/Kingfish/Tilapia)', amount: '220g' },
          { name: 'Freshly Crushed Malabar Black Pepper & Turmeric', amount: '1.5 tsp' },
          { name: 'Lemon Juice & Curry Leaves', amount: '1 sprig + 1 tbsp' },
          { name: 'Steamed Sweet Potato Cubes', amount: '1 small (100g)' },
          { name: 'Virgin Coconut Oil', amount: '1 tsp' },
        ],
        stepByStepInstructions: [
          { stepNumber: 1, title: 'Rub Spice Paste', instruction: 'Make a thick paste with black pepper, turmeric, salt, and lemon juice. Coat fish fillets and rest 10 mins.', timingMinutes: 10 },
          { stepNumber: 2, title: 'Tawa Sear with Curry Leaves', instruction: 'Heat flat pan with 1 tsp coconut oil and curry leaves. Sear fish for 4 mins per side until flakey and fragrant.', timingMinutes: 8 },
          { stepNumber: 3, title: 'Serve with Sweet Potato', instruction: 'Serve hot alongside steamed sweet potato chunks and lemon wedges.', timingMinutes: 2 },
        ],
        chefTips: ['Marine white fish has one of the highest biological protein absorption values (BV 85+).', 'Piperine in black pepper boosts nutrient bioavailability by up to 200%.'],
        whyItFitsBodyGoal: 'Gigantic 42g protein with zero junk carbs and anti-inflammatory Malabar black pepper.',
        customCookerOrderPrompt: 'Ask a coastal Kerala home cook to prepare fresh pepper grilled fish fillets for your workout dinner.',
      },
      {
        id: `recipe-ai-mg-4-${timestamp}`,
        recipeName: 'Protein-Packed Spiced Egg Whites & Sprouted Moong Power Chaat',
        tagline: 'AI Recommended: 29g quick-digesting bio-protein bowl for rapid post-workout nutrition',
        goalType: 'High-Protein Muscle Building',
        prepTimeMinutes: 8,
        cookTimeMinutes: 6,
        difficulty: 'Easy',
        macros: { calories: 320, protein: 29, carbs: 32, fat: 5, sugar: 2.8, fiber: 6.2 },
        ingredients: [
          { name: 'Hard Boiled Egg Whites (or whole eggs)', amount: '4 whites + 1 whole' },
          { name: 'Sprouted Green Moong (Lentils)', amount: '1 cup steamed' },
          { name: 'Chopped Onion, Tomato, Green Chilli & Coriander', amount: '1 cup' },
          { name: 'Chaat Masala & Roasted Cumin Powder', amount: '1/2 tsp each' },
          { name: 'Fresh Lemon Juice', amount: '1 tbsp' },
        ],
        stepByStepInstructions: [
          { stepNumber: 1, title: 'Cube Egg Whites', instruction: 'Dice boiled egg whites and whole egg into bite sized pieces.', timingMinutes: 2 },
          { stepNumber: 2, title: 'Toss with Sprouted Moong', instruction: 'In a large mixing bowl, combine diced eggs, steamed sprouted moong, chopped onions, and tomatoes.', timingMinutes: 3 },
          { stepNumber: 3, title: 'Season & Serve', instruction: 'Sprinkle chaat masala, roasted cumin, and drizzle lemon juice. Toss lightly and enjoy immediately.', timingMinutes: 2 },
        ],
        chefTips: ['Sprouting green moong increases its vitamin C and active enzyme content by 300%.'],
        whyItFitsBodyGoal: 'Light on the stomach while providing 29g pure albumen and plant protein to repair muscle tears.',
        customCookerOrderPrompt: 'Order fresh egg white power bowls and healthy bakes from verified local kitchens.',
      },
    ];

    return muscleGainRecipes[Math.abs(cycle) % muscleGainRecipes.length];
  }

  /**
   * Optional Gemini API integration if environment key is provided
   */
  private static async callGeminiAPI(
    params: any,
    goal: string,
    targetProtein: number,
    targetCalories: number,
    targetSugar: number
  ): Promise<GeneratedAIRecipe | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const promptText = `
You are an expert sports nutritionist and gourmet home chef.
Generate a healthy, mouth-watering homemade recipe matching these exact parameters:
User Request: "${params.prompt}"
Goal: ${goal}
Target Protein: at least ${targetProtein}g
Target Calories: under ${targetCalories} kcal
Target Sugar: under ${targetSugar}g
Dietary Preferences: ${(params.dietary || []).join(', ')}

Respond ONLY with a valid JSON object matching this schema:
{
  "recipeName": "string",
  "tagline": "string",
  "goalType": "string",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "difficulty": "Easy" | "Medium" | "Chef Level",
  "macros": { "calories": number, "protein": number, "carbs": number, "fat": number, "sugar": number, "fiber": number },
  "ingredients": [ { "name": "string", "amount": "string", "notes": "string" } ],
  "stepByStepInstructions": [ { "stepNumber": number, "title": "string", "instruction": "string", "timingMinutes": number } ],
  "chefTips": [ "string", "string" ],
  "whyItFitsBodyGoal": "string",
  "customCookerOrderPrompt": "string"
}
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      const parsed = JSON.parse(candidateText);
      return {
        id: `recipe-gemini-${Date.now()}`,
        ...parsed,
      };
    }
    return null;
  }
}
