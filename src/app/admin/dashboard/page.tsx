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
  UploadCloud,
  FileUp,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { CookerProfile, Product, DeliveryPersonProfile, Category, MasterIngredient, AuditLog, PlatformSettings } from '@/lib/types';
import { DEFAULT_PLATFORM_SETTINGS } from '@/lib/initial-data';

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
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [simOrderAmount, setSimOrderAmount] = useState<number>(500);
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
  const [catImageMode, setCatImageMode] = useState<'UPLOAD' | 'URL'>('UPLOAD');
  const [catFileInfo, setCatFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);
  const [isProcessingCatFile, setIsProcessingCatFile] = useState(false);
  const [isCatDragOver, setIsCatDragOver] = useState(false);

  const compressAndReadCategoryFile = (file: File): Promise<{ dataUrl: string; info: { name: string; size: number; type: string } }> => {
    return new Promise((resolve) => {
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const rawDataUrl = event.target?.result as string;
          const img = new Image();
          img.src = rawDataUrl;
          img.onload = () => {
            const maxWidth = 1200;
            const maxHeight = 800;
            let { width, height } = img;

            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve({ dataUrl: rawDataUrl, info: fileInfo });
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            resolve({ dataUrl: compressed, info: fileInfo });
          };
          img.onerror = () => resolve({ dataUrl: rawDataUrl, info: fileInfo });
        };
        reader.onerror = () => resolve({ dataUrl: '', info: fileInfo });
      } else {
        // Document (PDF or text/document): create an SVG banner card representation
        const cleanName = file.name.replace(/[^a-zA-Z0-9 ._-]/g, '');
        const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
        const docSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%234338ca"/><circle cx="300" cy="150" r="45" fill="%236366f1"/><path d="M285 130h30v40h-30z" fill="white"/><text x="300" y="240" font-family="sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">${encodeURIComponent(cleanName)}</text><text x="300" y="270" font-family="sans-serif" font-size="14" fill="%23c7d2fe" text-anchor="middle">Document Attached (${sizeStr})</text></svg>`;
        resolve({ dataUrl: docSvg, info: fileInfo });
      }
    });
  };

  const handleCatFileSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsProcessingCatFile(true);
    try {
      const { dataUrl, info } = await compressAndReadCategoryFile(file);
      if (dataUrl) {
        setNewCatImage(dataUrl);
        setCatFileInfo(info);
      }
    } catch (err) {
      console.error('File reading error:', err);
      alert('Could not read the selected file.');
    } finally {
      setIsProcessingCatFile(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [sRes, cRes, rRes, pRes, catRes, iRes, setRes, lRes, uRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/cookers', { cache: 'no-store' }),
        fetch('/api/delivery/riders', { cache: 'no-store' }),
        fetch('/api/products?status=', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/ingredients', { cache: 'no-store' }),
        fetch('/api/admin/settings', { cache: 'no-store' }),
        fetch('/api/admin/audit-logs', { cache: 'no-store' }),
        fetch('/api/admin/users', { cache: 'no-store' }),
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
        setCatFileInfo(null);
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
    setIsSavingSettings(true);
    setSettingsFeedback(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: settings,
          adminEmail: currentUser?.email || 'admin@homelybite.com',
        }),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setSettingsFeedback({
          type: 'success',
          message: 'Platform parameters & commission rules updated and synchronized across all services!',
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('platform-settings-updated'));
        }
        await loadAdminData();
      } else {
        setSettingsFeedback({
          type: 'error',
          message: data.message || 'Failed to update platform settings',
        });
      }
    } catch {
      setSettingsFeedback({
        type: 'error',
        message: 'Network error saving platform settings',
      });
    } finally {
      setIsSavingSettings(false);
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

              {/* Cover Photo / Document Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Category Cover Image or Document (Optional)
                  </label>
                  <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCatImageMode('UPLOAD')}
                      className={`px-2.5 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
                        catImageMode === 'UPLOAD'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3" />
                      Upload File / Doc
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatImageMode('URL')}
                      className={`px-2.5 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 ${
                        catImageMode === 'URL'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      Paste URL
                    </button>
                  </div>
                </div>

                {catImageMode === 'UPLOAD' ? (
                  <div>
                    {newCatImage ? (
                      /* Preview of Uploaded Image / Document */
                      <div className="relative border border-indigo-200 bg-indigo-50/30 rounded-2xl p-3 flex items-center gap-4">
                        <div className="w-20 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {catFileInfo?.type?.startsWith('image/') || (!catFileInfo && newCatImage.startsWith('data:image')) ? (
                            <img
                              src={newCatImage}
                              alt="Uploaded Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-2 text-indigo-600">
                              <FileText className="w-6 h-6" />
                              <span className="text-[9px] font-bold uppercase mt-0.5">DOC</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ready to Publish
                            </span>
                            {catFileInfo && (
                              <span className="text-[10px] text-gray-500 font-mono">
                                {(catFileInfo.size / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-gray-800 truncate mt-1">
                            {catFileInfo?.name || 'Uploaded category cover photo'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Attached and ready for display across marketplace
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-xl transition-all shadow-2xs">
                            Change
                            <input
                              type="file"
                              accept="image/*,.pdf,.doc,.docx"
                              className="hidden"
                              onChange={(e) => handleCatFileSelected(e.target.files)}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setNewCatImage('');
                              setCatFileInfo(null);
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drop & Upload Box */
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsCatDragOver(true);
                        }}
                        onDragLeave={() => setIsCatDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsCatDragOver(false);
                          handleCatFileSelected(e.dataTransfer.files);
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative group ${
                          isCatDragOver
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/20'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          disabled={isProcessingCatFile}
                          onChange={(e) => handleCatFileSelected(e.target.files)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">
                              {isProcessingCatFile
                                ? 'Reading & Optimizing File...'
                                : 'Click to upload image or document, or drag & drop here'}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Supports JPG, PNG, WEBP, SVG, PDF or documents from phone / PC
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={newCatImage}
                      onChange={(e) => {
                        setNewCatImage(e.target.value);
                        setCatFileInfo(null);
                      }}
                      placeholder="https://images.unsplash.com/... (Direct image link)"
                      className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Paste a direct HTTPS image URL or switch to &quot;Upload File / Doc&quot; tab.
                    </p>
                  </div>
                )}
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
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6 max-w-4xl">
          {/* Header & Status Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-2">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Live Platform Engine
                </div>
                <h2 className="text-xl font-bold text-gray-900">Platform Settings & Commission Rates</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Configure live platform fees, kitchen payout commission %, doorstep delivery economics, AI ranking weights, and OTP rules.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...DEFAULT_PLATFORM_SETTINGS })}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings || !settings}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow-xs flex items-center gap-2"
                >
                  {isSavingSettings ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      Saving & Syncing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save & Sync Rules
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Inline feedback banner */}
            {settingsFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 ${
                  settingsFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {settingsFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{settingsFeedback.message}</span>
                </div>
                <button
                  onClick={() => setSettingsFeedback(null)}
                  className="text-gray-400 hover:text-gray-700 text-xs px-2 py-0.5"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {!settings ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-xs text-gray-500">
              Loading platform rules...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section 1 & 2: Financial Rules & Logistics Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Commercial Revenue & Commission */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-gray-900 text-sm">Commercial Revenue & Commission</h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-gray-700">Platform Commission Rate</label>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          {settings.commissionRatePercent}%
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={settings.commissionRatePercent ?? ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              commissionRatePercent: e.target.value === '' ? 0 : Number(e.target.value),
                            })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 pr-8 text-gray-900 focus:bg-white focus:border-indigo-500 font-semibold"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 font-bold">%</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Deducted from home cookers on total food subtotal of each delivered order.
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-gray-700">Customer Platform Tech Fee</label>
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          ₹{settings.platformFee}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={settings.platformFee ?? ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              platformFee: e.target.value === '' ? 0 : Number(e.target.value),
                            })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 pr-8 text-gray-900 focus:bg-white focus:border-indigo-500 font-semibold"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 font-bold">₹</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Convenience & platform maintenance charge added to customer cart checkout.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logistics & Delivery Rates */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <Bike className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-gray-900 text-sm">Doorstep Delivery Logistics Rates</h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-gray-700">Base Doorstep Delivery Fee</label>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          ₹{settings.baseDeliveryFee}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={settings.baseDeliveryFee ?? ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              baseDeliveryFee: e.target.value === '' ? 0 : Number(e.target.value),
                            })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 pr-8 text-gray-900 focus:bg-white focus:border-indigo-500 font-semibold"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 font-bold">₹</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Baseline charge for orders within the first 5 km delivery radius.
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-gray-700">Distance Surcharge Rate (Per Km)</label>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          ₹{settings.deliveryFeePerKm}/km
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={settings.deliveryFeePerKm ?? ''}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              deliveryFeePerKm: e.target.value === '' ? 0 : Number(e.target.value),
                            })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 pr-14 text-gray-900 focus:bg-white focus:border-indigo-500 font-semibold"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 font-bold">₹/km</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Additional charge per kilometer beyond initial 5 km (direct customer pickup stays ₹0).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Live Order Economics Simulator */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Interactive Model</span>
                    <h3 className="text-lg font-black text-white mt-0.5">Live Order Economics & Payout Simulator</h3>
                    <p className="text-xs text-indigo-200">
                      See exactly how order amounts are divided between cooker, platform, and logistics with your current parameters.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
                    <span className="text-xs text-indigo-200">Test Order:</span>
                    <input
                      type="number"
                      min="50"
                      step="50"
                      value={simOrderAmount}
                      onChange={(e) => setSimOrderAmount(Math.max(1, Number(e.target.value)))}
                      className="w-20 bg-white/20 text-white font-black text-sm px-2 py-1 rounded-xl border border-white/20 focus:outline-hidden"
                    />
                    <span className="text-xs text-indigo-200 font-bold">₹</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  {/* Customer Payment */}
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2">
                    <span className="text-indigo-200 font-medium block text-[11px]">Customer Checkout Total</span>
                    <span className="text-2xl font-black text-white block">
                      ₹{simOrderAmount + Number(settings.baseDeliveryFee || 0) + Number(settings.platformFee || 0)}
                    </span>
                    <div className="text-[10px] text-indigo-300 space-y-0.5 pt-1 border-t border-white/10">
                      <div>Food: ₹{simOrderAmount}</div>
                      <div>Delivery: ₹{settings.baseDeliveryFee}</div>
                      <div>Platform Fee: ₹{settings.platformFee}</div>
                    </div>
                  </div>

                  {/* Cooker Payout */}
                  <div className="bg-emerald-500/20 rounded-2xl p-4 border border-emerald-500/30 space-y-2">
                    <span className="text-emerald-300 font-medium block text-[11px]">Cooker Payout (Net)</span>
                    <span className="text-2xl font-black text-emerald-400 block">
                      ₹{simOrderAmount - Math.round((simOrderAmount * Number(settings.commissionRatePercent || 0)) / 100)}
                    </span>
                    <div className="text-[10px] text-emerald-200 space-y-0.5 pt-1 border-t border-emerald-500/20">
                      <div>Gross: ₹{simOrderAmount}</div>
                      <div>Minus {settings.commissionRatePercent}% cut</div>
                      <div className="text-emerald-300 font-bold">Transferred to Cooker</div>
                    </div>
                  </div>

                  {/* Platform Commission */}
                  <div className="bg-amber-500/20 rounded-2xl p-4 border border-amber-500/30 space-y-2">
                    <span className="text-amber-300 font-medium block text-[11px]">Platform Commission Cut</span>
                    <span className="text-2xl font-black text-amber-400 block">
                      ₹{Math.round((simOrderAmount * Number(settings.commissionRatePercent || 0)) / 100)}
                    </span>
                    <div className="text-[10px] text-amber-200 space-y-0.5 pt-1 border-t border-amber-500/20">
                      <div>Rate: {settings.commissionRatePercent}%</div>
                      <div>On ₹{simOrderAmount} subtotal</div>
                      <div className="text-amber-300 font-bold">Kitchen service share</div>
                    </div>
                  </div>

                  {/* Total Platform Revenue */}
                  <div className="bg-indigo-500/20 rounded-2xl p-4 border border-indigo-500/30 space-y-2">
                    <span className="text-indigo-300 font-medium block text-[11px]">Total Platform Net Revenue</span>
                    <span className="text-2xl font-black text-indigo-300 block">
                      ₹{Math.round((simOrderAmount * Number(settings.commissionRatePercent || 0)) / 100) + Number(settings.platformFee || 0)}
                    </span>
                    <div className="text-[10px] text-indigo-200 space-y-0.5 pt-1 border-t border-indigo-500/20">
                      <div>Commission: ₹{Math.round((simOrderAmount * Number(settings.commissionRatePercent || 0)) / 100)}</div>
                      <div>Tech Fee: +₹{settings.platformFee}</div>
                      <div className="text-indigo-300 font-bold">Company Earnings</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4 & 5: AI Search Weights & OTP Security */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Search & Recommendation Weights */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                      <h3 className="font-bold text-gray-900 text-sm">AI Search & Ranking Weights</h3>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">Relative scoring signals</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Text Relevance</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.relevanceWeight ?? 40}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            relevanceWeight: Number(e.target.value),
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Distance Proximity</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.distanceWeight ?? 20}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            distanceWeight: Number(e.target.value),
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Customer Rating</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.ratingWeight ?? 15}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            ratingWeight: Number(e.target.value),
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Kitchen Availability</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.availabilityWeight ?? 10}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            availabilityWeight: Number(e.target.value),
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Dish Popularity</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.popularityWeight ?? 10}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            popularityWeight: Number(e.target.value),
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Cooker Quality</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.cookerQualityWeight ?? 5}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            cookerQualityWeight: Number(e.target.value),
                          })
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Authentication & Security Rules */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-gray-900 text-sm">Authentication & Security Rules</h3>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">OTP Verification</span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">OTP Expiry Window (Minutes)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={settings.otpExpiryMinutes ?? 5}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              otpExpiryMinutes: Number(e.target.value),
                            })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 font-semibold"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 font-medium">mins</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        How long a one-time login / registration password remains valid before expiring.
                      </p>
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">OTP Resend Cooldown (Seconds)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          max="300"
                          value={settings.otpCooldownSeconds ?? 60}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              otpCooldownSeconds: Number(e.target.value),
                            })
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 font-semibold"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400 font-medium">sec</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Minimum cooldown delay between consecutive OTP resend requests.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...DEFAULT_PLATFORM_SETTINGS })}
                  className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings || !settings}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-7 py-2.5 rounded-xl text-xs transition-colors shadow-xs flex items-center gap-2"
                >
                  {isSavingSettings ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Saving Parameters...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save & Sync Platform Rules
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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
