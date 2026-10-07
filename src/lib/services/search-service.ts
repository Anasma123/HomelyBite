import { Product, CookerProfile, Category, Tag, PlatformSettings } from '../types';
import { DEFAULT_PLATFORM_SETTINGS } from '../initial-data';

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  subcategoryId?: string;
  tagIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDistanceKm?: number;
  userLat?: number;
  userLng?: number;
  dietary?: ('eggless' | 'vegan' | 'vegetarian' | 'gluten-free')[];
  nutrition?: ('low-sugar' | 'high-protein' | 'low-calorie')[];
  availableNowOnly?: boolean;
  sortBy?: 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'distance' | 'popularity';
}

export interface RankedSearchResult {
  product: Product;
  cooker: CookerProfile;
  distanceKm: number;
  relevanceScore: number;
  rankingScore: number;
  matchReasons: string[];
}

export class SearchService {
  /**
   * Calculates Haversine distance in kilometers between two GPS coordinates
   */
  public static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Parses natural language queries (e.g. "Eggless chocolate cake under 700")
   */
  public static parseNaturalLanguageQuery(rawQuery: string): {
    cleanedQuery: string;
    extractedMaxPrice?: number;
    extractedDietary: string[];
    extractedNutrition: string[];
  } {
    let query = rawQuery.toLowerCase();
    let extractedMaxPrice: number | undefined;
    const extractedDietary: string[] = [];
    const extractedNutrition: string[] = [];

    // Extract price pattern e.g. "under 700", "under ₹500", "below 1000"
    const priceMatch = query.match(/(?:under|below|less than)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (priceMatch && priceMatch[1]) {
      extractedMaxPrice = parseInt(priceMatch[1], 10);
      query = query.replace(priceMatch[0], ' ');
    }

    // Extract dietary
    if (/eggless/i.test(query)) {
      extractedDietary.push('eggless');
      query = query.replace(/\beggless\b/gi, ' ');
    }
    if (/vegan/i.test(query)) {
      extractedDietary.push('vegan');
      query = query.replace(/\bvegan\b/gi, ' ');
    }
    if (/vegetarian|veg\b/i.test(query)) {
      extractedDietary.push('vegetarian');
      query = query.replace(/\b(vegetarian|veg)\b/gi, ' ');
    }
    if (/gluten[- ]?free/i.test(query)) {
      extractedDietary.push('gluten-free');
      query = query.replace(/gluten[- ]?free/gi, ' ');
    }

    // Extract nutrition
    if (/low[- ]?sugar|sugar[- ]?free/i.test(query)) {
      extractedNutrition.push('low-sugar');
      query = query.replace(/low[- ]?sugar|sugar[- ]?free/gi, ' ');
    }
    if (/high[- ]?protein|protein[- ]?rich/i.test(query)) {
      extractedNutrition.push('high-protein');
      query = query.replace(/high[- ]?protein|protein[- ]?rich/gi, ' ');
    }
    if (/low[- ]?calorie|diet/i.test(query)) {
      extractedNutrition.push('low-calorie');
      query = query.replace(/low[- ]?calorie|diet/gi, ' ');
    }

    // Remove filler stop words
    query = query.replace(/\b(near me|best|fresh|homemade|please|find|show me)\b/gi, ' ');
    const cleanedQuery = query.trim().replace(/\s+/g, ' ');

    return {
      cleanedQuery,
      extractedMaxPrice,
      extractedDietary,
      extractedNutrition,
    };
  }

  /**
   * YouTube-style multi-signal relevance search with weighted scoring
   */
  public static searchAndRank(
    products: Product[],
    cookers: CookerProfile[],
    categories: Category[],
    tags: Tag[],
    filters: SearchFilters,
    settings: PlatformSettings = DEFAULT_PLATFORM_SETTINGS
  ): RankedSearchResult[] {
    const rawQuery = filters.query ? filters.query.trim() : '';
    const { cleanedQuery, extractedMaxPrice, extractedDietary, extractedNutrition } =
      this.parseNaturalLanguageQuery(rawQuery);

    const effectiveMaxPrice = filters.maxPrice ?? extractedMaxPrice;
    const effectiveDietary = Array.from(new Set([...(filters.dietary || []), ...extractedDietary]));
    const effectiveNutrition = Array.from(new Set([...(filters.nutrition || []), ...extractedNutrition]));

    // Default user coordinate (Kochi center) if not supplied
    const userLat = filters.userLat ?? 9.9675;
    const userLng = filters.userLng ?? 76.2995;

    const queryTokens = cleanedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    const cookerMap = new Map<string, CookerProfile>();
    cookers.forEach((c) => cookerMap.set(c.id, c));

    const categoryMap = new Map<string, Category>();
    categories.forEach((cat) => categoryMap.set(cat.id, cat));

    const tagMap = new Map<string, Tag>();
    tags.forEach((t) => tagMap.set(t.id, t));

    const results: RankedSearchResult[] = [];

    for (const product of products) {
      if (product.status !== 'APPROVED') continue;

      const cooker = cookerMap.get(product.cookerId);
      if (!cooker || cooker.status !== 'APPROVED') continue;

      // Distance calculation
      const distanceKm = this.calculateDistance(userLat, userLng, cooker.latitude, cooker.longitude);

      // Filter: Distance limit
      if (filters.maxDistanceKm && distanceKm > filters.maxDistanceKm) continue;

      // Filter: Category
      if (filters.categoryId && product.categoryId !== filters.categoryId) continue;
      if (filters.subcategoryId && product.subcategoryId !== filters.subcategoryId) continue;

      // Filter: Price
      if (filters.minPrice !== undefined && product.price < filters.minPrice) continue;
      if (effectiveMaxPrice !== undefined && product.price > effectiveMaxPrice) continue;

      // Filter: Rating
      if (filters.minRating !== undefined && product.rating < filters.minRating) continue;

      // Filter: Availability
      if (filters.availableNowOnly && (!product.isAvailable || product.stockCount <= 0)) continue;

      // Filter: Dietary
      const productTags = product.tagIds.map((id) => tagMap.get(id)?.slug || '').filter(Boolean);
      if (effectiveDietary.length > 0) {
        const matchesAllDietary = effectiveDietary.every((d) => productTags.includes(d));
        if (!matchesAllDietary) continue;
      }

      // Filter: Nutrition criteria
      if (effectiveNutrition.includes('low-sugar') && product.nutrition.per100g.sugar > 10) continue;
      if (effectiveNutrition.includes('high-protein') && product.nutrition.per100g.protein < 10) continue;
      if (effectiveNutrition.includes('low-calorie') && product.nutrition.per100g.calories > 300) continue;

      // Filter: Manual tags
      if (filters.tagIds && filters.tagIds.length > 0) {
        const hasAnyTag = filters.tagIds.some((tid) => product.tagIds.includes(tid));
        if (!hasAnyTag) continue;
      }

      // Signal 1: Text Relevance (0 - 100)
      let textMatchScore = 0;
      const matchReasons: string[] = [];

      if (queryTokens.length === 0) {
        textMatchScore = 100; // Browsing with empty search
      } else {
        const nameLower = product.name.toLowerCase();
        const descLower = product.description.toLowerCase();
        const cookerNameLower = cooker.storeName.toLowerCase();
        const categoryNameLower = (categoryMap.get(product.categoryId)?.name || '').toLowerCase();
        const ingredientNames = product.ingredients.map((i) => i.name.toLowerCase()).join(' ');

        for (const token of queryTokens) {
          if (nameLower.includes(token)) {
            textMatchScore += 45;
            matchReasons.push(`Dish name matches "${token}"`);
          } else if (cookerNameLower.includes(token)) {
            textMatchScore += 30;
            matchReasons.push(`Cooker store matches "${token}"`);
          } else if (categoryNameLower.includes(token)) {
            textMatchScore += 25;
            matchReasons.push(`Category matches "${token}"`);
          } else if (ingredientNames.includes(token)) {
            textMatchScore += 20;
            matchReasons.push(`Contains ingredient "${token}"`);
          } else if (descLower.includes(token)) {
            textMatchScore += 15;
          }
        }

        // If user searched for something and no token matched anything, discard product
        if (textMatchScore === 0) continue;
      }

      const normalizedRelevance = Math.min(100, textMatchScore);

      // Signal 2: Distance Score (0 - 100, closer is higher)
      // Max score at 0 km, decreases up to 15 km
      const distanceScore = Math.max(0, 100 - (distanceKm / 15) * 100);

      // Signal 3: Rating Score (0 - 100)
      const ratingScore = (product.rating / 5.0) * 100;

      // Signal 4: Availability Score (0 - 100)
      const availabilityScore = product.isAvailable && product.stockCount > 0 ? 100 : 30;

      // Signal 5: Popularity Score (0 - 100 based on review count and bookings)
      const popularityScore = Math.min(100, product.reviewCount * 2 + product.bookedToday * 10);

      // Signal 6: Cooker Quality Score (0 - 100)
      const cookerQualityScore = (cooker.rating / 5.0) * 80 + (cooker.status === 'APPROVED' ? 20 : 0);

      // Calculate Total Weighted Ranking
      const totalWeight =
        settings.relevanceWeight +
        settings.distanceWeight +
        settings.ratingWeight +
        settings.availabilityWeight +
        settings.popularityWeight +
        settings.cookerQualityWeight;

      const rankingScore =
        (normalizedRelevance * settings.relevanceWeight +
          distanceScore * settings.distanceWeight +
          ratingScore * settings.ratingWeight +
          availabilityScore * settings.availabilityWeight +
          popularityScore * settings.popularityWeight +
          cookerQualityScore * settings.cookerQualityWeight) /
        totalWeight;

      results.push({
        product,
        cooker,
        distanceKm,
        relevanceScore: normalizedRelevance,
        rankingScore: Math.round(rankingScore * 10) / 10,
        matchReasons,
      });
    }

    // Sort according to requested sort option or weighted ranking
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.product.rating - a.product.rating;
        case 'price_asc':
          return a.product.price - b.product.price;
        case 'price_desc':
          return b.product.price - a.product.price;
        case 'distance':
          return a.distanceKm - b.distanceKm;
        case 'popularity':
          return b.product.reviewCount - a.product.reviewCount;
        case 'relevance':
        default:
          return b.rankingScore - a.rankingScore;
      }
    });

    return results;
  }
}
