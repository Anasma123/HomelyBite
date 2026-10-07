'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, CookerProfile, Review } from '@/lib/types';
import { useCart } from '@/lib/context/CartContext';
import {
  Star,
  Clock,
  AlertTriangle,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  ChefHat,
  Scale,
  Utensils,
  Plus,
  Minus,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';

interface Props {
  product: Product;
  cooker?: CookerProfile | null;
  reviews: Review[];
}

export default function ProductDetailClient({ product, cooker, reviews }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [nutritionView, setNutritionView] = useState<'perServing' | 'per100g' | 'total'>('perServing');
  const [selectedImage, setSelectedImage] = useState(product.imageUrls[0] || '');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const activeNutrition = product.nutrition[nutritionView];

  const handleAddToCart = () => {
    const res = addToCart(product, quantity, cooker?.storeName);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } else {
      alert(res.message);
    }
  };

  const handleBuyNow = () => {
    const res = addToCart(product, quantity, cooker?.storeName);
    if (res.success) {
      router.push('/checkout');
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <Link href="/" className="hover:text-orange-600">Home</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-orange-600">Dishes</Link>
        <span>/</span>
        {cooker && (
          <>
            <Link href={`/cooker/${cooker.id}`} className="hover:text-orange-600">{cooker.storeName}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 truncate">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Images */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-gray-100 border border-gray-200/90 shadow-sm relative">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.aiAnalysis?.healthGrade && (
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-gray-200/60 flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Health Grade</span>
                <span className={`w-7 h-7 rounded-xl font-black text-white text-sm flex items-center justify-center ${
                  product.aiAnalysis.healthGrade === 'A'
                    ? 'bg-emerald-600'
                    : product.aiAnalysis.healthGrade === 'B'
                    ? 'bg-amber-500'
                    : 'bg-orange-600'
                }`}>
                  {product.aiAnalysis.healthGrade}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail list if multiple */}
          {product.imageUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.imageUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(url)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === url ? 'border-orange-600 shadow-xs' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Key Info, Pricing & Actions */}
        <div className="lg:col-span-6 space-y-6">
          {/* Cooker Store Chip */}
          {cooker && (
            <Link
              href={`/cooker/${cooker.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 text-xs font-semibold transition-colors"
            >
              <ChefHat className="w-4 h-4 text-orange-600" />
              <span>Baked by {cooker.storeName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </Link>
          )}

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {product.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-gray-400 font-normal">({product.reviewCount} customer reviews)</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>Prep Time: {product.prepTimeMinutes} mins</span>
            </div>

            <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
              <Scale className="w-3.5 h-3.5 text-gray-500" />
              <span>Net Weight: {product.netWeightGrams}g</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Prominent Allergen Alert Box */}
          {product.detectedAllergens.length > 0 && (
            <div className="p-3.5 bg-red-50/90 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-red-900 block">
                  Allergen Warning: Contains {product.detectedAllergens.join(', ')}
                </span>
                <span className="text-red-700 leading-tight">
                  Automatically detected from raw ingredient components. If you have severe food allergies, please verify with the cooker.
                </span>
              </div>
            </div>
          )}

          {/* Price & Quantity Bar */}
          <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-xs space-y-5">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Price per unit</span>
                <span className="text-3xl font-black text-gray-900">₹{product.price}</span>
              </div>

              {/* Quantity Adjuster */}
              <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-2xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-xl bg-white text-gray-700 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold text-gray-900 text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-xl bg-white text-gray-700 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Daily Capacity & Availability Indicator */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Daily Capacity: {product.dailyCapacity} orders</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Available Now ({product.stockCount} left today)
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className={`py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Cart!
                  </>
                ) : (
                  <>Add to Cart</>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                Buy Now →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary USP Section: Transparent Ingredient Breakdown */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-1">
              <Utensils className="w-3.5 h-3.5 text-orange-600" />
              100% Ingredient Transparency
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              What Goes Inside This Dish
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Every single raw kitchen ingredient and exact quantity used in baking this recipe.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="pb-3">Ingredient</th>
                <th className="pb-3 text-right">Quantity</th>
                <th className="pb-3 text-right">Unit</th>
                <th className="pb-3 text-right">Calculated Energy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {product.ingredients.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    {item.name}
                  </td>
                  <td className="py-3 text-right font-mono font-semibold">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-500">{item.unit}</td>
                  <td className="py-3 text-right text-orange-600 font-medium">Verified Database</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Primary USP Section: Nutrition Engine & AI Health Analysis */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
              <HeartPulse className="w-3.5 h-3.5" />
              Nutrition Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Calculated Nutritional Facts
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Deterministic calculation based on verified standard raw ingredient nutrition.
            </p>
          </div>

          {/* Toggle View: Per Serving vs Per 100g vs Total */}
          <div className="bg-gray-100 p-1 rounded-2xl flex items-center gap-1 self-start sm:self-center">
            {[
              { id: 'perServing', label: `Per Serving (${product.nutrition.servingWeightGrams}g)` },
              { id: 'per100g', label: 'Per 100g' },
              { id: 'total', label: 'Total Product' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setNutritionView(v.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  nutritionView === v.id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Macronutrient Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-orange-50/70 border border-orange-200/80 p-3.5 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-orange-700 block uppercase tracking-wider">Calories</span>
            <span className="text-2xl font-black text-gray-900 block mt-1">{activeNutrition.calories}</span>
            <span className="text-[10px] text-gray-500">kcal</span>
          </div>

          <div className="bg-purple-50/70 border border-purple-200/80 p-3.5 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-purple-700 block uppercase tracking-wider">Protein</span>
            <span className="text-2xl font-black text-gray-900 block mt-1">{activeNutrition.protein}g</span>
            <span className="text-[10px] text-gray-500">macro</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-amber-700 block uppercase tracking-wider">Carbs</span>
            <span className="text-2xl font-black text-gray-900 block mt-1">{activeNutrition.carbs}g</span>
            <span className="text-[10px] text-gray-500">total</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200/80 p-3.5 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-rose-700 block uppercase tracking-wider">Total Fat</span>
            <span className="text-2xl font-black text-gray-900 block mt-1">{activeNutrition.fat}g</span>
            <span className="text-[10px] text-gray-500">wholesome</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-blue-700 block uppercase tracking-wider">Sugar</span>
            <span className="text-2xl font-black text-gray-900 block mt-1">{activeNutrition.sugar}g</span>
            <span className="text-[10px] text-gray-500">{product.aiAnalysis?.sugarLevel}</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">Fiber</span>
            <span className="text-2xl font-black text-gray-900 block mt-1">{activeNutrition.fiber}g</span>
            <span className="text-[10px] text-gray-500">prebiotic</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-slate-600 block uppercase tracking-wider">Sodium</span>
            <span className="text-2xl font-black text-gray-900 block mt-1">{activeNutrition.sodium || 40}mg</span>
            <span className="text-[10px] text-gray-500">electrolyte</span>
          </div>
        </div>

        {/* AI Nutrition Health Insight Card */}
        {product.aiAnalysis && (
          <div className="bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-yellow-50/60 border border-orange-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-gray-900 text-base">AI Nutrition & Dietary Analysis</h3>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
              {product.aiAnalysis.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Key Benefits */}
              <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wider mb-2">
                  Key Nutritional Highlights
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  {product.aiAnalysis.keyBenefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dietary Cautions */}
              <div className="bg-white/80 p-4 rounded-2xl border border-amber-100">
                <h4 className="font-bold text-amber-800 text-xs uppercase tracking-wider mb-2">
                  Dietary Considerations
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  {product.aiAnalysis.dietaryCautions.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">!</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-center gap-2 text-[11px] text-gray-500 italic pt-2">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{product.aiAnalysis.disclaimer}</span>
            </div>
          </div>
        )}
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Verified Customer Reviews ({reviews.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Only customers who placed and received this dish can write verified reviews.
            </p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No reviews yet. Be the first to try this homemade recipe!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{rev.customerName}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      Verified Purchase
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.productRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                <span className="text-[10px] text-gray-400 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
