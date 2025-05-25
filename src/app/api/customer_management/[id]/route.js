import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid customer ID is required' }, { status: 400 });
    }

    if (!prisma.customer) {
      console.error('Prisma Customer model is undefined');
      return NextResponse.json({ error: 'Customer model not found' }, { status: 500 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
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

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid customer ID is required' }, { status: 400 });
    }

    const data = await request.json();
    const { name, email, phone, address, balance } = data;

    if (name && typeof name !== 'string') {
      return NextResponse.json({ error: 'Name must be a string' }, { status: 400 });
    }

    if (name && name.trim().length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (name && name.length > 255) {
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

    // Check if customer exists
    const customer = await prisma.customer.findUnique({ where: { id: parseInt(id) } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check for duplicate email (excluding current customer)
    if (email && email.trim() !== customer.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { email: email.trim() },
      });
      if (existingCustomer) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name: name ? name.trim() : customer.name,
        email: email !== undefined ? (email ? email.trim() : null) : customer.email,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : customer.phone,
        address: address !== undefined ? (address ? address.trim() : null) : customer.address,
        balance: balance !== undefined ? parseFloat(balance) : customer.balance,
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
      { customer: updatedCustomer, message: 'Customer updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid customer ID is required' }, { status: 400 });
    }

    if (!prisma.customer) {
      console.error('Prisma Customer model is undefined');
      return NextResponse.json({ error: 'Customer model not found' }, { status: 500 });
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({ where: { id: parseInt(id) } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check for related records
    const relatedCounts = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      select: {
        _count: {
          select: {
            invoices: true,
            sales: true,
            ledger_entries: true,
          },
        },
      },
    });

    if (relatedCounts._count.invoices > 0 || relatedCounts._count.sales > 0 || relatedCounts._count.ledger_entries > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with associated invoices, sales, or ledger entries' },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}