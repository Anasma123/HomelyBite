import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DeliveryService } from '@/lib/services/delivery-service';
import { Order, OrderItem, Address, DeliveryMode, PaymentMethod } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerPhone,
      items = [], // Array of { productId, quantity }
      deliveryAddress, // Address object
      deliveryMode = 'PLATFORM_DELIVERY',
      deliverySlotDate,
      deliverySlotTime,
      isPreorder = false,
      couponCode,
      paymentMethod = 'UPI',
      specialInstructions,
    } = body;

    await db.sync();

    if (!customerId || !items.length) {
      return NextResponse.json(
        { success: false, message: 'Missing required order fields: items or customer information.' },
        { status: 400 }
      );
    }

    if (deliveryMode !== 'CUSTOMER_PICKUP' && (!deliveryAddress || !deliveryAddress.street)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid delivery street address.' },
        { status: 400 }
      );
    }

    // 1. Server-side product price & availability verification
    const orderItems: OrderItem[] = [];
    let serverSubtotal = 0;
    let cookerId: string | null = null;
    let maxWaitLimitMinutes = 60;

    for (const item of items) {
      const dbProduct = db.getProductById(item.productId);
      if (!dbProduct) {
        return NextResponse.json(
          { success: false, message: `Product with ID ${item.productId} is no longer available.` },
          { status: 400 }
        );
      }

      if (!dbProduct.isAvailable || dbProduct.stockCount < item.quantity) {
        return NextResponse.json(
          { success: false, message: `"${dbProduct.name}" does not have enough stock available.` },
          { status: 400 }
        );
      }

      if (!cookerId) {
        cookerId = dbProduct.cookerId;
      } else if (cookerId !== dbProduct.cookerId) {
        return NextResponse.json(
          { success: false, message: 'Cart items must be from the same home cooker for a single delivery order.' },
          { status: 400 }
        );
      }

      const itemTotal = dbProduct.price * item.quantity;
      serverSubtotal += itemTotal;
      if (dbProduct.maxWaitLimitMinutes < maxWaitLimitMinutes) {
        maxWaitLimitMinutes = dbProduct.maxWaitLimitMinutes;
      }

      orderItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        productImage: dbProduct.imageUrls[0] || '',
        unitPrice: dbProduct.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    const cooker = db.getCookerById(cookerId!);
    if (!cooker) {
      return NextResponse.json({ success: false, message: 'Cooker kitchen not found.' }, { status: 404 });
    }

    // 2. Server-side delivery eligibility & fee calculation
    const effectiveDeliveryAddress: Address = deliveryAddress || {
      id: `addr-pickup-${Date.now()}`,
      label: 'Kitchen Pickup Point',
      street: cooker.address || 'Cooker Kitchen Counter',
      city: 'Kochi',
      pincode: '682036',
      latitude: cooker.latitude || 9.9675,
      longitude: cooker.longitude || 76.2995,
      isDefault: false,
    };

    let serverDeliveryFee = 0;
    if (deliveryMode === 'CUSTOMER_PICKUP') {
      serverDeliveryFee = 0;
    } else {
      const eligibility = DeliveryService.checkDeliveryEligibility(
        cooker,
        effectiveDeliveryAddress.latitude || 9.9675,
        effectiveDeliveryAddress.longitude || 76.2995,
        deliveryMode as DeliveryMode
      );

      if (!eligibility.eligible) {
        return NextResponse.json(
          { success: false, message: eligibility.reason || 'Address is outside supported delivery range.' },
          { status: 400 }
        );
      }

      const settings = db.getSettings();
      const baseFee = Number(settings.baseDeliveryFee ?? 30);
      const feePerKm = Number(settings.deliveryFeePerKm ?? 10);

      serverDeliveryFee = DeliveryService.calculateDeliveryFee(
        eligibility.distanceKm,
        deliveryMode as DeliveryMode,
        baseFee,
        feePerKm
      );
    }

    const currentSettings = db.getSettings();
    const platformFee = Number(currentSettings.platformFee ?? 5);

    // 3. Server-side coupon verification
    let discountAmount = 0;
    if (couponCode) {
      const coupon = db.getCouponByCode(couponCode);
      if (coupon && serverSubtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'FIXED') {
          discountAmount = coupon.discountValue;
        } else {
          discountAmount = (serverSubtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        }
        discountAmount = Math.round(discountAmount);
        coupon.timesUsed += 1;
      }
    }

    const totalAmount = Math.max(0, serverSubtotal + serverDeliveryFee + platformFee - discountAmount);

    // 4. Server-side platform commission & cooker earnings calculation
    const commissionPercent = Number(currentSettings.commissionRatePercent ?? 10);
    const platformCommission = Math.round((serverSubtotal * commissionPercent) / 100);
    const netCookerEarnings = serverSubtotal - platformCommission;

    const cookerUser = cooker.userId ? db.getUserById(cooker.userId) : null;
    const cookerPhone = cookerUser?.phone || '+91 9846012345';

    const orderNumber = `HF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId,
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || '+91 9554433221',
      cookerId: cooker.id,
      cookerStoreName: cooker.storeName,
      cookerAddress: cooker.address,
      cookerPhone,
      items: orderItems,
      subtotal: serverSubtotal,
      deliveryFee: serverDeliveryFee,
      platformFee,
      discountAmount,
      couponCode: discountAmount > 0 ? couponCode : undefined,
      totalAmount,
      platformCommission,
      netCookerEarnings,
      deliveryAddress: effectiveDeliveryAddress,
      deliveryMode: deliveryMode as DeliveryMode,
      deliverySlotDate: deliverySlotDate || new Date().toISOString().split('T')[0],
      deliverySlotTime: deliverySlotTime || '01:00 PM - 02:00 PM',
      isPreorder: Boolean(isPreorder),
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'SUCCESS',
      status: 'PENDING',
      timeline: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          description: deliveryMode === 'CUSTOMER_PICKUP'
            ? `Order #${orderNumber} placed for Direct Kitchen Pickup (${paymentMethod === 'COD' ? 'Pay at Pickup' : paymentMethod}).`
            : `Order #${orderNumber} placed for ${deliveryMode === 'SELF_DELIVERY' ? 'Cooker Self-Delivery' : 'Smart Rider Delivery'} (${paymentMethod}).`,
        },
      ],
      maxWaitLimitMinutes,
      specialInstructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update cooker today's orders & product bookings
    cooker.totalOrders += 1;
    for (const item of items) {
      const p = db.getProductById(item.productId);
      if (p) {
        p.stockCount = Math.max(0, p.stockCount - item.quantity);
        p.bookedToday += item.quantity;
      }
    }

    db.createOrder(newOrder);

    db.addAuditLog({
      id: `log-${Date.now()}`,
      action: 'ORDER_PLACED',
      actorId: customerId,
      actorEmail: customerName,
      actorRole: 'CUSTOMER',
      targetType: 'ORDER',
      targetId: newOrder.id,
      details: `Order #${newOrder.orderNumber} placed for ₹${newOrder.totalAmount} (${orderItems.length} items).`,
      timestamp: new Date().toISOString(),
    });

    await db.flush();

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder,
    });
  } catch (error) {
    console.error('Error in checkout route:', error);
    return NextResponse.json({ success: false, message: 'Checkout processing failed.' }, { status: 500 });
  }
}
