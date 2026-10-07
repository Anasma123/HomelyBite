'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
  CheckCircle2,
  ShieldCheck,
  ChefHat,
  X,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const {
    items,
    cookerStoreName,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    platformFee,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    finalTotal,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplying(true);
    setCouponError('');
    setCouponSuccess('');

    const res = await applyCoupon(couponInput.trim());
    setIsApplying(false);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your Basket is Empty</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
          Explore homemade artisan cakes, wholesome cookies, and handcrafted meals from local home chefs.
        </p>
        <Link
          href="/search"
          className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-xs transition-colors"
        >
          Explore Homemade Dishes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Your Culinary Basket
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
          <ChefHat className="w-4 h-4 text-orange-600" />
          <span>Ordering directly from: <strong className="text-gray-900">{cookerStoreName}</strong></span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.productId} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.imageUrls[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200'}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-gray-100 shrink-0"
                  />
                  <div>
                    <Link
                      href={`/product/${item.productId}`}
                      className="font-bold text-gray-900 text-sm sm:text-base hover:text-orange-600 transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">₹{item.product.price} each</p>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium mt-1 inline-block">
                      {item.product.nutrition.perServing.calories} kcal/serving
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 bg-white text-gray-700 rounded-lg flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 shadow-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-gray-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-7 h-7 bg-white text-gray-700 rounded-lg flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-extrabold text-gray-900 text-sm sm:text-base min-w-[70px] text-right">
                    ₹{item.product.price * item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId)}
                    className="text-gray-400 hover:text-red-600 p-1.5 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center px-2 text-xs">
            <button
              type="button"
              onClick={clearCart}
              className="text-gray-400 hover:text-red-600 font-medium transition-colors"
            >
              Clear Entire Cart
            </button>
            <Link href="/search" className="text-orange-600 hover:underline font-semibold">
              + Add More Dishes
            </Link>
          </div>
        </div>

        {/* Right: Bill Summary & Coupon */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coupon Box */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-600" />
              Apply Discount Coupon
            </h3>

            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-800 text-xs block">{appliedCoupon.code}</span>
                  <span className="text-[11px] text-emerald-600">Saved ₹{discountAmount}</span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. WELCOME50)"
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 uppercase focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </div>

                {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
                {couponSuccess && <p className="text-[11px] text-emerald-600">{couponSuccess}</p>}

                <div className="pt-1 text-[11px] text-gray-400">
                  Try promo code <strong className="text-orange-600 cursor-pointer" onClick={() => setCouponInput('WELCOME50')}>WELCOME50</strong> for ₹50 off!
                </div>
              </form>
            )}
          </div>

          {/* Bill Summary */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm pb-2 border-b border-gray-100">
              Bill Details
            </h3>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-900">
                  {deliveryFee === 0 ? '₹0 (Free)' : `₹${deliveryFee}`}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-extrabold text-gray-900">
                <span>Total Amount</span>
                <span className="text-orange-600">₹{finalTotal}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  router.push('/auth/login?redirect=/checkout');
                } else {
                  router.push('/checkout');
                }
              }}
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              {currentUser ? 'Proceed to Delivery Address →' : 'Sign In to Proceed to Checkout →'}
            </button>
            {!currentUser && (
              <p className="text-[11px] text-gray-500 text-center mt-2 font-medium">
                Customer registration / login required to place orders
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
