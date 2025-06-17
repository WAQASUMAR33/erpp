import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { sub_category_title } = data;

    // Validate category_name
    if (!sub_category_title) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
   

    // Check for existing category (case-insensitive)
    let subcategory_id = await prisma.SubCategory.findFirst({
      where: {
        sub_category_title: {
          equals: sub_category_title.trim()
        },
      },
      select: {
        id: true,
      },
    });


    return NextResponse.json({ id: subcategory_id.id }, { status: 200 });
  } catch (error) {
    console.error('Category lookup/create error:', error);
    return NextResponse.json({ error: 'Failed to process category' }, { status: 500 });
  }
}