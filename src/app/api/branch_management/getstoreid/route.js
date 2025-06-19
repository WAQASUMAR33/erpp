import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { store_title } = data;

    // Validate category_name
    if (!store_title) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }
   

    // Check for existing category (case-insensitive)
    let store = await prisma.Store.findFirst({
      where: {
        branch_title: {
          equals: store_title.trim()
        },
      },
      select: {
        id: true,
      },
    });


    return NextResponse.json({ id: store.id }, { status: 200 });
  } catch (error) {
    console.error('Store lookup/create error:', error);
    return NextResponse.json({ error: 'Failed to process category' }, { status: 500 });
  }
}