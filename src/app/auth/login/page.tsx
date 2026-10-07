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
        body: JSON.stringify({ email, password }),
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

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Welcome to HomelyBite
        </h1>
        <p className="text-xs text-gray-500">
          Sign in to access your culinary dashboard or customer orders
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Username / Email Address</label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your username or email"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
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
            {loading ? 'Authenticating...' : 'Sign In with Role Access →'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-gray-500 space-y-2">
          <div>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-bold text-orange-600 hover:underline">
              Register as Customer, Cooker, or Rider
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
