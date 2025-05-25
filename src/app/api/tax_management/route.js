import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.taxSetting) {
      console.error('Prisma TaxSetting model is undefined');
      return NextResponse.json({ error: 'TaxSetting model not found' }, { status: 500 });
    }

    const taxes = await prisma.taxSetting.findMany({
      orderBy: { tax_name: 'asc' },
      select: {
        id: true,
        tax_name: true,
        tax_per: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(taxes, { status: 200 });
  } catch (error) {
    console.error('Get taxes error:', error);
    return NextResponse.json({ error: 'Failed to fetch taxes' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { tax_name, tax_per } = data;

    if (!tax_name) {
      return NextResponse.json({ error: 'Tax name is required' }, { status: 400 });
    }

    if (typeof tax_name !== 'string') {
      return NextResponse.json({ error: 'Tax name must be a string' }, { status: 400 });
    }

    if (tax_name.length > 255) {
      return NextResponse.json({ error: 'Tax name exceeds 255 characters' }, { status: 400 });
    }

    if (tax_per === undefined || tax_per === null) {
      return NextResponse.json({ error: 'Tax percentage is required' }, { status: 400 });
    }

    if (typeof tax_per !== 'number' || isNaN(tax_per)) {
      return NextResponse.json({ error: 'Tax percentage must be a number' }, { status: 400 });
    }

    if (tax_per < 0) {
      return NextResponse.json({ error: 'Tax percentage cannot be negative' }, { status: 400 });
    }

    if (!prisma.taxSetting) {
      console.error('Prisma TaxSetting model is undefined');
      return NextResponse.json({ error: 'TaxSetting model not found' }, { status: 500 });
    }

    // Check for duplicate tax_name
    const existingTax = await prisma.taxSetting.findFirst({
      where: { tax_name: tax_name.trim() },
    });
    if (existingTax) {
      return NextResponse.json({ error: 'Tax name already exists' }, { status: 400 });
    }

    const tax = await prisma.taxSetting.create({
      data: {
        tax_name: tax_name.trim(),
        tax_per: parseFloat(tax_per),
      },
      select: {
        id: true,
        tax_name: true,
        tax_per: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      { tax, message: 'Tax created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create tax error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('tax_name')) {
      return NextResponse.json({ error: 'Tax name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create tax' }, { status: 500 });
  }
}