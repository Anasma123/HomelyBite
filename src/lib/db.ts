import fs from 'fs';
import path from 'path';
import {
  User,
  CookerProfile,
  DeliveryPersonProfile,
  Category,
  Tag,
  MasterIngredient,
  Product,
  Order,
  Review,
  Coupon,
  PlatformSettings,
  AuditLog,
  CustomerProfile,
  OrderStatus,
  DeliveryMode,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_COOKER_PROFILES,
  INITIAL_RIDER_PROFILES,
  INITIAL_CATEGORIES,
  INITIAL_TAGS,
  MASTER_INGREDIENTS,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  DEFAULT_PLATFORM_SETTINGS,
} from './initial-data';

interface DatabaseState {
  users: User[];
  cookers: CookerProfile[];
  riders: DeliveryPersonProfile[];
  categories: Category[];
  tags: Tag[];
  masterIngredients: MasterIngredient[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  settings: PlatformSettings;
  auditLogs: AuditLog[];
  customerProfiles: CustomerProfile[];
}

// In-memory runtime state
let state: DatabaseState | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'marketplace-store.json');

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function loadState(): DatabaseState {
  if (state) return state;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      state = JSON.parse(raw);
      return state!;
    }
  } catch (err) {
    console.warn('Could not read existing database file, falling back to initial seed data:', err);
  }

  // Initial seed state
  state = {
    users: [...INITIAL_USERS],
    cookers: [...INITIAL_COOKER_PROFILES],
    riders: [...INITIAL_RIDER_PROFILES],
    categories: [...INITIAL_CATEGORIES],
    tags: [...INITIAL_TAGS],
    masterIngredients: [...MASTER_INGREDIENTS],
    products: [...INITIAL_PRODUCTS],
    orders: [
      {
        id: 'ord-seed-101',
        orderNumber: 'HF-2026-901',
        customerId: 'usr-cust-1',
        customerName: 'Amina Fathima',
        customerPhone: '+91 9554433221',
        cookerId: 'cook-prof-1',
        cookerStoreName: 'Anas Artisanal Home Bakery',
        cookerAddress: 'Baker Street Villa, Panampilly Nagar, Kochi',
        cookerPhone: '+91 9988776655',
        items: [
          {
            productId: 'prod-1',
            productName: 'Belgian Dark Chocolate Truffle Cake (500g)',
            productImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
            unitPrice: 650,
            quantity: 1,
            totalPrice: 650,
          },
        ],
        subtotal: 650,
        deliveryFee: 30,
        platformFee: 5,
        discountAmount: 50,
        couponCode: 'WELCOME50',
        totalAmount: 635,
        platformCommission: 65,
        netCookerEarnings: 585,
        deliveryAddress: {
          id: 'addr-1',
          label: 'Home',
          street: 'Flat 4B, Palm Grove, Panampilly Nagar',
          city: 'Kochi',
          pincode: '682036',
          latitude: 9.9680,
          longitude: 76.3010,
          isDefault: true,
        },
        deliveryMode: 'PLATFORM_DELIVERY',
        deliverySlotDate: new Date().toISOString().split('T')[0],
        deliverySlotTime: '01:00 PM - 02:00 PM',
        isPreorder: false,
        paymentMethod: 'UPI',
        paymentStatus: 'SUCCESS',
        status: 'DELIVERED',
        timeline: [
          { status: 'PENDING', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), description: 'Order placed & paid via UPI' },
          { status: 'ACCEPTED', timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(), description: 'Accepted by Anas Artisanal Home Bakery' },
          { status: 'PREPARING', timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(), description: 'Freshly baking in small batch' },
          { status: 'READY_FOR_PICKUP', timestamp: new Date(Date.now() - 3600000 * 1.0).toISOString(), description: 'Packed & ready at home kitchen' },
          { status: 'RIDER_ASSIGNED', timestamp: new Date(Date.now() - 3600000 * 0.9).toISOString(), description: 'Assigned to Arjun Das (KL-07-CD-4102)' },
          { status: 'PICKED_UP', timestamp: new Date(Date.now() - 3600000 * 0.7).toISOString(), description: 'Picked up from kitchen' },
          { status: 'OUT_FOR_DELIVERY', timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), description: 'On the way to customer' },
          { status: 'DELIVERED', timestamp: new Date(Date.now() - 3600000 * 0.2).toISOString(), description: 'Safely handed over to customer' },
        ],
        assignedRiderId: 'rider-prof-1',
        assignedRiderName: 'Arjun Das',
        assignedRiderPhone: '+91 9776655443',
        maxWaitLimitMinutes: 45,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 0.2).toISOString(),
      },
    ],
    reviews: [
      {
        id: 'rev-1',
        orderId: 'ord-seed-101',
        productId: 'prod-1',
        customerId: 'usr-cust-1',
        customerName: 'Amina Fathima',
        cookerId: 'cook-prof-1',
        productRating: 5,
        cookerRating: 5,
        deliveryRating: 5,
        tasteRating: 5,
        freshnessRating: 5,
        packagingRating: 5,
        comment: 'Absolutely heavenly! The pure dark cocoa notes and melted truffle core were exquisite. The ingredient transparency gave me so much peace of mind.',
        createdAt: new Date().toISOString(),
        isVerifiedPurchase: true,
      },
    ],
    coupons: [...INITIAL_COUPONS],
    settings: { ...DEFAULT_PLATFORM_SETTINGS },
    auditLogs: [
      {
        id: 'log-1',
        action: 'PLATFORM_INITIALIZED',
        actorId: 'usr-admin-1',
        actorEmail: 'admin@homefood.local',
        actorRole: 'ADMIN',
        targetType: 'SETTING',
        targetId: 'global',
        details: 'Home Food Marketplace database initialized with default verified cookers, products, and categories.',
        timestamp: new Date().toISOString(),
      },
    ],
    customerProfiles: [
      {
        id: 'prof-cust-1',
        userId: 'usr-cust-1',
        savedAddresses: [
          {
            id: 'addr-1',
            label: 'Home',
            street: 'Flat 4B, Palm Grove, Panampilly Nagar',
            city: 'Kochi',
            pincode: '682036',
            latitude: 9.9680,
            longitude: 76.3010,
            isDefault: true,
          },
        ],
        favouriteProductIds: ['prod-1', 'prod-2'],
        favouriteCookerIds: ['cook-prof-1'],
      },
    ],
  };

  saveState();
  return state!;
}

