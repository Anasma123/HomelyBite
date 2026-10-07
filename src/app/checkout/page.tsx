'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Address, DeliveryMode, PaymentMethod } from '@/lib/types';
import {
  MapPin,
  Truck,
  Bike,
  Store,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, cookerId, cookerStoreName, subtotal, finalTotal, deliveryFee, platformFee, appliedCoupon, discountAmount, clearCart } = useCart();
  const { currentUser } = useAuth();

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('PLATFORM_DELIVERY');
  const [selectedAddress, setSelectedAddress] = useState<Address>({
    id: 'addr-active',
    label: 'Home',
    street: 'Flat 4B, Palm Grove Villa, Panampilly Nagar',
    city: 'Kochi',
    pincode: '682036',
    latitude: 9.9680,
    longitude: 76.3010,
    isDefault: true,
  });

  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTime, setSlotTime] = useState('01:00 PM - 02:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Your basket is empty</h2>
        <button
          onClick={() => router.push('/search')}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-2xl text-xs font-semibold"
        >
          Browse Dishes
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        customerId: currentUser?.id || 'usr-guest',
        customerName: currentUser?.name || 'Customer',
        customerPhone: currentUser?.phone || '',
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: selectedAddress,
        deliveryMode,
        deliverySlotDate: slotDate,
        deliverySlotTime: slotTime,
        isPreorder: slotDate !== new Date().toISOString().split('T')[0],
        couponCode: appliedCoupon?.code,
        paymentMethod,
        specialInstructions: instructions,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.order) {
        clearCart();
        router.push(`/order/${data.order.id}`);
      } else {
        setErrorMessage(data.message || 'Order could not be processed.');
      }
    } catch (err) {
      setErrorMessage('Network error placing order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Checkout & Delivery Details
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Order will be freshly prepared by <strong className="text-gray-900">{cookerStoreName}</strong>
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Delivery Address */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <MapPin className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-bold text-gray-900">Delivery Address</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={selectedAddress.street}
                  onChange={(e) => setSelectedAddress({ ...selectedAddress, street: e.target.value })}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">City & Pincode</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedAddress.city}
                    onChange={(e) => setSelectedAddress({ ...selectedAddress, city: e.target.value })}
                    className="w-2/3 text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                  <input
                    type="text"
                    value={selectedAddress.pincode}
                    onChange={(e) => setSelectedAddress({ ...selectedAddress, pincode: e.target.value })}
                    className="w-1/3 text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Option (Platform vs Self vs Pickup) */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Truck className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-bold text-gray-900">Delivery Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'PLATFORM_DELIVERY',
                  label: 'Smart Rider Delivery',
                  desc: 'Fastest available platform rider matched upon food readiness',
                  icon: Bike,
                  fee: '₹30',
                },
                {
                  id: 'SELF_DELIVERY',
                  label: 'Cooker Self-Delivery',
                  desc: 'Directly hand-delivered by the home cooker within local radius',
                  icon: Truck,
                  fee: '₹30',
                },
                {
                  id: 'CUSTOMER_PICKUP',
                  label: 'Direct Pickup',
                  desc: 'Collect fresh and warm directly from the home kitchen',
                  icon: Store,
                  fee: 'Free',
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = deliveryMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDeliveryMode(opt.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50/70 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                        <span className="text-xs font-bold text-gray-900">{opt.fee}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{opt.label}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Scheduled Slots & Pre-order */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-bold text-gray-900">Delivery Schedule & Slot</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={slotDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Preferred Time Slot</label>
                <select
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM (Lunch)</option>
                  <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM (Afternoon)</option>
                  <option value="04:30 PM - 05:30 PM">04:30 PM - 05:30 PM (Evening Tea / Cake)</option>
                  <option value="07:30 PM - 08:30 PM">07:30 PM - 08:30 PM (Dinner)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Special Instructions for Cooker / Rider (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Please leave with security, or write 'Happy Birthday Anas' on cake box"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Section 4: Payment Method */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-bold text-gray-900">Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'UPI', label: 'Instant UPI', desc: 'Google Pay, PhonePe, Paytm QR', icon: QrCode },
                { id: 'CARD', label: 'Card Payment', desc: 'Debit & Credit Cards', icon: CreditCard },
                { id: 'COD', label: 'Cash on Delivery', desc: 'Pay cash upon safe delivery', icon: Banknote },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = paymentMethod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentMethod(p.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50/70 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{p.label}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4 sticky top-28">
            <h3 className="font-bold text-gray-900 text-sm pb-2 border-b border-gray-100">
              Order Review
            </h3>

            {/* Micro items list */}
            <div className="space-y-2 text-xs divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {items.map((i) => (
                <div key={i.productId} className="pt-2 first:pt-0 flex justify-between">
                  <span className="text-gray-700 truncate max-w-[190px]">
                    {i.quantity}x {i.product.name}
                  </span>
                  <span className="font-bold text-gray-900">₹{i.product.price * i.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-900">
                  {deliveryMode === 'CUSTOMER_PICKUP' ? '₹0 (Pickup)' : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="font-semibold text-gray-900">₹{platformFee}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-extrabold text-gray-900">
                <span>Total Payable</span>
                <span className="text-orange-600">₹{finalTotal}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Placing Order...' : `Confirm & Pay ₹${finalTotal} →`}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe payments & verified kitchen hygiene guarantee</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
