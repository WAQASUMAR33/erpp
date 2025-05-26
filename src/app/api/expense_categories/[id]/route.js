import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid expense category ID is required' }, { status: 400 });
    }

    if (!prisma.expenseCategory) {
      console.error('Prisma ExpenseCategory model is undefined');
      return NextResponse.json({ error: 'ExpenseCategory model not found' }, { status: 500 });
    }

    const category = await prisma.expenseCategory.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        category_name: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Expense category not found' }, { status: 404 });
    }

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error('Get expense category error:', error);
    return NextResponse.json({ error: 'Failed to fetch expense category' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid expense category ID is required' }, { status: 400 });
    }

    const data = await request.json();
    const { category_name } = data;

    if (!prisma.expenseCategory) {
      console.error('Prisma ExpenseCategory model is undefined');
      return NextResponse.json({ error: 'ExpenseCategory model not found' }, { status: 500 });
    }

    // Check if category exists
    const existingCategory = await prisma.expenseCategory.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingCategory) {
      return NextResponse.json({ error: 'Expense category not found' }, { status: 404 });
    }

    // Validate category_name
    if (category_name !== undefined) {
      if (typeof category_name !== 'string') {
        return NextResponse.json({ error: 'Category name must be a string' }, { status: 400 });
      }
      if (category_name.trim().length === 0) {
        return NextResponse.json({ error: 'Category name cannot be empty' }, { status: 400 });
      }
      if (category_name.length > 255) {
        return NextResponse.json({ error: 'Category name exceeds 255 characters' }, { status: 400 });
      }
      if (category_name.trim() !== existingCategory.category_name) {
        const duplicateCategory = await prisma.expenseCategory.findFirst({
          where: { category_name: category_name.trim() },
        });
        if (duplicateCategory) {
          return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
        }
      }
    }

    const updatedCategory = await prisma.expenseCategory.update({
      where: { id: parseInt(id) },
      data: {
        category_name: category_name ? category_name.trim() : existingCategory.category_name,
      },
      select: {
        id: true,
        category_name: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      { category: updatedCategory, message: 'Expense category updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update expense category error:', error);
    return NextResponse.json({ error: 'Failed to update expense category' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid expense category ID is required' }, { status: 400 });
    }

    if (!prisma.expenseCategory) {
      console.error('Prisma ExpenseCategory model is undefined');
      return NextResponse.json({ error: 'ExpenseCategory model not found' }, { status: 500 });
    }

    // Check if category exists
    const category = await prisma.expenseCategory.findUnique({
      where: { id: parseInt(id) },
    });
    if (!category) {
      return NextResponse.json({ error: 'Expense category not found' }, { status: 404 });
    }

    // Check for related expenses
    const relatedCount = await prisma.expense.count({
      where: { category_id: parseInt(id) },
    });
    if (relatedCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete expense category with associated expenses' },
        { status: 400 }
      );
    }

    await prisma.expenseCategory.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: 'Expense category deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete expense category error:', error);
    return NextResponse.json({ error: 'Failed to delete expense category' }, { status: 500 });
  }
}