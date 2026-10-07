import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const product = db.getProductById(id) || db.getProductBySlug(id);
  if (!product) {
    notFound();
  }

  const cooker = db.getCookerById(product.cookerId);
  const reviews = db.getReviewsByProductId(product.id);

  return (
    <ProductDetailClient
      product={product}
      cooker={cooker}
      reviews={reviews}
    />
  );
}
