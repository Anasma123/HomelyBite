'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.products) {
          // Pre-populate with first 2 dishes as saved favorites
          setFavouriteProducts(data.products.slice(0, 2));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
          Saved Dishes & Favourites
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Your bookmarked homemade dishes from trusted neighbourhood kitchens.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Loading your saved dishes...</p>
        </div>
      ) : favouriteProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <p className="text-sm text-gray-500">No favourites saved yet.</p>
          <Link
            href="/search"
            className="inline-block bg-orange-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-700"
          >
            Explore Fresh Bakes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favouriteProducts.map((p) => (
            <ProductCard key={p.id} product={p} distanceKm={2.0} />
          ))}
        </div>
      )}
    </div>
  );
}
