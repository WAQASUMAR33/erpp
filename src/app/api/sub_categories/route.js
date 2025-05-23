import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.sub_category) {
      console.error('Prisma sub_category model is undefined');
      return NextResponse.json({ error: 'Sub-category model not found' }, { status: 500 });
    }

    const subCategories = await prisma.sub_category.findMany({
      orderBy: { sub_category_title: 'asc' },
      include: { category: { select: { category_id, category_name } } },
    });
    return NextResponse.json(subCategories, { status: 200 });
  } catch (error) {
    console.error('Get sub-categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Parse JSON
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { sub_category_title, category_id } = data;

    // Validate inputs
    if (!sub_category_title || typeof sub_category_title !== 'string') {
      return NextResponse.json({ error: 'Sub-category title is required and must be a string' }, { status: 400 });
    }
    if (!category_id || typeof category_id !== 'number') {
      return NextResponse.json({ error: 'Category ID is required and must be a number' }, { status: 400 });
    }

    // Check if category model exists
    if (!prisma.category) {
      console.error('Prisma category model is undefined');
      return NextResponse.json({ error: 'Category model not found' }, { status: 500 });
    }

    // Check if category_id exists
    const category = await prisma.category.findUnique({
      where: { category_id },
    });
    if (!category) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Create sub-category
    const subCategory = await prisma.sub_category.create({
      data: {
        sub_category_title: sub_category_title.trim(),
        category_id,
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