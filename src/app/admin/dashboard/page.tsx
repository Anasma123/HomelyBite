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
} from 'lucide-react';
import { CookerProfile, Product, DeliveryPersonProfile, Category, MasterIngredient, AuditLog } from '@/lib/types';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'COOKERS' | 'RIDERS' | 'PRODUCTS' | 'CATEGORIES' | 'INGREDIENTS' | 'SETTINGS' | 'LOGS'>('METRICS');

  const [stats, setStats] = useState<any>(null);
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

  const loadAdminData = async () => {
    try {
      const [sRes, cRes, rRes, pRes, catRes, iRes, setRes, lRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/cookers'),
        fetch('/api/delivery/riders'),
        fetch('/api/products?status='),
        fetch('/api/categories'),
        fetch('/api/ingredients'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/audit-logs'),
      ]);

      const [sData, cData, rData, pData, catData, iData, setData, lData] = await Promise.all([
        sRes.json(),
        cRes.json(),
        rRes.json(),
        pRes.json(),
        catRes.json(),
        iRes.json(),
        setRes.json(),
        lRes.json(),
      ]);

      if (sData.success) setStats(sData.stats);
      if (cData.success) setCookers(cData.cookers || []);
      if (rData.success) setRiders(rData.riders || []);
      if (pData.success) setProducts(pData.products || []);
      if (catData.success) setCategories(catData.categories || []);
      if (iData.success) setIngredients(iData.ingredients || []);
      if (setData.success) setSettings(setData.settings);
      if (lData.success) setAuditLogs(lData.logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

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

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, description: newCatDesc }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCatName('');
        setNewCatDesc('');
        loadAdminData();
      }
    } catch {
      alert('Failed to create category');
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
          { id: 'COOKERS', label: `Cookers Approval (${cookers.filter((c) => c.status === 'PENDING').length} Pending)`, icon: ChefHat },
          { id: 'RIDERS', label: `Rider Fleet (${riders.length})`, icon: Bike },
          { id: 'PRODUCTS', label: `Dishes Moderation (${products.length})`, icon: UtensilsCrossed },
          { id: 'CATEGORIES', label: 'Categories CRUD', icon: FileText },
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
              <p className="text-gray-500">{stats.totalCustomers} verified food lovers registered via SMTP</p>
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
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Create New Food Category</h2>
            <form onSubmit={handleCreateCategory} className="flex gap-3">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category Name (e.g. Sourdough & Hearth)"
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
              />
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Description"
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shrink-0"
              >
                + Add Category
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
                <h4 className="font-bold text-gray-900 text-sm">{cat.name}</h4>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{cat.description}</p>
              </div>
            ))}
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
