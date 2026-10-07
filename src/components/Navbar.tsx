'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useCart } from '@/lib/context/CartContext';
import {
  UtensilsCrossed,
  Search,
  ShoppingCart,
  Heart,
  ChefHat,
  User as UserIcon,
  Bell,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { currentUser, currentRole, logout } = useAuth();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="glass-nav sticky top-[33px] z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-1">
                Home<span className="text-orange-600">Food</span>
                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Artisan
                </span>
              </span>
              <p className="text-[10px] text-gray-500 font-medium hidden sm:block">Home Bakes & Trusted Cooks</p>
            </div>
          </Link>

          {/* Search Bar (YouTube-style relevance query) */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-lg hidden md:flex items-center relative"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Try 'Eggless chocolate cake under 700' or 'Sourdough'..."
                className="w-full pl-10 pr-24 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-sm text-gray-900 rounded-full border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded-full font-medium transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/search" className="hover:text-orange-600 transition-colors flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-orange-500" />
              Explore Dishes
            </Link>
            {currentRole === 'COOKER' ? (
              <Link
                href="/cooker/dashboard"
                className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-1"
              >
                <ChefHat className="w-4 h-4" />
                Kitchen Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/register?role=COOKER"
                className="hover:text-orange-600 transition-colors flex items-center gap-1"
              >
                <ChefHat className="w-4 h-4" />
                Become a Cooker
              </Link>
            )}
            <Link href="/orders" className="hover:text-orange-600 transition-colors">
              My Orders
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors relative"
              title="Favourites"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="p-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors relative"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-orange-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <Link
                  href={
                    currentRole === 'COOKER'
                      ? '/cooker/dashboard'
                      : currentRole === 'RIDER'
                      ? '/rider/dashboard'
                      : currentRole === 'ADMIN'
                      ? '/admin/dashboard'
                      : '/orders'
                  }
                  className="flex items-center gap-2 group"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-200 group-hover:ring-orange-400 transition-all"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-gray-900 leading-tight group-hover:text-orange-600">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-tight capitalize">{currentUser.role.toLowerCase()}</p>
                  </div>
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shadow-xs"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-500 lg:hidden hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search homemade dishes, diet, cooks..."
              className="w-full pl-9 pr-20 py-1.5 bg-gray-50 text-xs text-gray-900 rounded-full border border-gray-200 focus:outline-none focus:border-orange-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-600 text-white text-[11px] px-2.5 py-1 rounded-full font-medium"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-2 text-sm font-medium">
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-gray-700 hover:text-orange-600"
          >
            Explore All Dishes
          </Link>
          <Link
            href="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-gray-700 hover:text-orange-600"
          >
            My Orders
          </Link>
          <Link
            href="/cooker/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-gray-700 hover:text-orange-600"
          >
            Cooker Kitchen Dashboard
          </Link>
          <Link
            href="/rider/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-gray-700 hover:text-orange-600"
          >
            Rider Delivery Portal
          </Link>
          <Link
            href="/admin/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-gray-700 hover:text-orange-600"
          >
            Admin Master Dashboard
          </Link>
        </div>
      )}
    </nav>
  );
}
