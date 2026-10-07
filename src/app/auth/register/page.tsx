'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  Bike,
} from 'lucide-react';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRole = searchParams.get('role');
  const initialRole: 'CUSTOMER' | 'COOKER' | 'RIDER' =
    rawRole === 'RIDER' ? 'RIDER' : rawRole === 'COOKER' ? 'COOKER' : 'CUSTOMER';
  const { loginUser } = useAuth();

  const [role, setRole] = useState<'CUSTOMER' | 'COOKER' | 'RIDER'>(initialRole);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Cooker specific fields
  const [storeName, setStoreName] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [fssaiLicense, setFssaiLicense] = useState('');

  // Rider specific fields
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'SCOOTER' | 'CYCLE' | 'EV'>('BIKE');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !phone) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const rRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
          storeName,
          bio,
          address,
          fssaiLicense,
          vehicleType,
          vehicleNumber,
        }),
      });
      const rData = await rRes.json();

      if (rData.success && rData.user) {
        loginUser(rData.user, rData.cooker, rData.rider);
        if (role === 'COOKER') {
          router.push('/cooker/dashboard');
        } else if (role === 'RIDER') {
          router.push('/rider/dashboard');
        } else {
          router.push('/');
        }
      } else {
        setErrorMsg(rData.message || 'Registration failed.');
      }
    } catch {
      setErrorMsg('Network error completing registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Create Your Account
        </h1>
        <p className="text-xs text-gray-500">
          Instant registration — sign up and start immediately
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5">
        {/* Role selector tab (3 Roles) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              role === 'CUSTOMER'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
            Customer
          </button>

          <button
            type="button"
            onClick={() => setRole('COOKER')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              role === 'COOKER'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-600" />
            Cooker
          </button>

          <button
            type="button"
            onClick={() => setRole('RIDER')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              role === 'RIDER'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5 text-emerald-600" />
            Rider
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Mobile Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9988776655"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Extra Cooker Store Details */}
          {role === 'COOKER' && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Kitchen / Bakery Details
              </span>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Store / Bakery Name</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. My Fresh Home Bakery"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Kitchen Address / City</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Panampilly Nagar, Kochi"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Kitchen Bio / Specialties</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Handcrafted homemade cakes, artisan breads, no preservatives..."
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* Extra Rider Vehicle Details */}
          {role === 'RIDER' && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Rider Delivery Details
              </span>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="BIKE">Motorcycle / Bike</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                  <option value="CYCLE">Bicycle</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Vehicle Registration Number</label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. KL-07-CD-4102"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-2xl text-xs transition-colors shadow-xs"
          >
            {loading ? 'Creating Account...' : 'Complete Registration & Sign In →'}
          </button>
        </form>

        <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
          Already registered?{' '}
          <Link href="/auth/login" className="font-bold text-orange-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500">Loading Registration...</p>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
