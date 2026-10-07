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
    const { updates, adminEmail = 'admin@homefood.local' } = body;

    const newSettings = db.updateSettings(updates);

    db.addAuditLog({
      id: `log-${Date.now()}`,
      action: 'PLATFORM_SETTINGS_UPDATED',
      actorId: 'usr-admin-1',
      actorEmail: adminEmail,
      actorRole: 'ADMIN',
      targetType: 'SETTING',
      targetId: 'global',
      details: `Platform settings updated: ${JSON.stringify(updates)}`,
      timestamp: new Date().toISOString(),
    });

    await db.flush();

    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update platform settings' }, { status: 500 });
  }
}
