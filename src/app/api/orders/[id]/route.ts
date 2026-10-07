import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await db.sync();
    const order = db.getOrderById(id);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    const cooker = db.getCookerById(order.cookerId);
    let rider = null;
    if (order.assignedRiderId) {
      rider = db.getRiderById(order.assignedRiderId);
    }

    return NextResponse.json({
      success: true,
      order,
      cooker,
      rider,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to retrieve order' }, { status: 500 });
  }
}
