import { NextResponse } from 'next/server';
import { OTPService } from '@/lib/services/otp-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Valid email address is required.' }, { status: 400 });
    }

    const result = await OTPService.sendOTP(email);
    return NextResponse.json(result, { status: result.success ? 200 : 429 });
  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error processing OTP.' }, { status: 500 });
  }
}
