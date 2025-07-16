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
        where: { id: supplierId },
        include: {
          products: { select: { product_id: true } },
          ledger_entries: { select: { id: true } },
        },
      });

      if (!supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
      }

      return NextResponse.json(supplier, { status: 200 });
    }

    const suppliers = await prisma.supplier.findMany({
      orderBy: { supplier_name: 'asc' },
      include: {
        products: { select: { product_id: true } },
        ledger_entries: { select: { id: true } },
      },
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
      account_type,
      contact_name,
      email,
      phone,
      address,
      shipping_address,
      bank_name,
      bank_accountno,
      bank_ifsc_code,
      balance,
      tax_id,
      tax_id2,
      tax_id3,
      is_register,
      credit_limit,
      debit_limit,
      credit_period,
      discount_type,
      payment_terms,
      status,
      remarks,
    } = data;

    const supplier = await prisma.supplier.create({
      data: {
        supplier_name: supplier_name?.trim() || '',
        account_type: account_type?.trim() || '',
        contact_name: contact_name?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address || null,
        shipping_address: shipping_address || null,
        bank_name: bank_name?.trim() || null,
        bank_accountno: bank_accountno?.trim() || null,
        bank_ifsc_code: bank_ifsc_code?.trim() || null,
        balance: balance !== undefined ? parseFloat(balance) : 0.0,
        tax_id: tax_id?.trim() || null,
        tax_id2: tax_id2?.trim() || null,
        tax_id3: tax_id3?.trim() || null,
        is_register: is_register !== undefined ? parseInt(is_register) : 1,
        credit_limit: credit_limit !== undefined ? parseFloat(credit_limit) : 0,
        debit_limit: debit_limit !== undefined ? parseFloat(debit_limit) : 0,
        credit_period: credit_period?.trim() || '',
        discount_type: discount_type?.trim() || '',
        payment_terms: payment_terms?.trim() || 'Net 30',
        status: status?.trim() || 'Active',
        remarks: remarks || null,
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