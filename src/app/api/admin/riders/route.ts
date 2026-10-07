import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User, DeliveryPersonProfile } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      vehicleType = 'BIKE',
      vehicleNumber,
      deliveryRadiusKm = 8.0,
      adminEmail = 'admin@homefood.local',
    } = body;

    if (!name || !email || !phone || !vehicleNumber) {
      return NextResponse.json(
        { success: false, message: 'Rider Name, Email, Phone, and Vehicle Number are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    const userId = `usr-rider-${Date.now()}`;
    const newUser: User = {
      id: userId,
      name,
      email: normalizedEmail,
      phone,
      role: 'RIDER',
      isVerified: true,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createUser(newUser);

    const riderId = `rider-${Date.now()}`;
    const newRider: DeliveryPersonProfile = {
      id: riderId,
      userId: newUser.id,
      vehicleType,
      vehicleNumber,
      currentLatitude: 9.9675,
      currentLongitude: 76.2995,
      status: 'ONLINE',
      isActive: true,
      deliveryRadiusKm: Number(deliveryRadiusKm),
      rating: 5.0,
      totalDeliveries: 0,
      todayEarnings: 0,
      totalEarnings: 0,
    };

    db.createRider(newRider);

    db.addAuditLog({
      id: `log-${Date.now()}`,
      action: 'RIDER_CREATED_BY_ADMIN',
      actorId: 'usr-admin-1',
      actorEmail: adminEmail,
      actorRole: 'ADMIN',
      targetType: 'RIDER',
      targetId: riderId,
      details: `Admin created new delivery person account for ${name} (${vehicleNumber}).`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Delivery Rider account created successfully for ${name}.`,
      user: newUser,
      rider: newRider,
    });
  } catch (error) {
    console.error('Error creating rider account:', error);
    return NextResponse.json({ success: false, message: 'Failed to create rider account.' }, { status: 500 });
  }
}
