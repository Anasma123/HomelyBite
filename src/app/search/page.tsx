'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import { RankedSearchResult } from '@/lib/services/search-service';
import { RankedAISearchResult, AIInterpretation } from '@/lib/services/ai-search-service';
import { GeneratedAIRecipe } from '@/lib/services/ai-recipe-service';
import { CustomFoodRequest } from '@/lib/types';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  Star,
  CheckCircle2,
  X,
  RotateCcw,
  RotateCw,
  Dumbbell,
  HeartPulse,
  Activity,
  Flame,
  Zap,
  Clock,
  Plus,
  Check,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ChefHat,
  Utensils,
  UtensilsCrossed,
  BookOpen,
  Send,
  ShoppingBag,
} from 'lucide-react';

const BODY_GOAL_PRESETS = [
  {
    id: 'MUSCLE_GAIN',
    label: 'Muscle Gain / Gym',
    icon: Dumbbell,
    minProtein: 20,
    maxCalories: 600,
    maxSugar: 12,
    color: 'from-purple-500 to-indigo-600',
    samplePrompt: 'High protein gym meal with at least 20g protein',
  },
  {
    id: 'WEIGHT_LOSS',
    label: 'Weight Loss / Diet',
    icon: Flame,
    minProtein: 12,
    maxCalories: 350,
    maxSugar: 8,
    color: 'from-orange-500 to-amber-600',
    samplePrompt: 'Low calorie light meal under 350 calories for fat loss',
  },
  {
    id: 'DIABETIC_SAFE',
    label: 'Low Sugar / Diabetic',
    icon: HeartPulse,
    minProtein: 8,
    maxCalories: 450,
    maxSugar: 5,
    color: 'from-emerald-500 to-teal-600',
    samplePrompt: 'Low glycemic dessert with sugar under 5g for diabetic diet',
  },
  {
    id: 'LOW_CARB',
    label: 'Keto / Low-Carb',
    icon: Zap,
    minProtein: 15,
    maxCalories: 500,
    maxSugar: 4,
    color: 'from-blue-500 to-cyan-600',
    samplePrompt: 'Keto friendly meal with low carbs and healthy fats',
  },
  {
    id: 'HIGH_FIBER',
    label: 'Gut Health & Fiber',
    icon: Activity,
    minProtein: 10,
    maxCalories: 400,
    maxSugar: 10,
    color: 'from-green-500 to-emerald-600',
    samplePrompt: 'High fiber meal promoting easy digestion and gut health',
  },
  {
    id: 'CLEAN_EATING',
    label: 'Clean & Wholesome',
    icon: Sparkles,
    minProtein: 10,
    maxCalories: 500,
    maxSugar: 15,
    color: 'from-rose-500 to-pink-600',
    samplePrompt: 'Wholesome organic homemade meal with zero preservatives',
  },
];

const COMMON_PANTRY_ITEMS = [
  'Eggs',
  'Rolled Oats',
  'Chicken Breast',
  'Milk / Curd',
  'Ripe Banana',
  'Paneer / Tofu',
  'Basmati Rice',
  'Tomatoes & Onions',
  'Spinach (Palak)',
  'Peanut Butter',
  'Flour / Maida',
  'Chia Seeds',
];

