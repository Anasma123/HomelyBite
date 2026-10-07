'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Order, CookerProfile, DeliveryPersonProfile, Review, OrderStatus } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  Bike,
  Truck,
  ChefHat,
  MapPin,
  Calendar,
  Star,
  ShieldCheck,
  AlertCircle,
  Play,
  RotateCw,
  Store,
} from 'lucide-react';

interface Props {
  initialOrder: Order;
  cooker?: CookerProfile | null;
  rider?: DeliveryPersonProfile | null;
  existingReview?: Review | null;
}

const ORDER_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'PENDING', label: 'Order Placed', desc: 'Sent to home kitchen' },
  { status: 'ACCEPTED', label: 'Accepted', desc: 'Confirmed by cooker' },
  { status: 'PREPARING', label: 'Baking / Cooking', desc: 'Fresh small-batch prep' },
  { status: 'READY_FOR_PICKUP', label: 'Food Ready', desc: 'Packed & ready' },
  { status: 'RIDER_ASSIGNED', label: 'Rider Matched', desc: 'Assigned via Smart Radar' },
  { status: 'PICKED_UP', label: 'Picked Up', desc: 'Collected from kitchen' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Heading to customer' },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Enjoy fresh homemade food!' },
];

const PICKUP_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'PENDING', label: 'Order Placed', desc: 'Sent to home kitchen' },
  { status: 'ACCEPTED', label: 'Accepted', desc: 'Confirmed by kitchen' },
  { status: 'PREPARING', label: 'Baking / Cooking', desc: 'Fresh preparation' },
  { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Packed at kitchen counter' },
  { status: 'DELIVERED', label: 'Collected', desc: 'Handed over to customer' },
];

