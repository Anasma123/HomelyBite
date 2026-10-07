import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const categories = db.getCategories();
    return NextResponse.json(
      { success: true, count: categories.length, categories },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, displayOrder = 0, subcategories = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      slug,
      description: description || '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
      displayOrder: Number(displayOrder) || 1,
      isActive: true,
      subcategories,
    };

    db.createCategory(newCategory);

    // Immediately revalidate all consumer pages
    try {
      revalidatePath('/');
      revalidatePath('/search');
      revalidatePath('/cooker/dashboard');
      revalidatePath('/admin/dashboard');
    } catch (e) {}

    return NextResponse.json(
      { success: true, category: newCategory, message: `Category "${newCategory.name}" created successfully!` },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 });
  }
}
