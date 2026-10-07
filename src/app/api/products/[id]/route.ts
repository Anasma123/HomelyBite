import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const product = db.getProductById(id) || db.getProductBySlug(id);

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    const cooker = db.getCookerById(product.cookerId);
    const reviews = db.getReviewsByProductId(product.id);

    return NextResponse.json({
      success: true,
      product,
      cooker,
      reviews,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error retrieving product.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const updated = db.updateProduct(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error updating product.' }, { status: 500 });
  }
}
