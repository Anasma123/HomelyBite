import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CustomRequestStatus } from '@/lib/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await db.sync();
    const req = db.getCustomRequestById(id);

    if (!req) {
      return NextResponse.json(
        { success: false, message: 'Custom request not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: req,
    });
  } catch (error) {
    console.error('Error fetching custom request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch custom request.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await db.sync();
    const body = await request.json();
    const req = db.getCustomRequestById(id);

    if (!req) {
      return NextResponse.json(
        { success: false, message: 'Custom request not found.' },
        { status: 404 }
      );
    }

    const { action } = body;
    let updates: Partial<typeof req> = {};

    switch (action) {
      // 1. Cooker submits price and time quote
      case 'SUBMIT_QUOTE': {
        const quotedPrice = Number(body.quotedPrice);
        const quotedPrepTimeMinutes = Number(body.quotedPrepTimeMinutes);

        if (!quotedPrice || quotedPrice <= 0) {
          return NextResponse.json(
            { success: false, message: 'Please provide a valid quoted price (₹).' },
            { status: 400 }
          );
        }

        updates = {
          quotedPrice,
          quotedPrepTimeMinutes: quotedPrepTimeMinutes || 45,
          cookerNotes: body.cookerNotes || 'Freshly made with wholesome ingredients.',
          status: 'QUOTE_SUBMITTED',
        };
        break;
      }

      // 2. Customer accepts the quote & confirms order
      case 'ACCEPT_QUOTE': {
        updates = {
          status: 'ACCEPTED',
        };
        break;
      }

      // 3. Cooker starts cooking
      case 'START_COOKING': {
        updates = {
          status: 'COOKING',
        };
        break;
      }

      // 4. Cooker finishes cooking & marks ready
      case 'READY_FOR_DELIVERY': {
        updates = {
          status: 'READY_FOR_DELIVERY',
        };
        break;
      }

      // 5. Cooker selects delivery method (Platform Rider vs Self-Delivery)
      case 'ASSIGN_DELIVERY': {
        const requestedMode = body.deliveryMode || 'PLATFORM_DELIVERY';

        if (requestedMode === 'PLATFORM_DELIVERY') {
          // Check online riders
          const riders = db.getRiders();
          const onlineRiders = riders.filter((r) => r.status === 'ONLINE' && r.isActive);

          if (onlineRiders.length > 0) {
            const bestRider = onlineRiders[0];
            const users = db.getUsers();
            const riderUser = users.find((u) => u.id === bestRider.userId);

            updates = {
              deliveryMode: 'PLATFORM_DELIVERY',
              assignedRiderId: bestRider.id,
              assignedRiderName: riderUser?.name || 'Assigned Platform Rider',
              cookerSelfDelivery: false,
              aiDeliveryFallbackTriggered: false,
              status: 'RIDER_ASSIGNED',
            };
          } else {
            // CRITICAL AI FALLBACK: No delivery riders available!
            // System automatically re-routes to Cooker Self-Delivery
            updates = {
              deliveryMode: 'SELF_DELIVERY',
              cookerSelfDelivery: true,
              aiDeliveryFallbackTriggered: true,
              aiDeliveryFallbackMessage:
                '⚠️ AI Delivery Fallback: No delivery riders are online in your zone right now! AI has automatically assigned this order to Cooker Self-Delivery so the fresh homemade dish reaches the customer without delay. Cooker keeps 100% of the delivery fee.',
              status: 'READY_FOR_DELIVERY',
            };
          }
        } else {
          // Cooker chosen direct Self-Delivery
          updates = {
            deliveryMode: 'SELF_DELIVERY',
            cookerSelfDelivery: true,
            aiDeliveryFallbackTriggered: false,
            status: 'READY_FOR_DELIVERY',
          };
        }
        break;
      }

      // 6. Cooker or Rider dispatches the dish
      case 'DISPATCH': {
        updates = {
          status: 'OUT_FOR_DELIVERY',
        };
        break;
      }

      // 7. Marked as Delivered
      case 'DELIVER': {
        updates = {
          status: 'DELIVERED',
        };
        break;
      }

      // Cooker rejected
      case 'REJECT': {
        updates = {
          status: 'REJECTED',
          cookerNotes: body.cookerNotes || 'Cooker is unavailable to prepare this custom order.',
        };
        break;
      }

      default:
        // Generic status update
        if (body.status) {
          updates = { status: body.status as CustomRequestStatus };
        }
        break;
    }

    const updated = db.updateCustomRequest(id, updates);
    await db.flush();

    return NextResponse.json({
      success: true,
      message: 'Custom request updated successfully.',
      request: updated,
    });
  } catch (error) {
    console.error('Error updating custom request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update custom request.' },
      { status: 500 }
    );
  }
}
