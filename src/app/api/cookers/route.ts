import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookers = db.getCookers();
    return NextResponse.json({ success: true, cookers });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch cookers' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { cookerId, ...updates } = body;

    if (!cookerId) {
      return NextResponse.json({ success: false, message: 'cookerId is required' }, { status: 400 });
    }

    const updated = db.updateCooker(cookerId, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Cooker not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cooker: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update cooker' }, { status: 500 });
  }
}
