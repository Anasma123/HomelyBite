import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CustomFoodRequest } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cookerId = searchParams.get('cookerId');
    const customerId = searchParams.get('customerId');

    let requests: CustomFoodRequest[] = [];

    if (cookerId) {
      requests = db.getCustomRequestsByCookerId(cookerId);
    } else if (customerId) {
      requests = db.getCustomRequestsByCustomerId(customerId);
    } else {
      requests = db.getCustomRequests();
    }

    return NextResponse.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error('Error fetching custom food requests:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch custom food requests.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.dishName || !body.customerName || !body.customerPhone) {
      return NextResponse.json(
        { success: false, message: 'Dish name, customer name, and phone are required.' },
        { status: 400 }
      );
    }

    const newRequest: CustomFoodRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestNumber: `CR-${Date.now().toString().slice(-6)}`,
      customerId: body.customerId || 'cust-anon',
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      cookerId: body.cookerId || 'cook-prof-1',
      cookerStoreName: body.cookerStoreName || 'Local Home Kitchen',
      dishName: body.dishName,
      dishDescription: body.dishDescription || '',
      ingredients: body.ingredients || [],
      cookingSteps: body.cookingSteps || [],
      macros: body.macros || {
        calories: 350,
        protein: 25,
        carbs: 35,
        fat: 10,
        sugar: 3,
        fiber: 5,
      },
      servings: Number(body.servings) || 2,
      specialNotes: body.specialNotes || '',
      deliveryAddress: body.deliveryAddress || {
        street: '123 Baker Street',
        city: 'Calicut',
        pincode: '673001',
      },
      status: 'PENDING_COOKER_QUOTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.createCustomRequest(newRequest);

    return NextResponse.json({
      success: true,
      message: 'Custom food request submitted to baker successfully!',
      request: saved,
    });
  } catch (error) {
    console.error('Error submitting custom food request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit custom food request.' },
      { status: 500 }
    );
  }
}
