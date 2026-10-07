import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CookerApprovalStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    await db.sync();
    const body = await request.json();
    const { cookerId, status, adminEmail = 'admin@homefood.local' } = body;

    if (!cookerId || !status) {
      return NextResponse.json({ success: false, message: 'cookerId and status are required' }, { status: 400 });
    }

    const cooker = db.getCookerById(cookerId);
    if (!cooker) {
      return NextResponse.json({ success: false, message: 'Cooker not found' }, { status: 404 });
    }

    const previousStatus = cooker.status;
    db.updateCooker(cookerId, { status: status as CookerApprovalStatus });

    db.addAuditLog({
      id: `log-${Date.now()}`,
      action: `COOKER_STATUS_${status}`,
      actorId: 'usr-admin-1',
      actorEmail: adminEmail,
      actorRole: 'ADMIN',
      targetType: 'COOKER',
      targetId: cookerId,
      details: `Admin changed status for "${cooker.storeName}" from ${previousStatus} to ${status}.`,
      timestamp: new Date().toISOString(),
    });

    await db.flush();

    return NextResponse.json({
      success: true,
      message: `Cooker profile "${cooker.storeName}" marked as ${status}.`,
      cooker: db.getCookerById(cookerId),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update cooker approval' }, { status: 500 });
  }
}
