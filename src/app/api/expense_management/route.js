import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.expense) {
      console.error('Prisma Expense model is undefined');
      return NextResponse.json({ error: 'Expense model not found' }, { status: 500 });
    }

    const expenses = await prisma.expense.findMany({
      orderBy: { expense_date: 'desc' },
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

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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

    // Validate expense_number
    if (!expense_number) {
      return NextResponse.json({ error: 'Expense number is required' }, { status: 400 });
    }
    if (typeof expense_number !== 'string') {
      return NextResponse.json({ error: 'Expense number must be a string' }, { status: 400 });
    }
    if (expense_number.trim().length === 0) {
      return NextResponse.json({ error: 'Expense number cannot be empty' }, { status: 400 });
    }
    if (expense_number.length > 50) {
      return NextResponse.json({ error: 'Expense number exceeds 50 characters' }, { status: 400 });
    }

    // Validate user_id
    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    if (isNaN(parseInt(user_id))) {
      return NextResponse.json({ error: 'User ID must be a valid integer' }, { status: 400 });
    }
    const userExists = await prisma.user.findUnique({ where: { id: parseInt(user_id) } });
    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
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
    if (amount === undefined) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }
    if (typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json({ error: 'Amount must be a number' }, { status: 400 });
    }
    if (amount < 0) {
      return NextResponse.json({ error: 'Amount cannot be negative' }, { status: 400 });
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
    let parsedDate = new Date();
    if (expense_date) {
      parsedDate = new Date(expense_date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid expense date format' }, { status: 400 });
      }
    }

    // Validate description
    if (description && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    if (!prisma.expense) {
      console.error('Prisma Expense model is undefined');
      return NextResponse.json({ error: 'Expense model not found' }, { status: 500 });
    }

    // Check for duplicate expense_number
    const existingExpense = await prisma.expense.findFirst({
      where: { expense_number: expense_number.trim() },
    });
    if (existingExpense) {
      return NextResponse.json({ error: 'Expense number already exists' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        expense_number: expense_number.trim(),
        user_id: parseInt(user_id),
        store_id: store_id ? parseInt(store_id) : null,
        category_id: category_id ? parseInt(category_id) : null,
        amount: parseFloat(amount),
        payment_status: payment_status || 'Pending',
        expense_date: parsedDate,
        description: description ? description.trim() : null,
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
      { expense, message: 'Expense created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create expense error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('expense_number')) {
      return NextResponse.json({ error: 'Expense number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}