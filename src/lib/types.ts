export type UserRole = 'CUSTOMER' | 'COOKER' | 'RIDER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  savedAddresses: Address[];
  favouriteProductIds: string[];
  favouriteCookerIds: string[];
}

export interface Address {
  id: string;
  label: string; // e.g. "Home", "Office"
  street: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export type CookerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface CookerProfile {
  id: string;
  userId: string;
  storeName: string;
  bio: string;
  logoUrl: string;
  coverImageUrl: string;
  status: CookerApprovalStatus;
  rating: number;
  totalReviews: number;
  totalOrders: number;
  fssaiLicenseNumber?: string;
  address: string;
  latitude: number;
  longitude: number;
  // Delivery configuration
  platformDeliveryEnabled: boolean;
  selfDeliveryEnabled: boolean;
  customerPickupEnabled: boolean;
  selfDeliveryRadiusKm: number; // e.g. 5 km
  platformDeliveryRadiusKm: number; // e.g. 10 km
  minimumOrderValue: number;
  averagePrepTimeMinutes: number;
  maxDailyCapacity: number;
  isOpenToday: boolean;
  openingHours: string; // e.g. "09:00 AM - 08:00 PM"
}

export type RiderStatus = 'OFFLINE' | 'ONLINE' | 'BUSY';

export interface DeliveryPersonProfile {
  id: string;
  userId: string;
  vehicleType: 'BIKE' | 'SCOOTER' | 'CYCLE' | 'EV';
  vehicleNumber: string;
  currentLatitude: number;
  currentLongitude: number;
  status: RiderStatus;
  isActive: boolean;
  deliveryRadiusKm: number;
  rating: number;
  totalDeliveries: number;
  todayEarnings: number;
  totalEarnings: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  isDietary?: boolean;
}

export interface MasterIngredient {
  id: string;
  name: string;
  standardUnit: 'g' | 'ml' | 'piece';
  caloriesPer100: number; // kcal
  proteinPer100: number; // g
  carbsPer100: number; // g
  fatPer100: number; // g
  saturatedFatPer100?: number; // g
  sugarPer100: number; // g
  fiberPer100: number; // g
  sodiumPer100?: number; // mg
  allergens: string[]; // e.g. ['Gluten', 'Wheat', 'Milk']
}

export interface ProductIngredientItem {
  id: string;
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'litre' | 'mg' | 'pieces' | 'tsp' | 'tbsp';
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat?: number;
  sugar: number;
  fiber: number;
  sodium?: number;
}

export interface ProductNutritionProfile {
  total: NutritionData;
  per100g: NutritionData;
  perServing: NutritionData;
  servingWeightGrams: number;
  servingsPerPackage: number;
}

export interface AINutritionAnalysis {
  summary: string;
  healthGrade: 'A' | 'B' | 'C' | 'D';
  sugarLevel: 'Low' | 'Moderate' | 'High';
  calorieDensity: 'Low' | 'Moderate' | 'High';
  keyBenefits: string[];
  dietaryCautions: string[];
  disclaimer: string;
  suggestedAlternatives?: string;
}

export type ProductStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Product {
  id: string;
  cookerId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  tagIds: string[];
  price: number;
  imageUrls: string[];
  netWeightGrams: number;
  servingSizeGrams: number;
  servingsCount: number;
  prepTimeMinutes: number;
  maxWaitLimitMinutes: number; // Product-specific wait limit before spoiling (e.g. 30 min for ice cream, 240 for dry cake)
  isAvailable: boolean;
  stockCount: number;
  dailyCapacity: number;
  bookedToday: number;
  supportsPreorder: boolean;
  status: ProductStatus;
  ingredients: ProductIngredientItem[];
  detectedAllergens: string[];
  nutrition: ProductNutritionProfile;
  aiAnalysis?: AINutritionAnalysis;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  cookerId: string;
  cookerStoreName: string;
}

export type DeliveryMode = 'PLATFORM_DELIVERY' | 'SELF_DELIVERY' | 'CUSTOMER_PICKUP';

export type PaymentMethod = 'UPI' | 'CARD' | 'COD';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
  actor?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  cookerId: string;
  cookerStoreName: string;
  cookerAddress: string;
  cookerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  platformCommission: number;
  netCookerEarnings: number;
  deliveryAddress: Address;
  deliveryMode: DeliveryMode;
  deliverySlotDate: string; // "YYYY-MM-DD"
  deliverySlotTime: string; // e.g. "12:00 PM - 01:00 PM"
  isPreorder: boolean;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  assignedRiderId?: string;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  specialInstructions?: string;
  maxWaitLimitMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  customerId: string;
  customerName: string;
  cookerId: string;
  productRating: number;
  cookerRating: number;
  deliveryRating?: number;
  tasteRating?: number;
  freshnessRating?: number;
  packagingRating?: number;
  comment: string;
  imageUrls?: string[];
  createdAt: string;
  isVerifiedPurchase: boolean;
  isHiddenByAdmin?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
  description: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  targetType: 'PRODUCT' | 'COOKER' | 'RIDER' | 'ORDER' | 'SETTING' | 'COUPON';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface PlatformSettings {
  commissionRatePercent: number; // e.g. 10%
  baseDeliveryFee: number; // e.g. 30
  deliveryFeePerKm: number; // e.g. 10
  platformFee: number; // e.g. 5
  relevanceWeight: number; // 40
  distanceWeight: number; // 20
  ratingWeight: number; // 15
  availabilityWeight: number; // 10
  popularityWeight: number; // 10
  cookerQualityWeight: number; // 5
  otpExpiryMinutes: number; // 5
  otpCooldownSeconds: number; // 60
}

export interface OTPRecord {
  email: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  isUsed: boolean;
}
