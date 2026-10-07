import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Category } from '@/lib/types';

export async function GET() {
  try {
    const categories = db.getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, displayOrder = 0, subcategories = [] } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      description: description || '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
      displayOrder: Number(displayOrder),
      isActive: true,
      subcategories,
    };

    db.createCategory(newCategory);
    return NextResponse.json({ success: true, category: newCategory });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 });
  }
}
