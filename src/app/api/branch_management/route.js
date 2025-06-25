import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.Store) {
      console.error('Prisma Store model is undefined');
      return NextResponse.json({ error: 'Store model not found' }, { status: 500 });
    }

    const stores = await prisma.Store.findMany({
      orderBy: { branch_title: 'asc' },
    });

    return NextResponse.json(stores, { status: 200 });
  } catch (error) {
    console.error('Get stores error:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { branch_title, sub_title, address, phone, email, logo_path, website, tax_no } = data;

    // Validate required fields
    if (!branch_title || typeof branch_title !== 'string') {
      return NextResponse.json({ error: 'Branch title is required' }, { status: 400 });
    }

    if (!prisma.Store) {
      console.error('Prisma Store model is undefined');
      return NextResponse.json({ error: 'Store model not found' }, { status: 500 });
    }

    // Check for duplicate branch_title
    const existingStore = await prisma.Store.findFirst({
      where: { branch_title: branch_title.trim() },
    });
    if (existingStore) {
      return NextResponse.json({ error: 'Branch title already exists' }, { status: 400 });
    }

    const store = await prisma.Store.create({
      data: {
        branch_title: branch_title.trim(),
        sub_title: sub_title || '', // Default to empty string as per schema
        address: address || null,
        phone: phone || null,
        email: email || null,
        logo_path: logo_path || null,
        website: website || null,
        tax_no: tax_no || null,
      },
    });

    return NextResponse.json(
      { store, message: 'Store created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create store error:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}