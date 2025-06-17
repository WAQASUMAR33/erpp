import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.SubCategory) {
      console.error('Prisma category model is undefined');
      return NextResponse.json({ error: 'Category model not found' }, { status: 500 });
    }

    const categories = await prisma.SubCategory.findMany();

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Parse JSON
  
    const data = await request.json();
    const { sub_category_title, category_id } = data;

   

    // Check models

    // Check category_id
   
    // Create sub-category
    const subCategory = await prisma.SubCategory.create({
      data: {
        sub_category_title,
        category_id : parent(category_id),
      },
    });

    return NextResponse.json(
      { subCategory, message: 'Sub-category created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create sub-category error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to create sub-category' }, { status: 500 });
  }
}