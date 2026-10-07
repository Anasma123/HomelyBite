'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, DeliveryMode, Coupon } from '../types';

interface CartContextType {
  items: CartItem[];
  cookerId: string | null;
  cookerStoreName: string | null;
  addToCart: (product: Product, quantity?: number, cookerStoreName?: string) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryMode: DeliveryMode;
  setDeliveryMode: (mode: DeliveryMode) => void;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  finalTotal: number;
  deliveryFee: number;
  platformFee: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cookerId, setCookerId] = useState<string | null>(null);
  const [cookerStoreName, setCookerStoreName] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('PLATFORM_DELIVERY');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hf_cart_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setCookerId(parsed[0].cookerId);
          setCookerStoreName(parsed[0].cookerStoreName);
        }
      }
    } catch {}
  }, []);

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem('hf_cart_items', JSON.stringify(items));
    } catch {}
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1, storeName?: string) => {
    if (items.length > 0 && cookerId && cookerId !== product.cookerId) {
      return {
        success: false,
        message: `Your cart contains items from "${cookerStoreName}". Homemade food orders must be from the same kitchen. Please clear cart first or complete existing order.`,
      };
    }

    const existingIndex = items.findIndex((i) => i.productId === product.id);
    let newItems = [...items];

    if (existingIndex > -1) {
      newItems[existingIndex].quantity += quantity;
    } else {
      newItems.push({
        productId: product.id,
        product,
        quantity,
        cookerId: product.cookerId,
        cookerStoreName: storeName || 'Artisan Home Cook',
      });
    }

    setItems(newItems);
    setCookerId(product.cookerId);
    setCookerStoreName(storeName || cookerStoreName || 'Artisan Home Cook');

    return { success: true, message: `Added ${product.name} to cart!` };
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newItems = items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setItems(newItems);
  };

  const removeFromCart = (productId: string) => {
    const newItems = items.filter((item) => item.productId !== productId);
    setItems(newItems);
    if (newItems.length === 0) {
      setCookerId(null);
      setCookerStoreName(null);
      setAppliedCoupon(null);
      setDiscountAmount(0);
    }
  };

  const clearCart = () => {
    setItems([]);
    setCookerId(null);
    setCookerStoreName(null);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    try {
      localStorage.removeItem('hf_cart_items');
    } catch {}
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Delivery fee baseline
  const deliveryFee = deliveryMode === 'CUSTOMER_PICKUP' ? 0 : 30;
  const platformFee = items.length > 0 ? 5 : 0;

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount: subtotal }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
        setDiscountAmount(data.discountAmount);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Invalid coupon' };
      }
    } catch {
      return { success: false, message: 'Failed to apply coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const finalTotal = Math.max(0, subtotal + deliveryFee + platformFee - discountAmount);

  return (
    <CartContext.Provider
      value={{
        items,
        cookerId,
        cookerStoreName,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        deliveryMode,
        setDeliveryMode,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
        finalTotal,
        deliveryFee,
        platformFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
