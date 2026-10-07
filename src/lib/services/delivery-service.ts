import {
  Order,
  DeliveryPersonProfile,
  CookerProfile,
  User,
  OrderStatus,
  DeliveryMode,
} from '../types';
import { SearchService } from './search-service';

export interface RiderCandidateScore {
  rider: DeliveryPersonProfile;
  riderUser?: User;
  distanceToCookerKm: number;
  estimatedPickupMinutes: number;
  workloadScore: number;
  compositeScore: number;
  reason: string;
}

export interface DeliveryAssignmentResult {
  success: boolean;
  assignedMode: DeliveryMode;
  assignedRider?: DeliveryPersonProfile;
  cookerSelfDelivery: boolean;
  message: string;
  actionRequired?: 'WAIT_AND_RETRY' | 'COOKER_SELF_DELIVERY' | 'RESCHEDULE_OR_CANCEL';
}

export class DeliveryService {
  /**
   * Calculates distance-based delivery fee in INR
   */
  public static calculateDeliveryFee(distanceKm: number, mode: DeliveryMode): number {
    if (mode === 'CUSTOMER_PICKUP') return 0;
    if (distanceKm <= 3) return 30;
    if (distanceKm <= 6) return 60;
    if (distanceKm <= 10) return 100;
    // Beyond 10km: 100 + 15 per extra km
    return Math.round(100 + (distanceKm - 10) * 15);
  }

  /**
   * Verifies if customer location is within cooker's delivery radius
   */
  public static checkDeliveryEligibility(
    cooker: CookerProfile,
    customerLat: number,
    customerLng: number,
    mode: DeliveryMode
  ): { eligible: boolean; distanceKm: number; reason?: string } {
    const distanceKm = SearchService.calculateDistance(
      cooker.latitude,
      cooker.longitude,
      customerLat,
      customerLng
    );

    if (mode === 'CUSTOMER_PICKUP') {
      if (!cooker.customerPickupEnabled) {
        return { eligible: false, distanceKm, reason: 'This home cooker does not offer customer pickup.' };
      }
      return { eligible: true, distanceKm };
    }

    if (mode === 'SELF_DELIVERY') {
      if (!cooker.selfDeliveryEnabled) {
        return { eligible: false, distanceKm, reason: 'Cooker self-delivery is not enabled for this kitchen.' };
      }
      if (distanceKm > cooker.selfDeliveryRadiusKm) {
        return {
          eligible: false,
          distanceKm,
          reason: `Location is ${distanceKm} km away. Cooker self-delivers only up to ${cooker.selfDeliveryRadiusKm} km.`,
        };
      }
      return { eligible: true, distanceKm };
    }

    // Default: PLATFORM_DELIVERY
    if (!cooker.platformDeliveryEnabled) {
      return { eligible: false, distanceKm, reason: 'Platform delivery is currently unavailable for this cooker.' };
    }
    if (distanceKm > cooker.platformDeliveryRadiusKm) {
      return {
        eligible: false,
        distanceKm,
        reason: `Delivery distance (${distanceKm} km) exceeds maximum service limit of ${cooker.platformDeliveryRadiusKm} km.`,
      };
    }

    return { eligible: true, distanceKm };
  }

