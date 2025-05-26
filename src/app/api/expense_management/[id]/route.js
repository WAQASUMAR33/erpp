import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid expense ID is required' }, { status: 400 });
    }

    if (!prisma.expense) {
      console.error('Prisma Expense model is undefined');
      return NextResponse.json({ error: 'Expense model not found' }, { status: 500 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        expense_number: true,
        user_id: true,
        store_id: true,
        category_id: true,
        amount: true,
        payment_status: true,
        expense_date: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(expense, { status: 200 });
  } catch (error) {
    console.error('Get expense error:', error);
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid expense ID is required' }, { status: 400 });
    }

    const data = await request.json();
    const {
      expense_number,
      user_id,
      store_id,
      category_id,
      amount,
      payment_status,
      expense_date,
      description,
    } = data;

    if (!prisma.expense) {
      console.error('Prisma Expense model is undefined');
      return NextResponse.json({ error: 'Expense model not found' }, { status: 500 });
    }

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({ where: { id: parseInt(id) } });
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Validate expense_number
    if (expense_number !== undefined) {
      if (typeof expense_number !== 'string') {
        return NextResponse.json({ error: 'Expense number must be a string' }, { status: 400 });
      }
      if (expense_number.trim().length === 0) {
        return NextResponse.json({ error: 'Expense number cannot be empty' }, { status: 400 });
      }
      if (expense_number.length > 50) {
        return NextResponse.json({ error: 'Expense number exceeds 50 characters' }, { status: 400 });
      }
      if (expense_number.trim() !== existingExpense.expense_number) {
        const duplicateExpense = await prisma.expense.findFirst({
          where: { expense_number: expense_number.trim() },
        });
        if (duplicateExpense) {
          return NextResponse.json({ error: 'Expense number already exists' }, { status: 400 });
        }
      }
    }

    // Validate user_id
    if (user_id !== undefined) {
      if (isNaN(parseInt(user_id))) {
        return NextResponse.json({ error: 'User ID must be a valid integer' }, { status: 400 });
      }
      const userExists = await prisma.user.findUnique({ where: { id: parseInt(user_id) } });
      if (!userExists) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 });
      }
    }

    // Validate store_id
    if (store_id !== undefined && store_id !== null) {
      if (isNaN(parseInt(store_id))) {
        return NextResponse.json({ error: 'Store ID must be a valid integer' }, { status: 400 });
      }
      const storeExists = await prisma.store.findUnique({ where: { id: parseInt(store_id) } });
      if (!storeExists) {
        return NextResponse.json({ error: 'Store not found' }, { status: 400 });
      }
    }

    // Validate category_id
    if (category_id !== undefined && category_id !== null) {
      if (isNaN(parseInt(category_id))) {
        return NextResponse.json({ error: 'Category ID must be a valid integer' }, { status: 400 });
      }
      const categoryExists = await prisma.expenseCategory.findUnique({
        where: { id: parseInt(category_id) },
      });
      if (!categoryExists) {
        return NextResponse.json({ error: 'Expense category not found' }, { status: 400 });
      }
    }

    // Validate amount
    if (amount !== undefined) {
      if (typeof amount !== 'number' || isNaN(amount)) {
        return NextResponse.json({ error: 'Amount must be a number' }, { status: 400 });
      }
      if (amount < 0) {
        return NextResponse.json({ error: 'Amount cannot be negative' }, { status: 400 });
      }
    }

    // Validate payment_status
    const validStatuses = ['Pending', 'Paid', 'Cancelled'];
    if (payment_status && !validStatuses.includes(payment_status)) {
      return NextResponse.json(
        { error: 'Payment status must be one of: Pending, Paid, Cancelled' },
        { status: 400 }
      );
    }

    // Validate expense_date
    let parsedDate;
    if (expense_date !== undefined) {
      parsedDate = new Date(expense_date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid expense date format' }, { status: 400 });
      }
    }

    // Validate description
    if (description !== undefined && description !== null && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        expense_number: expense_number ? expense_number.trim() : existingExpense.expense_number,
        user_id: user_id ? parseInt(user_id) : existingExpense.user_id,
        store_id: store_id !== undefined ? (store_id ? parseInt(store_id) : null) : existingExpense.store_id,
        category_id: category_id !== undefined ? (category_id ? parseInt(category_id) : null) : existingExpense.category_id,
        amount: amount !== undefined ? parseFloat(amount) : existingExpense.amount,
        payment_status: payment_status || existingExpense.payment_status,
        expense_date: parsedDate || existingExpense.expense_date,
        description: description !== undefined ? (description ? description.trim() : null) : existingExpense.description,
      },
      select: {
        id: true,
        expense_number: true,
        user_id: true,
        store_id: true,
        category_id: true,
        amount: true,
        payment_status: true,
        expense_date: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      { expense: updatedExpense, message: 'Expense updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update expense error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('expense_number')) {
      return NextResponse.json({ error: 'Expense number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid expense ID is required' }, { status: 400 });
    }

    if (!prisma.expense) {
      console.error('Prisma Expense model is undefined');
      return NextResponse.json({ error: 'Expense model not found' }, { status: 500 });
    }

    // Check if expense exists
    const expense = await prisma.expense.findUnique({ where: { id: parseInt(id) } });
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Check for related supplier_ledger_entries
    const relatedCount = await prisma.supplierLedger.count({
      where: { reference_id: parseInt(id), reference_type: 'EXPENSE' },
    });
    if (relatedCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete expense with associated supplier ledger entries' },
        { status: 400 }
      );
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: 'Expense deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}