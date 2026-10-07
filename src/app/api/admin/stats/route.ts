import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const users = db.getUsers();
    const cookers = db.getCookers();
    const riders = db.getRiders();
    const products = db.getProducts();
    const orders = db.getOrders();

    const totalCustomers = users.filter((u) => u.role === 'CUSTOMER').length;
    const totalCookers = cookers.length;
    const totalRiders = riders.length;
    const pendingCookers = cookers.filter((c) => c.status === 'PENDING').length;
    const pendingProducts = products.filter((p) => p.status === 'SUBMITTED').length;

    const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length;
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;

    const totalGrossRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPlatformCommission = orders.reduce((sum, o) => sum + o.platformCommission, 0);
    const totalCookerPayouts = orders.reduce((sum, o) => sum + o.netCookerEarnings, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        totalCookers,
        totalRiders,
        pendingCookers,
        pendingProducts,
        activeOrders,
        completedOrders,
        totalOrders: orders.length,
        totalGrossRevenue,
        totalPlatformCommission,
        totalCookerPayouts,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
