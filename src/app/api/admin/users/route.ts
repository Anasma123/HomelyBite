import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const users = db.getUsers();
    const cookers = db.getCookers();
    const riders = db.getRiders();

    // Enrich users with their linked profile info
    const enrichedUsers = users.map((u) => {
      let profileInfo: any = null;
      if (u.role === 'COOKER') {
        const cooker = cookers.find((c) => c.userId === u.id);
        if (cooker) {
          profileInfo = {
            storeName: cooker.storeName,
            address: cooker.address,
            rating: cooker.rating,
            totalOrders: cooker.totalOrders,
            cookerId: cooker.id,
          };
        }
      } else if (u.role === 'RIDER') {
        const rider = riders.find((r) => r.userId === u.id);
        if (rider) {
          profileInfo = {
            vehicleType: rider.vehicleType,
            vehicleNumber: rider.vehicleNumber,
            status: rider.status,
            riderId: rider.id,
          };
        }
      }

      return {
        ...u,
        status: u.isFrozen ? 'FROZEN' : (u.status || 'ACTIVE'),
        isFrozen: !!u.isFrozen,
        profileInfo,
      };
    });

    return NextResponse.json(
      {
        success: true,
        count: enrichedUsers.length,
        users: enrichedUsers,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users.' },
      { status: 500 }
    );
  }
}
