import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User, CookerProfile } from '@/lib/types';

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

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists.' }, { status: 409 });
    }

    const userId = `usr-${Date.now()}`;
    const newUser: User = {
      id: userId,
      name,
      email: normalizedEmail,
      phone,
      role: role === 'COOKER' ? 'COOKER' : 'CUSTOMER',
      isVerified: true,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=ea580c`,
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
        status: 'PENDING', // Requires Admin approval before publishing products
        rating: 5.0,
        totalReviews: 0,
        totalOrders: 0,
        fssaiLicenseNumber: fssaiLicense || '',
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
        maxDailyCapacity: 10,
        isOpenToday: true,
        openingHours: '10:00 AM - 08:00 PM',
      };

      db.createCooker(newCooker);

      db.addAuditLog({
        id: `log-${Date.now()}`,
        action: 'COOKER_REGISTERED_PENDING_APPROVAL',
        actorId: newUser.id,
        actorEmail: newUser.email,
        actorRole: 'COOKER',
        targetType: 'COOKER',
        targetId: cookerId,
        details: `Cooker "${newCooker.storeName}" registered and submitted for admin review.`,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Cooker account registered successfully. Your profile is currently under admin verification.',
        user: newUser,
        cooker: newCooker,
      });
    }

    // Customer
    db.getCustomerProfile(newUser.id);

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
