import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
    const { sub_category_title } = await request.json();

    if (!sub_category_title) {
      return NextResponse.json({ error: 'Sub-category title is required' }, { status: 400 });
    }

    const subCategory = await prisma.sub_category.create({
      data: {
        sub_category_title,
      },
    });

    return NextResponse.json(subCategory, { status: 201 });
  } catch (error) {
    console.error('Create sub-category error:', error);
    return NextResponse.json({ error: 'Failed to create sub-category' }, { status: 500 });
  }
}