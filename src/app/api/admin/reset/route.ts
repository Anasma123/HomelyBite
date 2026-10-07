import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    await db.resetToInitialData();
    return NextResponse.json({
      success: true,
      message: 'Database reset to clean fresh slate successfully.',
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to reset database.' }, { status: 500 });
  }
}