function saveState() {
  if (!state) return;
  try {
    ensureDirectoryExistence(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    // In serverless read-only environments (like edge / some Vercel serverless without persistent disk)
    // state continues in memory safely
    console.warn('Note: Could not persist state to file system (operating in-memory):', err);
  }
}

export const db = {
  // Users
  getUsers: () => loadState().users,
  getUserById: (id: string) => loadState().users.find((u) => u.id === id),
  getUserByEmail: (email: string) =>
    loadState().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),
  createUser: (user: User) => {
    const s = loadState();
    s.users.push(user);
    saveState();
    return user;
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const s = loadState();
    const idx = s.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      s.users[idx] = { ...s.users[idx], ...updates, updatedAt: new Date().toISOString() };
      saveState();
      return s.users[idx];
    }
    return null;
  },

  // Cookers
  getCookers: () => loadState().cookers,
  getCookerById: (id: string) => loadState().cookers.find((c) => c.id === id),
  getCookerByUserId: (userId: string) => loadState().cookers.find((c) => c.userId === userId),
  createCooker: (cooker: CookerProfile) => {
    const s = loadState();
    s.cookers.push(cooker);
    saveState();
    return cooker;
  },
  updateCooker: (id: string, updates: Partial<CookerProfile>) => {
    const s = loadState();
    const idx = s.cookers.findIndex((c) => c.id === id);
    if (idx !== -1) {
      s.cookers[idx] = { ...s.cookers[idx], ...updates };
      saveState();
      return s.cookers[idx];
    }
    return null;
  },

  // Riders
  getRiders: () => loadState().riders,
  getRiderById: (id: string) => loadState().riders.find((r) => r.id === id),
  getRiderByUserId: (userId: string) => loadState().riders.find((r) => r.userId === userId),
  createRider: (rider: DeliveryPersonProfile) => {
    const s = loadState();
    s.riders.push(rider);
    saveState();
    return rider;
  },
  updateRider: (id: string, updates: Partial<DeliveryPersonProfile>) => {
    const s = loadState();
    const idx = s.riders.findIndex((r) => r.id === id);
    if (idx !== -1) {
      s.riders[idx] = { ...s.riders[idx], ...updates };
      saveState();
      return s.riders[idx];
    }
    return null;
  },

  // Categories
  getCategories: () => loadState().categories,
  getCategoryById: (id: string) => loadState().categories.find((c) => c.id === id),
  createCategory: (cat: Category) => {
    const s = loadState();
    s.categories.push(cat);
    saveState();
    return cat;
  },
  updateCategory: (id: string, updates: Partial<Category>) => {
    const s = loadState();
    const idx = s.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      s.categories[idx] = { ...s.categories[idx], ...updates };
      saveState();
      return s.categories[idx];
    }
    return null;
  },

  // Tags
  getTags: () => loadState().tags,
  createTag: (tag: Tag) => {
    const s = loadState();
    s.tags.push(tag);
    saveState();
    return tag;
  },

  // Master Ingredients
  getMasterIngredients: () => loadState().masterIngredients,
  createMasterIngredient: (ing: MasterIngredient) => {
    const s = loadState();
    s.masterIngredients.push(ing);
    saveState();
    return ing;
  },
  updateMasterIngredient: (id: string, updates: Partial<MasterIngredient>) => {
    const s = loadState();
    const idx = s.masterIngredients.findIndex((m) => m.id === id);
    if (idx !== -1) {
      s.masterIngredients[idx] = { ...s.masterIngredients[idx], ...updates };
      saveState();
      return s.masterIngredients[idx];
    }
    return null;
  },

  // Products
  getProducts: () => loadState().products,
  getProductById: (id: string) => loadState().products.find((p) => p.id === id),
  getProductBySlug: (slug: string) => loadState().products.find((p) => p.slug === slug),
  getProductsByCookerId: (cookerId: string) =>
    loadState().products.filter((p) => p.cookerId === cookerId),
  createProduct: (product: Product) => {
    const s = loadState();
    s.products.push(product);
    saveState();
    return product;
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    const s = loadState();
    const idx = s.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      s.products[idx] = { ...s.products[idx], ...updates, updatedAt: new Date().toISOString() };
      saveState();
      return s.products[idx];
    }
    return null;
  },

  // Orders
  getOrders: () => loadState().orders,
  getOrderById: (id: string) => loadState().orders.find((o) => o.id === id),
  getOrdersByCustomerId: (customerId: string) =>
    loadState().orders.filter((o) => o.customerId === customerId),
  getOrdersByCookerId: (cookerId: string) =>
    loadState().orders.filter((o) => o.cookerId === cookerId),
  getOrdersByRiderId: (riderId: string) =>
    loadState().orders.filter((o) => o.assignedRiderId === riderId),
  createOrder: (order: Order) => {
    const s = loadState();
    s.orders.unshift(order);
    saveState();
    return order;
  },
  updateOrder: (id: string, updates: Partial<Order>) => {
    const s = loadState();
    const idx = s.orders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      s.orders[idx] = { ...s.orders[idx], ...updates, updatedAt: new Date().toISOString() };
      saveState();
      return s.orders[idx];
    }
    return null;
  },

  // Reviews
  getReviews: () => loadState().reviews,
  getReviewsByProductId: (productId: string) =>
    loadState().reviews.filter((r) => r.productId === productId && !r.isHiddenByAdmin),
  getReviewsByCookerId: (cookerId: string) =>
    loadState().reviews.filter((r) => r.cookerId === cookerId && !r.isHiddenByAdmin),
  createReview: (review: Review) => {
    const s = loadState();
    s.reviews.unshift(review);
    saveState();
    return review;
  },

  // Coupons
  getCoupons: () => loadState().coupons,
  getCouponByCode: (code: string) =>
    loadState().coupons.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive
    ),
  createCoupon: (coupon: Coupon) => {
    const s = loadState();
    s.coupons.push(coupon);
    saveState();
    return coupon;
  },

  // Platform Settings
  getSettings: () => loadState().settings,
  updateSettings: (updates: Partial<PlatformSettings>) => {
    const s = loadState();
    s.settings = { ...s.settings, ...updates };
    saveState();
    return s.settings;
  },

  // Audit Logs
  getAuditLogs: () => loadState().auditLogs,
  addAuditLog: (log: AuditLog) => {
    const s = loadState();
    s.auditLogs.unshift(log);
    saveState();
    return log;
  },

  // Customer Profiles
  getCustomerProfile: (userId: string) => {
    const s = loadState();
    let prof = s.customerProfiles.find((p) => p.userId === userId);
    if (!prof) {
      prof = {
        id: `prof-${Date.now()}`,
        userId,
        savedAddresses: [],
        favouriteProductIds: [],
        favouriteCookerIds: [],
      };
      s.customerProfiles.push(prof);
      saveState();
    }
    return prof;
  },
  updateCustomerProfile: (userId: string, updates: Partial<CustomerProfile>) => {
    const s = loadState();
    const idx = s.customerProfiles.findIndex((p) => p.userId === userId);
    if (idx !== -1) {
      s.customerProfiles[idx] = { ...s.customerProfiles[idx], ...updates };
      saveState();
      return s.customerProfiles[idx];
    }
    return null;
  },

  // Reset helper
  resetToInitialData: () => {
    state = null;
    if (fs.existsSync(DATA_FILE)) {
      try {
        fs.unlinkSync(DATA_FILE);
      } catch {}
    }
    return loadState();
  },
};
