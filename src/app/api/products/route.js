import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    if (!prisma.products) {
      console.error('Prisma products model is undefined');
      return NextResponse.json({ error: 'Products model not found' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const product = await prisma.products.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: { select: { category_id, category_name } },
          sub_category: { select: { sub_category_id, sub_category_title } },
        },
      });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json(product, { status: 200 });
    }

    const products = await prisma.products.findMany({
      orderBy: { item_name: 'asc' },
      include: {
        category: { select: { category_id, category_name } },
        sub_category: { select: { sub_category_id, sub_category_title } },
      },
    });
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Get products error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Parse JSON
  
    const data = await request.json();

    const {
      item_name, item_code, category_id, sub_category_id,
      barcode, uom, item_desccription, enable_batching, qunatity, cost_per_unit,
      value, min_order, remarks, default_tax_account, additional_cess,
      d_purchase_price_ex, d_purchase_price_in, d_sale_price_in, d_sale_price_ex, default_discount
    } = data;

    // Validate required fields
    if (!item_name || typeof item_name !== 'string') {
      return NextResponse.json({ error: 'Item name is required and must be a string' }, { status: 400 });
    }
    if (!item_code || typeof item_code !== 'string') {
      return NextResponse.json({ error: 'Item code is required and must be a string' }, { status: 400 });
    }
    if (!category_id || typeof category_id !== 'number') {
      return NextResponse.json({ error: 'Category ID is required and must be a number' }, { status: 400 });
    }
    if (!sub_category_id || typeof sub_category_id !== 'number') {
      return NextResponse.json({ error: 'Sub-category ID is required and must be a number' }, { status: 400 });
    }

  

    // Create product
    const product = await prisma.products.create({
      data: {
        item_name,
        item_code,
        category_id,
        sub_category_id,
        barcode,
        uom,
        item_desccription,
        enable_batching,
        qunatity,
        cost_per_unit,
        value,
        min_order,
        remarks,
        default_tax_account,
        additional_cess,
        d_purchase_price_ex,
        d_purchase_price_in,
        d_sale_price_in,
        d_sale_price_ex,
        default_discount,
      },
    });

    return NextResponse.json(
      { product, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}