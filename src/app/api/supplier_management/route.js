import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    if (!prisma.supplier) {
      console.error('Prisma Supplier model is undefined');
      return NextResponse.json({ error: 'Supplier model not found' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const supplierId = parseInt(id);
      if (isNaN(supplierId)) {
        return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
      }

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
      }

      return NextResponse.json(supplier, { status: 200 });
    }

    const suppliers = await prisma.supplier.findMany({
      orderBy: { supplier_name: 'asc' }
      
    });

    return NextResponse.json(suppliers, { status: 200 });
  } catch (error) {
    console.error('Get suppliers error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      supplier_name,
      contact_name,
      email,
      phone,
      address,
      bank_name,
      bank_accountno,
      balance,
      tax_id,
      payment_terms,
      status,
    } = data;

    // Validate required fields
    if (!supplier_name || typeof supplier_name !== 'string' || supplier_name.trim().length === 0) {
      return NextResponse.json({ error: 'Supplier name is required and must be a non-empty string' }, { status: 400 });
    }
    if (supplier_name.trim().length > 255) {
      return NextResponse.json({ error: 'Supplier name exceeds 255 characters' }, { status: 400 });
    }

    // Validate optional fields
    if (contact_name && (typeof contact_name !== 'string' || contact_name.length > 255)) {
      return NextResponse.json({ error: 'Contact name must be a string with max 255 characters' }, { status: 400 });
    }
    if (email) {
      if (typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }
    if (phone && (typeof phone !== 'string' || phone.length > 50)) {
      return NextResponse.json({ error: 'Phone must be a string with max 50 characters' }, { status: 400 });
    }
    if (address && typeof address !== 'string') {
      return NextResponse.json({ error: 'Address must be a string' }, { status: 400 });
    }
    if (bank_name && (typeof bank_name !== 'string' || bank_name.length > 50)) {
      return NextResponse.json({ error: 'Bank name must be a string with max 50 characters' }, { status: 400 });
    }
    if (bank_accountno && (typeof bank_accountno !== 'string' || bank_accountno.length > 50)) {
      return NextResponse.json({ error: 'Bank account number must be a string with max 50 characters' }, { status: 400 });
    }
    if (balance !== undefined && (typeof balance !== 'number' || isNaN(balance))) {
      return NextResponse.json({ error: 'Balance must be a valid number' }, { status: 400 });
    }
    if (tax_id && (typeof tax_id !== 'string' || tax_id.length > 50)) {
      return NextResponse.json({ error: 'Tax ID must be a string with max 50 characters' }, { status: 400 });
    }
    if (payment_terms && (typeof payment_terms !== 'string' || payment_terms.length > 50)) {
      return NextResponse.json({ error: 'Payment terms must be a string with max 50 characters' }, { status: 400 });
    }
    if (status && (typeof status !== 'string' || !['Active', 'Inactive'].includes(status))) {
      return NextResponse.json({ error: 'Status must be "Active" or "Inactive"' }, { status: 400 });
    }

    // Check for duplicates
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        OR: [
          { supplier_name: supplier_name.trim() },
          email ? { email: email.trim() } : undefined,
        ].filter(Boolean),
      },
    });
    if (existingSupplier) {
      return NextResponse.json(
        { error: existingSupplier.supplier_name === supplier_name.trim() ? 'Supplier name already exists' : 'Email already exists' },
        { status: 409 }
      );
    }

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        supplier_name: supplier_name.trim(),
        contact_name: contact_name ? contact_name.trim() : null,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address || null,
        bank_name: bank_name ? bank_name.trim() : null,
        bank_accountno: bank_accountno ? bank_accountno.trim() : null,
        balance: parseFloat(balance)  !== undefined ? parseFloat(balance)  : 0.0,
        tax_id: tax_id ? tax_id.trim() : null,
        payment_terms: payment_terms ? payment_terms.trim() : 'Net 30',
        status: status || 'Active',
      },
      include: {
        products: { select: { product_id: true } },
        ledger_entries: { select: { id: true } },
      },
    });

    return NextResponse.json(
      { supplier, message: 'Supplier created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create supplier error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}