import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
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

export interface DatabaseState {
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

function getInitialState(): DatabaseState {
  return {
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
}

// In-memory runtime state
let state: DatabaseState | null = null;
let lastLoadedMtime = 0;
let lastPgSyncTime = 0;
let isTableInitialized = false;

// Dirty collections tracker for PostgreSQL upserts
const dirtyCollections = new Set<keyof DatabaseState>();

// Detect PostgreSQL connection string (Neon / Supabase / Vercel Postgres / Railway)
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.SUPABASE_DB_URL ||
  '';

let pgPool: Pool | null = null;

function getPgPool(): Pool | null {
  if (!DATABASE_URL || DATABASE_URL.trim() === '') return null;
  if (!pgPool) {
    const isLocal = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pgPool.on('error', (err) => {
      console.warn('PostgreSQL pool client warning:', err.message);
    });
  }
  return pgPool;
}

function getLocalFilePath(): string {
  // If running in AWS Lambda / Vercel serverless where /var/task is read-only
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    const tmpFile = path.join('/tmp', 'marketplace-store.json');
    // Seed /tmp from bundled data if not present
    const bundledFile = path.join(process.cwd(), 'data', 'marketplace-store.json');
    if (!fs.existsSync(tmpFile) && fs.existsSync(bundledFile)) {
      try {
        fs.copyFileSync(bundledFile, tmpFile);
      } catch {}
    }
    return tmpFile;
  }
  return path.join(process.cwd(), 'data', 'marketplace-store.json');
}

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  ensureDirectoryExistence(dirname);
  try {
    fs.mkdirSync(dirname, { recursive: true });
  } catch {}
}

function loadLocalFileState(): DatabaseState {
  const localFile = getLocalFilePath();
  try {
    if (fs.existsSync(localFile)) {
      const stats = fs.statSync(localFile);
      if (!state || stats.mtimeMs !== lastLoadedMtime) {
        const raw = fs.readFileSync(localFile, 'utf-8');
        state = JSON.parse(raw);
        if (!state!.customRequests) state!.customRequests = [];
        lastLoadedMtime = stats.mtimeMs;
      }
      return state!;
    }
  } catch (err) {
    console.warn('Could not read local store file, falling back to seed data:', err);
  }

  if (state) return state;
  state = getInitialState();
  saveLocalFileState();
  return state!;
}

function saveLocalFileState() {
  if (!state) return;
  const localFile = getLocalFilePath();
  try {
    ensureDirectoryExistence(localFile);
    fs.writeFileSync(localFile, JSON.stringify(state, null, 2), 'utf-8');
    if (fs.existsSync(localFile)) {
      lastLoadedMtime = fs.statSync(localFile).mtimeMs;
    }
  } catch (err) {
    // In serverless environments, state continues safely
    console.warn('Notice: Could not write to filesystem (operating in-memory):', err);
  }
}

