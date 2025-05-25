import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.Store) {
      console.error('Prisma category model is undefined');
      return NextResponse.json({ error: 'Category model not found' }, { status: 500 });
    }

    const stores = await prisma.Store.findMany({
      orderBy: { branch_title: 'asc' },
    });

    return NextResponse.json(stores, { status: 200 });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { branch_title,address,phone } = data;

 

    if (!prisma.Store) {
      console.error('Prisma category model is undefined');
      return NextResponse.json({ error: 'Category model not found' }, { status: 500 });
    }

    // Check for duplicate category_name
    const existingStore = await prisma.Store.findFirst({
      where: { branch_title: branch_title.trim() },
    });
    if (existingStore) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
    }

    const branch = await prisma.Store.create({
      data: {
        branch_title: branch_title.trim(),
        address: address,
        phone: phone,
      },
    });

    return NextResponse.json(
      { branch, message: 'Store created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Store category error:', error);
    return NextResponse.json({ error: 'Failed to create Store' }, { status: 500 });
  }
}