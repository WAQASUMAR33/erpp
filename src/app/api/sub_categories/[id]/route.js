import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid sub-category ID' }, { status: 400 });
    }

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
    if (sub_category_title && typeof sub_category_title !== 'string') {
      return NextResponse.json({ error: 'Sub-category title must be a string' }, { status: 400 });
    }
    if (category_id && typeof category_id !== 'number') {
      return NextResponse.json({ error: 'Category ID must be a number' }, { status: 400 });
    }
    if (!sub_category_title && !category_id) {
      return NextResponse.json({ error: 'At least one field (sub_category_title or category_id) is required' }, { status: 400 });
    }

    // Check models
    if (!prisma.SubCategory) {
      console.error('Prisma sub_category model is undefined');
      return NextResponse.json({ error: 'Sub-category model not found' }, { status: 500 });
    }
    if (category_id && !prisma.category) {
      console.error('Prisma category model is undefined');
      return NextResponse.json({ error: 'Category model not found' }, { status: 500 });
    }

    // Check sub-category exists
    const existingSubCategory = await prisma.SubCategory.findUnique({
      where: { sub_category_id: id },
    });
    if (!existingSubCategory) {
      return NextResponse.json({ error: 'Sub-category not found' }, { status: 404 });
    }

    // Check category_id if provided
    if (category_id) {
      const category = await prisma.category.findUnique({
        where: { category_id },
      });
      if (!category) {
        return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
      }
    }

    // Update sub-category
    const subCategory = await prisma.SubCategory.update({
      where: { sub_category_id: id },
      data: {
        sub_category_title: sub_category_title ? sub_category_title.trim() : undefined,
        category_id: category_id ? category_id : undefined,
      },
    });

    return NextResponse.json(
      { subCategory, message: 'Sub-category updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update sub-category error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to update sub-category' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid sub-category ID' }, { status: 400 });
    }

    // Check model
    if (!prisma.SubCategory) {
      console.error('Prisma sub_category model is undefined');
      return NextResponse.json({ error: 'Sub-category model not found' }, { status: 500 });
    }

    // Check sub-category exists
    const existingSubCategory = await prisma.SubCategory.findUnique({
      where: { sub_category_id: id },
    });
    if (!existingSubCategory) {
      return NextResponse.json({ error: 'Sub-category not found' }, { status: 404 });
    }

    // Delete sub-category
    await prisma.SubCategory.delete({
      where: { sub_category_id: id },
    });

    return NextResponse.json({ message: 'Sub-category deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete sub-category error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to delete sub-category' }, { status: 500 });
  }
}