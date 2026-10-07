import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, orderAmount = 0 } = body;

    if (!code) {
      return NextResponse.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = db.getCouponByCode(code);
    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Invalid or expired coupon code.' }, { status: 404 });
    }

    if (orderAmount < coupon.minOrderValue) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order amount of ₹${coupon.minOrderValue} required for this coupon.`,
        },
        { status: 400 }
      );
    }

    let discount = 0;
    if (coupon.discountType === 'FIXED') {
      discount = coupon.discountValue;
    } else {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    }

    discount = Math.round(discount);

    return NextResponse.json({
      success: true,
      coupon,
      discountAmount: discount,
      message: `Coupon "${coupon.code}" applied! You saved ₹${discount}.`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to validate coupon' }, { status: 500 });
  }
}
