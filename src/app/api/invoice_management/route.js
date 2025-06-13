import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
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
      },
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    console.error('Get invoices error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      store_id,
      supplier_id,
      user_id,
      total_amount,
      tax_amount,
      net_total,
      pre_balance,
      payment,
      balance,
      paymode,
      bank_name,
      bank_cardno,
      details,
      invoice_id,
      invoice_items,
    } = data;

    // Validate Invoice required fields
     // Validate Invoice required fields
      // Validate Invoice required fields
       // Validate Invoice required fields
    if (!store_id || !Number.isInteger(store_id)) {
      return NextResponse.json({ error: 'Valid store_id is required' }, { status: 400 });
    }
    if (!supplier_id || !Number.isInteger(supplier_id)) {
      return NextResponse.json({ error: 'Valid supplier_id is required' }, { status: 400 });
    }
    if (!invoice_id || typeof invoice_id !== 'string' || invoice_id.length > 50) {
      return NextResponse.json(
        { error: 'Valid invoice_id (string, max 50 chars) is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(total_amount) || total_amount < 0) {
      return NextResponse.json(
        { error: 'Valid total_amount (non-negative number) is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(tax_amount) || tax_amount < 0) {
      return NextResponse.json(
        { error: 'Valid tax_amount (non-negative number) is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(net_total) || net_total < 0) {
      return NextResponse.json(
        { error: 'Valid net_total (non-negative number) is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(pre_balance)) {
      return NextResponse.json(
        { error: 'Valid pre_balance is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(payment) || payment < 0) {
      return NextResponse.json(
        { error: 'Valid payment (non-negative number) is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(balance)) {
      return NextResponse.json({ error: 'Valid balance is required' }, { status: 400 });
    }
    if (!paymode || typeof paymode !== 'string') {
      return NextResponse.json(
        { error: 'Valid paymode (string) is required' },
        { status: 400 }
      );
    }
    if (!bank_name || typeof bank_name !== 'string') {
      return NextResponse.json(
        { error: 'Valid bank_name (string) is required' },
        { status: 400 }
      );
    }
    if (!bank_cardno || typeof bank_cardno !== 'string') {
      return NextResponse.json(
        { error: 'Valid bank_cardno (string) is required' },
        { status: 400 }
      );
    }
    if (!details || typeof details !== 'string') {
      return NextResponse.json(
        { error: 'Valid details (string) is required' },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (user_id && !Number.isInteger(user_id)) {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
    }

    // Validate invoice_items array
    if (!Array.isArray(invoice_items) || invoice_items.length === 0) {
      return NextResponse.json(
        { error: 'At least one invoice item is required' },
        { status: 400 }
      );
    }

    // Validate foreign keys for Invoice
    if (!(await prisma.store.findUnique({ where: { id: store_id } }))) {
      return NextResponse.json({ error: 'Invalid store_id' }, { status: 400 });
    }
    if (!(await prisma.supplier.findUnique({ where: { id: supplier_id } }))) {
      return NextResponse.json({ error: 'Invalid supplier_id' }, { status: 400 });
    }
    if (user_id && !(await prisma.user.findUnique({ where: { id: user_id } }))) {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
    }
    if (await prisma.invoice.findUnique({ where: { invoice_id } })) {
      return NextResponse.json({ error: 'Invoice ID already exists' }, { status: 400 });
    }

    // Validate InvoiceItem fields and foreign keys
    for (const item of invoice_items) {
      const {
        product_id,
        unit_price,
        quantity,
        total_amount: item_total_amount,
        tax_setting_id,
        tax_amount: item_tax_amount,
        discount_per,
        discount_amount: item_discount_amount,
        net_total: item_net_total,
        supplier_id: item_supplier_id,
      } = item;

      if (!product_id || !Number.isInteger(product_id)) {
        return NextResponse.json(
          { error: 'Valid product_id is required for each invoice item' },
          { status: 400 }
        );
      }
      if (!item_supplier_id || !Number.isInteger(item_supplier_id)) {
        return NextResponse.json(
          { error: 'Valid supplier_id is required for each invoice item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(unit_price) || unit_price < 0) {
        return NextResponse.json(
          { error: 'Valid unit_price (non-negative number) is required for each invoice item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: 'Valid quantity (positive number) is required for each invoice item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item_total_amount) || item_total_amount < 0) {
        return NextResponse.json(
          { error: 'Valid total_amount (non-negative number) is required for each invoice item' },
          { status: 400 }
        );
      }
      if (tax_setting_id && !Number.isInteger(tax_setting_id)) {
        return NextResponse.json(
          { error: 'Invalid tax_setting_id in invoice item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item_tax_amount) || item_tax_amount < 0) {
        return NextResponse.json(
          { error: 'Valid tax_amount (non-negative number) is required for each invoice item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(discount_per) || discount_per < 0) {
        return NextResponse.json(
          { error: 'Valid discount_per (non-negative number) is required for each invoice item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item_discount_amount) || item_discount_amount < 0) {
        return NextResponse.json(
          { error: 'Valid discount_amount (non-negative number) is required for each invoice item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(item_net_total) || item_net_total < 0) {
        return NextResponse.json(
          { error: 'Valid net_total (non-negative number) is required for each invoice item' },
          { status: 400 }
        );
      }

      if (!(await prisma.product.findUnique({ where: { id: product_id } }))) {
        return NextResponse.json(
          { error: `Invalid product_id: ${product_id}` },
          { status: 400 }
        );
      }
      if (!(await prisma.supplier.findUnique({ where: { id: item_supplier_id } }))) {
        return NextResponse.json(
          { error: `Invalid supplier_id: ${item_supplier_id} in invoice item` },
          { status: 400 }
        );
      }
      if (
        tax_setting_id &&
        !(await prisma.taxSetting.findUnique({ where: { id: tax_setting_id } }))
      ) {
        return NextResponse.json(
          { error: `Invalid tax_setting_id: ${tax_setting_id}` },
          { status: 400 }
        );
      }
    }

    // Create Invoice and InvoiceItems in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          store_id: parseInt(store_id),
          supplier_id: parseInt(supplier_id),
          user_id:parseInt(user_id),
          total_amount :parseFloat(total_amount),
          tax_amount: parseFloat(tax_amount),
          net_total: parseFloat(net_total),
          pre_balance : parseFloat(pre_balance),
          payment: parseFloat(payment),
          balance : parseFloat(balance),
          paymode,
          bank_name,
          bank_cardno,
          details,
          invoice_id,
        },
        select: {
          id: true,
          invoice_id: true,
          created_at: true,
        },
      });

      // Create InvoiceItems
      const createdItems = await Promise.all(
        invoice_items.map((item) =>
          tx.invoiceItem.create({
            data: {
              invoice_id: invoice.id,
              product_id: parseInt(item.product_id) ,
              unit_price: parseFloat(item.unit_price),
              quantity: parseFloat( item.quantity),
              total_amount: parseFloat(item.total_amount),
              tax_setting_id: parseInt(item.tax_setting_id),
              tax_amount: parseFloat(item.tax_amount),
              discount_per: parseFloat(item.discount_per),
              discount_amount: parseFloat(item.discount_amount),
              net_total: parseFloat(item.net_total),
              supplier_id: parseInt(item.supplier_id),
            },
            select: {
              id: true,
              product_id: true,
              total_amount: true,
              created_at: true,
            },
          })
        )
      );

      return { invoice, invoice_items: createdItems };
    });

    return NextResponse.json(
      {
        invoice: result.invoice,
        invoice_items: result.invoice_items,
        message: 'Invoice and items created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create invoice error:', error.message, error.stack);
    if (error.code === 'P2002' && error.meta?.target?.includes('invoice_id')) {
      return NextResponse.json({ error: 'Invoice ID already exists' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error.message },
      { status: 500 }
    );
  }
}