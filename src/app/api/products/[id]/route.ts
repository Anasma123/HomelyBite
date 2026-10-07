import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

    return NextResponse.json(
      {
        success: true,
        product,
        cooker,
        reviews,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
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

    try {
      revalidatePath('/', 'page');
      revalidatePath('/search', 'page');
      revalidatePath(`/cooker/${updated.cookerId}`, 'page');
      revalidatePath(`/product/${updated.id}`, 'page');
    } catch (e) {}

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error updating product.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const existing = db.getProductById(id);
    const deleted = db.deleteProduct(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    if (existing) {
      try {
        revalidatePath('/', 'page');
        revalidatePath('/search', 'page');
        revalidatePath(`/cooker/${existing.cookerId}`, 'page');
        revalidatePath(`/product/${id}`, 'page');
      } catch (e) {}
    }

    db.addAuditLog({
      id: `log-${Date.now()}`,
      action: 'PRODUCT_DELETED',
      actorId: 'cooker',
      actorEmail: 'cooker@kitchen',
      actorRole: 'COOKER',
      targetType: 'PRODUCT',
      targetId: id,
      details: `Product ${id} was deleted from the kitchen menu.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error deleting product.' }, { status: 500 });
  }
}

