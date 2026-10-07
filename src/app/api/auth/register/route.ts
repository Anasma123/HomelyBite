import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { User, CookerProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      role = 'CUSTOMER',
      storeName,
      bio,
      address,
      fssaiLicense,
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, message: 'Name, email, and phone are required.' }, { status: 400 });
    }

    await db.sync();

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists.' }, { status: 409 });
    }

    const userId = `usr-${Date.now()}`;
    const userRole = role === 'COOKER' ? 'COOKER' : role === 'RIDER' ? 'RIDER' : 'CUSTOMER';
    const newUser: User = {
      id: userId,
      name,
      email: normalizedEmail,
      phone,
      role: userRole,
      isVerified: true,
      status: 'ACTIVE',
      isFrozen: false,
      avatarUrl: body.avatarUrl?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=ea580c`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createUser(newUser);

    if (role === 'COOKER') {
      const cookerId = `cook-${Date.now()}`;
      const newCooker: CookerProfile = {
        id: cookerId,
        userId: newUser.id,
        storeName: storeName || `${name}'s Homemade Delights`,
        bio: bio || 'Freshly made homemade food prepared with love and wholesome ingredients.',
        logoUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80',
        coverImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
        status: 'APPROVED', // Immediately approved for active testing
        rating: 5.0,
        totalReviews: 0,
        totalOrders: 0,
        fssaiLicenseNumber: fssaiLicense || 'FSSAI-KL-2026-TEST',
        address: address || 'Kochi, Kerala',
        latitude: 9.9675,
        longitude: 76.2995,
        platformDeliveryEnabled: true,
        selfDeliveryEnabled: true,
        customerPickupEnabled: true,
        selfDeliveryRadiusKm: 5.0,
        platformDeliveryRadiusKm: 10.0,
        minimumOrderValue: 200,
        averagePrepTimeMinutes: 45,
        maxDailyCapacity: 15,
        isOpenToday: true,
        openingHours: '10:00 AM - 08:00 PM',
      };

      db.createCooker(newCooker);

      db.addAuditLog({
        id: `log-${Date.now()}`,
        action: 'COOKER_REGISTERED_ACTIVE',
        actorId: newUser.id,
        actorEmail: newUser.email,
        actorRole: 'COOKER',
        targetType: 'COOKER',
        targetId: cookerId,
        details: `Cooker "${newCooker.storeName}" registered and verified for testing.`,
        timestamp: new Date().toISOString(),
      });

      await db.flush();
      try {
        revalidatePath('/');
        revalidatePath('/cooker/dashboard');
        revalidatePath('/admin/dashboard');
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: 'Cooker account registered and verified successfully! Welcome to your kitchen.',
        user: newUser,
        cooker: newCooker,
      });
    }

    if (role === 'RIDER') {
      const riderId = `rider-${Date.now()}`;
      const newRider = {
        id: riderId,
        userId: newUser.id,
        vehicleType: (body.vehicleType || 'BIKE') as any,
        vehicleNumber: body.vehicleNumber || 'KL-07-CD-1001',
        currentLatitude: 9.9675,
        currentLongitude: 76.2995,
        status: 'ONLINE' as const,
        isActive: true,
        deliveryRadiusKm: 10.0,
        rating: 5.0,
        totalDeliveries: 0,
        todayEarnings: 0,
        totalEarnings: 0,
      };

      db.createRider(newRider);

      db.addAuditLog({
        id: `log-${Date.now()}`,
        action: 'RIDER_REGISTERED_ACTIVE',
        actorId: newUser.id,
        actorEmail: newUser.email,
        actorRole: 'RIDER',
        targetType: 'RIDER',
        targetId: riderId,
        details: `Delivery Rider "${newUser.name}" registered and set to ONLINE status.`,
        timestamp: new Date().toISOString(),
      });

      await db.flush();
      try {
        revalidatePath('/');
        revalidatePath('/delivery/portal');
        revalidatePath('/admin/dashboard');
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: 'Delivery Rider registered successfully! Welcome to your rider portal.',
        user: newUser,
        rider: newRider,
      });
    }

    // Customer
    db.getCustomerProfile(newUser.id);
    await db.flush();

    try {
      revalidatePath('/');
      revalidatePath('/admin/dashboard');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Welcome to HomeFood Marketplace.',
      user: newUser,
    });
  } catch (error) {
    console.error('Error in register route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error during registration.' }, { status: 500 });
  }
}
