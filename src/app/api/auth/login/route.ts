import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Username or email address is required.' }, { status: 400 });
    }

    const input = (email || '').trim().toLowerCase();

    // Check for user by exact email or admin alias ('silu', 'admin', 'silu@homefood.local', 'admin@homefood.local')
    const users = db.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === input);

    if (!user && (input === 'silu' || input === 'admin' || input === 'silu@homefood.local' || input === 'admin@homefood.local')) {
      user = users.find((u) => u.role === 'ADMIN');
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found. Please register or check your credentials.' }, { status: 404 });
    }

    // Password validation for Admin
    if (user.role === 'ADMIN') {
      if (password && password !== '123') {
        return NextResponse.json({ success: false, message: 'Incorrect password! Admin password is "123".' }, { status: 401 });
      }
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
