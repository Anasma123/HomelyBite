import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email address is required.' }, { status: 400 });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User with this email not found. Please register.' }, { status: 404 });
    }

    let extraData = {};
    if (user.role === 'COOKER') {
      const cooker = db.getCookerByUserId(user.id);
      extraData = { cooker };
    } else if (user.role === 'RIDER') {
      const rider = db.getRiderByUserId(user.id);
      extraData = { rider };
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful.',
      user,
      ...extraData,
    });
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error during login.' }, { status: 500 });
  }
}
