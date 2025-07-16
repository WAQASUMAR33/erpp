import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    // Check if Prisma is properly initialized
    if (!prisma.product) {
      console.error('Prisma Product model is undefined');
      return NextResponse.json({ error: 'Product model not found' }, { status: 500 });
    }

    // Fetch products with related data in a flat structure
    const products = await prisma.product.findMany({
      select: {
        id: true,
        item_name: true,
        item_code: true,
        barcode: true,
        quantity: true,
        cost_per_unit: true,
        value: true,
        min_order: true,
        purchase_price_ex: true,
        purchase_price_in: true,
        sale_price_in: true,
        sale_price_ex: true,
        b2b_rate: true,
        default_discount: true,
        remarks: true,
        default_tax_account: true,
        additional_cess: true,
        // Category fields
        category: {
          select: {
            category_name: true,
          },
        },
        // SubCategory fields
        sub_category: {
          select: {
            sub_category_title: true,
          },
        },
        // Store fields
        store: {
          select: {
            branch_title: true,
            address: true,
            phone: true,
          },
        },
        // UnitOfMeasurement fields
        uom: {
          select: {
            uom_title: true,
          },
        },
        // Suppliers (select supplier names)
        suppliers: {
          select: {
            supplier: {
              select: {
                supplier_name: true,
              },
            },
          },
        },
        // InvoiceItems (aggregate total amount and quantity)
        invoice_items: {
          select: {
            total_amount: true,
            quantity: true,
          },
        },
        // SaleItems (aggregate total amount and quantity)
        sale_items: {
          select: {
            total: true,
            quantity: true,
          },
        },
      },
    });

    // Flatten the response
    const flattenedProducts = products.map(product => ({
      id: product.id,
      item_name: product.item_name ?? 'N/A',
      item_code: product.item_code ?? 'N/A',
      barcode: product.barcode ?? 'N/A',
      quantity: product.quantity,
      cost_per_unit: product.cost_per_unit ?? 0,
      value: product.value,
      min_order: product.min_order,
      purchase_price_ex: product.purchase_price_ex ?? 0,
      purchase_price_in: product.purchase_price_in ?? 0,
      sale_price_in: product.sale_price_in ?? 0,
      sale_price_ex: product.sale_price_ex ?? 0,
      b2b_rate: product.b2b_rate,
      default_discount: product.default_discount ?? 0,
      remarks: product.remarks ?? 'N/A',
      default_tax_account: product.default_tax_account,
      additional_cess: product.additional_cess ?? 'N/A',
      category_name: product.category?.category_name ?? 'N/A',
      sub_category_title: product.sub_category?.sub_category_title ?? 'N/A',
      store_branch_title: product.store?.branch_title ?? 'N/A',
      store_address: product.store?.address ?? 'N/A',
      store_phone: product.store?.phone ?? 'N/A',
      uom_title: product.uom?.uom_title ?? 'N/A',
      supplier_names: product.suppliers.length > 0 
        ? product.suppliers.map(s => s.supplier.supplier_name).join(', ') 
        : 'N/A',
      total_invoice_amount: product.invoice_items.reduce((sum, item) => sum + (item.total_amount || 0), 0),
      total_invoice_quantity: product.invoice_items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      total_sale_amount: product.sale_items.reduce((sum, item) => sum + (item.total || 0), 0),
      total_sale_quantity: product.sale_items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    }));
    return NextResponse.json(flattenedProducts, { status: 200 });
  } catch (error) {
    console.error('Get products error:', error);
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
      { message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to create product', details: error.message }, { status: 500 });
  }
}