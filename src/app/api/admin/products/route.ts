import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProductStatus } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, status, adminEmail = 'admin@homefood.local' } = body;

    if (!productId || !status) {
      return NextResponse.json({ success: false, message: 'productId and status are required' }, { status: 400 });
    }

    const product = db.getProductById(productId);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const previousStatus = product.status;
    db.updateProduct(productId, { status: status as ProductStatus });

    db.addAuditLog({
      id: `log-${Date.now()}`,
      action: `PRODUCT_STATUS_${status}`,
      actorId: 'usr-admin-1',
      actorEmail: adminEmail,
      actorRole: 'ADMIN',
      targetType: 'PRODUCT',
      targetId: productId,
      details: `Admin changed status for product "${product.name}" from ${previousStatus} to ${status}.`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" status updated to ${status}.`,
      product: db.getProductById(productId),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update product status' }, { status: 500 });
  }
}
