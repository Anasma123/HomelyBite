import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await db.sync();
    const { id } = await context.params;
    const deleted = db.deleteCategory(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Category not found or could not be deleted.' },
        { status: 404 }
      );
    }
    await db.flush();

    try {
      revalidatePath('/');
      revalidatePath('/search');
      revalidatePath('/cooker/dashboard');
      revalidatePath('/admin/dashboard');
    } catch (e) {}

    return NextResponse.json(
      {
        success: true,
        message: 'Category deleted successfully.',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error deleting category.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await db.sync();
    const { id } = await context.params;
    const body = await request.json();
    const updated = db.updateCategory(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Category not found.' },
        { status: 404 }
      );
    }
    await db.flush();

    try {
      revalidatePath('/');
      revalidatePath('/search');
      revalidatePath('/cooker/dashboard');
      revalidatePath('/admin/dashboard');
    } catch (e) {}

    return NextResponse.json(
      {
        success: true,
        category: updated,
        message: 'Category updated successfully.',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error updating category.' },
      { status: 500 }
    );
  }
}
