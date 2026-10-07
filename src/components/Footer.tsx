'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ShieldCheck, HeartPulse, Sparkles, Truck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20 text-gray-600 text-sm">
      {/* Top Value Badges */}
      <div className="border-b border-gray-100 bg-[#fbfbfa] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">100% Homemade</h4>
              <p className="text-xs text-gray-500 mt-0.5">Cooked in certified home kitchens, never commercial factory lines.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Transparent Nutrition</h4>
              <p className="text-xs text-gray-500 mt-0.5">Exact calculated macros, sugar indicators, and auto-scanned allergens.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Smart Delivery</h4>
              <p className="text-xs text-gray-500 mt-0.5">Intelligent rider matching with cooker self-delivery fallback.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Verified Cooks</h4>
              <p className="text-xs text-gray-500 mt-0.5">Every baker & cooker manually vetted with hygiene standards.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-gray-900">HomeFood</span>
            </div>
            <p className="mt-3 text-xs text-gray-500 leading-relaxed">
              Empowering talented home chefs and passionate bakers to connect with discerning food lovers who care about what goes inside their food.
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-gray-900 text-xs uppercase tracking-wider mb-3">Marketplace</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/search" className="hover:text-orange-600">Explore All Dishes</Link></li>
              <li><Link href="/search?category=cat-1" className="hover:text-orange-600">Artisan Cakes</Link></li>
              <li><Link href="/search?category=cat-2" className="hover:text-orange-600">Sourdough & Breads</Link></li>
              <li><Link href="/search?dietary=eggless" className="hover:text-orange-600">Eggless Bakes</Link></li>
              <li><Link href="/search?nutrition=low-sugar" className="hover:text-orange-600">Low-Sugar Choices</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-gray-900 text-xs uppercase tracking-wider mb-3">Portals & Workflows</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/cooker/dashboard" className="hover:text-orange-600">Cooker Kitchen Dashboard</Link></li>
              <li><Link href="/rider/dashboard" className="hover:text-orange-600">Rider Delivery Radar</Link></li>
              <li><Link href="/admin/dashboard" className="hover:text-orange-600">Admin Control Panel</Link></li>
              <li><Link href="/orders" className="hover:text-orange-600">Order Tracking & History</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-gray-900 text-xs uppercase tracking-wider mb-3">Technology & Safety</h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              Engineered with deterministic nutrition calculation, multi-signal YouTube relevance ranking, and resilient delivery failover architecture.
            </p>
            <div className="mt-4 p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-[11px] text-orange-800">
              <strong>Vercel & Postgres Ready:</strong> Production serverless architecture with dual database abstraction.
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© 2026 HomelyBite. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-medium">
            Developed by <span className="font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">Ayisha naswa</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
