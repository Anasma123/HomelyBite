import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Review } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await db.sync();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const cookerId = searchParams.get('cookerId');

    let reviews = db.getReviews();

    if (productId) {
      reviews = reviews.filter((r) => r.productId === productId && !r.isHiddenByAdmin);
    } else if (cookerId) {
      reviews = reviews.filter((r) => r.cookerId === cookerId && !r.isHiddenByAdmin);
    }

    return NextResponse.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await db.sync();
    const body = await request.json();
    const {
      orderId,
      productId,
      customerId,
      customerName,
      productRating = 5,
      cookerRating = 5,
      deliveryRating = 5,
      tasteRating = 5,
      freshnessRating = 5,
      packagingRating = 5,
      comment,
      imageUrls = [],
    } = body;

    if (!orderId || !productId || !customerId || !comment) {
      return NextResponse.json(
        { success: false, message: 'Order ID, product ID, and your review comments are required.' },
        { status: 400 }
      );
    }

    // Verified purchase check
    const order = db.getOrderById(orderId);
    if (!order || order.customerId !== customerId) {
      return NextResponse.json(
        { success: false, message: 'You can only review products from your verified completed orders.' },
        { status: 403 }
      );
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { success: false, message: 'You can only submit reviews after your order has been safely delivered.' },
        { status: 400 }
      );
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      orderId,
      productId,
      customerId,
      customerName: customerName || 'Verified Gourmet',
      cookerId: order.cookerId,
      productRating: Number(productRating),
      cookerRating: Number(cookerRating),
      deliveryRating: Number(deliveryRating),
      tasteRating: Number(tasteRating),
      freshnessRating: Number(freshnessRating),
      packagingRating: Number(packagingRating),
      comment,
      imageUrls,
      createdAt: new Date().toISOString(),
      isVerifiedPurchase: true,
      isHiddenByAdmin: false,
    };

    db.createReview(newReview);

    // Update product & cooker rating averages
    const productReviews = db.getReviewsByProductId(productId);
    const avgProductRating =
      productReviews.reduce((sum, r) => sum + r.productRating, 0) / productReviews.length;
    db.updateProduct(productId, {
      rating: Math.round(avgProductRating * 10) / 10,
      reviewCount: productReviews.length,
    });

    const cookerReviews = db.getReviewsByCookerId(order.cookerId);
    const avgCookerRating =
      cookerReviews.reduce((sum, r) => sum + r.cookerRating, 0) / cookerReviews.length;
    db.updateCooker(order.cookerId, {
      rating: Math.round(avgCookerRating * 10) / 10,
      totalReviews: cookerReviews.length,
    });

    await db.flush();

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your verified review and rating have been recorded.',
      review: newReview,
    });
  } catch (error) {
    console.error('Error adding review:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit review' }, { status: 500 });
  }
}
