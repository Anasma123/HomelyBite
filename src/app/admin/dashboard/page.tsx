'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  ChefHat,
  Bike,
  UtensilsCrossed,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Settings,
  SlidersHorizontal,
  FileText,
  RotateCw,
  Snowflake,
  Trash2,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { CookerProfile, Product, DeliveryPersonProfile, Category, MasterIngredient, AuditLog } from '@/lib/types';

export default function AdminDashboard() {
  const { currentUser, currentRole, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'METRICS' | 'USERS' | 'COOKERS' | 'RIDERS' | 'PRODUCTS' | 'CATEGORIES' | 'INGREDIENTS' | 'SETTINGS' | 'LOGS'>('METRICS');

  const [stats, setStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userFilterRole, setUserFilterRole] = useState<'ALL' | 'CUSTOMER' | 'COOKER' | 'RIDER' | 'ADMIN'>('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [cookers, setCookers] = useState<CookerProfile[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<MasterIngredient[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rider Form State
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderEmail, setNewRiderEmail] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderVehicleType, setNewRiderVehicleType] = useState('BIKE');
  const [newRiderVehicleNumber, setNewRiderVehicleNumber] = useState('');
  const [newRiderRadius, setNewRiderRadius] = useState(8.0);
  const [isCreatingRider, setIsCreatingRider] = useState(false);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatOrder, setNewCatOrder] = useState(1);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const loadAdminData = async () => {
    try {
      const [sRes, cRes, rRes, pRes, catRes, iRes, setRes, lRes, uRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/cookers'),
        fetch('/api/delivery/riders'),
        fetch('/api/products?status='),
        fetch('/api/categories'),
        fetch('/api/ingredients'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/users'),
      ]);

      const [sData, cData, rData, pData, catData, iData, setData, lData, uData] = await Promise.all([
        sRes.json(),
        cRes.json(),
        rRes.json(),
        pRes.json(),
        catRes.json(),
        iRes.json(),
        setRes.json(),
        lRes.json(),
        uRes.json(),
      ]);

      if (sData.success) setStats(sData.stats);
      if (cData.success) setCookers(cData.cookers || []);
      if (rData.success) setRiders(rData.riders || []);
      if (pData.success) setProducts(pData.products || []);
      if (catData.success) setCategories(catData.categories || []);
      if (iData.success) setIngredients(iData.ingredients || []);
      if (setData.success) setSettings(setData.settings);
      if (lData.success) setAuditLogs(lData.logs || []);
      if (uData.success) setAllUsers(uData.users || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleFreezeUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_FREEZE' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadAdminData();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch {
      alert('Error updating user status');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userName}"? This will remove all their profiles and cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadAdminData();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch {
      alert('Network error deleting user');
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert('Category deleted successfully');
        loadAdminData();
      } else {
        alert(data.message || 'Failed to delete category');
      }
    } catch {
      alert('Network error deleting category');
    }
  };

  const handleCookerApproval = async (cookerId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/cookers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookerId, status }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadAdminData();
      }
    } catch {
      alert('Failed to update cooker verification status');
    }
  };

  const handleProductApproval = async (productId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadAdminData();
      }
    } catch {
      alert('Failed to update product approval status');
    }
  };

  const handleCreateRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiderName || !newRiderEmail || !newRiderVehicleNumber) return;
    setIsCreatingRider(true);

    try {
      const res = await fetch('/api/admin/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRiderName,
          email: newRiderEmail,
          phone: newRiderPhone,
          vehicleType: newRiderVehicleType,
          vehicleNumber: newRiderVehicleNumber,
          deliveryRadiusKm: newRiderRadius,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setNewRiderName('');
        setNewRiderEmail('');
        setNewRiderPhone('');
        setNewRiderVehicleNumber('');
        loadAdminData();
      } else {
        alert(data.message || 'Failed to create rider');
      }
    } catch {
      alert('Error creating rider account');
    } finally {
      setIsCreatingRider(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    setIsCreatingCategory(true);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName,
          description: newCatDesc,
          imageUrl: newCatImage || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
          displayOrder: Number(newCatOrder) || 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatName('');
        setNewCatDesc('');
        setNewCatImage('');
        setNewCatOrder(categories.length + 1);
        alert('New food category created successfully!');
        loadAdminData();
      } else {
        alert(data.message || 'Failed to create category');
      }
    } catch {
      alert('Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: settings }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Platform settings & commission updated successfully!');
      }
    } catch {
      alert('Failed to save settings');
    }
  };

  if (!authLoading && (!currentUser || currentRole !== 'ADMIN')) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Administrator Access Required</h2>
        <p className="text-xs text-gray-500">
          This portal is reserved for platform administrators. Please sign in with your administrator credentials.
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-2.5 rounded-2xl shadow-xs transition-colors"
        >
          Sign In as Admin (silu / 123) →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Admin Master Control Panel
              </h1>
              <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                Superuser
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Full governance over verified cooks, rider fleet, nutrition databases, search weights, and payouts.
            </p>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-2xl text-gray-700 self-end sm:self-center"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {[
          { id: 'METRICS', label: 'Platform Metrics', icon: TrendingUp },
          { id: 'USERS', label: `All Users (${allUsers.length})`, icon: Users },
          { id: 'COOKERS', label: `Cookers Approval (${cookers.filter((c) => c.status === 'PENDING').length} Pending)`, icon: ChefHat },
          { id: 'RIDERS', label: `Rider Fleet (${riders.length})`, icon: Bike },
          { id: 'PRODUCTS', label: `Dishes Moderation (${products.length})`, icon: UtensilsCrossed },
          { id: 'CATEGORIES', label: `Categories (${categories.length})`, icon: FileText },
          { id: 'INGREDIENTS', label: 'Nutrition Ingredients Master', icon: UtensilsCrossed },
          { id: 'SETTINGS', label: 'Platform Rules & Commission', icon: Settings },
          { id: 'LOGS', label: 'Audit Trail', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Platform Metrics */}
      {activeTab === 'METRICS' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Gross Sales (GMV)</span>
              <span className="text-3xl font-black text-gray-900 mt-1 block">₹{stats.totalGrossRevenue}</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">Platform Commission</span>
              <span className="text-3xl font-black text-indigo-700 mt-1 block">₹{stats.totalPlatformCommission}</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Total Orders</span>
              <span className="text-3xl font-black text-emerald-700 mt-1 block">{stats.totalOrders}</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Active Cookers</span>
              <span className="text-3xl font-black text-amber-700 mt-1 block">{stats.totalCookers}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 text-xs space-y-1">
              <strong className="block text-gray-900 text-sm">Customer Accounts</strong>
              <p className="text-gray-500">{stats.totalCustomers} registered food lovers</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-200 text-xs space-y-1">
              <strong className="block text-gray-900 text-sm">Delivery Fleet</strong>
              <p className="text-gray-500">{stats.totalRiders} admin-created riders operating on radar</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-200 text-xs space-y-1">
              <strong className="block text-gray-900 text-sm">Cooker Payouts</strong>
              <p className="text-gray-500">₹{stats.totalCookerPayouts} credited directly to kitchen ledgers</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: All Platform Users */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">All Platform Users</h2>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {allUsers.length} Total Registered
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete user management: view profiles, freeze/unfreeze accounts, or permanently delete users.
                </p>
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search name, email, phone..."
                  className="text-xs bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-gray-900 focus:outline-none focus:border-indigo-500 w-64"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400 mr-1">Filter Role:</span>
              {(['ALL', 'CUSTOMER', 'COOKER', 'RIDER', 'ADMIN'] as const).map((r) => {
                const count = r === 'ALL' ? allUsers.length : allUsers.filter((u) => u.role === r).length;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUserFilterRole(r)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      userFilterRole === r
                        ? 'bg-indigo-900 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {r} ({count})
                  </button>
                );
              })}
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
                    <th className="pb-3">User & Profile Photo</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Contact Info</th>
                    <th className="pb-3">Account Status</th>
                    <th className="pb-3">Associated Store / Vehicle</th>
                    <th className="pb-3">Joined Date</th>
                    <th className="pb-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {allUsers
                    .filter((u) => {
                      if (userFilterRole !== 'ALL' && u.role !== userFilterRole) return false;
                      if (!userSearchQuery.trim()) return true;
                      const q = userSearchQuery.toLowerCase();
                      return (
                        u.name?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q) ||
                        u.phone?.includes(q)
                      );
                    })
                    .map((u) => {
                      const isFrozen = !!u.isFrozen;
                      const isSuperAdmin = u.role === 'ADMIN' && (u.email === 'silu@homelybite.com' || u.email === 'silu@homefood.local');

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 font-semibold text-gray-900">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                                alt={u.name}
                                className="w-8 h-8 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-gray-900 block">{u.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{u.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'COOKER'
                                  ? 'bg-amber-100 text-amber-800'
                                  : u.role === 'RIDER'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3">
                            <span className="block text-gray-900 font-medium">{u.email}</span>
                            <span className="text-gray-400 text-[11px]">{u.phone}</span>
                          </td>

                          <td className="py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                isFrozen
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isFrozen ? (
                                <>
                                  <Snowflake className="w-3 h-3 text-rose-600" />
                                  FROZEN
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ACTIVE
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-3 text-gray-500">
                            {u.profileInfo ? (
                              <div className="text-[11px]">
                                {u.role === 'COOKER' && (
                                  <>
                                    <strong className="text-gray-800 block">{u.profileInfo.storeName}</strong>
                                    <span>{u.profileInfo.address}</span>
                                  </>
                                )}
                                {u.role === 'RIDER' && (
                                  <>
                                    <strong className="text-gray-800 block">{u.profileInfo.vehicleType}</strong>
                                    <span>{u.profileInfo.vehicleNumber}</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Standard Customer</span>
                            )}
                          </td>

                          <td className="py-3 text-gray-400 text-[11px]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Freeze/Unfreeze Button */}
                              {!isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleFreezeUser(u.id)}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                                    isFrozen
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200'
                                  }`}
                                  title={isFrozen ? 'Unfreeze this account' : 'Freeze this account'}
                                >
                                  {isFrozen ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Unfreeze
                                    </>
                                  ) : (
                                    <>
                                      <Snowflake className="w-3 h-3 text-amber-700" />
                                      Freeze
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Delete User Button */}
                              {!isSuperAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all border border-rose-200 hover:border-rose-600"
                                  title="Permanently Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-md">
                                  Primary Admin
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {allUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No users found in database.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cookers Approval */}
      {activeTab === 'COOKERS' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Home Cookers & Verification Status</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3">Kitchen / Store Name</th>
                  <th className="pb-3">Address</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {cookers.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 font-semibold text-gray-900">{c.storeName}</td>
                    <td className="py-3 text-gray-500 max-w-xs truncate">{c.address}</td>
                    <td className="py-3">★ {c.rating} ({c.totalReviews})</td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          c.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1.5">
                      {c.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleCookerApproval(c.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px]"
                        >
                          Approve
                        </button>
                      )}
                      {c.status !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleCookerApproval(c.id, 'SUSPENDED')}
                          className="px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-semibold text-[11px]"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Rider Fleet (Admin Creates Riders) */}
      {activeTab === 'RIDERS' && (
        <div className="space-y-6">
          {/* Create Rider Form (No Public Signup!) */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add New Delivery Person (Admin Control)</h2>
              <p className="text-xs text-gray-500">There is no public rider signup. Create credentials directly for delivery partners.</p>
            </div>

            <form onSubmit={handleCreateRider} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Rider Name</label>
                <input
                  type="text"
                  required
                  value={newRiderName}
                  onChange={(e) => setNewRiderName(e.target.value)}
                  placeholder="e.g. Rahul Nair"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Rider Email</label>
                <input
                  type="email"
                  required
                  value={newRiderEmail}
                  onChange={(e) => setNewRiderEmail(e.target.value)}
                  placeholder="rahul.rider@homefood.local"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={newRiderPhone}
                  onChange={(e) => setNewRiderPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Vehicle Type</label>
                <select
                  value={newRiderVehicleType}
                  onChange={(e) => setNewRiderVehicleType(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
                >
                  <option value="EV">Electric Scooter / EV</option>
                  <option value="BIKE">Motorcycle / Bike</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="CYCLE">Cycle</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Vehicle Number Plate</label>
                <input
                  type="text"
                  required
                  value={newRiderVehicleNumber}
                  onChange={(e) => setNewRiderVehicleNumber(e.target.value)}
                  placeholder="KL-07-AB-1234"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isCreatingRider}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs"
                >
                  {isCreatingRider ? 'Creating Rider...' : '+ Create Rider Account'}
                </button>
              </div>
            </form>
          </div>

          {/* Riders List */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Active Fleet ({riders.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Deliveries</th>
                    <th className="pb-3 text-right">Lifetime Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {riders.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 font-semibold text-gray-900">{r.name}</td>
                      <td className="py-3">{r.vehicleType} ({r.vehicleNumber})</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            r.status === 'ONLINE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'BUSY'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3">{r.totalDeliveries} completed</td>
                      <td className="py-3 text-right font-bold text-emerald-700">₹{r.totalEarnings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Products Moderation */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Dishes & Nutrition Profiles</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3">Dish Name</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Calories</th>
                  <th className="pb-3">Allergens Detected</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 font-semibold text-gray-900">{p.name}</td>
                    <td className="py-3 font-bold">₹{p.price}</td>
                    <td className="py-3">{p.nutrition?.perServing?.calories || '-'} kcal</td>
                    <td className="py-3 text-red-600 font-medium">
                      {p.detectedAllergens?.length ? p.detectedAllergens.join(', ') : 'None'}
                    </td>
                    <td className="py-3">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleProductApproval(p.id, p.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED')}
                        className="px-2.5 py-1 border border-gray-300 hover:bg-gray-100 rounded-lg font-semibold text-[11px]"
                      >
                        {p.status === 'APPROVED' ? 'Suspend' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Categories CRUD */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-6">
          {/* Add Category Form */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New Food Category</h2>
                <p className="text-xs text-gray-500">Categories organize dishes across the marketplace for customers and cookers.</p>
              </div>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                {categories.length} Active Categories
              </span>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Traditional Breads & Roti"
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Display Order (Sorting)</label>
                  <input
                    type="number"
                    value={newCatOrder}
                    onChange={(e) => setNewCatOrder(Number(e.target.value))}
                    placeholder="1"
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Freshly hand-rolled traditional chapatis, rotis, and parottas."
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Cover Photo URL (Optional)</label>
                <input
                  type="text"
                  value={newCatImage}
                  onChange={(e) => setNewCatImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... (Leave empty for default gourmet banner)"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingCategory}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isCreatingCategory ? 'Creating Category...' : '+ Save & Publish Category'}
                </button>
              </div>
            </form>
          </div>

          {/* Categories Grid List */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-base">Published Marketplace Categories ({categories.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/9 bg-gray-100 overflow-hidden">
                      <img
                        src={cat.imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600'}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        #{cat.displayOrder}
                      </span>
                    </div>

                    <div className="p-4 space-y-1">
                      <h4 className="font-bold text-gray-900 text-sm">{cat.name}</h4>
                      <span className="text-[10px] text-gray-400 font-mono block">slug: {cat.slug}</span>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {cat.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {cat.subcategories?.length || 0} subcategories
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Master Ingredients */}
      {activeTab === 'INGREDIENTS' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nutrition Master Ingredient Database ({ingredients.length})</h2>
            <p className="text-xs text-gray-500">Powers the platform deterministic nutrition engine.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3">Ingredient</th>
                  <th className="pb-3">Per 100g Energy</th>
                  <th className="pb-3">Protein</th>
                  <th className="pb-3">Carbs</th>
                  <th className="pb-3">Fat</th>
                  <th className="pb-3">Sugar</th>
                  <th className="pb-3">Allergens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {ingredients.map((ing) => (
                  <tr key={ing.id}>
                    <td className="py-2.5 font-semibold text-gray-900">{ing.name}</td>
                    <td className="py-2.5">{ing.caloriesPer100} kcal</td>
                    <td className="py-2.5">{ing.proteinPer100}g</td>
                    <td className="py-2.5">{ing.carbsPer100}g</td>
                    <td className="py-2.5">{ing.fatPer100}g</td>
                    <td className="py-2.5">{ing.sugarPer100}g</td>
                    <td className="py-2.5 text-red-600 font-medium">
                      {ing.allergens?.length ? ing.allergens.join(', ') : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Settings & Commission Rules */}
      {activeTab === 'SETTINGS' && settings && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-900">Platform Settings & Commission Rates</h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Platform Commission Rate (%)</label>
              <input
                type="number"
                value={settings.commissionRatePercent}
                onChange={(e) => setSettings({ ...settings, commissionRatePercent: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Base Delivery Fee (₹)</label>
                <input
                  type="number"
                  value={settings.baseDeliveryFee}
                  onChange={(e) => setSettings({ ...settings, baseDeliveryFee: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Platform Tech Fee (₹)</label>
                <input
                  type="number"
                  value={settings.platformFee}
                  onChange={(e) => setSettings({ ...settings, platformFee: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              Update Platform Parameters
            </button>
          </div>
        </div>
      )}

      {/* Tab 8: Audit Logs */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Platform Security & Audit Trail</h2>

          <div className="divide-y divide-gray-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700">{log.action}</span>
                  <span className="text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-gray-700">{log.details}</p>
                <span className="text-[10px] text-gray-400">Actor: {log.actorEmail} ({log.actorRole})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
