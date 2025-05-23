import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const products = await prisma.products.findMany({
      orderBy: { item_name: 'asc' },
      include: {
        category: { select: { category_id: true, category_name: true } },
        sub_category: { select: { sub_category_id: true, sub_category_title: true } },
      },
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      item_name,
      item_code,
      barcode,
      uom,
      item_description,
      enable_batching,
      qunatity,
      cost_per_unit,
      value,
      min_order,
      category_id,
      sub_category_id,
      remarks,
      default_tax_account,
      additional_cess,
      d_purchase_price_ex,
      d_purchase_price_in,
      d_sale_price_in,
      d_sale_price_ex,
      default_discount,
    } = data;

    if (!item_name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    // Validate category_id if provided
    if (category_id) {
      const category = await prisma.category.findUnique({
        where: { category_id: parseInt(category_id) },
      });
      if (!category) {
        return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
      }
    }

    // Validate sub_category_id if provided
    if (sub_category_id) {
      const subCategory = await prisma.sub_category.findUnique({
        where: { sub_category_id: parseInt(sub_category_id) },
      });
      if (!subCategory) {
        return NextResponse.json({ error: 'Invalid sub-category ID' }, { status: 400 });
      }
    }

    const product = await prisma.products.create({
      data: {
        item_name,
        item_code,
        barcode,
        uom: uom ?? 0.0,
        item_description,
        enable_batching: enable_batching ?? 0,
        qunatity: qunatity ?? 0.0,
        cost_per_unit,
        value: value ?? 0.0,
        min_order: min_order ?? 0.0,
        category_id: category_id ? parseInt(category_id) : null,
        sub_category_id: sub_category_id ? parseInt(sub_category_id) : null,
        remarks,
        default_tax_account: default_tax_account ?? 'None',
        additional_cess,
        d_purchase_price_ex,
        d_purchase_price_in,
        d_sale_price_in,
        d_sale_price_ex,
        default_discount,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}