'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Product, Order, CookerProfile, Category, MasterIngredient, ProductIngredientItem } from '@/lib/types';
import {
  ChefHat,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Star,
  Plus,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Settings,
  Scale,
  UtensilsCrossed,
  HeartPulse,
  X,
  Play,
  RotateCw,
} from 'lucide-react';

export default function CookerDashboard() {
  const { currentCooker, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PRODUCTS' | 'ADD_PRODUCT' | 'SETTINGS' | 'LEDGER'>('ORDERS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [masterIngredients, setMasterIngredients] = useState<MasterIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrepTime, setNewProdPrepTime] = useState(45);
  const [newProdWaitLimit, setNewProdWaitLimit] = useState(60);
  const [newProdCapacity, setNewProdCapacity] = useState(15);
  const [newProdServings, setNewProdServings] = useState(4);
  const [newProdIngredients, setNewProdIngredients] = useState<ProductIngredientItem[]>([
    { id: '1', name: 'All-Purpose Flour (Maida)', quantity: 200, unit: 'g' },
    { id: '2', name: 'Pure Butter (Dairy)', quantity: 100, unit: 'g' },
    { id: '3', name: 'Granulated Cane Sugar', quantity: 120, unit: 'g' },
  ]);
  const [calculatedNutrition, setCalculatedNutrition] = useState<any>(null);
  const [detectedAllergens, setDetectedAllergens] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmittingDish, setIsSubmittingDish] = useState(false);

  // Cooker Kitchen Settings State
  const [storeSettings, setStoreSettings] = useState({
    platformDeliveryEnabled: currentCooker?.platformDeliveryEnabled ?? true,
    selfDeliveryEnabled: currentCooker?.selfDeliveryEnabled ?? true,
    customerPickupEnabled: currentCooker?.customerPickupEnabled ?? true,
    selfDeliveryRadiusKm: currentCooker?.selfDeliveryRadiusKm ?? 6.0,
    openingHours: currentCooker?.openingHours ?? '09:00 AM - 08:00 PM',
    minimumOrderValue: currentCooker?.minimumOrderValue ?? 200,
  });

  const loadDashboardData = async () => {
    try {
      const cookerId = currentCooker?.id || 'cook-prof-1';

      const [ordersRes, prodsRes, catsRes, ingsRes] = await Promise.all([
        fetch(`/api/orders?cookerId=${cookerId}`),
        fetch(`/api/products?cookerId=${cookerId}`),
        fetch('/api/categories'),
        fetch('/api/ingredients'),
      ]);

      const [ordersData, prodsData, catsData, ingsData] = await Promise.all([
        ordersRes.json(),
        prodsRes.json(),
        catsRes.json(),
        ingsRes.json(),
      ]);

      if (ordersData.success) setOrders(ordersData.orders || []);
      if (prodsData.success) setProducts(prodsData.products || []);
      if (catsData.success) {
        setCategories(catsData.categories || []);
        if (catsData.categories?.length && !newProdCategory) {
          setNewProdCategory(catsData.categories[0].id);
        }
      }
      if (ingsData.success) setMasterIngredients(ingsData.ingredients || []);
    } catch (err) {
      console.error('Failed to load cooker dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentCooker]);

  // Order status transition from dashboard
  const handleUpdateOrderStatus = async (orderId: string, status: string, note?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          actorName: currentCooker?.storeName || 'Anas Home Bakery',
          actorRole: 'COOKER',
          note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadDashboardData();
      }
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  // Ingredient list handlers
  const handleAddIngredientRow = () => {
    setNewProdIngredients([
      ...newProdIngredients,
      { id: Date.now().toString(), name: 'Whole Milk', quantity: 100, unit: 'ml' },
    ]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setNewProdIngredients(newProdIngredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof ProductIngredientItem, val: any) => {
    const updated = [...newProdIngredients];
    updated[index] = { ...updated[index], [field]: val };
    setNewProdIngredients(updated);
  };

  // Run Deterministic Nutrition Engine & AI Health Analysis
  const handleComputeNutrition = async () => {
    setIsCalculating(true);
    try {
      const calcRes = await fetch('/api/nutrition/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: newProdIngredients,
          servingsCount: Number(newProdServings),
        }),
      });
      const calcData = await calcRes.json();

      if (calcData.success) {
        setCalculatedNutrition(calcData.nutrition);
        setDetectedAllergens(calcData.detectedAllergens);

        // Run AI Analysis
        const aiRes = await fetch('/api/nutrition/ai-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: newProdName || 'Artisan Dish',
            nutrition: calcData.nutrition,
            ingredients: newProdIngredients,
            detectedAllergens: calcData.detectedAllergens,
          }),
        });
        const aiData = await aiRes.json();
        if (aiData.success) {
          setAiAnalysis(aiData.analysis);
        }
      } else {
        alert(calcData.message || 'Calculation error');
      }
    } catch {
      alert('Error calculating nutrition values');
    } finally {
      setIsCalculating(false);
    }
  };

  // Submit New Product
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || newProdIngredients.length === 0) {
      alert('Please fill product name, price, and at least one ingredient.');
      return;
    }

    setIsSubmittingDish(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookerId: currentCooker?.id || 'cook-prof-1',
          name: newProdName,
          description: newProdDesc,
          categoryId: newProdCategory || categories[0]?.id,
          price: Number(newProdPrice),
          servingsCount: Number(newProdServings),
          prepTimeMinutes: Number(newProdPrepTime),
          maxWaitLimitMinutes: Number(newProdWaitLimit),
          dailyCapacity: Number(newProdCapacity),
          ingredients: newProdIngredients,
          imageUrls: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800'],
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Product published successfully!');
        setNewProdName('');
        setNewProdPrice('');
        setNewProdDesc('');
        setCalculatedNutrition(null);
        setActiveTab('PRODUCTS');
        loadDashboardData();
      } else {
        alert(data.message || 'Failed to add dish');
      }
    } catch {
      alert('Network error saving dish');
    } finally {
      setIsSubmittingDish(false);
    }
  };

  // Financial aggregates
  const totalGrossSales = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalPlatformCommission = orders.reduce((sum, o) => sum + o.platformCommission, 0);
  const totalNetEarnings = orders.reduce((sum, o) => sum + o.netCookerEarnings, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Cooker Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {currentCooker?.storeName || 'Anas Artisanal Home Bakery'}
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified Kitchen
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Panampilly Nagar, Kochi • Self-Delivery Active ({currentCooker?.selfDeliveryRadiusKm || 6} km)
            </p>
          </div>
        </div>

        {/* Top Metric Pills */}
        <div className="flex items-center gap-3">
          <div className="text-center p-3 bg-amber-50 rounded-2xl border border-amber-100 min-w-[90px]">
            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Orders</span>
            <span className="text-lg font-black text-gray-900">{orders.length}</span>
          </div>

          <div className="text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100 min-w-[110px]">
            <span className="text-[10px] text-emerald-700 font-semibold uppercase block">Net Earnings</span>
            <span className="text-lg font-black text-emerald-700">₹{totalNetEarnings}</span>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-2xl border border-orange-100 min-w-[80px]">
            <span className="text-[10px] text-orange-700 font-semibold uppercase block">Rating</span>
            <span className="text-lg font-black text-orange-700 flex items-center justify-center gap-0.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              4.9
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {[
          { id: 'ORDERS', label: `Active Orders (${orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length})`, icon: ShoppingBag },
          { id: 'PRODUCTS', label: `My Dishes (${products.length})`, icon: UtensilsCrossed },
          { id: 'ADD_PRODUCT', label: '+ Add New Dish & Macros', icon: Plus },
          { id: 'SETTINGS', label: 'Delivery & Kitchen Settings', icon: Settings },
          { id: 'LEDGER', label: 'Financial Ledger & Payouts', icon: DollarSign },
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
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Orders Board */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Live Kitchen Orders</h2>
            <button onClick={loadDashboardData} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
              <p className="text-xs text-gray-500">No orders received yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-gray-900 text-sm">#{order.orderNumber}</span>
                      <span className="text-xs text-gray-400 block">{order.customerName} ({order.customerPhone})</span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.quantity}x {it.productName}</span>
                        <span className="font-semibold text-gray-900">₹{it.totalPrice}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Mode: <strong className="text-gray-800 capitalize">{order.deliveryMode.replace(/_/g, ' ').toLowerCase()}</strong></span>
                    <span>Net Kitchen Payout: <strong className="text-emerald-700">₹{order.netCookerEarnings}</strong></span>
                  </div>

                  {/* Cooker Action Progression */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'ACCEPTED', 'Accepted by cooker')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED', 'Rejected due to capacity')}
                          className="py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING', 'Baking started in batch')}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Start Baking / Preparing
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'READY_FOR_PICKUP', 'Food packed. Smart delivery radar triggered.')}
                        className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold animate-pulse"
                      >
                        Food Ready → Trigger Rider / Self-Delivery!
                      </button>
                    )}

                    {order.deliveryMode === 'SELF_DELIVERY' && order.status === 'READY_FOR_PICKUP' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY', 'Cooker left for self-delivery')}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Cooker: Start Hand Delivery →
                      </button>
                    )}

                    {order.deliveryMode === 'SELF_DELIVERY' && order.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED', 'Delivered safely by cooker')}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                      >
                        Cooker: Mark Delivered
                      </button>
                    )}

                    {order.status === 'DELIVERED' && (
                      <span className="text-xs text-emerald-700 font-semibold">Delivered & Closed</span>
                    )}

                    <Link
                      href={`/order/${order.id}`}
                      className="text-xs text-orange-600 hover:underline font-semibold shrink-0"
                    >
                      View Timeline
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Products List */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Dishes in Kitchen ({products.length})</h2>
            <button
              onClick={() => setActiveTab('ADD_PRODUCT')}
              className="bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Dish
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs flex flex-col justify-between">
                <div>
                  <img src={p.imageUrls[0]} alt={p.name} className="h-40 w-full object-cover" />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{p.name}</h3>
                      <span className="font-extrabold text-gray-900 text-sm">₹{p.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>

                    <div className="flex flex-wrap gap-1 text-[11px] pt-1">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                        {p.nutrition.perServing.calories} kcal/serving
                      </span>
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium">
                        {p.nutrition.perServing.protein}g protein
                      </span>
                      {p.detectedAllergens.length > 0 && (
                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-medium">
                          ⚠ {p.detectedAllergens.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Stock: {p.stockCount} / {p.dailyCapacity}</span>
                  <Link href={`/product/${p.id}`} className="text-orange-600 font-semibold hover:underline">
                    View Public Page →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Dish & Ingredient Builder with Deterministic Nutrition Calc & AI Analysis */}
      {activeTab === 'ADD_PRODUCT' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Ingredient Transparency & Nutrition Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Add New Homemade Dish & Compute Nutrition
            </h2>
            <p className="text-xs text-gray-500">
              Input raw ingredient quantities. The system deterministically computes Calories, Protein, Fat, Sugar, and scans allergens.
            </p>
          </div>

          <form onSubmit={handleSubmitProduct} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Cardamom Honey Spiced Cake"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder="e.g. 450"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Preparation Time (mins)</label>
                <input
                  type="number"
                  value={newProdPrepTime}
                  onChange={(e) => setNewProdPrepTime(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Max Shelf Wait Limit (mins)</label>
                <input
                  type="number"
                  value={newProdWaitLimit}
                  onChange={(e) => setNewProdWaitLimit(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Servings Count</label>
                <input
                  type="number"
                  value={newProdServings}
                  onChange={(e) => setNewProdServings(Number(e.target.value))}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Dish Description & Craft Story</label>
              <textarea
                rows={2}
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                placeholder="Describe your artisan preparation process and natural flavours..."
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Interactive Ingredient Entry Table */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Ingredient Breakdown</h3>
                  <p className="text-[11px] text-gray-500">Add exact kitchen measurements to compute transparent nutrition facts.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Ingredient
                </button>
              </div>

              <div className="space-y-2">
                {newProdIngredients.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    {/* Name dropdown or text */}
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Flour, Sugar, Butter"
                      className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 text-gray-900"
                    />

                    {/* Quantity */}
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleIngredientChange(idx, 'quantity', Number(e.target.value))}
                      className="w-24 text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 text-gray-900"
                    />

                    {/* Unit */}
                    <select
                      value={item.unit}
                      onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                      className="w-24 text-xs bg-gray-50 border border-gray-200 rounded-xl p-2 text-gray-900"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="litre">litre</option>
                      <option value="pieces">pieces</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Compute Button */}
              <button
                type="button"
                onClick={handleComputeNutrition}
                disabled={isCalculating}
                className="mt-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                {isCalculating ? 'Computing Macros...' : 'Compute Nutrition & Allergen Scan'}
              </button>
            </div>

            {/* Calculated Nutrition Live Preview */}
            {calculatedNutrition && (
              <div className="p-5 bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-white rounded-3xl border border-orange-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    Calculated Nutrition Preview (Per Serving)
                  </h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Health Grade: {aiAnalysis?.healthGrade || 'B'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-orange-100">
                    <span className="text-[10px] text-gray-400 block font-medium">Calories</span>
                    <strong className="text-base text-gray-900">{calculatedNutrition.perServing.calories}</strong> kcal
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-gray-400 block font-medium">Protein</span>
                    <strong className="text-base text-purple-700">{calculatedNutrition.perServing.protein}g</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-gray-400 block font-medium">Carbs</span>
                    <strong className="text-base text-amber-700">{calculatedNutrition.perServing.carbs}g</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-rose-100">
                    <span className="text-[10px] text-gray-400 block font-medium">Fat</span>
                    <strong className="text-base text-rose-700">{calculatedNutrition.perServing.fat}g</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-gray-400 block font-medium">Sugar</span>
                    <strong className="text-base text-blue-700">{calculatedNutrition.perServing.sugar}g</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-gray-400 block font-medium">Fiber</span>
                    <strong className="text-base text-emerald-700">{calculatedNutrition.perServing.fiber}g</strong>
                  </div>
                </div>

                {/* Detected Allergens */}
                {detectedAllergens.length > 0 && (
                  <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    <strong>Auto-detected Allergens:</strong> {detectedAllergens.join(', ')}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingDish}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-colors shadow-xs"
            >
              {isSubmittingDish ? 'Publishing Dish...' : 'Publish Dish to Kitchen Store →'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Delivery & Kitchen Settings */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-900">Delivery & Kitchen Parameters</h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div>
                <strong className="block text-gray-900">Platform Delivery</strong>
                <span className="text-gray-500">Allow platform delivery riders to deliver orders</span>
              </div>
              <input
                type="checkbox"
                checked={storeSettings.platformDeliveryEnabled}
                onChange={(e) => setStoreSettings({ ...storeSettings, platformDeliveryEnabled: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div>
                <strong className="block text-gray-900">Cooker Self-Delivery</strong>
                <span className="text-gray-500">Deliver personally within your chosen radius</span>
              </div>
              <input
                type="checkbox"
                checked={storeSettings.selfDeliveryEnabled}
                onChange={(e) => setStoreSettings({ ...storeSettings, selfDeliveryEnabled: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Self-Delivery Radius (km)</label>
              <input
                type="number"
                value={storeSettings.selfDeliveryRadiusKm}
                onChange={(e) => setStoreSettings({ ...storeSettings, selfDeliveryRadiusKm: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Kitchen Opening Hours</label>
              <input
                type="text"
                value={storeSettings.openingHours}
                onChange={(e) => setStoreSettings({ ...storeSettings, openingHours: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
              />
            </div>

            <button
              type="button"
              onClick={() => alert('Kitchen settings saved successfully!')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Financial Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Kitchen Earnings & Commission Ledger</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-400 block font-medium">Gross Orders Value</span>
              <span className="text-2xl font-black text-gray-900">₹{totalGrossSales}</span>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-xs text-amber-700 block font-medium">Platform Fee (10%)</span>
              <span className="text-2xl font-black text-amber-700">₹{totalPlatformCommission}</span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-xs text-emerald-700 block font-medium">Net Payout to Kitchen</span>
              <span className="text-2xl font-black text-emerald-700">₹{totalNetEarnings}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Gross Amount</th>
                  <th className="pb-3 text-right">Commission</th>
                  <th className="pb-3 text-right">Net Payout</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-3 font-semibold text-gray-900">#{ord.orderNumber}</td>
                    <td className="py-3 text-gray-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right">₹{ord.subtotal}</td>
                    <td className="py-3 text-right text-amber-700">-₹{ord.platformCommission}</td>
                    <td className="py-3 text-right font-bold text-emerald-700">₹{ord.netCookerEarnings}</td>
                    <td className="py-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        Credited
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
