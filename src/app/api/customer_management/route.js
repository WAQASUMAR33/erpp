import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.customer) {
      console.error('Prisma Customer model is undefined');
      return NextResponse.json({ error: 'Customer model not found' }, { status: 500 });
    }

    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        balance: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, email, phone, address, balance } = data;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (typeof name !== 'string') {
      return NextResponse.json({ error: 'Name must be a string' }, { status: 400 });
    }

    if (name.trim().length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (name.length > 255) {
      return NextResponse.json({ error: 'Name exceeds 255 characters' }, { status: 400 });
    }

    if (email && typeof email !== 'string') {
      return NextResponse.json({ error: 'Email must be a string' }, { status: 400 });
    }

    if (email && email.length > 255) {
      return NextResponse.json({ error: 'Email exceeds 255 characters' }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (phone && typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone must be a string' }, { status: 400 });
    }

    if (phone && phone.length > 50) {
      return NextResponse.json({ error: 'Phone exceeds 50 characters' }, { status: 400 });
    }

    if (address && typeof address !== 'string') {
      return NextResponse.json({ error: 'Address must be a string' }, { status: 400 });
    }

    if (balance !== undefined && (typeof balance !== 'number' || isNaN(balance))) {
      return NextResponse.json({ error: 'Balance must be a number' }, { status: 400 });
    }

    if (balance !== undefined && balance < 0) {
      return NextResponse.json({ error: 'Balance cannot be negative' }, { status: 400 });
    }

    if (!prisma.customer) {
      console.error('Prisma Customer model is undefined');
      return NextResponse.json({ error: 'Customer model not found' }, { status: 500 });
    }

    // Check for duplicate email if provided
    if (email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { email: email.trim() },
      });
      if (existingCustomer) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        balance: balance !== undefined ? parseFloat(balance) : 0.0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        balance: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      { customer, message: 'Customer created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create customer error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}