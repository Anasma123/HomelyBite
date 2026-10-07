'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useCart } from '@/lib/context/CartContext';
import { Order } from '@/lib/types';
import {
  ShoppingBag,
  Clock,
  ArrowRight,
  RotateCcw,
  ChefHat,
  CheckCircle2,
} from 'lucide-react';

export default function CustomerOrdersPage() {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/orders?customerId=${currentUser.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.orders) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-2">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Your Order History</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Please sign in to your customer account to view your past orders, track active home kitchen deliveries, and leave cook reviews.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/auth/login?redirect=/orders"
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs"
          >
            Sign In to Account →
          </Link>
          <Link
            href="/auth/register?role=CUSTOMER&redirect=/orders"
            className="w-full sm:w-auto border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all"
          >
            Create Customer Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Your Order History
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Track active deliveries and reorder your favourite homemade dishes.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 space-y-4">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No orders placed yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Order fresh artisanal bakery goods and wholesome family meals from verified cooks!
          </p>
          <Link
            href="/search"
            className="inline-block bg-orange-600 text-white text-xs font-semibold px-6 py-2.5 rounded-2xl hover:bg-orange-700 transition-colors"
          >
            Browse Fresh Dishes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:border-orange-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-gray-900 text-base">
                    #{ord.orderNumber}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      ord.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ChefHat className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold text-gray-700">{ord.cookerStoreName}</span>
                  <span>•</span>
                  <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="text-xs text-gray-600">
                  {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center">
                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block font-medium">Total</span>
                  <span className="font-extrabold text-gray-900 text-base">₹{ord.totalAmount}</span>
                </div>

                <Link
                  href={`/order/${ord.id}`}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Track Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
