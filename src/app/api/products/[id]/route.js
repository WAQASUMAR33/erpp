import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
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
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
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

    const existingProduct = await prisma.products.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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

    const product = await prisma.products.update({
      where: { id: parseInt(id) },
      data: {
        item_name,
        item_code,
        barcode,
        uom: uom ?? existingProduct.uom,
        item_description,
        enable_batching: enable_batching ?? existingProduct.enable_batching,
        qunatity: qunatity ?? existingProduct.qunatity,
        cost_per_unit,
        value: value ?? existingProduct.value,
        min_order: min_order ?? existingProduct.min_order,
        category_id: category_id ? parseInt(category_id) : existingProduct.category_id,
        sub_category_id: sub_category_id ? parseInt(sub_category_id) : existingProduct.sub_category_id,
        remarks,
        default_tax_account: default_tax_account ?? existingProduct.default_tax_account,
        additional_cess,
        d_purchase_price_ex,
        d_purchase_price_in,
        d_sale_price_in,
        d_sale_price_ex,
        default_discount,
      },
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const existingProduct = await prisma.products.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.products.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}