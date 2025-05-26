import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.expenseCategory) {
      console.error('Prisma ExpenseCategory model is undefined');
      return NextResponse.json({ error: 'ExpenseCategory model not found' }, { status: 500 });
    }

    const categories = await prisma.expenseCategory.findMany({
      orderBy: { category_name: 'asc' },
      select: {
        id: true,
        category_name: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Get expense categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch expense categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { category_name } = data;

    // Validate category_name
    if (!category_name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    if (typeof category_name !== 'string') {
      return NextResponse.json({ error: 'Category name must be a string' }, { status: 400 });
    }
    if (category_name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name cannot be empty' }, { status: 400 });
    }
    if (category_name.length > 255) {
      return NextResponse.json({ error: 'Category name exceeds 255 characters' }, { status: 400 });
    }

    if (!prisma.expenseCategory) {
      console.error('Prisma ExpenseCategory model is undefined');
      return NextResponse.json({ error: 'ExpenseCategory model not found' }, { status: 500 });
    }

    // Check for duplicate category_name
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: { category_name: category_name.trim() },
    });
    if (existingCategory) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        category_name: category_name.trim(),
      },
      select: {
        id: true,
        category_name: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      { category, message: 'Expense category created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create expense category error:', error);
    return NextResponse.json({ error: 'Failed to create expense category' }, { status: 500 });
  }
}