  /**
   * Scores and ranks online available riders for an order ready at cooker's location
   */
  public static findAndScoreRiders(
    cooker: CookerProfile,
    riders: DeliveryPersonProfile[],
    users: User[]
  ): RiderCandidateScore[] {
    const candidates: RiderCandidateScore[] = [];

    const activeOnlineRiders = riders.filter(
      (r) => r.isActive && r.status === 'ONLINE'
    );

    for (const rider of activeOnlineRiders) {
      const distanceToCooker = SearchService.calculateDistance(
        rider.currentLatitude,
        rider.currentLongitude,
        cooker.latitude,
        cooker.longitude
      );

      // Rider must be within their own delivery radius of the cooker
      if (distanceToCooker > rider.deliveryRadiusKm) continue;

      // ETA approx: 2.5 min per km + 3 min buffer
      const estimatedPickupMinutes = Math.round(distanceToCooker * 2.5 + 3);

      // Workload score: Lower today's deliveries = higher priority to balance earnings
      const workloadScore = Math.max(0, 100 - rider.totalDeliveries * 2);

      // Proximity score (0 to 100, closer is higher)
      const proximityScore = Math.max(0, 100 - (distanceToCooker / rider.deliveryRadiusKm) * 100);

      // Rating score
      const ratingScore = (rider.rating / 5.0) * 100;

      // Composite scoring: Proximity 50%, Workload balance 25%, Rating 25%
      const compositeScore = proximityScore * 0.5 + workloadScore * 0.25 + ratingScore * 0.25;

      const user = users.find((u) => u.id === rider.userId);

      candidates.push({
        rider,
        riderUser: user,
        distanceToCookerKm: distanceToCooker,
        estimatedPickupMinutes,
        workloadScore,
        compositeScore: Math.round(compositeScore * 10) / 10,
        reason: `${distanceToCooker} km away, ETA ~${estimatedPickupMinutes}m, score: ${Math.round(compositeScore)}`,
      });
    }

    // Sort highest composite score first
    return candidates.sort((a, b) => b.compositeScore - a.compositeScore);
  }

  /**
   * Smart Delivery Assignment with Cooker Self-Delivery Fallback (Sections 29, 31, 32, 33)
   */
  public static assignDeliveryJob(
    order: Order,
    cooker: CookerProfile,
    riders: DeliveryPersonProfile[],
    users: User[]
  ): DeliveryAssignmentResult {
    // If order was already designated as customer pickup
    if (order.deliveryMode === 'CUSTOMER_PICKUP') {
      return {
        success: true,
        assignedMode: 'CUSTOMER_PICKUP',
        cookerSelfDelivery: false,
        message: 'Order is ready for customer direct pickup at the home kitchen.',
      };
    }

    // 1. Check Platform Delivery Riders
    const scoredRiders = this.findAndScoreRiders(cooker, riders, users);

    if (scoredRiders.length > 0) {
      const best = scoredRiders[0];
      return {
        success: true,
        assignedMode: 'PLATFORM_DELIVERY',
        assignedRider: best.rider,
        cookerSelfDelivery: false,
        message: `Rider assigned: ${best.riderUser?.name || 'Rider'} (${best.distanceToCookerKm} km away, pickup in ~${best.estimatedPickupMinutes} mins).`,
      };
    }

    // 2. CRITICAL FALLBACK: Check Cooker Self-Delivery
    const customerDistance = SearchService.calculateDistance(
      cooker.latitude,
      cooker.longitude,
      order.deliveryAddress.latitude,
      order.deliveryAddress.longitude
    );

    if (cooker.selfDeliveryEnabled && customerDistance <= cooker.selfDeliveryRadiusKm) {
      return {
        success: true,
        assignedMode: 'SELF_DELIVERY',
        cookerSelfDelivery: true,
        actionRequired: 'COOKER_SELF_DELIVERY',
        message: `No platform riders online nearby. Order redirected to Cooker Self-Delivery (${customerDistance} km). Cooker notified.`,
      };
    }

    // 3. Fallback: Check Product-Specific Wait Limit
    const waitLimitMinutes = order.maxWaitLimitMinutes || 45;
    const isPerishableSoon = waitLimitMinutes <= 30; // e.g. Ice cream or sensitive whipped cream

    if (isPerishableSoon) {
      return {
        success: false,
        assignedMode: 'PLATFORM_DELIVERY',
        cookerSelfDelivery: false,
        actionRequired: 'RESCHEDULE_OR_CANCEL',
        message: `No riders available and sensitive dish cannot wait beyond ${waitLimitMinutes} minutes. Please reschedule or initiate refund.`,
      };
    }

    // Dish can safely wait: Queue for retry
    return {
      success: false,
      assignedMode: 'PLATFORM_DELIVERY',
      cookerSelfDelivery: false,
      actionRequired: 'WAIT_AND_RETRY',
      message: `No riders currently available. System reattempting assignment. Product shelf wait limit: ${waitLimitMinutes} mins.`,
    };
  }
}
