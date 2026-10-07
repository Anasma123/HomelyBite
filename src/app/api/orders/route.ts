import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await db.sync();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const cookerId = searchParams.get('cookerId');
    const riderId = searchParams.get('riderId');

    let orders = db.getOrders();

    if (customerId) {
      orders = orders.filter((o) => o.customerId === customerId);
    } else if (cookerId) {
      orders = orders.filter((o) => o.cookerId === cookerId);
    } else if (riderId) {
      orders = orders.filter((o) => o.assignedRiderId === riderId);
    }

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}