async function ensureTableExists(pool: Pool) {
  if (isTableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_store (
        collection VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    isTableInitialized = true;
  } catch (err) {
    console.error('Failed to create/verify marketplace_store table in PostgreSQL:', err);
    throw err;
  }
}

async function flushAllToPostgres(pool: Pool, targetState: DatabaseState) {
  await ensureTableExists(pool);
  const keys = Object.keys(targetState) as (keyof DatabaseState)[];
  for (const key of keys) {
    const val = targetState[key];
    await pool.query(
      `
      INSERT INTO marketplace_store (collection, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (collection)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
      `,
      [key, JSON.stringify(val)]
    );
  }
}

async function syncFromPostgres(): Promise<void> {
  const pool = getPgPool();
  if (!pool) return;

  try {
    await ensureTableExists(pool);
    const res = await pool.query('SELECT collection, data FROM marketplace_store');

    if (res.rows.length === 0) {
      console.log('PostgreSQL table is empty. Auto-seeding initial marketplace data...');
      const defaultState = getInitialState();
      state = defaultState;
      await flushAllToPostgres(pool, defaultState);
      lastPgSyncTime = Date.now();
      return;
    }

    const remoteCollections: Partial<DatabaseState> = {};
    for (const row of res.rows) {
      (remoteCollections as any)[row.collection] = row.data;
    }

    const baseState = state || getInitialState();
    state = {
      users: remoteCollections.users || baseState.users,
      cookers: remoteCollections.cookers || baseState.cookers,
      riders: remoteCollections.riders || baseState.riders,
      categories: remoteCollections.categories || baseState.categories,
      tags: remoteCollections.tags || baseState.tags,
      masterIngredients: remoteCollections.masterIngredients || baseState.masterIngredients,
      products: remoteCollections.products || baseState.products,
      orders: remoteCollections.orders || baseState.orders,
      reviews: remoteCollections.reviews || baseState.reviews,
      coupons: remoteCollections.coupons || baseState.coupons,
      settings: remoteCollections.settings || baseState.settings,
      auditLogs: remoteCollections.auditLogs || baseState.auditLogs,
      customerProfiles: remoteCollections.customerProfiles || baseState.customerProfiles,
      customRequests: remoteCollections.customRequests || baseState.customRequests || [],
    };
    lastPgSyncTime = Date.now();
  } catch (err) {
    console.error('Error synchronizing from PostgreSQL:', err);
  }
}

async function flushDirtyToPostgres(): Promise<void> {
  const pool = getPgPool();
  if (!pool || !state) return;
  if (dirtyCollections.size === 0) return;

  try {
    await ensureTableExists(pool);
    const collectionsToSave = Array.from(dirtyCollections);
    for (const coll of collectionsToSave) {
      const val = state[coll];
      await pool.query(
        `
        INSERT INTO marketplace_store (collection, data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (collection)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
        `,
        [coll, JSON.stringify(val)]
      );
      dirtyCollections.delete(coll);
    }
  } catch (err) {
    console.error('Error flushing dirty collections to PostgreSQL:', err);
  }
}

function markDirty(coll: keyof DatabaseState) {
  dirtyCollections.add(coll);
  saveLocalFileState();
  // Asynchronously trigger flush to PostgreSQL
  const pool = getPgPool();
  if (pool) {
    flushDirtyToPostgres().catch((err) => {
      console.warn('Background PostgreSQL flush failed:', err.message);
    });
  }
}

function loadState(): DatabaseState {
  if (state) return state;
  return loadLocalFileState();
}

export const db = {
  // Sync & Flush Lifecycle
  sync: async (): Promise<void> => {
    if (getPgPool()) {
      await syncFromPostgres();
    } else {
      loadLocalFileState();
    }
  },

  flush: async (): Promise<void> => {
    saveLocalFileState();
    if (getPgPool()) {
      await flushDirtyToPostgres();
    }
  },

  // Users
  getUsers: () => loadState().users,
  getUserById: (id: string) => loadState().users.find((u) => u.id === id),
  getUserByEmail: (email: string) =>
    loadState().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),
  createUser: (user: User) => {
    const s = loadState();
    s.users.push(user);
    markDirty('users');
    return user;
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const s = loadState();
    const idx = s.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      s.users[idx] = { ...s.users[idx], ...updates, updatedAt: new Date().toISOString() };
      markDirty('users');
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
      markDirty('users');
      return s.users[idx];
    }
    return null;
  },
  deleteUser: (id: string) => {
    const s = loadState();
    const user = s.users.find((u) => u.id === id);
    if (!user) return false;
    if (user.role === 'ADMIN' && (user.email === 'silu@homelybite.com' || user.email === 'silu@homefood.local')) {
      return false;
    }
    s.users = s.users.filter((u) => u.id !== id);
    markDirty('users');
    if (user.role === 'COOKER') {
      s.cookers = s.cookers.filter((c) => c.userId !== id);
      markDirty('cookers');
    } else if (user.role === 'RIDER') {
      s.riders = s.riders.filter((r) => r.userId !== id);
      markDirty('riders');
    }
    return true;
  },

  // Cookers
  getCookers: () => loadState().cookers,
  getCookerById: (id: string) => loadState().cookers.find((c) => c.id === id),
  getCookerByUserId: (userId: string) => loadState().cookers.find((c) => c.userId === userId),
  createCooker: (cooker: CookerProfile) => {
    const s = loadState();
    s.cookers.push(cooker);
    markDirty('cookers');
    return cooker;
  },
  updateCooker: (id: string, updates: Partial<CookerProfile>) => {
    const s = loadState();
    const idx = s.cookers.findIndex((c) => c.id === id);
    if (idx !== -1) {
      s.cookers[idx] = { ...s.cookers[idx], ...updates };
      markDirty('cookers');
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
    markDirty('riders');
    return rider;
  },
  updateRider: (id: string, updates: Partial<DeliveryPersonProfile>) => {
    const s = loadState();
    const idx = s.riders.findIndex((r) => r.id === id);
    if (idx !== -1) {
      s.riders[idx] = { ...s.riders[idx], ...updates };
      markDirty('riders');
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
    markDirty('categories');
    return cat;
  },
  updateCategory: (id: string, updates: Partial<Category>) => {
    const s = loadState();
    const idx = s.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      s.categories[idx] = { ...s.categories[idx], ...updates };
      markDirty('categories');
      return s.categories[idx];
    }
    return null;
  },
  deleteCategory: (id: string) => {
    const s = loadState();
    const countBefore = s.categories.length;
    s.categories = s.categories.filter((c) => c.id !== id);
    if (s.categories.length !== countBefore) {
      markDirty('categories');
      return true;
    }
    return false;
  },

  // Tags
  getTags: () => loadState().tags,
  createTag: (tag: Tag) => {
    const s = loadState();
    s.tags.push(tag);
    markDirty('tags');
    return tag;
  },

  // Master Ingredients
  getMasterIngredients: () => loadState().masterIngredients,
  createMasterIngredient: (ing: MasterIngredient) => {
    const s = loadState();
    s.masterIngredients.push(ing);
    markDirty('masterIngredients');
    return ing;
  },
  updateMasterIngredient: (id: string, updates: Partial<MasterIngredient>) => {
    const s = loadState();
    const idx = s.masterIngredients.findIndex((m) => m.id === id);
    if (idx !== -1) {
      s.masterIngredients[idx] = { ...s.masterIngredients[idx], ...updates };
      markDirty('masterIngredients');
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
    markDirty('products');
    return product;
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    const s = loadState();
    const idx = s.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      s.products[idx] = { ...s.products[idx], ...updates, updatedAt: new Date().toISOString() };
      markDirty('products');
      return s.products[idx];
    }
    return null;
  },
  deleteProduct: (id: string) => {
    const s = loadState();
    const initialLen = s.products.length;
    s.products = s.products.filter((p) => p.id !== id);
    if (s.products.length !== initialLen) {
      markDirty('products');
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
    markDirty('orders');
    return order;
  },
  updateOrder: (id: string, updates: Partial<Order>) => {
    const s = loadState();
    const idx = s.orders.findIndex((o) => o.id === id);
    if (idx !== -1) {
      s.orders[idx] = { ...s.orders[idx], ...updates, updatedAt: new Date().toISOString() };
      markDirty('orders');
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
    markDirty('reviews');
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
    markDirty('coupons');
    return coupon;
  },

  // Platform Settings
  getSettings: () => loadState().settings,
  updateSettings: (updates: Partial<PlatformSettings>) => {
    const s = loadState();
    s.settings = { ...s.settings, ...updates };
    markDirty('settings');
    return s.settings;
  },

  // Audit Logs
  getAuditLogs: () => loadState().auditLogs,
  addAuditLog: (log: AuditLog) => {
    const s = loadState();
    s.auditLogs.unshift(log);
    markDirty('auditLogs');
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
      markDirty('customerProfiles');
    }
    return prof;
  },
  updateCustomerProfile: (userId: string, updates: Partial<CustomerProfile>) => {
    const s = loadState();
    const idx = s.customerProfiles.findIndex((p) => p.userId === userId);
    if (idx !== -1) {
      s.customerProfiles[idx] = { ...s.customerProfiles[idx], ...updates };
      markDirty('customerProfiles');
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
    markDirty('customRequests');
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
      markDirty('customRequests');
      return s.customRequests[idx];
    }
    return null;
  },

  // Reset helper
  resetToInitialData: async () => {
    state = null;
    const localFile = getLocalFilePath();
    if (fs.existsSync(localFile)) {
      try {
        fs.unlinkSync(localFile);
      } catch {}
    }
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM marketplace_store');
      } catch {}
    }
    const fresh = getInitialState();
    state = fresh;
    if (pool) {
      await flushAllToPostgres(pool, fresh);
    } else {
      saveLocalFileState();
    }
    return fresh;
  },
};