function GeneratedRecipeCard({
  recipe,
  onOrderRequest,
  orderSent,
  onRefresh,
  isRefreshing,
}: {
  recipe: GeneratedAIRecipe;
  onOrderRequest?: () => void;
  orderSent?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div className="bg-white rounded-3xl border-2 border-orange-200/90 overflow-hidden shadow-lg space-y-6 p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>AI Recommended Chef Recipe & Preparation Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {recipe.recipeName}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{recipe.tagline}</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Thinking...' : '🔄 Suggest Another Dish'}</span>
            </button>
          )}

          <div className="text-center px-3 py-2 bg-orange-50 rounded-2xl border border-orange-100">
            <span className="text-[10px] text-gray-400 block font-medium">Total Time</span>
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1 justify-center">
              <Clock className="w-3 h-3 text-orange-500" />
              {recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins
            </span>
          </div>
          <div className="text-center px-3 py-2 bg-purple-50 rounded-2xl border border-purple-100">
            <span className="text-[10px] text-gray-400 block font-medium">Difficulty</span>
            <span className="text-xs font-bold text-purple-700">{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Verified Macro Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
        <div className="bg-gradient-to-br from-orange-50 to-white p-3 rounded-2xl border border-orange-200/60">
          <span className="text-[10px] text-gray-400 block font-medium">Calories</span>
          <strong className="text-lg font-black text-gray-900">{recipe.macros.calories}</strong>
          <span className="text-[10px] text-gray-500 block">kcal</span>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-white p-3 rounded-2xl border border-purple-200/60">
          <span className="text-[10px] text-gray-400 block font-medium">Protein</span>
          <strong className="text-lg font-black text-purple-700">{recipe.macros.protein}g</strong>
          <span className="text-[10px] text-purple-600 font-semibold block">High Muscle</span>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-white p-3 rounded-2xl border border-amber-200/60">
          <span className="text-[10px] text-gray-400 block font-medium">Carbs</span>
          <strong className="text-lg font-black text-amber-700">{recipe.macros.carbs}g</strong>
          <span className="text-[10px] text-gray-400 block">Clean fuel</span>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-white p-3 rounded-2xl border border-rose-200/60">
          <span className="text-[10px] text-gray-400 block font-medium">Fat</span>
          <strong className="text-lg font-black text-rose-700">{recipe.macros.fat}g</strong>
          <span className="text-[10px] text-gray-400 block">Healthy fats</span>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white p-3 rounded-2xl border border-blue-200/60">
          <span className="text-[10px] text-gray-400 block font-medium">Sugar</span>
          <strong className="text-lg font-black text-blue-700">{recipe.macros.sugar}g</strong>
          <span className="text-[10px] text-blue-600 font-semibold block">Low GI</span>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white p-3 rounded-2xl border border-emerald-200/60">
          <span className="text-[10px] text-gray-400 block font-medium">Fiber</span>
          <strong className="text-lg font-black text-emerald-700">{recipe.macros.fiber}g</strong>
          <span className="text-[10px] text-emerald-600 block">Gut motility</span>
        </div>
      </div>

      {/* Complete Metabolic Health Assessment */}
      <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white rounded-2xl border border-purple-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-purple-600" />
            Complete Metabolic & Body-Fit Analysis
          </span>
          <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
            Health Grade: A+
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="p-2.5 bg-white rounded-xl border border-purple-100">
            <span className="text-[10px] text-gray-400 block font-medium">Glycemic Load</span>
            <strong className="text-gray-900 font-bold block">Low Glycemic</strong>
            <span className="text-[10px] text-emerald-600 font-medium">Stable Insulin Curve</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-purple-100">
            <span className="text-[10px] text-gray-400 block font-medium">Muscle Synthesis</span>
            <strong className="text-gray-900 font-bold block">High Bio-Availability</strong>
            <span className="text-[10px] text-purple-600 font-medium">Active Hypertrophy</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-purple-100">
            <span className="text-[10px] text-gray-400 block font-medium">Satiety Index</span>
            <strong className="text-gray-900 font-bold block">94 / 100</strong>
            <span className="text-[10px] text-blue-600 font-medium">Fullness for 4+ hrs</span>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-purple-100">
            <span className="text-[10px] text-gray-400 block font-medium">Clean Standard</span>
            <strong className="text-gray-900 font-bold block">100% Homemade</strong>
            <span className="text-[10px] text-emerald-600 font-medium">0 Chemical Additives</span>
          </div>
        </div>
      </div>

      {/* Why it fits body goal narrative */}
      <div className="p-3.5 bg-gradient-to-r from-orange-50 via-amber-50/60 to-white rounded-2xl border border-orange-200 text-xs text-orange-950 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Why AI Recommends This For Your Body:</strong>
          <p className="text-gray-700 leading-relaxed mt-0.5">{recipe.whyItFitsBodyGoal}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left: Ingredients breakdown */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-gray-900 text-sm">Ingredients Required</h3>
          </div>
          <div className="bg-gray-50/80 rounded-2xl border border-gray-200 p-4 divide-y divide-gray-100">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    ✓
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 block">{ing.name}</span>
                    {ing.notes && <span className="text-[10px] text-gray-400 block">{ing.notes}</span>}
                  </div>
                </div>
                <span className="font-bold text-orange-700 text-[11px] shrink-0 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                  {ing.amount}
                </span>
              </div>
            ))}
          </div>

          {/* Pro Chef Tips */}
          {recipe.chefTips && recipe.chefTips.length > 0 && (
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-1.5 text-xs">
              <strong className="font-bold text-amber-900 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                Chef's Nutrition & Prep Tips:
              </strong>
              <ul className="space-y-1 text-gray-600 pl-4 list-disc text-[11px]">
                {recipe.chefTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Step-by-Step Instructions */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-gray-900 text-sm">Step-by-Step Preparation Method</h3>
          </div>

          <div className="space-y-3">
            {recipe.stepByStepInstructions.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs hover:border-orange-200 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                    Step {step.stepNumber}
                  </span>
                  {step.timingMinutes && (
                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ~{step.timingMinutes} mins
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{step.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{step.instruction}</p>
              </div>
            ))}
          </div>

          {/* Custom Order Request to Nearby Bakers / Cooks */}
          <div className="p-5 bg-gradient-to-r from-gray-950 via-gray-900 to-black text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl mt-4">
            <div>
              <p className="font-extrabold text-sm sm:text-base flex items-center gap-2 text-orange-400">
                <ChefHat className="w-5 h-5 text-orange-400" />
                Want a Verified Local Baker to Cook This Dish for You?
              </p>
              <p className="text-xs text-gray-300 mt-1 max-w-xl">
                Send this exact AI recipe to trusted neighbourhood home bakers. The baker will review the ingredients, quote a price & preparation time, and deliver it fresh!
              </p>
            </div>
            <button
              type="button"
              onClick={onOrderRequest}
              className="px-5 py-3 rounded-xl text-xs font-black transition-all shrink-0 flex items-center justify-center gap-2 shadow-lg bg-orange-600 hover:bg-orange-500 text-white"
            >
              <Send className="w-4 h-4" />
              <span>👨‍🍳 Request Baker to Cook This Dish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

{/* Modal to Request Local Baker to Cook Custom Dish */}
function RequestBakerModal({
  recipe,
  isOpen,
  onClose,
  onSuccess,
}: {
  recipe: GeneratedAIRecipe | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (req: CustomFoodRequest) => void;
}) {
  const { currentUser } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');
  const [selectedCooker, setSelectedCooker] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [submittedReq, setSubmittedReq] = useState<CustomFoodRequest | null>(null);
  const [availableCookers, setAvailableCookers] = useState<{ id: string; storeName: string; address: string; rating: number; status: string }[]>([]);
  const [loadingCookers, setLoadingCookers] = useState(false);

  // Fetch registered cookers dynamically
  useEffect(() => {
    if (!isOpen) return;
    setLoadingCookers(true);
    fetch('/api/cookers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.cookers) {
          const approved = data.cookers.filter((c: any) => c.status === 'APPROVED');
          setAvailableCookers(approved);
          if (approved.length === 1) setSelectedCooker(approved[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCookers(false));
  }, [isOpen]);

  if (!isOpen || !recipe) return null;

  // Enforce customer account login / registration
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-gray-100 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 text-sm"
          >
            ✕
          </button>
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <ChefHat className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-lg text-gray-900">Customer Account Required</h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              To request home bakers to prepare custom recipes and receive personal quotes & baking time, please sign in or register as a customer.
            </p>
          </div>

          <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-100 text-left text-xs">
            <span className="text-[10px] uppercase font-bold text-orange-800 tracking-wider block">Selected Recipe</span>
            <strong className="text-gray-900 font-bold block mt-0.5">{recipe.recipeName}</strong>
            <span className="text-gray-500 text-[11px]">{recipe.macros.calories} kcal • {recipe.macros.protein}g Protein per serving</span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/auth/login?redirect=/search"
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs transition-all shadow-xs"
            >
              Sign In to Account →
            </Link>
            <Link
              href="/auth/register?role=CUSTOMER&redirect=/search"
              className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl text-xs transition-all"
            >
              Register as Customer
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getSelectedCookerName = () => {
    if (selectedCooker === 'ALL') return 'Broadcast to All Nearby Bakers';
    const found = availableCookers.find((c) => c.id === selectedCooker);
    return found?.storeName || 'Selected Baker';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishName: recipe.recipeName,
          dishDescription: recipe.tagline,
          ingredients: recipe.ingredients,
          cookingSteps: recipe.stepByStepInstructions.map((s) => `${s.stepNumber}. ${s.title}: ${s.instruction}`),
          macros: recipe.macros,
          servings: quantity,
          customerId: currentUser.id,
          customerName: currentUser.name,
          customerPhone: currentUser.phone || '',
          deliveryAddress: { street: '', city: '', pincode: '' },
          specialNotes,
          cookerId: selectedCooker,
          cookerStoreName: getSelectedCookerName(),
        }),
      });
      const data = await res.json();
      if (data.success && data.request) {
        setSubmittedReq(data.request);
        onSuccess(data.request);
      } else {
        alert(data.message || 'Failed to submit request');
      }
    } catch {
      alert('Network error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-gray-100 my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Request Baker to Cook</h3>
              <p className="text-[11px] text-gray-500">Custom Home Kitchen Preparation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg text-lg">
            ✕
          </button>
        </div>

        {submittedReq ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-gray-500">#{submittedReq.requestNumber}</span>
              <h4 className="text-lg font-black text-gray-900 mt-1">Request Sent to Baker!</h4>
              <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                Your custom dish &quot;{recipe.recipeName}&quot; ({quantity} {quantity === 1 ? 'serving' : 'servings'}) has been submitted.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 text-xs text-orange-950 text-left space-y-1.5">
              <strong className="block font-bold">What happens next:</strong>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-700">
                <li>Baker reviews recipe & quotes preparation price and baking time.</li>
                <li>You receive notification on your customer account to accept the quote.</li>
                <li>Baker prepares it fresh and delivers straight to your doorstep!</li>
              </ol>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Dish Card Summary */}
            <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
              <div>
                <strong className="text-gray-900 block font-bold text-xs">{recipe.recipeName}</strong>
                <span className="text-[11px] text-gray-500">
                  {recipe.macros.calories} kcal • {recipe.macros.protein}g Protein per serving
                </span>
              </div>
              <span className="text-xs font-black text-orange-700 bg-white px-2.5 py-1 rounded-lg border border-orange-200 shadow-2xs">
                Qty: {quantity}
              </span>
            </div>

            {/* Clean Quantity Selector */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Enter Quantity to Prepare:</label>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-gray-200 rounded-2xl bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-black flex items-center justify-center shadow-2xs transition-all disabled:opacity-40"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                    className="w-14 text-center font-black text-sm bg-transparent text-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-black flex items-center justify-center shadow-2xs transition-all"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-500 font-semibold">
                  {quantity === 1 ? '1 Dish / Serving' : `${quantity} Dishes / Servings`}
                </span>
              </div>
            </div>

            {/* Select Baker - Dynamic from registered cookers */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Select Home Baker / Kitchen:</label>
              {loadingCookers ? (
                <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-400 animate-pulse">
                  Loading registered bakers...
                </div>
              ) : (
                <select
                  value={selectedCooker}
                  onChange={(e) => setSelectedCooker(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">📢 Broadcast to All Verified Home Bakers Nearby</option>
                  {availableCookers.map((c) => (
                    <option key={c.id} value={c.id}>
                      ⭐ {c.storeName} ({c.address}) — ★{c.rating.toFixed(1)}
                    </option>
                  ))}
                </select>
              )}
              {availableCookers.length === 0 && !loadingCookers && (
                <p className="text-[10px] text-gray-400 mt-1">No approved bakers found. Use &quot;Broadcast&quot; to notify all nearby bakers.</p>
              )}
            </div>

            {/* Customer Details (Auto-filled from Account — Read Only) */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                  {currentUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <span className="font-bold text-gray-900 block text-xs">{currentUser.name}</span>
                  <span className="text-[11px] text-gray-500">{currentUser.phone || currentUser.email}</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                Verified Account
              </span>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Special Dietary / Allergy Notes (Optional)</label>
              <input
                type="text"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="e.g. Less oil, use cold-pressed ghee, extra spicy..."
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                {submitting ? 'Sending Request...' : 'Send Request to Baker →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  // Mode: AI Body Search or Standard Search
  const [searchMode, setSearchMode] = useState<'AI' | 'STANDARD'>(
    searchParams.get('mode') === 'standard' ? 'STANDARD' : 'AI'
  );

  // Sub-tabs in AI Mode: Verified Marketplace Matches vs Pantry AI Chef vs Custom Recipe
  const [aiSubTab, setAiSubTab] = useState<'MATCHES' | 'PANTRY' | 'CUSTOM'>('MATCHES');

  // AI Search States
  const [aiPrompt, setAiPrompt] = useState(searchParams.get('q') || searchParams.get('prompt') || '');
  const [selectedGoal, setSelectedGoal] = useState<string>(searchParams.get('goal') || '');
  const [targetMinProtein, setTargetMinProtein] = useState<number>(
    searchParams.get('minProtein') ? Number(searchParams.get('minProtein')) : 0
  );
  const [targetMaxCalories, setTargetMaxCalories] = useState<number>(
    searchParams.get('maxCalories') ? Number(searchParams.get('maxCalories')) : 900
  );
  const [targetMaxSugar, setTargetMaxSugar] = useState<number>(
    searchParams.get('maxSugar') ? Number(searchParams.get('maxSugar')) : 40
  );
  const [aiInterpretation, setAiInterpretation] = useState<AIInterpretation | null>(null);
  const [aiResults, setAiResults] = useState<RankedAISearchResult[]>([]);
  const [allStoreProducts, setAllStoreProducts] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [addedItemAnim, setAddedItemAnim] = useState<string | null>(null);

  // AI Recipe States
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedAIRecipe | null>(null);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  const [recipeCycle, setRecipeCycle] = useState(0);
  const [aiGenMode, setAiGenMode] = useState<'RECOMMENDATION' | 'PANTRY'>('RECOMMENDATION');
  const [selectedRecipeForOrder, setSelectedRecipeForOrder] = useState<GeneratedAIRecipe | null>(null);
  const [isBakerModalOpen, setIsBakerModalOpen] = useState(false);
  const [pantryIngredients, setPantryIngredients] = useState<string[]>(['Eggs', 'Rolled Oats', 'Milk / Curd']);
  const [customIngredientInput, setCustomIngredientInput] = useState('');
  const [customOrderSent, setCustomOrderSent] = useState(false);

  // Standard Search States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  );
  const [maxDistance, setMaxDistance] = useState<number | undefined>(
    searchParams.get('distance') ? Number(searchParams.get('distance')) : undefined
  );
  const [minRating, setMinRating] = useState<number | undefined>(
    searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined
  );
  const [dietary, setDietary] = useState<string[]>(
    searchParams.get('dietary') ? searchParams.get('dietary')!.split(',') : []
  );
  const [nutrition, setNutrition] = useState<string[]>(
    searchParams.get('nutrition') ? searchParams.get('nutrition')!.split(',') : []
  );
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'relevance');
  const [results, setResults] = useState<RankedSearchResult[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Categories and Store Products
  useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCategories(data.categories);
      })
      .catch(() => {});

    fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.products) setAllStoreProducts(data.products);
      })
      .catch(() => {});
  }, []);

  // Execute AI Search
  const executeAISearch = async (overridePrompt?: string, overrideGoal?: string) => {
    setAiLoading(true);
    setCustomOrderSent(false);
    try {
      const activePrompt = overridePrompt !== undefined ? overridePrompt : aiPrompt;
      const activeGoal = overrideGoal !== undefined ? overrideGoal : selectedGoal;

      const res = await fetch('/api/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          goal: activeGoal || undefined,
          minProtein: targetMinProtein,
          maxCalories: targetMaxCalories,
          maxSugar: targetMaxSugar,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiInterpretation(data.interpretation);
        setAiResults(data.results || []);

        // Also fetch or prepare AI generated recipe as backup
        fetchAIRecipe(activePrompt, activeGoal);
      }
    } catch (err) {
      console.error('AI search failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Fetch AI Custom Recipe with dynamic cycle rotation
  const fetchAIRecipe = async (promptText?: string, goalType?: string, cycleIndex?: number) => {
    setIsGeneratingRecipe(true);
    try {
      const activeCycle = cycleIndex !== undefined ? cycleIndex : recipeCycle;
      const res = await fetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CUSTOM_RECIPE',
          prompt: promptText || aiPrompt || 'High protein homemade meal',
          goal: goalType || selectedGoal || 'MUSCLE_GAIN',
          targetProtein: targetMinProtein,
          targetCalories: targetMaxCalories,
          targetSugar: targetMaxSugar,
          cycle: activeCycle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedRecipe(data.recipe);
      }
    } catch (err) {
      console.error('Failed to generate AI recipe:', err);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const handleRefreshRecipe = () => {
    const nextCycle = recipeCycle + 1;
    setRecipeCycle(nextCycle);
    fetchAIRecipe(undefined, undefined, nextCycle);
  };

  // Fetch Recipe From On-Hand Pantry Ingredients
  const fetchPantryRecipe = async () => {
    setIsGeneratingRecipe(true);
    setCustomOrderSent(false);
    try {
      const res = await fetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PANTRY',
          ingredientsOnHand: pantryIngredients,
          goal: selectedGoal || 'MUSCLE_GAIN',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedRecipe(data.recipe);
      }
    } catch (err) {
      console.error('Failed to generate pantry recipe:', err);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  // Execute Standard Search
  const executeStandardSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedCategory) params.set('category', selectedCategory);
      if (maxPrice) params.set('maxPrice', maxPrice.toString());
      if (maxDistance) params.set('distance', maxDistance.toString());
      if (minRating) params.set('minRating', minRating.toString());
      if (dietary.length) params.set('dietary', dietary.join(','));
      if (nutrition.length) params.set('nutrition', nutrition.join(','));
      if (sortBy) params.set('sortBy', sortBy);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Standard search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial search trigger
  useEffect(() => {
    if (searchMode === 'AI') {
      executeAISearch();
    } else {
      executeStandardSearch();
    }
  }, [searchMode]);

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAiSubTab('MATCHES');
    executeAISearch();
  };

  const handleSelectGoalPreset = (preset: typeof BODY_GOAL_PRESETS[0]) => {
    setSelectedGoal(preset.id);
    setTargetMinProtein(preset.minProtein);
    setTargetMaxCalories(preset.maxCalories);
    setTargetMaxSugar(preset.maxSugar);
    setAiPrompt(preset.samplePrompt);
    executeAISearch(preset.samplePrompt, preset.id);
  };

  const handleAddFromAICard = (product: any, storeName?: string) => {
    const res = addToCart(product, 1, storeName);
    if (res.success) {
      setAddedItemAnim(product.id);
      setTimeout(() => setAddedItemAnim(null), 1200);
    } else {
      alert(res.message);
    }
  };

  const togglePantryIngredient = (item: string) => {
    setPantryIngredients((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomPantryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIngredientInput.trim()) return;
    if (!pantryIngredients.includes(customIngredientInput.trim())) {
      setPantryIngredients([...pantryIngredients, customIngredientInput.trim()]);
    }
    setCustomIngredientInput('');
  };

  const resetStandardFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setMaxPrice(undefined);
    setMaxDistance(undefined);
    setMinRating(undefined);
    setDietary([]);
    setNutrition([]);
    setSortBy('relevance');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Mode Navigation Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setSearchMode('AI')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              searchMode === 'AI'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            ✨ AI Body & Nutrition Search
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('STANDARD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              searchMode === 'STANDARD'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-4 h-4" />
            Standard Search
          </button>
        </div>

        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Macro Verification & AI Chef Engine Active</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: AI BODY & NUTRITION SEARCH */}
      {/* ========================================================================= */}
      {searchMode === 'AI' && (
        <div className="space-y-6">
          {/* AI Search Hero & Prompt Box */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50/50 to-white border border-orange-200/80 p-6 sm:p-8 shadow-xs">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>AI Health & Nutrition Intelligence</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Find Food Crafted For Your Body & Health Goals
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Type what your body needs — calories, high protein, low sugar, or health conditions. If no
                  cook has listed it, our AI Chef generates a custom step-by-step recipe, or helps you cook with
                  ingredients you currently have at home!
                </p>
              </div>

              {/* Natural Language Prompt Input */}
              <form onSubmit={handleAISubmit} className="pt-2 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. 'High protein food for gym under 450 cal' or 'Diabetic low sugar cake'..."
                    className="w-full pl-11 pr-4 py-3.5 bg-white text-xs sm:text-sm rounded-2xl border border-orange-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 shadow-xs transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                  />
                  <Sparkles className="w-4 h-4 text-orange-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0 shadow-md shadow-orange-500/20"
                >
                  {aiLoading ? 'Analyzing Macros...' : 'Analyze & Search with AI →'}
                </button>
              </form>

              {/* 1-Click Body Goal Quick Pills */}
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Quick Body & Fitness Goals (1-Click):
                </span>
                <div className="flex flex-wrap gap-2">
                  {BODY_GOAL_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedGoal === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectGoalPreset(preset)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-600 shadow-xs scale-105'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Macro Sliders Accordion */}
              <div className="pt-3 border-t border-orange-100/80 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/70 backdrop-blur-sm p-4 rounded-2xl border">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Min Protein:</span>
                    <span className="text-purple-700 font-bold">{targetMinProtein}g</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="2"
                    value={targetMinProtein}
                    onChange={(e) => setTargetMinProtein(Number(e.target.value))}
                    className="w-full accent-orange-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
                  />
                  <span className="text-[10px] text-gray-400">Aim: 20g+ for muscle synthesis</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Max Calories:</span>
                    <span className="text-orange-700 font-bold">{targetMaxCalories} kcal</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="900"
                    step="25"
                    value={targetMaxCalories}
                    onChange={(e) => setTargetMaxCalories(Number(e.target.value))}
                    className="w-full accent-orange-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
                  />
                  <span className="text-[10px] text-gray-400">Aim: &lt;400 for fat loss deficit</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Max Sugar Limit:</span>
                    <span className="text-blue-700 font-bold">{targetMaxSugar}g</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={targetMaxSugar}
                    onChange={(e) => setTargetMaxSugar(Number(e.target.value))}
                    className="w-full accent-orange-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
                  />
                  <span className="text-[10px] text-gray-400">Aim: &lt;5g for stable glucose</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Navigation Tabs: Matches vs Pantry AI Chef vs Custom AI Recipe */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setAiSubTab('MATCHES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                aiSubTab === 'MATCHES'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Kitchen Dishes ({aiResults.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setAiSubTab('PANTRY');
                fetchPantryRecipe();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                aiSubTab === 'PANTRY'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
              }`}
            >
              <ChefHat className="w-4 h-4 text-orange-500" />
              🍳 Cook With What You Have In Hand
            </button>

            <button
              type="button"
              onClick={() => {
                setAiSubTab('CUSTOM');
                fetchAIRecipe();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                aiSubTab === 'CUSTOM'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              ✨ AI Custom Recipe Generator
            </button>
          </div>

          {/* ============================================================== */}
          {/* SUB-TAB 1: VERIFIED MARKETPLACE DISHES */}
          {/* ============================================================== */}
          {aiSubTab === 'MATCHES' && (
            <div className="space-y-6">
              {/* AI Interpretation Live Callout */}
              {aiInterpretation && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block font-bold">
                        AI Goal Active: {aiInterpretation.goalLabel}
                      </strong>
                      <span className="text-emerald-700">{aiInterpretation.intentSummary}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto shrink-0">
                    {aiResults.length} Matches Found
                  </span>
                </div>
              )}

              {/* AI Results Grid or Automatic Recipe Fallback */}
              {aiLoading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 space-y-3">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-gray-700">
                    AI is scanning dish ingredients, computing nutrient density, and calculating body-fit percentages...
                  </p>
                </div>
              ) : aiResults.length === 0 ? (
                /* Fallback When No Product Matches in Kitchen */
                <div className="space-y-6">
                  {/* Explicit No Result Notice */}
                  <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-bold mb-1">
                          No Matches in Local Kitchens
                        </div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">
                          No matching dishes currently available in registered kitchens
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
                          {aiPrompt
                            ? `None of our verified local home kitchens have listed an approved dish matching "${aiPrompt}".`
                            : 'No kitchen dishes match your specific calorie and nutrient targets.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Available kitchen dishes fallback */}
                  {allStoreProducts.length > 0 && (
                    <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                            All Available Dishes From Verified Kitchens ({allStoreProducts.length})
                          </h3>
                          <p className="text-xs text-gray-500">
                            Explore freshly listed homemade dishes prepared by our neighbourhood cooks:
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchMode('STANDARD');
                            setQuery('');
                            executeStandardSearch();
                          }}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline self-start sm:self-auto"
                        >
                          Switch to Standard Menu →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                        {allStoreProducts.map((p) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* "Click to Generate AI Food Using Your Requirements" */}
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-purple-950 via-gray-900 to-black text-white rounded-3xl shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          AI Culinary Engine Ready
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
                          Generate AI Food Using Your Requirements
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-300 mt-1">
                          Choose how you would like our culinary AI to engineer your personalized healthy meal:
                        </p>
                      </div>
                    </div>

                    {/* The 2 Clear Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 1: AI Chef Recommendation (Get AI Food) */}
                      <button
                        type="button"
                        onClick={() => {
                          setAiGenMode('RECOMMENDATION');
                          if (!generatedRecipe) fetchAIRecipe();
                        }}
                        className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          aiGenMode === 'RECOMMENDATION'
                            ? 'bg-purple-600/30 border-purple-400 ring-2 ring-purple-400/50 shadow-md'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            Option 1: Get AI Food
                          </span>
                          {aiGenMode === 'RECOMMENDATION' && (
                            <span className="text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-base text-white">AI Chef Recommendation</h3>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                          AI crafts an optimal gourmet fitness meal precisely tuned to your Calories, Protein & Dietary targets. Includes refresh rotation to suggest different dishes!
                        </p>
                      </button>

                      {/* Option 2: Select Your Ingredients & Create Food */}
                      <button
                        type="button"
                        onClick={() => {
                          setAiGenMode('PANTRY');
                          setAiSubTab('PANTRY');
                          fetchPantryRecipe();
                        }}
                        className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          aiGenMode === 'PANTRY'
                            ? 'bg-orange-600/30 border-orange-400 ring-2 ring-orange-400/50 shadow-md'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                            <Utensils className="w-4 h-4 text-orange-400" />
                            Option 2: Select Ingredients
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base text-white">Select Products & Create Food</h3>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                          Select what ingredients you have in hand right now (eggs, oats, chicken, veggies) and AI builds a matching recipe with step-by-step cooking steps.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Render the Generated Recipe */}
                  {generatedRecipe ? (
                    <GeneratedRecipeCard
                      recipe={generatedRecipe}
                      onOrderRequest={() => {
                        setSelectedRecipeForOrder(generatedRecipe);
                        setIsBakerModalOpen(true);
                      }}
                      onRefresh={handleRefreshRecipe}
                      isRefreshing={isGeneratingRecipe}
                    />
                  ) : (
                    <div className="text-center py-10 bg-white rounded-3xl border border-gray-200">
                      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-600">Synthesizing custom AI recipe...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiResults.map((item) => {
                    const p = item.product;
                    const isAvailable = p.isAvailable !== false;
                    const isAdded = addedItemAnim === p.id;

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-orange-200 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Top AI Match Header */}
                          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-4 py-2 flex items-center justify-between text-white text-xs font-bold shadow-2xs">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              {item.matchScore}% Body Match
                            </span>
                            <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] tracking-wide uppercase">
                              {item.fitnessGrade} FIT
                            </span>
                          </div>

                          {/* Image & Overlay */}
                          <Link href={`/product/${p.id}`} className="relative block aspect-16/10 overflow-hidden bg-gray-100">
                            <img
                              src={p.imageUrls[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800'}
                              alt={p.name}
                              className={`w-full h-full object-cover hover:scale-105 transition-transform duration-500 ${
                                !isAvailable ? 'grayscale opacity-75' : ''
                              }`}
                            />
                            {!isAvailable && (
                              <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase">
                                  Currently Unavailable
                                </span>
                              </div>
                            )}
                            <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-bold text-gray-800 flex items-center gap-1 shadow-xs">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{p.rating ? p.rating.toFixed(1) : '5.0'}</span>
                            </div>
                          </Link>

                          {/* Body Info */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-orange-700 truncate">
                                {item.cooker?.storeName || 'Verified Home Cook'}
                              </span>
                              <span className="font-extrabold text-gray-900 text-sm">₹{p.price}</span>
                            </div>

                            <Link href={`/product/${p.id}`} className="block">
                              <h3 className="font-bold text-gray-900 text-base hover:text-orange-600 transition-colors line-clamp-1">
                                {p.name}
                              </h3>
                            </Link>

                            {/* Live Macro Pill Bar */}
                            <div className="grid grid-cols-4 gap-1.5 p-2 bg-orange-50/50 rounded-xl border border-orange-100 text-center text-xs">
                              <div>
                                <span className="text-[10px] text-gray-400 block font-medium">Calories</span>
                                <strong className="text-gray-900 font-bold">{item.macroHighlights.calories}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-400 block font-medium">Protein</span>
                                <strong className="text-purple-700 font-bold">{item.macroHighlights.protein}g</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-400 block font-medium">Sugar</span>
                                <strong className="text-blue-700 font-bold">{item.macroHighlights.sugar}g</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-400 block font-medium">Fiber</span>
                                <strong className="text-emerald-700 font-bold">{item.macroHighlights.fiber}g</strong>
                              </div>
                            </div>

                            {/* AI Recommendation Explanation Narrative */}
                            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/50 border border-amber-200/70 text-[11px] text-amber-950 space-y-1">
                              <p className="font-semibold flex items-center gap-1 text-amber-900">
                                <Sparkles className="w-3 h-3 text-orange-600" />
                                Why this fits your body:
                              </p>
                              <p className="text-gray-600 leading-relaxed">{item.aiRecommendationReason}</p>
                            </div>

                            {/* Goal Fit Badges */}
                            {item.goalFitBadges.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.goalFitBadges.map((badge, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                                  >
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer CTA */}
                        <div className="p-4 pt-0 border-t border-gray-100 flex items-center justify-between gap-2 mt-2">
                          <Link
                            href={`/product/${p.id}`}
                            className="text-xs text-orange-600 hover:underline font-semibold"
                          >
                            Inspect Ingredients →
                          </Link>

                          <button
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => handleAddFromAICard(p, item.cooker?.storeName)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs ${
                              !isAvailable
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                            }`}
                          >
                            {!isAvailable ? (
                              'Sold Out'
                            ) : isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Added!
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" /> Add to Cart
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-TAB 2: PANTRY AI CHEF (COOK WITH WHAT YOU HAVE IN HAND) */}
          {/* ============================================================== */}
          {aiSubTab === 'PANTRY' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Pantry AI Chef: Cook With What You Have In Hand
                    </h2>
                    <p className="text-xs text-gray-500">
                      Select or type the ingredients currently in your kitchen. Our AI creates a healthy, high-macro
                      dish with step-by-step preparation instructions!
                    </p>
                  </div>
                </div>

                {/* Common Pantry Selector Chips */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-gray-700 block">
                    1. Tap ingredients in your kitchen right now:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_PANTRY_ITEMS.map((item) => {
                      const isSelected = pantryIngredients.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => togglePantryIngredient(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Ingredient Input */}
                <form onSubmit={handleAddCustomPantryItem} className="flex gap-2 max-w-md pt-1">
                  <input
                    type="text"
                    value={customIngredientInput}
                    onChange={(e) => setCustomIngredientInput(e.target.value)}
                    placeholder="Type other ingredient (e.g. Garlic, Curd, Ghee)..."
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0"
                  >
                    + Add Item
                  </button>
                </form>

                {/* Active Selected Ingredients */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-gray-400 font-medium">Selected in pantry:</span>
                  {pantryIngredients.length === 0 ? (
                    <span className="text-rose-600 font-semibold">Select at least 1 ingredient</span>
                  ) : (
                    pantryIngredients.map((item) => (
                      <span
                        key={item}
                        className="bg-orange-50 text-orange-800 font-bold px-2.5 py-1 rounded-lg border border-orange-200 flex items-center gap-1"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => togglePantryIngredient(item)}
                          className="text-orange-500 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Generate Button */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Goal: <strong className="text-gray-900">{selectedGoal || 'Muscle Gain / High Protein'}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={isGeneratingRecipe || pantryIngredients.length === 0}
                    onClick={fetchPantryRecipe}
                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-2"
                  >
                    {isGeneratingRecipe ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating Recipe...
                      </>
                    ) : (
                      <>🍳 Generate Recipe From My Ingredients →</>
                    )}
                  </button>
                </div>
              </div>

              {/* Render Pantry Generated Recipe */}
              {generatedRecipe && (
                <GeneratedRecipeCard
                  recipe={generatedRecipe}
                  onOrderRequest={() => {
                    setSelectedRecipeForOrder(generatedRecipe);
                    setIsBakerModalOpen(true);
                  }}
                  onRefresh={fetchPantryRecipe}
                  isRefreshing={isGeneratingRecipe}
                />
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* SUB-TAB 3: CUSTOM AI RECIPE GENERATOR */}
          {/* ============================================================== */}
          {aiSubTab === 'CUSTOM' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-purple-900">
                <div>
                  <strong className="block font-bold">✨ Bespoke AI Culinary Synthesis:</strong>
                  <span>
                    Crafted to match your exact requested macros ({targetMinProtein}g Protein, &lt;
                    {targetMaxCalories} kcal, &lt;{targetMaxSugar}g Sugar) with step-by-step instructions.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchAIRecipe()}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shrink-0"
                >
                  Regenerate Recipe ↻
                </button>
              </div>

              {generatedRecipe ? (
                <GeneratedRecipeCard
                  recipe={generatedRecipe}
                  onOrderRequest={() => {
                    setSelectedRecipeForOrder(generatedRecipe);
                    setIsBakerModalOpen(true);
                  }}
                  onRefresh={handleRefreshRecipe}
                  isRefreshing={isGeneratingRecipe}
                />
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
                  <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-600">Generating bespoke chef recipe...</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: STANDARD MULTI-SIGNAL SEARCH */}
      {/* ========================================================================= */}
      {searchMode === 'STANDARD' && (
        <div className="space-y-6">
          {/* Search Header Banner */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs">
            <div className="max-w-3xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Discover Fresh Homemade Dishes
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Multi-signal search with distance weighting, kitchen ratings, and transparent ingredients.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeStandardSearch();
                }}
                className="mt-4 flex gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by dish name, baker, or tag..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 focus:bg-white text-sm rounded-2xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-gray-900"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-colors shrink-0 shadow-xs"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* Main Grid: Filters Sidebar + Results */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-6 sticky top-28">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                    Refine Search
                  </h3>
                  <button
                    type="button"
                    onClick={resetStandardFilters}
                    className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* Categories */}
                <div>
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider block mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-800 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dietary */}
                <div>
                  <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider block mb-2">
                    Dietary Preferences
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'eggless', label: 'Eggless Bakes' },
                      { id: 'vegetarian', label: '100% Vegetarian' },
                      { id: 'vegan', label: 'Plant-Based Vegan' },
                      { id: 'gluten-free', label: 'Gluten Free' },
                    ].map((d) => (
                      <label key={d.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dietary.includes(d.id)}
                          onChange={() => {
                            setDietary((prev) =>
                              prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                            );
                          }}
                          className="rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span>{d.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Results Column */}
            <section className="lg:col-span-3 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
                <span className="font-bold text-gray-900 text-sm">
                  {results.length} {results.length === 1 ? 'Dish Found' : 'Dishes Found'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Rank by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-medium text-gray-800 focus:outline-none focus:border-orange-500"
                  >
                    <option value="relevance">Weighted Relevance</option>
                    <option value="rating">Top Rated (★)</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">Searching dishes...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 space-y-3">
                  <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Search className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No dishes match your specific filters</h3>
                  <button
                    type="button"
                    onClick={resetStandardFilters}
                    className="mt-2 bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {results.map((item) => (
                    <ProductCard
                      key={item.product.id}
                      product={item.product}
                      cooker={item.cooker}
                      distanceKm={item.distanceKm}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
      {/* Request Baker Modal */}
      <RequestBakerModal
        recipe={selectedRecipeForOrder}
        isOpen={isBakerModalOpen}
        onClose={() => setIsBakerModalOpen(false)}
        onSuccess={(req) => {
          setIsBakerModalOpen(false);
          alert(`✅ Custom request #${req.requestNumber} submitted to Baker! Check status in Baker Portal.`);
        }}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
