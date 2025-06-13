import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { item_name: 'asc' },
      // Uncomment if you need related data
      // include: {
      //   category: { select: { id: true, category_name: true } },
      //   sub_category: { select: { id: true, sub_category_name: true } },
      // },
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

    // Destructure and sanitize input data
    const {
      item_name,
      item_code,
      barcode,
      category_id,
      sub_category_id,
      uom_id,
      store_id,
      item_description,
      enable_batching,
      quantity,
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
    } = data;

    // Basic validation for required fields
    if (!item_name || typeof item_name !== 'string') {
      return NextResponse.json({ error: 'Item name is required and must be a string' }, { status: 400 });
    }

    // Validate relation IDs if provided
    if (category_id && !(await prisma.category.findUnique({ where: { id: Number(category_id) } }))) {
      return NextResponse.json({ error: 'Invalid category_id' }, { status: 400 });
    }
    if (sub_category_id && !(await prisma.subCategory.findUnique({ where: { id: Number(sub_category_id) } }))) {
      return NextResponse.json({ error: 'Invalid sub_category_id' }, { status: 400 });
    }
    if (uom_id && !(await prisma.unitOfMeasurement.findUnique({ where: { id: Number(uom_id) } }))) {
      return NextResponse.json({ error: 'Invalid uom_id' }, { status: 400 });
    }
    if (store_id && !(await prisma.store.findUnique({ where: { id: Number(store_id) } }))) {
      return NextResponse.json({ error: 'Invalid store_id' }, { status: 400 });
    }

    // Create product with sanitized data
    const product = await prisma.product.create({
      data: {
        item_name: item_name.trim(),
        item_code: item_code?.trim() || null,
        barcode: barcode?.trim() || null,
        category: category_id ? { connect: { id: Number(category_id) } } : undefined,
        sub_category: sub_category_id ? { connect: { id: Number(sub_category_id) } } : undefined,
        uom: uom_id ? { connect: { id: Number(uom_id) } } : undefined,
        store: store_id ? { connect: { id: Number(store_id) } } : undefined,
        item_description: item_description?.trim() || null,
        enable_batching: Boolean(enable_batching), // Convert to boolean, default false
        quantity: Number(quantity) || 0, // Default to 0 if NaN or undefined
        cost_per_unit: Number(cost_per_unit) || null, // Nullable, default to null
        value: Number(value) || 0, // Default to 0
        min_order: Number(min_order) || 0, // Default to 0
        remarks: remarks?.trim() || null,
        default_tax_account: default_tax_account?.trim() || 'None',
        additional_cess: additional_cess?.trim() || null,
        purchase_price_ex: Number(d_purchase_price_ex) || null, // Nullable
        purchase_price_in: Number(d_purchase_price_in) || null, // Nullable
        sale_price_in: Number(d_sale_price_in) || null, // Nullable
        sale_price_ex: Number(d_sale_price_ex) || null, // Nullable
        b2b_rate: Number(data.b2b_rate) || 0, // Default to 0
        default_discount: Number(default_discount) || null, // Nullable
      },
    });

    return NextResponse.json(
      { product, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to create product', details: error.message }, { status: 500 });
  }
}