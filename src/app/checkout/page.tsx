'use client';

import React, { useState, useEffect } from 'react';
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
  User as UserIcon,
  Phone,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    cookerId,
    cookerStoreName,
    subtotal,
    deliveryMode,
    setDeliveryMode,
    platformFee,
    appliedCoupon,
    discountAmount,
    clearCart,
  } = useCart();
  const { currentUser } = useAuth();

  // Cooker details for direct pickup location
  const [cookerInfo, setCookerInfo] = useState<{ address?: string; phone?: string; storeName?: string } | null>(null);

  useEffect(() => {
    if (cookerId) {
      fetch(`/api/cookers/${cookerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.cooker) {
            setCookerInfo(data.cooker);
          }
        })
        .catch(() => {});
    }
  }, [cookerId]);

  // Delivery Address (for doorstep delivery)
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

  // Customer contact details
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');

  useEffect(() => {
    if (currentUser?.name && !customerName) setCustomerName(currentUser.name);
    if (currentUser?.phone && !customerPhone) setCustomerPhone(currentUser.phone);
  }, [currentUser]);

  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTime, setSlotTime] = useState('01:00 PM - 02:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiApp, setUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM' | 'OTHER'>('GPAY');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 100% Synchronous, mathematically consistent fee calculations
  const deliveryFee = deliveryMode === 'CUSTOMER_PICKUP' ? 0 : 30;
  const totalPayable = Math.max(0, subtotal + deliveryFee + platformFee - discountAmount);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your basket is empty</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Explore delicious small-batch home-cooked meals, cakes, and regional delicacies from verified kitchens.
        </p>
        <button
          onClick={() => router.push('/search')}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-2xl text-xs font-semibold shadow-xs"
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

    // Basic validation
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please enter your name and phone number for order updates.');
      setIsSubmitting(false);
      return;
    }

    if (deliveryMode !== 'CUSTOMER_PICKUP' && !selectedAddress.street.trim()) {
      setErrorMessage('Please enter a delivery street address.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        customerId: currentUser?.id || `usr-guest-${Date.now()}`,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: deliveryMode === 'CUSTOMER_PICKUP' ? undefined : selectedAddress,
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
        setErrorMessage(data.message || 'Order could not be processed. Please check details.');
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
          Checkout & Order Details
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Order will be freshly prepared by <strong className="text-gray-900">{cookerInfo?.storeName || cookerStoreName}</strong>
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">

          {/* Section 1: Customer Identification */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <UserIcon className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-bold text-gray-900">Customer Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Your Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Phone Number (For Order Updates & OTP)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 9846012345"
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Option (Platform vs Self vs Direct Pickup) */}
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
                    onClick={() => setDeliveryMode(opt.id as DeliveryMode)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50/70 shadow-xs ring-2 ring-orange-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            opt.fee === 'Free' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {opt.fee}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{opt.label}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Address / Pickup Location Section */}
            {deliveryMode === 'CUSTOMER_PICKUP' ? (
              <div className="mt-4 p-4 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-3">
                <div className="flex items-center gap-2 text-orange-950 font-bold text-xs sm:text-sm">
                  <Store className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Kitchen Collection Point</span>
                  <span className="ml-auto text-[11px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                    No Delivery Fee
                  </span>
                </div>
                <div className="bg-white rounded-xl p-3 border border-orange-100 text-xs space-y-1.5 shadow-2xs">
                  <div className="font-extrabold text-gray-900 text-sm">
                    {cookerInfo?.storeName || cookerStoreName}
                  </div>
                  <div className="flex items-start gap-1.5 text-gray-700 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                    <span>{cookerInfo?.address || 'Panampilly Nagar, Kochi, Kerala'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] pt-1 border-t border-gray-100">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Collect hot and fresh ~30-45 minutes after placing order</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Doorstep Delivery Address</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">House / Flat / Street Address</label>
                    <input
                      type="text"
                      value={selectedAddress.street}
                      onChange={(e) => setSelectedAddress({ ...selectedAddress, street: e.target.value })}
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                      placeholder="e.g. Flat 4B, Palm Grove Villa, Panampilly Nagar"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">City & Pincode</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedAddress.city}
                        onChange={(e) => setSelectedAddress({ ...selectedAddress, city: e.target.value })}
                        className="w-2/3 text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                        placeholder="City"
                        required
                      />
                      <input
                        type="text"
                        value={selectedAddress.pincode}
                        onChange={(e) => setSelectedAddress({ ...selectedAddress, pincode: e.target.value })}
                        className="w-1/3 text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                        placeholder="PIN"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Scheduled Slots & Pre-order */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-bold text-gray-900">
                {deliveryMode === 'CUSTOMER_PICKUP' ? 'Pickup Schedule & Time Slot' : 'Delivery Schedule & Slot'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  {deliveryMode === 'CUSTOMER_PICKUP' ? 'Pickup Date' : 'Delivery Date'}
                </label>
                <input
                  type="date"
                  value={slotDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Preferred Time Window</label>
                <select
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM (Lunch)</option>
                  <option value="01:00 PM - 02:00 PM">01:00 PM - 02:00 PM (Afternoon)</option>
                  <option value="04:30 PM - 05:30 PM">04:30 PM - 05:30 PM (Evening Tea / Snacks)</option>
                  <option value="07:30 PM - 08:30 PM">07:30 PM - 08:30 PM (Dinner)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Special Instructions for Cooker / Kitchen (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Less spicy, pack curry in separate container, or write 'Happy Birthday' on cake box"
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
                {
                  id: 'UPI',
                  label: 'Instant UPI',
                  desc: 'Google Pay, PhonePe, Paytm QR',
                  icon: QrCode,
                },
                {
                  id: 'CARD',
                  label: 'Card Payment',
                  desc: 'Debit & Credit Cards, NetBanking',
                  icon: CreditCard,
                },
                {
                  id: 'COD',
                  label: deliveryMode === 'CUSTOMER_PICKUP' ? 'Pay at Pickup' : 'Cash on Delivery',
                  desc:
                    deliveryMode === 'CUSTOMER_PICKUP'
                      ? 'Pay cash / UPI at kitchen counter upon collection'
                      : 'Pay cash or UPI upon doorstep delivery',
                  icon: Banknote,
                },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = paymentMethod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentMethod(p.id as PaymentMethod)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50/70 shadow-xs ring-2 ring-orange-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{p.label}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{p.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Interactive Payment Details Breakdown */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-3">
                <div className="text-xs font-bold text-gray-800">Select Preferred UPI App or Enter ID:</div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'GPAY', label: 'Google Pay' },
                    { id: 'PHONEPE', label: 'PhonePe' },
                    { id: 'PAYTM', label: 'Paytm' },
                    { id: 'OTHER', label: 'Other UPI ID' },
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setUpiApp(app.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        upiApp === app.id
                          ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>

                {upiApp === 'OTHER' ? (
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or 9846012345@upi"
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                ) : (
                  <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                    <span>Instant payment trigger via {upiApp === 'GPAY' ? 'Google Pay' : upiApp === 'PHONEPE' ? 'PhonePe' : 'Paytm'} upon confirmation.</span>
                  </p>
                )}
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="text-xs font-bold text-gray-800">Card Payment Information:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">Card Number</label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="•••• •••• •••• ••••"
                      className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'COD' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-900">
                  <span className="font-bold block">
                    {deliveryMode === 'CUSTOMER_PICKUP' ? 'Pay at Kitchen Counter' : 'Cash on Doorstep Delivery'}
                  </span>
                  <span>
                    No advance online payment required. Pay ₹{totalPayable} in cash or UPI when you receive your fresh food.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4 sticky top-28">
            <h3 className="font-bold text-gray-900 text-sm pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Order Review</span>
              <span className="text-xs font-normal text-gray-500">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
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

            {/* Deterministic, Synchronized Calculation Breakdown */}
            <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Delivery Fee</span>
                <span className={`font-semibold ${deliveryFee === 0 ? 'text-emerald-700 font-bold' : 'text-gray-900'}`}>
                  {deliveryMode === 'CUSTOMER_PICKUP' ? '₹0 (Free Pickup)' : `₹${deliveryFee}`}
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
                <span className="text-orange-600 font-black text-lg">₹{totalPayable}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold py-3.5 rounded-2xl text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Processing Order...' : `Confirm & Pay ₹${totalPayable} →`}
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
