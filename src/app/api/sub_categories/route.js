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
    });

    return NextResponse.json(subCategories, { status: 200 });
  } catch (error) {
    console.error('Get sub-categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { sub_category_title } = data;

    if (!sub_category_title) {
      return NextResponse.json({ error: 'Sub-category title is required' }, { status: 400 });
    }

    if (typeof sub_category_title !== 'string') {
      return NextResponse.json({ error: 'Sub-category title must be a string' }, { status: 400 });
    }

    if (sub_category_title.length > 255) {
      return NextResponse.json({ error: 'Sub-category title exceeds 255 characters' }, { status: 400 });
    }

    if (!prisma.sub_category) {
      console.error('Prisma sub_category model is undefined');
      return NextResponse.json({ error: 'Sub-category model not found' }, { status: 500 });
    }

    // Check for duplicate sub_category_title
    const existingSubCategory = await prisma.sub_category.findFirst({
      where: { sub_category_title: sub_category_title.trim() },
    });
    if (existingSubCategory) {
      return NextResponse.json({ error: 'Sub-category title already exists' }, { status: 400 });
    }

    const subCategory = await prisma.sub_category.create({
      data: {
        sub_category_title: sub_category_title.trim(),
      },
    });

    return NextResponse.json(
      { subCategory, message: 'Sub-category created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create sub-category error:', error);
    return NextResponse.json({ error: 'Failed to create sub-category' }, { status: 500 });
  }
}