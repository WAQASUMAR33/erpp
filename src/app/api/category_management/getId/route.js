import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { category_name } = data;

    // Validate category_name
    if (!category_name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
   

    // Check for existing category (case-insensitive)
    let category = await prisma.category.findFirst({
      where: {
        category_name: {
          equals: category_name.trim()
        },
      },
      select: {
        category_id: true,
      },
    });


    return NextResponse.json({ id: category.id }, { status: 200 });
  } catch (error) {
    console.error('Category lookup/create error:', error);
    return NextResponse.json({ error: 'Failed to process category' }, { status: 500 });
  }
}