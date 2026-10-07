'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { RankedSearchResult, SearchFilters } from '@/lib/services/search-service';
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
} from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  // Fetch search results whenever filters change
  const executeSearch = async () => {
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
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [selectedCategory, maxPrice, maxDistance, minRating, dietary, nutrition, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const toggleDietary = (val: string) => {
    setDietary((prev) => (prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]));
  };

  const toggleNutrition = (val: string) => {
    setNutrition((prev) => (prev.includes(val) ? prev.filter((n) => n !== val) : [...prev, val]));
  };

  const resetFilters = () => {
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
      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            Smart YouTube-Style Relevance Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Discover Homemade Delicacies
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Uses natural language query extraction, distance weighting (20%), ratings (15%), and kitchen freshness.
          </p>

          <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try 'Eggless cake under 700' or 'Low sugar sourdough near me'..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 focus:bg-white text-sm rounded-2xl border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
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
                onClick={resetFilters}
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

            {/* Dietary Preferences */}
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
                      onChange={() => toggleDietary(d.id)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nutrition Engine Filters */}
            <div>
              <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider block mb-2">
                Nutrition Criteria
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'low-sugar', label: 'Low Sugar (≤10g/100g)' },
                  { id: 'high-protein', label: 'High Protein (≥10g/100g)' },
                  { id: 'low-calorie', label: 'Low Calorie (<300 kcal)' },
                ].map((n) => (
                  <label key={n.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nutrition.includes(n.id)}
                      onChange={() => toggleNutrition(n.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{n.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Max Distance Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-gray-900 uppercase tracking-wider">Max Distance</span>
                <span className="font-bold text-orange-600">{maxDistance ? `${maxDistance} km` : 'Any'}</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="1"
                value={maxDistance || 15}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-orange-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>2 km</span>
                <span>8 km</span>
                <span>15 km</span>
              </div>
            </div>

            {/* Price Limit */}
            <div>
              <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider block mb-1.5">
                Max Price (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 700"
                value={maxPrice || ''}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 text-gray-800 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Min Rating */}
            <div>
              <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider block mb-1.5">
                Minimum Rating
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { val: undefined, label: 'All' },
                  { val: 4.0, label: '★ 4.0+' },
                  { val: 4.8, label: '★ 4.8+' },
                ].map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMinRating(r.val)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      minRating === r.val
                        ? 'bg-orange-50 border-orange-500 text-orange-700 font-bold'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results Section */}
        <section className="lg:col-span-3 space-y-4">
          {/* Results Bar & Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">
                {results.length} {results.length === 1 ? 'Dish Found' : 'Dishes Found'}
              </span>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden ml-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Rank by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 font-medium text-gray-800 focus:outline-none focus:border-orange-500"
              >
                <option value="relevance">Weighted Relevance (YouTube Algorithm)</option>
                <option value="rating">Top Rated (★)</option>
                <option value="distance">Nearest Distance (km)</option>
                <option value="popularity">Most Popular / Bookings</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">Calculating multi-signal relevance ranking...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 space-y-3">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No dishes match your specific filters</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Try widening your search terms, removing dietary limits, or expanding your delivery radius.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map((item) => (
                <div key={item.product.id} className="flex flex-col">
                  <ProductCard
                    product={item.product}
                    cooker={item.cooker}
                    distanceKm={item.distanceKm}
                  />
                  {/* Relevance breakdown tooltip chip */}
                  {item.matchReasons.length > 0 && (
                    <div className="mt-1 px-2.5 py-1 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[10px] text-amber-900 flex items-center justify-between">
                      <span className="truncate">{item.matchReasons[0]}</span>
                      <span className="font-bold shrink-0 ml-1 text-amber-700">
                        Score: {item.rankingScore}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">Loading Smart Search...</p>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
