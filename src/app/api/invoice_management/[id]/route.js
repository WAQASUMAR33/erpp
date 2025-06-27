import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Validate the id parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid invoice id (integer) is required' },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        invoice_items: {
          select: {
            id: true,
            product_id: true,
            unit_price: true,
            quantity: true,
            total_amount: true,
            tax_amount: true,
            discount_per: true,
            discount_amount: true,
            net_total: true,
            supplier_id: true,
            tax_setting_id: true,
            created_at: true,
            updated_at: true,
          },
        },
        supplier: {
          select: {
            id: true,
            supplier_name: true,
            contact_name: true,
            email: true,
            phone: true,
            address: true,
            bank_name: true,
            bank_accountno: true,
            balance: true,
            tax_id: true,
            payment_terms: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: `Invoice with id ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice, { status: 200 });
  } catch (error) {
    console.error('Get invoice error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch invoice', details: error.message },
      { status: 500 }
    );
  }
}