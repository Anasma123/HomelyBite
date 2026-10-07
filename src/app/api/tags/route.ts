import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Tag } from '@/lib/types';

export async function GET() {
  try {
    const tags = db.getTags();
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color, isDietary = false } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Tag name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name,
      slug,
      color: color || '#059669',
      isDietary: Boolean(isDietary),
    };

    db.createTag(newTag);
    return NextResponse.json({ success: true, tag: newTag });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create tag' }, { status: 500 });
  }
}
