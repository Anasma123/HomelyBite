import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await db.sync();
    const settings = db.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await db.sync();
    const body = await request.json();
    const updates = body.updates || body;
    const adminEmail = body.adminEmail || 'admin@homelybite.com';

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid settings updates payload' },
        { status: 400 }
      );
    }

    const sanitizedUpdates: Record<string, number> = {};

    if (updates.smartRiderDeliveryFee !== undefined || updates.baseDeliveryFee !== undefined) {
      const val = Number(updates.smartRiderDeliveryFee ?? updates.baseDeliveryFee);
      if (!isNaN(val)) {
        sanitizedUpdates.smartRiderDeliveryFee = Math.max(0, Math.round(val));
        sanitizedUpdates.baseDeliveryFee = sanitizedUpdates.smartRiderDeliveryFee;
      }
    }

    sanitizedUpdates.commissionRatePercent = 0;
    sanitizedUpdates.platformFee = 0;
    sanitizedUpdates.deliveryFeePerKm = 0;

    if (updates.relevanceWeight !== undefined) {
      const val = Number(updates.relevanceWeight);
      if (!isNaN(val)) sanitizedUpdates.relevanceWeight = Math.max(0, Math.min(100, val));
    }

    if (updates.distanceWeight !== undefined) {
      const val = Number(updates.distanceWeight);
      if (!isNaN(val)) sanitizedUpdates.distanceWeight = Math.max(0, Math.min(100, val));
    }

    if (updates.ratingWeight !== undefined) {
      const val = Number(updates.ratingWeight);
      if (!isNaN(val)) sanitizedUpdates.ratingWeight = Math.max(0, Math.min(100, val));
    }

    if (updates.availabilityWeight !== undefined) {
      const val = Number(updates.availabilityWeight);
      if (!isNaN(val)) sanitizedUpdates.availabilityWeight = Math.max(0, Math.min(100, val));
    }

    if (updates.popularityWeight !== undefined) {
      const val = Number(updates.popularityWeight);
      if (!isNaN(val)) sanitizedUpdates.popularityWeight = Math.max(0, Math.min(100, val));
    }

    if (updates.cookerQualityWeight !== undefined) {
      const val = Number(updates.cookerQualityWeight);
      if (!isNaN(val)) sanitizedUpdates.cookerQualityWeight = Math.max(0, Math.min(100, val));
    }

    if (updates.otpExpiryMinutes !== undefined) {
      const val = Number(updates.otpExpiryMinutes);
      if (!isNaN(val)) sanitizedUpdates.otpExpiryMinutes = Math.max(1, Math.min(60, Math.round(val)));
    }

    if (updates.otpCooldownSeconds !== undefined) {
      const val = Number(updates.otpCooldownSeconds);
      if (!isNaN(val)) sanitizedUpdates.otpCooldownSeconds = Math.max(5, Math.min(300, Math.round(val)));
    }

    const newSettings = db.updateSettings(sanitizedUpdates);

    db.addAuditLog({
      id: `log-${Date.now()}`,
      action: 'PLATFORM_SETTINGS_UPDATED',
      actorId: 'usr-admin-1',
      actorEmail: adminEmail,
      actorRole: 'ADMIN',
      targetType: 'SETTING',
      targetId: 'global',
      details: `Platform settings updated: ${JSON.stringify(sanitizedUpdates)}`,
      timestamp: new Date().toISOString(),
    });

    await db.flush();

    return NextResponse.json({
      success: true,
      settings: newSettings,
      message: 'Platform parameters and commission rules updated successfully.',
    });
  } catch (error) {
    console.error('Failed to update platform settings:', error);
    return NextResponse.json({ success: false, message: 'Failed to update platform settings' }, { status: 500 });
  }
}
