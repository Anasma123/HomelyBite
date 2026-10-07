import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import {
  Sparkles,
  Award,
  Search,
  ArrowRight,
  HeartPulse,
  ChefHat,
  Star,
  CheckCircle2,
  TrendingUp,
  MapPin,
} from 'lucide-react';

export default function HomePage() {
  const categories = db.getCategories();
  const products = db.getProducts().filter((p) => p.status === 'APPROVED');
  const cookers = db.getCookers().filter((c) => c.status === 'APPROVED');

  // Filter sections
  const trendingDishes = products.slice(0, 4);
  const healthyChoices = products.filter((p) => p.nutrition.per100g.sugar <= 16 || p.tagIds.includes('tag-5') || p.tagIds.includes('tag-8'));
  const bestSellers = products.filter((p) => p.tagIds.includes('tag-11') || p.rating >= 4.8);

  const cookerMap = new Map();
  cookers.forEach((c) => cookerMap.set(c.id, c));

  return (
    <div className="space-y-14 pb-16">
      {/* Hero Banner with Warm Artisan Light Theme */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-transparent pt-10 pb-16 border-b border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/90 text-orange-800 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>The Direct Home Cook & Baker Marketplace</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.12]">
                Fresh Homemade Food,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                  Total Transparency.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
                Order small-batch bakes and warm meals made by verified neighbourhood cooks.
                Know every raw ingredient, verify macro calculations, and detect allergens before you take a bite.
              </p>

              {/* Natural Language Search Prompts */}
              <div className="pt-2">
                <Link
                  href="/search"
                  className="p-2 sm:p-2.5 bg-white rounded-2xl shadow-md border border-gray-200/80 max-w-xl flex items-center justify-between gap-2 group cursor-pointer hover:border-orange-300 transition-all"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0 group-hover:text-orange-500 transition-colors" />
                    <span className="text-xs sm:text-sm text-gray-400">
                      Try &apos;Eggless chocolate cake under 700&apos; or &apos;Low sugar&apos;...
                    </span>
                  </div>
                  <span className="bg-orange-600 group-hover:bg-orange-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-xs">
                    Find Food
                  </span>
                </Link>

                {/* Popular Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs text-gray-500">
                  <span className="font-medium text-gray-400">Popular:</span>
                  <Link href="/search?dietary=eggless" className="bg-white px-2.5 py-1 rounded-full border border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-colors">
                    🌿 Eggless
                  </Link>
                  <Link href="/search?category=cat-2" className="bg-white px-2.5 py-1 rounded-full border border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-colors">
                    🍞 Sourdough
                  </Link>
                  <Link href="/search?nutrition=low-sugar" className="bg-white px-2.5 py-1 rounded-full border border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-colors">
                    🍯 Low Sugar
                  </Link>
                  <Link href="/search?category=cat-1" className="bg-white px-2.5 py-1 rounded-full border border-gray-200 hover:border-orange-500 hover:text-orange-600 transition-colors">
                    🎂 Truffle Cake
                  </Link>
                </div>
              </div>

              {/* Quick USP Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200/60 max-w-lg">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">100%</p>
                  <p className="text-[11px] text-gray-500 font-medium">Ingredient Transparency</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">Zero</p>
                  <p className="text-[11px] text-gray-500 font-medium">Artificial Preservatives</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600">AI & Macros</p>
                  <p className="text-[11px] text-gray-500 font-medium">Calculated Nutrition</p>
                </div>
              </div>
            </div>

            {/* Hero Right Featured Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden bg-white shadow-xl border border-gray-200/90 p-4">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800"
                    alt="Belgian Truffle Cake"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-gray-900 flex items-center gap-1 shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    4.9 Rating
                  </div>
                  <div className="absolute bottom-3 left-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                    Verified Home Kitchen
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-lg">Belgian Dark Truffle Cake</h3>
                    <span className="text-xl font-black text-orange-600">₹650</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Baked by Anas Artisanal Home Bakery with 70% pure cocoa and grass-fed dairy butter.
                  </p>

                  {/* Micro nutrition snapshot */}
                  <div className="bg-orange-50/70 p-2.5 rounded-xl border border-orange-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Energy</span>
                      <strong className="text-gray-900">396 kcal/100g</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Protein</span>
                      <strong className="text-purple-700">6.9g/100g</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Sugar</span>
                      <strong className="text-amber-700">Moderate</strong>
                    </div>
                  </div>

                  <Link
                    href="/product/prod-1"
                    className="mt-2 block w-full text-center py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-xs transition-colors"
                  >
                    Inspect Ingredients & Nutrition →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Horizontal Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Explore Categories</h2>
            <p className="text-xs sm:text-sm text-gray-500">Handcrafted delicacies organized by our culinary curators</p>
          </div>
          <Link
            href="/search"
            className="text-orange-600 hover:text-orange-700 font-semibold text-xs sm:text-sm flex items-center gap-1 group"
          >
            See All <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.id}`}
              className="group bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs hover:shadow-md hover:border-orange-300 transition-all text-center flex flex-col items-center card-hover-lift"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gray-100 mb-3 shadow-xs">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h4 className="font-bold text-gray-900 text-sm group-hover:text-orange-600 transition-colors">
                {cat.name}
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Verified Home Cook Stores Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-orange-600" />
              Verified Neighbourhood Cooks & Bakers
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Kitchen-inspected home chefs cooking with authentic family recipes and utmost hygiene
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cookers.map((cooker) => (
            <Link
              key={cooker.id}
              href={`/cooker/${cooker.id}`}
              className="group bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg transition-all card-hover-lift flex flex-col"
            >
              <div className="h-32 w-full relative bg-gray-100 overflow-hidden">
                <img
                  src={cooker.coverImageUrl}
                  alt={cooker.storeName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-xs font-bold text-gray-800 flex items-center gap-1 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {cooker.rating.toFixed(1)}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between -mt-6">
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src={cooker.logoUrl}
                      alt={cooker.storeName}
                      className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-orange-600 transition-colors flex items-center gap-1">
                        {cooker.storeName}
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      </h3>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        Panampilly Nagar • {cooker.selfDeliveryRadiusKm} km radius
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {cooker.bio}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span>Avg Prep: {cooker.averagePrepTimeMinutes} mins</span>
                  <span className="text-orange-600 font-semibold group-hover:underline">Visit Store →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Homemade Dishes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              Trending Near You
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">Most loved small-batch dishes ordered this week</p>
          </div>
          <Link
            href="/search?sortBy=popularity"
            className="text-orange-600 hover:text-orange-700 font-semibold text-xs sm:text-sm flex items-center gap-1 group"
          >
            View More <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingDishes.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              cooker={cookerMap.get(p.cookerId)}
              distanceKm={2.4}
            />
          ))}
        </div>
      </section>

      {/* Healthy Choices & Low Sugar Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-green-50/70 rounded-3xl p-6 sm:p-10 border border-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <HeartPulse className="w-3.5 h-3.5" />
              Mindful Nutrition
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Healthy & Low-Sugar Choices
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl mt-1">
              Guilt-free home treats made with raw honey, rolled oats, almonds, and zero refined white sugar.
            </p>
          </div>

          <Link
            href="/search?nutrition=low-sugar"
            className="self-start sm:self-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors shrink-0"
          >
            Explore Health Bakes
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {healthyChoices.slice(0, 3).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              cooker={cookerMap.get(p.cookerId)}
              distanceKm={1.8}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
