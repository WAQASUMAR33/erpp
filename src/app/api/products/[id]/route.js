import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';



export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid expense ID is required' }, { status: 400 });
    }

  

    const productss = await prisma.Product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!productss) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(productss, { status: 200 });
  } catch (error) {
    console.error('Get expense error:', error);
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
  }
}




export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Parse JSON
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const {
      item_name, item_code, category_id, sub_category_id,
      barcode, uom, item_desccription, enable_batching, qunatity, cost_per_unit,
      value, min_order, remarks, default_tax_account, additional_cess,
      d_purchase_price_ex, d_purchase_price_in, d_sale_price_in, d_sale_price_ex, default_discount
    } = data;

    // Check if at least one field is provided
    if (!item_name && !item_code && !category_id && !sub_category_id && !barcode && !uom &&
        !item_desccription && !enable_batching && !qunatity && !cost_per_unit && !value &&
        !min_order && !remarks && !default_tax_account && !additional_cess &&
        !d_purchase_price_ex && !d_purchase_price_in && !d_sale_price_in && !d_sale_price_ex && !default_discount) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
    }

    // Check model
    if (!prisma.Product) {
      console.error('Prisma products model is undefined');
      return NextResponse.json({ error: 'Products model not found' }, { status: 500 });
    }

    // Check product exists
    const existingProduct = await prisma.Product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate fields
    if (item_name && typeof item_name !== 'string') {
      return NextResponse.json({ error: 'Item name must be a string' }, { status: 400 });
    }
    if (item_code && typeof item_code !== 'string') {
      return NextResponse.json({ error: 'Item code must be a string' }, { status: 400 });
    }
    if (category_id && typeof category_id !== 'number') {
      return NextResponse.json({ error: 'Category ID must be a number' }, { status: 400 });
    }
    if (sub_category_id && typeof sub_category_id !== 'number') {
      return NextResponse.json({ error: 'Sub-category ID must be a number' }, { status: 400 });
    }
    if (barcode && typeof barcode !== 'string') {
      return NextResponse.json({ error: 'Barcode must be a string' }, { status: 400 });
    }
    if (uom && typeof uom !== 'number') {
      return NextResponse.json({ error: 'UOM must be a number' }, { status: 400 });
    }
    if (item_desccription && typeof item_desccription !== 'string') {
      return NextResponse.json({ error: 'Item description must be a string' }, { status: 400 });
    }
    if (enable_batching && typeof enable_batching !== 'number') {
      return NextResponse.json({ error: 'Enable batching must be a number' }, { status: 400 });
    }
    if (qunatity && typeof qunatity !== 'number') {
      return NextResponse.json({ error: 'Quantity must be a number' }, { status: 400 });
    }
    if (cost_per_unit && typeof cost_per_unit !== 'number') {
      return NextResponse.json({ error: 'Cost per unit must be a number' }, { status: 400 });
    }
    if (value && typeof value !== 'number') {
      return NextResponse.json({ error: 'Value must be a number' }, { status: 400 });
    }
    if (min_order && typeof min_order !== 'number') {
      return NextResponse.json({ error: 'Min order must be a number' }, { status: 400 });
    }
    if (remarks && typeof remarks !== 'string') {
      return NextResponse.json({ error: 'Remarks must be a string' }, { status: 400 });
    }
    if (default_tax_account && typeof default_tax_account !== 'string') {
      return NextResponse.json({ error: 'Default tax account must be a string' }, { status: 400 });
    }
    if (additional_cess && typeof additional_cess !== 'string') {
      return NextResponse.json({ error: 'Additional cess must be a string' }, { status: 400 });
    }
    if (d_purchase_price_ex && typeof d_purchase_price_ex !== 'number') {
      return NextResponse.json({ error: 'Purchase price (ex) must be a number' }, { status: 400 });
    }
    if (d_purchase_price_in && typeof d_purchase_price_in !== 'number') {
      return NextResponse.json({ error: 'Purchase price (in) must be a number' }, { status: 400 });
    }
    if (d_sale_price_in && typeof d_sale_price_in !== 'number') {
      return NextResponse.json({ error: 'Sale price (in) must be a number' }, { status: 400 });
    }
    if (d_sale_price_ex && typeof d_sale_price_ex !== 'number') {
      return NextResponse.json({ error: 'Sale price (ex) must be a number' }, { status: 400 });
    }
    if (default_discount && typeof default_discount !== 'number') {
      return NextResponse.json({ error: 'Default discount must be a number' }, { status: 400 });
    }

    // Check foreign keys
    if (category_id) {
      if (!prisma.category) {
        console.error('Prisma category model is undefined');
        return NextResponse.json({ error: 'Category model not found' }, { status: 500 });
      }
      const category = await prisma.category.findUnique({ where: { category_id } });
      if (!category) {
        return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
      }
    }
    if (sub_category_id) {
      if (!prisma.SubCategory) {
        console.error('Prisma sub_category model is undefined');
        return NextResponse.json({ error: 'Sub-category model not found' }, { status: 500 });
      }
      const subCategory = await prisma.SubCategory.findUnique({ where: { sub_category_id } });
      if (!subCategory) {
        return NextResponse.json({ error: 'Invalid sub-category ID' }, { status: 400 });
      }
    }

    // Update product
    const product = await prisma.Product.update({
      where: { id },
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
      { product, message: 'Product updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update product error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Check model
    if (!prisma.Product) {
      console.error('Prisma products model is undefined');
      return NextResponse.json({ error: 'Products model not found' }, { status: 500 });
    }

    // Check product exists
    const existingProduct = await prisma.Product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete product
    await prisma.Product.delete({ where: { id } });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete product error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}