import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import OrderTrackingClient from './OrderTrackingClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const order = db.getOrderById(id);

  if (!order) {
    notFound();
  }

  const cooker = db.getCookerById(order.cookerId);
  const rider = order.assignedRiderId ? db.getRiderById(order.assignedRiderId) : null;
  const reviews = db.getReviews().filter((r) => r.orderId === order.id);

  return (
    <OrderTrackingClient
      initialOrder={order}
      cooker={cooker}
      rider={rider}
      existingReview={reviews[0] || null}
    />
  );
}
