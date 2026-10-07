export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import {
  Star,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Bike,
} from 'lucide-react';

interface CookerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CookerStorePage({ params }: CookerPageProps) {
  const { id } = await params;
  const cooker = db.getCookerById(id);

  if (!cooker) {
    notFound();
  }

  const products = db.getProductsByCookerId(cooker.id).filter((p) => p.status === 'APPROVED');
  const reviews = db.getReviewsByCookerId(cooker.id);

  return (
    <div className="space-y-10 pb-16">
      {/* Store Banner */}
      <div className="relative h-48 sm:h-64 bg-gray-900 overflow-hidden">
        <img
          src={cooker.coverImageUrl}
          alt={cooker.storeName}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Store Info Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={cooker.logoUrl}
                alt={cooker.storeName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {cooker.storeName}
                  </h1>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                </div>

                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>{cooker.address}</span>
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="font-bold text-gray-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {cooker.rating.toFixed(1)} ({cooker.totalReviews} reviews)
                  </span>

                  <span className="bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    FSSAI: {cooker.fssaiLicenseNumber || 'Verified Kitchen'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Kitchen Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100 shrink-0">
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Opening Hours</span>
                <span className="font-semibold text-gray-800">{cooker.openingHours}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Avg Prep Time</span>
                <span className="font-semibold text-gray-800">{cooker.averagePrepTimeMinutes} mins</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Self Delivery</span>
                <span className="font-semibold text-gray-800">
                  {cooker.selfDeliveryEnabled ? `Up to ${cooker.selfDeliveryRadiusKm} km` : 'Platform only'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Minimum Order</span>
                <span className="font-semibold text-gray-800">₹{cooker.minimumOrderValue}</span>
              </div>
            </div>
          </div>

          <p className="mt-6 pt-6 border-t border-gray-100 text-xs sm:text-sm text-gray-600 leading-relaxed max-w-4xl">
            {cooker.bio}
          </p>
        </div>
      </div>

      {/* Menu / Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Fresh Dishes by {cooker.storeName} ({products.length})
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Small-batch homemade delicacies prepared with complete ingredient transparency.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
            <p className="text-sm text-gray-500">No dishes currently published by this home cooker.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                cooker={cooker}
                distanceKm={2.4}
              />
            ))}
          </div>
        )}
      </div>

      {/* Customer Reviews for this Cooker */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <h3 className="text-xl font-bold text-gray-900">
            Customer Reviews for Kitchen ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <p className="text-xs text-gray-400">No customer reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-xs">{r.customerName}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < r.cookerRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
