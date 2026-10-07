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
  LogOut,
  ShieldCheck,
  Bike,
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

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardHref = () => {
    if (currentRole === 'ADMIN') return '/admin/dashboard';
    if (currentRole === 'COOKER') return '/cooker/dashboard';
    if (currentRole === 'RIDER') return '/rider/dashboard';
    return '/orders';
  };

  const getRoleBadge = () => {
    if (currentRole === 'ADMIN') return { label: 'Admin', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    if (currentRole === 'COOKER') return { label: 'Cooker', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (currentRole === 'RIDER') return { label: 'Rider', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    return { label: 'Customer', bg: 'bg-orange-100 text-orange-800 border-orange-200' };
  };

  const roleBadge = getRoleBadge();

  return (
    <nav className="glass-nav sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
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

            {/* Role-Specific Navigation Links */}
            {currentUser ? (
              <>
                {currentRole === 'ADMIN' && (
                  <Link
                    href="/admin/dashboard"
                    className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Admin Portal
                  </Link>
                )}
                {currentRole === 'COOKER' && (
                  <Link
                    href="/cooker/dashboard"
                    className="text-amber-700 font-semibold hover:text-amber-800 transition-colors flex items-center gap-1.5"
                  >
                    <ChefHat className="w-4 h-4 text-amber-600" />
                    Kitchen Dashboard
                  </Link>
                )}
                {currentRole === 'RIDER' && (
                  <Link
                    href="/rider/dashboard"
                    className="text-emerald-700 font-semibold hover:text-emerald-800 transition-colors flex items-center gap-1.5"
                  >
                    <Bike className="w-4 h-4 text-emerald-600" />
                    Rider Portal
                  </Link>
                )}
                <Link href="/orders" className="hover:text-orange-600 transition-colors">
                  My Orders
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/register?role=COOKER"
                  className="hover:text-orange-600 transition-colors flex items-center gap-1"
                >
                  <ChefHat className="w-4 h-4" />
                  Become a Cooker
                </Link>
              </>
            )}
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
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <Link
                  href={getDashboardHref()}
                  className="flex items-center gap-2 group"
                  title="Go to Dashboard"
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
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shadow-xs"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="hidden sm:inline-block bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors"
                >
                  Register
                </Link>
              </div>
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
          {currentUser && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900 text-xs">{currentUser.name}</p>
                <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 font-semibold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          )}

          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-gray-700 hover:text-orange-600"
          >
            Explore All Dishes
          </Link>

          {currentUser ? (
            <>
              {currentRole === 'ADMIN' && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-indigo-700 font-semibold"
                >
                  Admin Master Dashboard
                </Link>
              )}
              {currentRole === 'COOKER' && (
                <Link
                  href="/cooker/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-amber-700 font-semibold"
                >
                  Cooker Kitchen Dashboard
                </Link>
              )}
              {currentRole === 'RIDER' && (
                <Link
                  href="/rider/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-emerald-700 font-semibold"
                >
                  Rider Delivery Portal
                </Link>
              )}
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-gray-700 hover:text-orange-600"
              >
                My Orders
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/register?role=COOKER"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-orange-600 font-semibold"
              >
                Become a Cooker
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-gray-700 hover:text-orange-600"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-gray-700 hover:text-orange-600"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
