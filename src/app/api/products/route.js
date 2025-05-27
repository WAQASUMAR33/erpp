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
          category: { select: { category_id: true, category_name: true } },
          sub_category: { select: { sub_category_id: true, sub_category_title: true } },
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
        category: { select: { category_id: true, category_name: true } },
        sub_category: { select: { sub_category_id: true, sub_category_title: true } },
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
    const data = await request.json();

    const {
      item_name, item_code, category_id, sub_category_id, barcode, uom_id,
      item_description, enable_batching, quantity, cost_per_unit, value,
      min_order, store_id, remarks, default_tax_account, additional_cess,
      d_purchase_price_ex, d_purchase_price_in, d_sale_price_in,
      d_sale_price_ex, default_discount,
    } = data;

    
    

    // Create product
    const product = await prisma.products.create({
      data: {
        item_name: item_name.trim(),
        item_code: item_code.trim(),
        category_id : parseInt(category_id),
        sub_category_id :parseInt(sub_category_id),
        barcode: barcode ? barcode.trim() : null,
        uom_id,
        item_description: item_description || null,
        enable_batching: enable_batching ?? 0,
        quantity: quantity ?? 0.0,
        cost_per_unit: cost_per_unit ?? null,
        value: value ?? 0.0,
        min_order: min_order ?? 0.0,
        store_id : parseInt(store_id),
        remarks: remarks || null,
        default_tax_account: default_tax_account || 'None',
        additional_cess: additional_cess || null,
        d_purchase_price_ex: d_purchase_price_ex ?? null,
        d_purchase_price_in: d_purchase_price_in ?? null,
        d_sale_price_in: d_sale_price_in ?? null,
        d_sale_price_ex: d_sale_price_ex ?? null,
        default_discount: default_discount ?? null,
      },
      include: {
        category: { select: { category_id: true, category_name: true } },
        sub_category: { select: { sub_category_id: true, sub_category_title: true } },
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