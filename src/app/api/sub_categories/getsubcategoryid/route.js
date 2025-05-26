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
    let subcategory_id = await prisma.sub_category.findFirst({
      where: {
        sub_category_title: {
          equals: sub_category_title.trim()
        },
      },
      select: {
        sub_category_id: true,
      },
    });


    return NextResponse.json({ sub_category_id: subcategory_id.sub_category_id }, { status: 200 });
  } catch (error) {
    console.error('Category lookup/create error:', error);
    return NextResponse.json({ error: 'Failed to process category' }, { status: 500 });
  }
}