export default function OrderTrackingClient({ initialOrder, cooker, rider, existingReview }: Props) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [reviewRating, setReviewRating] = useState(5);
  const [tasteRating, setTasteRating] = useState(5);
  const [packagingRating, setPackagingRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(Boolean(existingReview));
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const activeSteps = order.deliveryMode === 'CUSTOMER_PICKUP' ? PICKUP_STEPS : ORDER_STEPS;

  // Status index for progress bar
  const getStepIndex = (status: OrderStatus) => {
    if (order.deliveryMode === 'CUSTOMER_PICKUP') {
      const idx = PICKUP_STEPS.findIndex((s) => s.status === status);
      return idx === -1 ? 0 : idx;
    }
    if (status === 'READY_FOR_PICKUP' && order.deliveryMode === 'SELF_DELIVERY') return 3;
    const idx = ORDER_STEPS.findIndex((s) => s.status === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStepIndex = getStepIndex(order.status);

  // Quick Simulation Action for effortless testing of the complete lifecycle
  const advanceOrderStatus = async (nextStatus: OrderStatus, note?: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          actorName: 'Test Simulator',
          actorRole: 'COOKER',
          note,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error('Failed to advance order status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          productId: order.items[0]?.productId,
          customerId: order.customerId,
          customerName: order.customerName,
          productRating: reviewRating,
          cookerRating: reviewRating,
          tasteRating,
          packagingRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewSubmitted(true);
      } else {
        alert(data.message);
      }
    } catch {
      alert('Failed to submit review');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Test Lifecycle Controller Banner */}
      <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-bold text-amber-900">Order Simulator:</span>
          <span className="text-amber-800">Test live lifecycle transitions directly here:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {order.status === 'PENDING' && (
            <button
              onClick={() => advanceOrderStatus('ACCEPTED', 'Accepted by kitchen')}
              disabled={isUpdatingStatus}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
            >
              1. Cooker: Accept Order
            </button>
          )}

          {order.status === 'ACCEPTED' && (
            <button
              onClick={() => advanceOrderStatus('PREPARING', 'Fresh baking started in batch')}
              disabled={isUpdatingStatus}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
            >
              2. Cooker: Start Baking
            </button>
          )}

          {order.status === 'PREPARING' && (
            <button
              onClick={() =>
                advanceOrderStatus(
                  'READY_FOR_PICKUP',
                  order.deliveryMode === 'CUSTOMER_PICKUP'
                    ? 'Food packed and ready for customer pickup at kitchen.'
                    : 'Dish packed. Smart Rider Radar activated.'
                )
              }
              disabled={isUpdatingStatus}
              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs animate-pulse"
            >
              {order.deliveryMode === 'CUSTOMER_PICKUP'
                ? '3. Food Ready → Ready for Customer Pickup at Kitchen!'
                : '3. Food Ready → Trigger Smart Rider / Self-Delivery Fallback!'}
            </button>
          )}

          {order.status === 'READY_FOR_PICKUP' && order.deliveryMode === 'CUSTOMER_PICKUP' && (
            <button
              onClick={() => advanceOrderStatus('DELIVERED', 'Customer collected food from kitchen counter.')}
              disabled={isUpdatingStatus}
              className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold shadow-xs"
            >
              4. Customer Collected Food → Mark Complete (Unlocks Review)
            </button>
          )}

          {(order.status === 'RIDER_ASSIGNED' || (order.status === 'READY_FOR_PICKUP' && order.deliveryMode === 'SELF_DELIVERY')) && (
            <button
              onClick={() => advanceOrderStatus('PICKED_UP', 'Collected from home kitchen')}
              disabled={isUpdatingStatus}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              4. Rider/Cooker: Pick Up
            </button>
          )}

          {order.status === 'PICKED_UP' && (
            <button
              onClick={() => advanceOrderStatus('OUT_FOR_DELIVERY', 'En route to customer')}
              disabled={isUpdatingStatus}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              5. Start Delivery
            </button>
          )}

          {order.status === 'OUT_FOR_DELIVERY' && (
            <button
              onClick={() => advanceOrderStatus('DELIVERED', 'Safely handed over to customer')}
              disabled={isUpdatingStatus}
              className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold shadow-xs"
            >
              6. Mark Delivered (Unlocks Review)
            </button>
          )}

          {order.status === 'DELIVERED' && (
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
              Order Complete & Delivered
            </span>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900">
              Order #{order.orderNumber}
            </h1>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                order.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.status === 'CANCELLED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-gray-400 block font-medium">
            {order.paymentStatus === 'SUCCESS' ? 'Paid Online via' : 'Pay via'} {order.paymentMethod}
          </span>
          <span className="text-2xl font-black text-gray-900">₹{order.totalAmount}</span>
        </div>
      </div>

      {/* Live Stepper Visualization */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-gray-900">
          {order.deliveryMode === 'CUSTOMER_PICKUP' ? 'Live Order & Pickup Journey' : 'Live Delivery Journey'}
        </h2>

        <div className="relative">
          {/* Timeline points */}
          <div
            className={`grid gap-4 ${
              order.deliveryMode === 'CUSTOMER_PICKUP'
                ? 'grid-cols-2 sm:grid-cols-5'
                : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'
            }`}
          >
            {activeSteps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.status} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-orange-600 text-white ring-4 ring-orange-100 shadow-xs'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <h4
                    className={`font-bold text-xs mt-2 ${
                      isCurrent ? 'text-orange-600' : isPast ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned Rider / Cooker Delivery Details */}
        {order.assignedRiderName && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                  Assigned Platform Rider
                </span>
                <h4 className="font-bold text-gray-900 text-sm">{order.assignedRiderName}</h4>
                <p className="text-xs text-gray-600">{order.assignedRiderPhone} • EV Eco-Bike</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs">
              Radar Active
            </span>
          </div>
        )}

        {/* Fallback Self-Delivery notice if applicable */}
        {order.deliveryMode === 'SELF_DELIVERY' && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3">
            <Truck className="w-6 h-6 text-orange-600 shrink-0" />
            <div className="text-xs text-orange-900">
              <strong className="block">Cooker Direct Hand-Delivery Fallback</strong>
              <span>
                Delivered personally by {order.cookerStoreName}. Cooker hand-carries temperature-sensitive food in insulated carrier.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Order Items & Address Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Dishes in this Order</h3>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.productImage || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120'}
                    alt={item.productName}
                    className="w-12 h-12 rounded-xl object-cover bg-gray-100"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{item.productName}</h4>
                    <p className="text-[11px] text-gray-400">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-gray-900 text-xs sm:text-sm">₹{item.totalPrice}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Delivery Mode</span>
              <span className="font-semibold text-gray-900 capitalize">{order.deliveryMode.replace(/_/g, ' ').toLowerCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Slot</span>
              <span className="font-semibold text-gray-900">{order.deliverySlotDate} ({order.deliverySlotTime})</span>
            </div>
          </div>
        </div>

        {/* Delivery Address & Kitchen Info */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">
            {order.deliveryMode === 'CUSTOMER_PICKUP' ? 'Kitchen Pickup Point & Contact' : 'Kitchen & Destination'}
          </h3>

          <div className="space-y-3 text-xs text-gray-700">
            <div className="flex items-start gap-2.5">
              <ChefHat className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-900 block">{order.cookerStoreName}</span>
                <span className="text-gray-500">{order.cookerAddress}</span>
                {order.cookerPhone && <span className="text-gray-400 block pt-0.5">📞 {order.cookerPhone}</span>}
              </div>
            </div>

            {order.deliveryMode === 'CUSTOMER_PICKUP' ? (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-orange-50/70 border border-orange-100">
                <Store className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-orange-950 block">Direct Kitchen Pickup</span>
                  <span className="text-gray-600">
                    To be collected by <strong className="text-gray-900">{order.customerName}</strong> ({order.customerPhone})
                  </span>
                  <span className="text-emerald-700 font-semibold block pt-1">
                    ✓ Zero Delivery Fee (Free Pickup)
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-gray-900 block">Deliver to: {order.customerName}</span>
                  <span className="text-gray-500">{order.deliveryAddress?.street}, {order.deliveryAddress?.city} {order.deliveryAddress?.pincode}</span>
                </div>
              </div>
            )}

            {order.specialInstructions && (
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600">
                <strong>Customer Note:</strong> {order.specialInstructions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verified Review Submission after DELIVERED */}
      {order.status === 'DELIVERED' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900 text-base">Verified Customer Review</h3>
          </div>

          {reviewSubmitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
              ✓ Thank you! Your verified review and ratings for taste, freshness, and packaging have been published.
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
              <p className="text-xs text-gray-500">
                Rate your culinary experience with {order.cookerStoreName}:
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">Overall Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 font-bold text-amber-600"
                  >
                    <option value={5}>★★★★★ (5/5)</option>
                    <option value={4}>★★★★☆ (4/5)</option>
                    <option value={3}>★★★☆☆ (3/5)</option>
                    <option value={2}>★★☆☆☆ (2/5)</option>
                    <option value={1}>★☆☆☆☆ (1/5)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">Taste Score</label>
                  <select
                    value={tasteRating}
                    onChange={(e) => setTasteRating(Number(e.target.value))}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 font-bold text-amber-600"
                  >
                    <option value={5}>5 - Exquisite</option>
                    <option value={4}>4 - Great</option>
                    <option value={3}>3 - Average</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">Packaging</label>
                  <select
                    value={packagingRating}
                    onChange={(e) => setPackagingRating(Number(e.target.value))}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 font-bold text-amber-600"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Secure</option>
                    <option value={3}>3 - Good</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">Your Honest Review</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell others about the flavour, freshness, and texture..."
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                Submit Verified Review
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
