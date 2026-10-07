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
  CustomFoodRequest,
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
  customRequests: CustomFoodRequest[];
}

// In-memory runtime state
let state: DatabaseState | null = null;
let lastLoadedMtime = 0;

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
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stats = fs.statSync(DATA_FILE);
      if (!state || stats.mtimeMs !== lastLoadedMtime) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        state = JSON.parse(raw);
        if (!state!.customRequests) state!.customRequests = [];
        lastLoadedMtime = stats.mtimeMs;
      }
      return state!;
    }
  } catch (err) {
    console.warn('Could not read existing database file, falling back to initial seed data:', err);
  }

  if (state) return state;

  // Initial seed state
  state = {
    users: [...INITIAL_USERS],
    cookers: [...INITIAL_COOKER_PROFILES],
    riders: [...INITIAL_RIDER_PROFILES],
    categories: [...INITIAL_CATEGORIES],
    tags: [...INITIAL_TAGS],
    masterIngredients: [...MASTER_INGREDIENTS],
    products: [...INITIAL_PRODUCTS],
    orders: [],
    reviews: [],
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
        details: 'Home Food Marketplace database initialized clean for fresh user testing.',
        timestamp: new Date().toISOString(),
      },
    ],
    customerProfiles: [],
    customRequests: [],
  };

  saveState();
  return state!;
}

function saveState() {
  if (!state) return;
  try {
    ensureDirectoryExistence(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    if (fs.existsSync(DATA_FILE)) {
      lastLoadedMtime = fs.statSync(DATA_FILE).mtimeMs;
    }
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
  toggleUserFreeze: (id: string) => {
    const s = loadState();
    const idx = s.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const currentFrozen = !!s.users[idx].isFrozen;
      const nextFrozen = !currentFrozen;
      s.users[idx] = {
        ...s.users[idx],
        isFrozen: nextFrozen,
        status: nextFrozen ? 'FROZEN' : 'ACTIVE',
        updatedAt: new Date().toISOString(),
      };
      saveState();
      return s.users[idx];
    }
    return null;
  },
  deleteUser: (id: string) => {
    const s = loadState();
    const user = s.users.find((u) => u.id === id);
    if (!user) return false;
    // Don't delete the platform admin
    if (user.role === 'ADMIN' && (user.email === 'silu@homelybite.com' || user.email === 'silu@homefood.local')) {
      return false;
    }
    s.users = s.users.filter((u) => u.id !== id);
    if (user.role === 'COOKER') {
      s.cookers = s.cookers.filter((c) => c.userId !== id);
    } else if (user.role === 'RIDER') {
      s.riders = s.riders.filter((r) => r.userId !== id);
    }
    saveState();
    return true;
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
  deleteCategory: (id: string) => {
    const s = loadState();
    const countBefore = s.categories.length;
    s.categories = s.categories.filter((c) => c.id !== id);
    if (s.categories.length !== countBefore) {
      saveState();
      return true;
    }
    return false;
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
  deleteProduct: (id: string) => {
    const s = loadState();
    const initialLen = s.products.length;
    s.products = s.products.filter((p) => p.id !== id);
    if (s.products.length !== initialLen) {
      saveState();
      return true;
    }
    return false;
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

  // Custom AI Food Requests
  getCustomRequests: () => loadState().customRequests || [],
  getCustomRequestById: (id: string) => (loadState().customRequests || []).find((r) => r.id === id),
  getCustomRequestsByCookerId: (cookerId: string) =>
    (loadState().customRequests || []).filter((r) => r.cookerId === cookerId || r.cookerId === 'ALL'),
  getCustomRequestsByCustomerId: (customerId: string) =>
    (loadState().customRequests || []).filter((r) => r.customerId === customerId),
  createCustomRequest: (req: CustomFoodRequest) => {
    const s = loadState();
    if (!s.customRequests) s.customRequests = [];
    s.customRequests.unshift(req);
    saveState();
    return req;
  },
  updateCustomRequest: (id: string, updates: Partial<CustomFoodRequest>) => {
    const s = loadState();
    if (!s.customRequests) s.customRequests = [];
    const idx = s.customRequests.findIndex((r) => r.id === id);
    if (idx !== -1) {
      s.customRequests[idx] = {
        ...s.customRequests[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveState();
      return s.customRequests[idx];
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
