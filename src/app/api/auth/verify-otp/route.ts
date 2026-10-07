import { NextResponse } from 'next/server';
import { OTPService } from '@/lib/services/otp-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP code are required.' }, { status: 400 });
    }

    const result = OTPService.verifyOTP(email, otp);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Error in verify-otp route:', error);
    return NextResponse.json({ success: false, message: 'Failed to verify OTP.' }, { status: 500 });
  }
}
