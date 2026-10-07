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

    if (!customerId || !items.length || !deliveryAddress) {
      return NextResponse.json(
        { success: false, message: 'Missing required order fields: items, customer, or address.' },
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
    const eligibility = DeliveryService.checkDeliveryEligibility(
      cooker,
      deliveryAddress.latitude || 9.9675,
      deliveryAddress.longitude || 76.2995,
      deliveryMode as DeliveryMode
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        { success: false, message: eligibility.reason || 'Address is outside supported delivery range.' },
        { status: 400 }
      );
    }

    const serverDeliveryFee = DeliveryService.calculateDeliveryFee(
      eligibility.distanceKm,
      deliveryMode as DeliveryMode
    );

    const platformFee = db.getSettings().platformFee || 5;

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
    const commissionPercent = db.getSettings().commissionRatePercent || 10;
    const platformCommission = Math.round((serverSubtotal * commissionPercent) / 100);
    const netCookerEarnings = serverSubtotal - platformCommission;

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
      cookerPhone: '+91 9988776655',
      items: orderItems,
      subtotal: serverSubtotal,
      deliveryFee: serverDeliveryFee,
      platformFee,
      discountAmount,
      couponCode: discountAmount > 0 ? couponCode : undefined,
      totalAmount,
      platformCommission,
      netCookerEarnings,
      deliveryAddress,
      deliveryMode: deliveryMode as DeliveryMode,
      deliverySlotDate: deliverySlotDate || new Date().toISOString().split('T')[0],
      deliverySlotTime: deliverySlotTime || '01:00 PM - 02:00 PM',
      isPreorder: Boolean(isPreorder),
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: 'SUCCESS', // Instant simulated verified payment for seamless testing
      status: 'PENDING',
      timeline: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          description: `Order placed and verified via ${paymentMethod}. Awaiting cooker acceptance.`,
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
