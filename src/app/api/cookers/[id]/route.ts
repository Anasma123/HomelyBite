import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cooker = db.getCookerById(id);

    if (!cooker) {
      return NextResponse.json({ success: false, message: 'Cooker not found' }, { status: 404 });
    }

    const products = db.getProductsByCookerId(cooker.id).filter((p) => p.status === 'APPROVED');
    const reviews = db.getReviewsByCookerId(cooker.id);

    return NextResponse.json({
      success: true,
      cooker,
      products,
      reviews,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error retrieving cooker profile' }, { status: 500 });
  }
}
