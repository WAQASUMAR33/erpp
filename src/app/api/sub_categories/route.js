import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    if (!prisma.sub_category) {
      console.error('Prisma sub_category model is undefined');
      return NextResponse.json({ error: 'Sub-category model not found' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const subCategory = await prisma.sub_category.findUnique({
        where: { sub_category_id: parseInt(id) },
        include: { category: { select: { category_id, category_name } } },
      });
      if (!subCategory) {
        return NextResponse.json({ error: 'Sub-category not found' }, { status: 404 });
      }
      return NextResponse.json(subCategory, { status: 200 });
    }

    const subCategories = await prisma.sub_category.findMany({
      orderBy: { sub_category_title: 'asc' },
      include: { category: { select: { category_id, category_name } } },
    });
    return NextResponse.json(subCategories, { status: 200 });
  } catch (error) {
    console.error('Get sub-categories error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch sub-categories' }, { status: 500 });
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
    const subCategory = await prisma.sub_category.create({
      data: {
        sub_category_title,
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