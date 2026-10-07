'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { UserRole } from '@/lib/types';
import { ShoppingBag, ChefHat, Bike, ShieldCheck } from 'lucide-react';

export default function RoleSwitcher() {
  const { currentRole, switchRole, currentUser } = useAuth();

  const roles: { role: UserRole; label: string; icon: any; link: string; color: string }[] = [
    { role: 'CUSTOMER', label: 'Customer View', icon: ShoppingBag, link: '/', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
    { role: 'COOKER', label: 'Cooker Dashboard', icon: ChefHat, link: '/cooker/dashboard', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    { role: 'RIDER', label: 'Rider Portal', icon: Bike, link: '/rider/dashboard', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    { role: 'ADMIN', label: 'Admin Control', icon: ShieldCheck, link: '/admin/dashboard', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 text-xs py-1.5 px-4 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Role Switcher:</span>
          <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full text-[11px]">
            Active: {currentRole} ({currentUser?.name || 'User'})
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = currentRole === r.role;
            return (
              <div key={r.role} className="flex items-center">
                <button
                  type="button"
                  onClick={() => switchRole(r.role)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium border transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                      : r.color
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                </button>
                {isActive && r.link !== '/' && (
                  <Link
                    href={r.link}
                    className="ml-1 text-blue-600 hover:text-blue-800 underline font-medium text-[11px]"
                  >
                    Open
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
