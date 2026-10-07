'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'COOKER' ? 'COOKER' : 'CUSTOMER';
  const { loginUser } = useAuth();

  const [role, setRole] = useState<'CUSTOMER' | 'COOKER'>(initialRole);
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');

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

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHelper, setDevOtpHelper] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !phone) {
      setErrorMsg('Please fill out all required personal fields.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devOtp) {
          setDevOtpHelper(data.devOtp);
        }
        setStep('OTP');
      } else {
        setErrorMsg(data.message || 'Failed to send OTP code.');
      }
    } catch {
      setErrorMsg('Network error requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Verify OTP
      const vRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const vData = await vRes.json();

      if (!vData.success) {
        setErrorMsg(vData.message || 'Invalid OTP code.');
        setLoading(false);
        return;
      }

      // 2. Complete Registration
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
        }),
      });
      const rData = await rRes.json();

      if (rData.success && rData.user) {
        loginUser(rData.user, rData.cooker);
        if (role === 'COOKER') {
          router.push('/cooker/dashboard');
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
          {step === 'DETAILS' ? 'Create Your Account' : 'Verify Email with OTP'}
        </h1>
        <p className="text-xs text-gray-500">
          {step === 'DETAILS'
            ? 'Join our community of authentic cooks and home food enthusiasts'
            : `Enter the 6-digit code sent to ${email}`}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5">
        {step === 'DETAILS' ? (
          <>
            {/* Role selector tab */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  role === 'CUSTOMER'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                Customer
              </button>

              <button
                type="button"
                onClick={() => setRole('COOKER')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  role === 'COOKER'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ChefHat className="w-4 h-4 text-orange-600" />
                Home Cooker / Baker
              </button>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anas Rahiman"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address (for SMTP OTP)</label>
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
                  <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">
                    Kitchen / Bakery Details (Subject to Admin Verification)
                  </span>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Store / Bakery Name</label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Anas Artisanal Home Bakery"
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
                      placeholder="Handcrafted European cakes, sourdough loaves, no preservatives..."
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
                {loading ? 'Sending SMTP OTP...' : 'Send Email Verification OTP →'}
              </button>
            </form>
          </>
        ) : (
          /* Step 2: OTP Entry */
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            {devOtpHelper && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-900 text-center">
                <span className="font-semibold block">Development OTP Preview:</span>
                <span className="text-xl font-mono font-black text-orange-600 tracking-widest">{devOtpHelper}</span>
                <button
                  type="button"
                  onClick={() => setOtpCode(devOtpHelper)}
                  className="mt-1 block mx-auto text-[11px] text-orange-700 underline font-medium"
                >
                  Click to Auto-Fill
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1 text-center">
                Enter 6-digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[8px] font-mono text-2xl bg-gray-50 border border-gray-200 rounded-2xl p-3 text-gray-900 focus:outline-none focus:border-orange-500 font-bold"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs transition-colors shadow-xs"
            >
              {loading ? 'Verifying...' : 'Verify OTP & Complete Registration →'}
            </button>

            <button
              type="button"
              onClick={() => setStep('DETAILS')}
              className="w-full text-xs text-gray-400 hover:text-gray-600 text-center"
            >
              ← Back to Details
            </button>
          </form>
        )}

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
