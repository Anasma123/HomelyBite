'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Order, DeliveryPersonProfile } from '@/lib/types';
import {
  Bike,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  ChefHat,
  ArrowRight,
  ShieldCheck,
  Star,
  DollarSign,
  Power,
  RotateCw,
} from 'lucide-react';

export default function RiderDashboard() {
  const { currentRider, currentUser } = useAuth();

  const [rider, setRider] = useState<DeliveryPersonProfile | null>(currentRider);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRiderData = async () => {
    try {
      const riderId = rider?.id || 'rider-prof-1';
      const [rRes, oRes] = await Promise.all([
        fetch('/api/delivery/riders'),
        fetch(`/api/orders?riderId=${riderId}`),
      ]);

      const [rData, oData] = await Promise.all([rRes.json(), oRes.json()]);

      if (rData.success && rData.riders) {
        const found = rData.riders.find((item: any) => item.id === riderId) || rData.riders[0];
        setRider(found);
      }
      if (oData.success) {
        setAssignedOrders(oData.orders || []);
      }
    } catch (err) {
      console.error('Failed to load rider portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiderData();
  }, []);

  const toggleAvailability = async () => {
    if (!rider) return;
    const nextStatus = rider.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      const res = await fetch('/api/delivery/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderId: rider.id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRider({ ...rider, status: nextStatus });
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string, note: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          actorName: currentUser?.name || 'Arjun Das',
          actorRole: 'RIDER',
          note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadRiderData();
      }
    } catch {
      alert('Failed to update delivery progression');
    }
  };

  if (!loading && (!currentUser || currentUser.role !== 'RIDER')) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
          <Bike className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Rider Portal Access</h2>
        <p className="text-xs text-gray-500">
          You need an active Delivery Rider account to view delivery requests and complete order drop-offs.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/auth/register?role=RIDER"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-2xl shadow-xs transition-colors"
          >
            Register as Delivery Rider →
          </Link>
          <Link
            href="/auth/login"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs py-2.5 rounded-2xl transition-colors"
          >
            Sign In with Existing Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Rider Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            <Bike className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {currentUser?.name || 'Arjun Das'}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {rider?.vehicleType || 'EV'} • {rider?.vehicleNumber || 'KL-07-CD-4102'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Smart Delivery Partner • Active radius: {rider?.deliveryRadiusKm || 8} km
            </p>
          </div>
        </div>

        {/* Online / Offline Switch */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAvailability}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
              rider?.status === 'ONLINE'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{rider?.status === 'ONLINE' ? 'ONLINE (Receiving Deliveries)' : 'OFFLINE'}</span>
          </button>

          <button onClick={loadRiderData} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl text-gray-700">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs text-center">
          <span className="text-[11px] text-gray-400 font-semibold uppercase block">Today's Earnings</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">₹{rider?.todayEarnings || 450}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs text-center">
          <span className="text-[11px] text-gray-400 font-semibold uppercase block">Total Deliveries</span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">{rider?.totalDeliveries || 312}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs text-center">
          <span className="text-[11px] text-gray-400 font-semibold uppercase block">Partner Rating</span>
          <span className="text-2xl font-black text-amber-500 mt-1 flex items-center justify-center gap-1">
            <Star className="w-5 h-5 fill-amber-400" />
            {rider?.rating?.toFixed(1) || '4.9'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs text-center">
          <span className="text-[11px] text-gray-400 font-semibold uppercase block">Lifetime Earnings</span>
          <span className="text-2xl font-black text-gray-900 mt-1 block">₹{rider?.totalEarnings || 21800}</span>
        </div>
      </div>

      {/* Active Delivery Radar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Active Delivery Radar</h2>
            <p className="text-xs text-gray-500">Orders smartly matched to your vehicle location & workload</p>
          </div>
        </div>

        {assignedOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 space-y-2">
            <Bike className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500">No active delivery assignments right now.</p>
            <p className="text-[11px] text-gray-400">Keep your status ONLINE to receive fresh kitchen assignments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-gray-900 text-base">#{ord.orderNumber}</span>
                    <span className="text-xs text-gray-400 block">{ord.items.length} homemade dishes to deliver</span>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      ord.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Pickup & Drop Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-orange-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <ChefHat className="w-3.5 h-3.5" />
                      Pickup from Cooker
                    </span>
                    <strong className="block text-gray-900">{ord.cookerStoreName}</strong>
                    <p className="text-gray-500">{ord.cookerAddress}</p>
                    <p className="text-gray-700 font-medium">📞 {ord.cookerPhone}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-emerald-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      Deliver to Customer
                    </span>
                    <strong className="block text-gray-900">{ord.customerName}</strong>
                    <p className="text-gray-500">{ord.deliveryAddress.street}, {ord.deliveryAddress.city}</p>
                    <p className="text-gray-700 font-medium">📞 {ord.customerPhone}</p>
                  </div>
                </div>

                {/* Delivery Earning & Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="text-gray-400">Rider Earning for this Delivery: </span>
                    <strong className="text-emerald-700 text-sm">₹{ord.deliveryFee}</strong>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {ord.status === 'RIDER_ASSIGNED' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'PICKED_UP', 'Picked up from cooker kitchen')}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                      >
                        Confirm Food Picked Up →
                      </button>
                    )}

                    {ord.status === 'PICKED_UP' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'OUT_FOR_DELIVERY', 'Rider is on the way to customer')}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                      >
                        Start Delivery Journey →
                      </button>
                    )}

                    {ord.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'DELIVERED', 'Delivered safely to customer hands')}
                        className="w-full sm:w-auto px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold shadow-md shadow-green-600/20"
                      >
                        Mark Successfully Delivered!
                      </button>
                    )}

                    {ord.status === 'DELIVERED' && (
                      <span className="text-xs text-emerald-700 font-bold">Delivery Completed ✓</span>
                    )}

                    <Link
                      href={`/order/${ord.id}`}
                      className="text-xs text-orange-600 hover:underline font-semibold"
                    >
                      View Map & Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
