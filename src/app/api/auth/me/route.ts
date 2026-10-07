import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = db.getUsers();
    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch user profiles' }, { status: 500 });
  }
}
