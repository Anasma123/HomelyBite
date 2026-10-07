import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DeliveryService } from '@/lib/services/delivery-service';
import { OrderStatus, DeliveryMode } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await db.sync();
    const body = await request.json();
    const { status, actorName = 'System', actorRole = 'COOKER', note } = body;

    const order = db.getOrderById(id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    const previousStatus = order.status;
    const newStatus = status as OrderStatus;
    const now = new Date().toISOString();

    let description = note || `Status updated to ${newStatus.replace(/_/g, ' ')}`;

    // Handle READY_FOR_PICKUP with Smart Rider Assignment & Self-Delivery Fallback
    if (newStatus === 'READY_FOR_PICKUP') {
      const cooker = db.getCookerById(order.cookerId);
      const riders = db.getRiders();
      const users = db.getUsers();

      if (cooker) {
        const assignmentResult = DeliveryService.assignDeliveryJob(order, cooker, riders, users);

        if (assignmentResult.assignedMode === 'PLATFORM_DELIVERY' && assignmentResult.assignedRider) {
          const rider = assignmentResult.assignedRider;
          const riderUser = users.find((u) => u.id === rider.userId);

          order.assignedRiderId = rider.id;
          order.assignedRiderName = riderUser?.name || 'Assigned Rider';
          order.assignedRiderPhone = riderUser?.phone || '+91 9776655443';
          order.status = 'RIDER_ASSIGNED';

          // Mark rider busy
          db.updateRider(rider.id, { status: 'BUSY' });

          order.timeline.push({
            status: 'READY_FOR_PICKUP',
            timestamp: now,
            description: 'Food freshly prepared and packed at home kitchen.',
            actor: actorName,
          });

          order.timeline.push({
            status: 'RIDER_ASSIGNED',
            timestamp: new Date(Date.now() + 1000).toISOString(),
            description: assignmentResult.message,
            actor: 'Smart Delivery Engine',
          });

          db.updateOrder(order.id, order);

          return NextResponse.json({
            success: true,
            order,
            message: assignmentResult.message,
            deliveryAssignment: assignmentResult,
          });
        } else if (assignmentResult.cookerSelfDelivery) {
          order.deliveryMode = 'SELF_DELIVERY';
          order.status = 'READY_FOR_PICKUP';

          order.timeline.push({
            status: 'READY_FOR_PICKUP',
            timestamp: now,
            description: assignmentResult.message,
            actor: 'Delivery Fallback Engine',
          });

          db.updateOrder(order.id, order);

          return NextResponse.json({
            success: true,
            order,
            message: assignmentResult.message,
            deliveryAssignment: assignmentResult,
          });
        }
      }
    }

    // Handle DELIVERED completion
    if (newStatus === 'DELIVERED') {
      if (order.assignedRiderId) {
        const rider = db.getRiderById(order.assignedRiderId);
        if (rider) {
          db.updateRider(rider.id, {
            status: 'ONLINE',
            totalDeliveries: rider.totalDeliveries + 1,
            todayEarnings: rider.todayEarnings + order.deliveryFee,
            totalEarnings: rider.totalEarnings + order.deliveryFee,
          });
        }
      }
    }

    order.status = newStatus;
    order.timeline.push({
      status: newStatus,
      timestamp: now,
      description,
      actor: actorName,
    });

    db.updateOrder(order.id, order);

    db.addAuditLog({
      id: `log-${Date.now()}`,
      action: 'ORDER_STATUS_CHANGED',
      actorId: actorName,
      actorEmail: actorName,
      actorRole: actorRole,
      targetType: 'ORDER',
      targetId: order.id,
      details: `Order #${order.orderNumber} changed from ${previousStatus} to ${newStatus}.`,
      timestamp: now,
    });

    await db.flush();

    return NextResponse.json({
      success: true,
      order,
      message: `Order marked as ${newStatus}.`,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, message: 'Status transition failed.' }, { status: 500 });
  }
}
