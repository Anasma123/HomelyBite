import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const riders = db.getRiders();
    const users = db.getUsers();

    const fullRiders = riders.map((r) => {
      const u = users.find((user) => user.id === r.userId);
      return {
        ...r,
        name: u?.name || 'Rider',
        email: u?.email || '',
        phone: u?.phone || '',
      };
    });

    return NextResponse.json(
      { success: true, count: fullRiders.length, riders: fullRiders },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch delivery riders' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { riderId, status, currentLatitude, currentLongitude, deliveryRadiusKm } = body;

    if (!riderId) {
      return NextResponse.json({ success: false, message: 'riderId is required' }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (currentLatitude !== undefined) updates.currentLatitude = currentLatitude;
    if (currentLongitude !== undefined) updates.currentLongitude = currentLongitude;
    if (deliveryRadiusKm !== undefined) updates.deliveryRadiusKm = deliveryRadiusKm;

    const updated = db.updateRider(riderId, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Rider not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, rider: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update rider' }, { status: 500 });
  }
}
