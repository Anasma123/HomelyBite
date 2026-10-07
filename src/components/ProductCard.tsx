'use client';

import React from 'react';
import Link from 'next/link';
import { Product, CookerProfile } from '@/lib/types';
import { useCart } from '@/lib/context/CartContext';
import { Star, Clock, AlertTriangle, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  cooker?: CookerProfile;
  distanceKm?: number;
}

export default function ProductCard({ product, cooker, distanceKm }: ProductCardProps) {
  const { addToCart, items } = useCart();
  const [addedAnimation, setAddedAnimation] = React.useState(false);

  const cartItem = items.find((i) => i.productId === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = addToCart(product, 1, cooker?.storeName);
    if (result.success) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1200);
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-lg hover:border-orange-200 transition-all duration-300 flex flex-col h-full card-hover-lift">
      {/* Product Image & Badges */}
      <Link href={`/product/${product.id}`} className="relative aspect-4/3 w-full overflow-hidden bg-gray-100 block">
        <img
          src={product.imageUrls[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600'}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            product.isAvailable === false ? 'grayscale opacity-75' : ''
          }`}
        />

        {/* Unavailable overlay badge */}
        {product.isAvailable === false && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
              Unavailable
            </span>
          </div>
        )}

        {/* Rating chip */}
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-semibold text-gray-800 shadow-xs flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{product.rating.toFixed(1)}</span>
          <span className="text-gray-400 text-[10px]">({product.reviewCount})</span>
        </div>

        {/* Distance or Prep Time */}
        <div className="absolute top-2.5 right-2.5 bg-gray-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1">
          <Clock className="w-3 h-3 text-orange-300" />
          <span>{product.prepTimeMinutes}m</span>
        </div>

        {/* Sugar Level Pill */}
        {product.aiAnalysis?.sugarLevel && (
          <div className="absolute bottom-2.5 left-2.5">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs ${
                product.aiAnalysis.sugarLevel === 'Low'
                  ? 'bg-emerald-500 text-white'
                  : product.aiAnalysis.sugarLevel === 'Moderate'
                  ? 'bg-amber-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {product.aiAnalysis.sugarLevel} Sugar
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Cooker store link & distance */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-medium text-orange-700 truncate max-w-[180px]">
              {cooker?.storeName || 'Verified Home Cook'}
            </span>
            {distanceKm !== undefined && (
              <span className="text-[11px] text-gray-400 shrink-0 font-medium">{distanceKm} km</span>
            )}
          </div>

          {/* Dish Name */}
          <Link href={`/product/${product.id}`} className="block">
            <h3 className="font-bold text-gray-900 text-base group-hover:text-orange-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Short description */}
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Allergen Warning / Dietary Chips */}
          <div className="mt-2.5 flex flex-wrap gap-1 items-center">
            {product.detectedAllergens.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-md font-semibold">
                <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                {product.detectedAllergens.slice(0, 2).join(', ')}
                {product.detectedAllergens.length > 2 && ` +${product.detectedAllergens.length - 2}`}
              </span>
            ) : (
              <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-md font-semibold">
                Allergen Free
              </span>
            )}

            {/* Calories Pill */}
            <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-md font-medium">
              {product.nutrition.perServing.calories} kcal/srv
            </span>
          </div>
        </div>

        {/* Footer: Price & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 block leading-none">Price</span>
            <span className="text-lg font-extrabold text-gray-900 leading-tight">
              ₹{product.price}
            </span>
          </div>

          <button
            type="button"
            disabled={product.isAvailable === false}
            onClick={handleAddToCart}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              product.isAvailable === false
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : addedAnimation
                ? 'bg-green-600 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs hover:shadow-md'
            }`}
          >
            {product.isAvailable === false ? (
              'Sold Out'
            ) : addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Added
              </>
            ) : cartQty > 0 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                In Cart ({cartQty})
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
