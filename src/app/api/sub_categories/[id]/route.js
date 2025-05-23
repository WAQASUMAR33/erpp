import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const subCategory = await prisma.sub_category.findUnique({
      where: { sub_category_id: parseInt(id) },
    });

    if (!subCategory) {
      return NextResponse.json({ error: 'Sub-category not found' }, { status: 404 });
    }

    return NextResponse.json(subCategory, { status: 200 });
  } catch (error) {
    console.error('Get sub-category error:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-category' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { sub_category_title } = await request.json();

    if (!sub_category_title) {
      return NextResponse.json({ error: 'Sub-category title is required' }, { status: 400 });
    }

    const existingSubCategory = await prisma.sub_category.findUnique({
      where: { sub_category_id: parseInt(id) },
    });

    if (!existingSubCategory) {
      return NextResponse.json({ error: 'Sub-category not found' }, { status: 404 });
    }

    const subCategory = await prisma.sub_category.update({
      where: { sub_category_id: parseInt(id) },
      data: { sub_category_title },
    });

    return NextResponse.json(subCategory, { status: 200 });
  } catch (error) {
    console.error('Update sub-category error:', error);
    return NextResponse.json({ error: 'Failed to update sub-category' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const existingSubCategory = await prisma.sub_category.findUnique({
      where: { sub_category_id: parseInt(id) },
    });

    if (!existingSubCategory) {
      return NextResponse.json({ error: 'Sub-category not found' }, { status: 404 });
    }

    // Check for related products
    const relatedProducts = await prisma.products.count({
      where: { sub_category_id: parseInt(id) },
    });

    if (relatedProducts > 0) {
      return NextResponse.json(
        { error: 'Cannot delete sub-category with associated products' },
        { status: 400 }
      );
    }

    await prisma.sub_category.delete({
      where: { sub_category_id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Sub-category deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete sub-category error:', error);
    return NextResponse.json({ error: 'Failed to delete sub-category' }, { status: 500 });
  }
}