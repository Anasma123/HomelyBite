'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  ChefHat,
  Bike,
  ShieldCheck,
  Mail,
  Lock,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginUser(data.user, data.cooker, data.rider);
        if (data.user.role === 'COOKER') router.push('/cooker/dashboard');
        else if (data.user.role === 'RIDER') router.push('/rider/dashboard');
        else if (data.user.role === 'ADMIN') router.push('/admin/dashboard');
        else router.push('/');
      } else {
        setErrorMessage(data.message || 'Login failed.');
      }
    } catch {
      setErrorMessage('Network error during login.');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (demoEmail: string, destination: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginUser(data.user, data.cooker, data.rider);
        router.push(destination);
      }
    } catch {
      setErrorMessage('Could not log in as demo persona.');
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
          Welcome to HomeFood
        </h1>
        <p className="text-xs text-gray-500">
          Sign in to access your culinary dashboard or customer orders
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Quick Demo Personas (1-Click Instant Testing) */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block text-center">
            ⚡ Quick Test: 1-Click Persona Sign-In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => loginAsDemo('amina.customer@homefood.local', '/')}
              className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100 text-left transition-all text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-orange-900">
                <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                Customer
              </div>
              <span className="text-[10px] text-gray-500">Amina Fathima</span>
            </button>

            <button
              type="button"
              onClick={() => loginAsDemo('anas.bakery@homefood.local', '/cooker/dashboard')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left transition-all text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                Cooker / Baker
              </div>
              <span className="text-[10px] text-gray-500">Anas Rahiman</span>
            </button>

            <button
              type="button"
              onClick={() => loginAsDemo('arjun.rider@homefood.local', '/rider/dashboard')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition-all text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Bike className="w-3.5 h-3.5 text-emerald-600" />
                Delivery Rider
              </div>
              <span className="text-[10px] text-gray-500">Arjun Das</span>
            </button>

            <button
              type="button"
              onClick={() => loginAsDemo('admin@homefood.local', '/admin/dashboard')}
              className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-left transition-all text-xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Admin Portal
              </div>
              <span className="text-[10px] text-gray-500">Master Control</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-gray-100"></div>
          <span className="shrink mx-2 text-[11px] text-gray-400">or sign in with email</span>
          <div className="grow border-t border-gray-100"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. anas.bakery@homefood.local"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-2xl text-xs transition-colors shadow-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In →'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-gray-500">
          New to HomeFood?{' '}
          <Link href="/auth/register" className="font-bold text-orange-600 hover:underline">
            Register with Email OTP
          </Link>
        </div>
      </div>
    </div>
  );
}
