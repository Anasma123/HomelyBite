'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Product, Order, CookerProfile, Category, MasterIngredient, ProductIngredientItem, CustomFoodRequest } from '@/lib/types';
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
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  Check,
} from 'lucide-react';

const PRESET_DISH_PHOTOS = [
  {
    name: 'Belgian Chocolate Cake',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    category: 'Bakery',
  },
  {
    name: 'Fresh Sourdough Bread',
    url: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&auto=format&fit=crop&q=80',
    category: 'Bakery',
  },
  {
    name: 'Butter Choco Cookies',
    url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&auto=format&fit=crop&q=80',
    category: 'Bakery',
  },
  {
    name: 'Chicken Dum Biryani',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    category: 'Meals',
  },
  {
    name: 'Malabar Fish Curry & Rice',
    url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    category: 'Curry',
  },
  {
    name: 'Artisan Thin Crust Pizza',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    category: 'Italian',
  },
  {
    name: 'Cardamom Kheer / Payasam',
    url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80',
    category: 'Dessert',
  },
  {
    name: 'Crispy Vegetable Samosas',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    category: 'Snacks',
  },
];

const compressAndReadImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 900;
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
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUrl);
    };
    reader.onerror = () => resolve('');
  });
};

export default function CookerDashboard() {
  const { currentCooker, currentUser, currentRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PRODUCTS' | 'ADD_PRODUCT' | 'SETTINGS' | 'LEDGER' | 'CUSTOM_REQUESTS'>('ORDERS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomFoodRequest[]>([]);
  const [quoteInputs, setQuoteInputs] = useState<Record<string, { price: string; prepTime: string; notes: string }>>({});
  const [actionAlert, setActionAlert] = useState<{ id: string; message: string; type: 'success' | 'warning' } | null>(null);
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

  // Dish Photos & Upload State
  const [newProdImages, setNewProdImages] = useState<string[]>([]);
  const [directImageUrl, setDirectImageUrl] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageTab, setImageTab] = useState<'UPLOAD' | 'URL' | 'PRESETS'>('UPLOAD');

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

      const [ordersRes, prodsRes, catsRes, ingsRes, reqsRes] = await Promise.all([
        fetch(`/api/orders?cookerId=${cookerId}`),
        fetch(`/api/products?cookerId=${cookerId}`),
        fetch('/api/categories'),
        fetch('/api/ingredients'),
        fetch(`/api/custom-requests?cookerId=${cookerId}`),
      ]);

      const [ordersData, prodsData, catsData, ingsData, reqsData] = await Promise.all([
        ordersRes.json(),
        prodsRes.json(),
        catsRes.json(),
        ingsRes.json(),
        reqsRes.json(),
      ]);

      if (ordersData.success) setOrders(ordersData.orders || []);
      if (prodsData.success) setProducts(prodsData.products || []);
      if (reqsData.success) setCustomRequests(reqsData.requests || []);
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

  // Custom AI Food Requests Operations
  const handleCustomRequestAction = async (requestId: string, action: string, payload: any = {}) => {
    try {
      const res = await fetch(`/api/custom-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.request?.aiDeliveryFallbackTriggered) {
          setActionAlert({
            id: requestId,
            message: data.request.aiDeliveryFallbackMessage || '⚠️ AI Delivery Fallback: No delivery riders online. Order auto-routed to Cooker Self-Delivery!',
            type: 'warning',
          });
        } else {
          setActionAlert({
            id: requestId,
            message: data.message || 'Updated successfully!',
            type: 'success',
          });
        }
        loadDashboardData();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch {
      alert('Network error updating custom request');
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

  // Dish Photo Handlers
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingImage(true);
    try {
      const fileArray = Array.from(files);
      const converted: string[] = [];
      for (const file of fileArray) {
        if (file.type.startsWith('image/')) {
          const compressed = await compressAndReadImage(file);
          if (compressed) converted.push(compressed);
        }
      }
      if (converted.length > 0) {
        setNewProdImages((prev) => [...prev, ...converted]);
      }
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Could not process image file.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleAddDirectUrl = () => {
    if (!directImageUrl.trim()) return;
    setNewProdImages((prev) => [...prev, directImageUrl.trim()]);
    setDirectImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setNewProdImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setNewProdImages((prev) => {
      const target = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [target, ...remaining];
    });
  };

  const handleAddPresetImage = (url: string) => {
    if (!newProdImages.includes(url)) {
      setNewProdImages((prev) => [...prev, url]);
    }
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
          imageUrls:
            newProdImages.length > 0
              ? newProdImages
              : ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800'],
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Product published successfully!');
        setNewProdName('');
        setNewProdPrice('');
        setNewProdDesc('');
        setNewProdImages([]);
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

  // Toggle Dish Availability (In Stock / Unavailable)
  const handleToggleProductAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isAvailable: !currentStatus } : p))
        );
      } else {
        alert(data.message || 'Failed to update availability');
      }
    } catch {
      alert('Network error updating availability');
    }
  };

  // Delete Dish from Menu
  const handleDeleteProduct = async (productId: string, productName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${productName}" from your kitchen menu?`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert(`"${productName}" has been removed from your kitchen menu.`);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        alert(data.message || 'Failed to delete dish');
      }
    } catch {
      alert('Network error deleting dish');
    }
  };

  // Financial aggregates
  const totalGrossSales = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalPlatformCommission = orders.reduce((sum, o) => sum + o.platformCommission, 0);
  const totalNetEarnings = orders.reduce((sum, o) => sum + o.netCookerEarnings, 0);

  if (!loading && (!currentUser || currentRole !== 'COOKER')) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
          <ChefHat className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Cooker Dashboard Access</h2>
        <p className="text-xs text-gray-500">
          You need an active Cooker / Home Baker account to manage kitchen orders and publish homemade dishes.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/auth/register?role=COOKER"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2.5 rounded-2xl shadow-xs transition-colors"
          >
            Register Your Home Kitchen →
          </Link>
          <Link
            href="/auth/login"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs py-2.5 rounded-2xl transition-colors"
          >
            Sign In with Existing Account
          </Link>
        </div>
      </div>
    );
  }

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
          { id: 'CUSTOM_REQUESTS', label: `AI Custom Requests (${customRequests.filter((r) => !['DELIVERED', 'REJECTED'].includes(r.status)).length})`, icon: Sparkles },
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

      {/* Tab: AI Custom Food Requests */}
      {activeTab === 'CUSTOM_REQUESTS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Custom AI Food Requests
                </h2>
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {customRequests.length} Total
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Customer-requested custom meals generated by the AI Chef matching specific body-fitness goals.
              </p>
            </div>

            <button
              onClick={loadDashboardData}
              className="self-start sm:self-auto px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCw className="w-3.5 h-3.5 text-gray-500" />
              Refresh Requests
            </button>
          </div>

          {/* Action Alert Banner */}
          {actionAlert && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                actionAlert.type === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${actionAlert.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`} />
              <div className="flex-1">
                <strong className="block font-bold">
                  {actionAlert.type === 'warning' ? 'AI Delivery Notification' : 'Success'}
                </strong>
                <p className="mt-0.5">{actionAlert.message}</p>
              </div>
              <button
                onClick={() => setActionAlert(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {customRequests.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 space-y-3">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">No Custom AI Requests Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                When customers search for body-fitness dishes or pantry recipes and request your kitchen to cook them, they will appear here for pricing quotes and cooking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {customRequests.map((req) => {
                const quote = quoteInputs[req.id] || { price: req.quotedPrice?.toString() || '320', prepTime: req.quotedPrepTimeMinutes?.toString() || '45', notes: req.cookerNotes || '' };

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-gray-500">#{req.requestNumber}</span>
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              {req.servings} Servings
                            </span>
                          </div>
                          <h3 className="font-extrabold text-base text-gray-900 mt-1">{req.dishName}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{req.dishDescription}</p>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                            req.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'COOKING'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : req.status === 'READY_FOR_DELIVERY' || req.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'QUOTE_SUBMITTED'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Customer & Address Details */}
                      <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-2xl text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase block">Customer</span>
                          <strong className="text-gray-900 block">{req.customerName}</strong>
                          <span className="text-gray-500">{req.customerPhone}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase block">Delivery Location</span>
                          <span className="text-gray-700 block font-medium">
                            {req.deliveryAddress.street}, {req.deliveryAddress.city} - {req.deliveryAddress.pincode}
                          </span>
                        </div>
                      </div>

                      {/* Target Macros */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2 bg-orange-50 rounded-xl border border-orange-100">
                          <span className="text-[10px] text-gray-400 block">Calories</span>
                          <strong className="text-gray-900">{req.macros.calories} kcal</strong>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
                          <span className="text-[10px] text-gray-400 block">Protein</span>
                          <strong className="text-purple-700">{req.macros.protein}g</strong>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                          <span className="text-[10px] text-gray-400 block">Sugar</span>
                          <strong className="text-blue-700">{req.macros.sugar}g</strong>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-gray-400 block">Carbs</span>
                          <strong className="text-emerald-700">{req.macros.carbs}g</strong>
                        </div>
                      </div>

                      {/* Ingredients List */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-orange-600" />
                          Ingredients Required ({req.ingredients.length}):
                        </span>
                        <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs divide-y divide-gray-100 max-h-36 overflow-y-auto">
                          {req.ingredients.map((ing, i) => (
                            <div key={i} className="py-1 first:pt-0 last:pb-0 flex justify-between items-center text-[11px]">
                              <span className="text-gray-700 font-medium">{ing.name}</span>
                              <span className="text-orange-700 font-bold">{ing.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Fallback Notice Alert if triggered */}
                      {req.aiDeliveryFallbackTriggered && (
                        <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>AI Delivery Fallback Alert</span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            {req.aiDeliveryFallbackMessage}
                          </p>
                          <span className="inline-block mt-1 bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Assigned Mode: Cooker Self-Delivery (100% Delivery Fee To Kitchen)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stage Transitions & Actions */}
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      {/* 1. Quote Submission Form */}
                      {req.status === 'PENDING_COOKER_QUOTE' && (
                        <div className="space-y-3 p-3.5 bg-orange-50/50 rounded-2xl border border-orange-100">
                          <span className="text-xs font-bold text-orange-950 block">
                            Submit Price Quote & Preparation Time
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-gray-500 block mb-1">
                                Quoted Price (₹)
                              </label>
                              <input
                                type="number"
                                value={quote.price}
                                onChange={(e) =>
                                  setQuoteInputs({
                                    ...quoteInputs,
                                    [req.id]: { ...quote, price: e.target.value },
                                  })
                                }
                                placeholder="e.g. 350"
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-gray-500 block mb-1">
                                Prep Time (Mins)
                              </label>
                              <input
                                type="number"
                                value={quote.prepTime}
                                onChange={(e) =>
                                  setQuoteInputs({
                                    ...quoteInputs,
                                    [req.id]: { ...quote, prepTime: e.target.value },
                                  })
                                }
                                placeholder="e.g. 45"
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCustomRequestAction(req.id, 'SUBMIT_QUOTE', {
                                quotedPrice: quote.price,
                                quotedPrepTimeMinutes: quote.prepTime,
                                cookerNotes: quote.notes,
                              })
                            }
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Accept Request & Send Price Quote (₹{quote.price})
                          </button>
                        </div>
                      )}

                      {/* 2. Waiting for Customer Confirmation / Test Action */}
                      {req.status === 'QUOTE_SUBMITTED' && (
                        <div className="space-y-2 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-950">
                              Quote Sent: ₹{req.quotedPrice} • {req.quotedPrepTimeMinutes} mins
                            </span>
                            <span className="text-[10px] text-amber-700 font-semibold">Waiting for Customer</span>
                          </div>
                          <p className="text-[11px] text-gray-600">
                            The customer has received your price quote and preparation time estimate.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCustomRequestAction(req.id, 'ACCEPT_QUOTE')}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            ⚡ Confirm Customer Approved Quote → Place Order
                          </button>
                        </div>
                      )}

                      {/* 3. Customer Accepted -> Ready to Cook */}
                      {req.status === 'ACCEPTED' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                            <span className="font-bold">Customer Confirmed & Paid: ₹{req.quotedPrice}</span>
                            <span>Ready to Prepare</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCustomRequestAction(req.id, 'START_COOKING')}
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Cooking Now
                          </button>
                        </div>
                      )}

                      {/* 4. Cooking in Progress */}
                      {req.status === 'COOKING' && (
                        <div className="space-y-2.5 p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200">
                          <div className="flex items-center justify-between text-xs text-orange-950">
                            <span className="font-bold flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-orange-600 animate-spin" /> Cooking In Progress...
                            </span>
                            <span className="font-bold text-orange-700">~{req.quotedPrepTimeMinutes} mins</span>
                          </div>
                          <div className="w-full bg-orange-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-orange-600 h-full rounded-full w-3/4 animate-pulse" />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCustomRequestAction(req.id, 'READY_FOR_DELIVERY')}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Food Ready for Delivery!
                          </button>
                        </div>
                      )}

                      {/* 5. Food Ready -> Choose Delivery Mode (Platform Rider vs Self Delivery) */}
                      {req.status === 'READY_FOR_DELIVERY' && (
                        <div className="space-y-2.5 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                          <span className="text-xs font-bold text-gray-900 block">
                            Select Delivery Method:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleCustomRequestAction(req.id, 'ASSIGN_DELIVERY', { deliveryMode: 'PLATFORM_DELIVERY' })}
                              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Truck className="w-3.5 h-3.5" /> Request Rider
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCustomRequestAction(req.id, 'ASSIGN_DELIVERY', { deliveryMode: 'SELF_DELIVERY' })}
                              className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs"
                            >
                              🚗 Cooker Self-Delivery
                            </button>
                          </div>

                          {req.deliveryMode && (
                            <button
                              type="button"
                              onClick={() => handleCustomRequestAction(req.id, 'DISPATCH')}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all mt-2 flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              🚀 Start Delivery Dispatch ({req.deliveryMode === 'SELF_DELIVERY' ? 'Cooker Hand-Delivery' : 'Rider'})
                            </button>
                          )}
                        </div>
                      )}

                      {/* 6. Out for Delivery */}
                      {req.status === 'OUT_FOR_DELIVERY' && (
                        <div className="space-y-2 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                          <div className="flex items-center justify-between text-xs text-blue-900">
                            <span className="font-bold flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-blue-600" /> Out for Delivery
                            </span>
                            <span className="font-medium text-[11px]">
                              {req.cookerSelfDelivery ? 'Cooker Direct Hand-Delivery' : 'Platform Rider'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCustomRequestAction(req.id, 'DELIVER')}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Delivery Completed (₹{req.quotedPrice} Earned)
                          </button>
                        </div>
                      )}

                      {/* 7. Completed */}
                      {req.status === 'DELIVERED' && (
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Order Delivered & ₹{req.quotedPrice} Credited to Kitchen!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Dishes in Your Kitchen Menu Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Click "+ Add New Dish" above to upload your first homemade culinary creation with photo and ingredients!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('ADD_PRODUCT')}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
              >
                + Add First Dish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const isAvailable = p.isAvailable !== false;
                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-3xl border transition-all overflow-hidden shadow-xs flex flex-col justify-between ${
                      !isAvailable ? 'border-gray-200 opacity-90' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="relative">
                        <img
                          src={p.imageUrls[0]}
                          alt={p.name}
                          className={`h-40 w-full object-cover transition-all ${
                            !isAvailable ? 'grayscale opacity-75' : ''
                          }`}
                        />
                        <div className="absolute top-2.5 left-2.5">
                          {isAvailable ? (
                            <span className="bg-emerald-600/95 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Available & In Stock
                            </span>
                          ) : (
                            <span className="bg-rose-600/95 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Currently Unavailable
                            </span>
                          )}
                        </div>
                      </div>

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

                    <div className="p-4 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Daily Capacity: {p.dailyCapacity}</span>
                        <Link href={`/product/${p.id}`} className="text-orange-600 font-semibold hover:underline">
                          View Public Page →
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleProductAvailability(p.id, isAvailable)}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                            isAvailable
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1 shrink-0"
                          title="Permanently remove dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

            {/* Dish Photographs / Image Upload Section */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                    Dish Photographs & Visuals
                    {newProdImages.length > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                        {newProdImages.length} {newProdImages.length === 1 ? 'photo' : 'photos'} attached
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Upload food photos from phone/PC, enter an image link, or select sample food presets.
                  </p>
                </div>

                {/* Photo Input Modes */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setImageTab('UPLOAD')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      imageTab === 'UPLOAD'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    📁 Upload Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('URL')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      imageTab === 'URL'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    🔗 Image Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('PRESETS')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      imageTab === 'PRESETS'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    ✨ Presets
                  </button>
                </div>
              </div>

              {/* Mode 1: File Upload & Drag-and-Drop */}
              {imageTab === 'UPLOAD' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                  className="border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer relative group"
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isProcessingImage}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {isProcessingImage
                          ? 'Compressing & Attaching Photo...'
                          : 'Click to select photo from device or drag & drop here'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Supports JPG, PNG, WEBP, Mobile Camera (auto-resized for ultra-fast loading)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 2: Direct Image URL */}
              {imageTab === 'URL' && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <label className="text-[11px] font-semibold text-gray-600 block">
                    Direct Photo URL (HTTPS)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={directImageUrl}
                        onChange={(e) => setDirectImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-gray-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDirectUrl}
                      disabled={!directImageUrl.trim()}
                      className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
                    >
                      Add Photo
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 3: Presets */}
              {imageTab === 'PRESETS' && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <p className="text-[11px] font-semibold text-gray-600">
                    Click any sample food photo to attach to this dish:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_DISH_PHOTOS.map((preset) => {
                      const isSelected = newProdImages.includes(preset.url);
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleAddPresetImage(preset.url)}
                          className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-200'
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-800'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold block truncate">{preset.name}</span>
                            <span className="text-[9px] text-gray-400 block">{preset.category}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attached Photos Preview Grid */}
              {newProdImages.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Attached Photos Preview ({newProdImages.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {newProdImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square shadow-2xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`Dish photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Cover Badge */}
                        {idx === 0 ? (
                          <div className="absolute top-1 left-1 bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                            Cover
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="absolute top-1 left-1 bg-black/60 hover:bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Cover
                          </button>
                        )}

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-xs"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
