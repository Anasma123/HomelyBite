import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await db.sync();
    const body = await request.json();
    const { action } = body;

    if (action === 'TOGGLE_FREEZE') {
      const updated = db.toggleUserFreeze(id);
      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'User not found.' },
          { status: 404 }
        );
      }
      await db.flush();
      return NextResponse.json({
        success: true,
        user: updated,
        message: updated.isFrozen
          ? `User ${updated.name} has been frozen. They cannot log in.`
          : `User ${updated.name} has been unfrozen and restored to active state.`,
      });
    }

    // Generic update
    const updated = db.updateUser(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      );
    }
    await db.flush();

    return NextResponse.json({
      success: true,
      user: updated,
      message: 'User updated successfully.',
    });
  } catch (error) {
    console.error('Error modifying user:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error updating user.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await db.sync();
    const user = db.getUserById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      );
    }

    // Guard platform administrator
    if (user.role === 'ADMIN' && (user.email === 'silu@homelybite.com' || user.email === 'silu@homefood.local')) {
      return NextResponse.json(
        { success: false, message: 'The primary Platform Administrator account cannot be deleted.' },
        { status: 403 }
      );
    }

    const deleted = db.deleteUser(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Could not delete user.' },
        { status: 400 }
      );
    }
    await db.flush();

    return NextResponse.json({
      success: true,
      message: `User ${user.name} and associated profiles were permanently deleted.`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error deleting user.' },
      { status: 500 }
    );
  }
}
