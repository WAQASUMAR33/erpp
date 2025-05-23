import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.category) {
      console.error('Prisma category model is undefined');
      return NextResponse.json({ error: 'Category model not found' }, { status: 500 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { category_name: 'asc' },
    });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { category_name } = data;

    if (!category_name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    if (typeof category_name !== 'string') {
      return NextResponse.json({ error: 'Category name must be a string' }, { status: 400 });
    }

    if (category_name.length > 255) {
      return NextResponse.json({ error: 'Category name exceeds 255 characters' }, { status: 400 });
    }

    if (!prisma.category) {
      console.error('Prisma category model is undefined');
      return NextResponse.json({ error: 'Category model not found' }, { status: 500 });
    }

    // Check for duplicate category_name
    const existingCategory = await prisma.category.findFirst({
      where: { category_name: category_name.trim() },
    });
    if (existingCategory) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        category_name: category_name.trim(),
      },
    });

    return NextResponse.json(
      { category, message: 'Category created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}