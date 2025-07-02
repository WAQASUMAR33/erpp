import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { uom_title } = data;

    // Validate category_name
    if (!uom_title) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
   

    // Check for existing category (case-insensitive)
    let uoms = await prisma.UnitOfMeasurement.findFirst({
      where: {
        uom_title: {
          equals: uom_title.trim()
        },
      },
      select: {
        id: true,
      },
    });


    return NextResponse.json({ id: uoms.id }, { status: 200 });
  } catch (error) {
    console.error('Category lookup/create error:', error);
    return NextResponse.json({ error: 'Failed to process category' }, { status: 500 });
  }
}