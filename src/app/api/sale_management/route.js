import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      store_id,
      supplier_id,
      user_id,
      due_date,
      total_amount,
      discount_amount,
      total_tax,
      net_total,
      payment_status,
      payment_type,
      payment,
      details,
      order_items, // Maps to sale_items in Prisma
    } = data;

    // Validate required fields
    if (!user_id || isNaN(parseInt(user_id))) {
      return NextResponse.json({ error: 'Valid user_id (integer) is required' }, { status: 400 });
    }
    if (store_id && isNaN(parseInt(store_id))) {
      return NextResponse.json({ error: 'Valid store_id (integer) is required' }, { status: 400 });
    }
  
    if (!Number.isFinite(parseFloat(total_amount)) || parseFloat(total_amount) < 0) {
      return NextResponse.json(
        { error: 'Valid total_amount (non-negative number) is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(parseFloat(discount_amount)) || parseFloat(discount_amount) < 0) {
      return NextResponse.json(
        { error: 'Valid discount_amount (non-negative number) is required' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(parseFloat(total_tax)) || parseFloat(total_tax) < 0) {
      return NextResponse.json(
        { error: 'Valid total_tax (non-negative number) is required' },
        { status: 400 }
      );
    }

    // Validate sale_items (order_items in input)
    if (!Array.isArray(order_items) || order_items.length === 0) {
      return NextResponse.json({ error: 'At least one sale item is required' }, { status: 400 });
    }

    // Validate foreign keys
    if (!(await prisma.user.findUnique({ where: { id: parseInt(user_id) } }))) {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
    }
    if (store_id && !(await prisma.store.findUnique({ where: { id: parseInt(store_id) } }))) {
      return NextResponse.json({ error: 'Invalid store_id' }, { status: 400 });
    }
    if (supplier_id && !(await prisma.supplier.findUnique({ where: { id: parseInt(supplier_id) } }))) {
      return NextResponse.json({ error: 'Invalid supplier_id' }, { status: 400 });
    }

    // Validate sale_items fields and foreign keys
    for (const item of order_items) {
      const {
        product_id,
        unit_price,
        quantity,
        total,
        tax_setting_id,
        tax_per,
        tax_amount,
        dis_per,
        dis_amount,
        net_total: item_net_total,
        created_at: item_created_at,
        updated_at: item_updated_at,
      } = item;

      if (!product_id || isNaN(parseInt(product_id))) {
        return NextResponse.json(
          { error: 'Valid product_id (integer) is required for each sale item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(parseFloat(unit_price)) || parseFloat(unit_price) < 0) {
        return NextResponse.json(
          { error: 'Valid unit_price (non-negative number) is required for each sale item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
        return NextResponse.json(
          { error: 'Valid quantity (positive number) is required for each sale item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(parseFloat(total)) || parseFloat(total) < 0) {
        return NextResponse.json(
          { error: 'Valid total (non-negative number) is required for each sale item' },
          { status: 400 }
        );
      }
      if (tax_setting_id && isNaN(parseInt(tax_setting_id))) {
        return NextResponse.json(
          { error: 'Valid tax_setting_id (integer) is required for each sale item' },
          { status: 400 }
        );
      }
      if (tax_per && (!Number.isFinite(parseFloat(tax_per)) || parseFloat(tax_per) < 0)) {
        return NextResponse.json(
          { error: 'Valid tax_per (non-negative number) is required for each sale item' },
          { status: 400 }
        );
      }
      if (tax_amount && (!Number.isFinite(parseFloat(tax_amount)) || parseFloat(tax_amount) < 0)) {
        return NextResponse.json(
          { error: 'Valid tax_amount (non-negative number) is required for each sale item' },
          { status: 400 }
        );
      }
      if (dis_per && (!Number.isFinite(parseFloat(dis_per)) || parseFloat(dis_per) < 0)) {
        return NextResponse.json(
          { error: 'Valid dis_per (non-negative number) is required for each sale item' },
          { status: 400 }
        );
      }
      if (dis_amount && (!Number.isFinite(parseFloat(dis_amount)) || parseFloat(dis_amount) < 0)) {
        return NextResponse.json(
          { error: 'Valid dis_amount (non-negative number) is required for each sale item' },
          { status: 400 }
        );
      }
      if (!Number.isFinite(parseFloat(item_net_total)) || parseFloat(item_net_total) < 0) {
        return NextResponse.json(
          { error: 'Valid net_total (non-negative number) is required for each sale item' },
          { status: 400 }
        );
      }
      if (item_created_at && isNaN(Date.parse(item_created_at))) {
       return NextResponse.json(
          { error: 'Valid created_at (ISO date string) is required for each sale item' },
          { status: 400 }
        );
      }
      if (item_updated_at && isNaN(Date.parse(item_updated_at))) {
        return NextResponse.json(
          { error: 'Valid updated_at (ISO date string) is required for each sale item' },
          { status: 400 }
        );
      }

      if (!(await prisma.product.findUnique({ where: { id: parseInt(product_id) } }))) {
        return NextResponse.json({ error: `Invalid product_id: ${product_id}` }, { status: 400 });
      }
      if (tax_setting_id && !(await prisma.taxSetting.findUnique({ where: { id: parseInt(tax_setting_id) } }))) {
        return NextResponse.json({ error: `Invalid tax_setting_id: ${tax_setting_id}` }, { status: 400 });
      }
    }

    // Create Sale and SaleItems in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Prepare sale data, omitting created_at and updated_at to use Prisma defaults
      const saleData = {
        user_id: parseInt(user_id),
        supplier_id: supplier_id ? parseInt(supplier_id) : null,
        store_id: store_id ? parseInt(store_id) : null,
        due_date: due_date ? new Date(due_date) : new Date(),
        total_amount: parseFloat(total_amount),
        discount_amount: parseFloat(discount_amount),
        total_tax: parseFloat(total_tax),
        net_total,
        payment_status,
        payment_type: parseFloat(payment_type),
        payment: parseFloat(payment),
        details: details || '',
      };

      // Create Sale
      const sale = await tx.sale.create({
        data: saleData,
        select: {
          id: true,
          net_total: true,
          created_at: true,
        },
      });

      // Create SaleItems
      const createdItems = await Promise.all(
        order_items.map((item) =>
          tx.saleItem.create({
            data: {
              sale_id: sale.id,
              product_id: parseInt(item.product_id),
              unit_price: parseFloat(item.unit_price),
              quantity: parseFloat(item.quantity),
              total: parseFloat(item.total),
              tax_setting_id: item.tax_setting_id ? parseInt(item.tax_setting_id) : null,
              tax_per: item.tax_per ? parseFloat(item.tax_per) : 0,
              tax_amount: item.tax_amount ? parseFloat(item.tax_amount) : 0,
              dis_per: item.dis_per ? parseFloat(item.dis_per) : 0,
              dis_amount: item.dis_amount ? parseFloat(item.dis_amount) : 0,
              net_total: parseFloat(item.net_total),
              created_at: item.created_at && !isNaN(Date.parse(item.created_at)) ? new Date(item.created_at) : new Date(),
              updated_at: item.updated_at && !isNaN(Date.parse(item.updated_at)) ? new Date(item.created_at) : new Date(),
            },
            select: {
              id: true,
              product_id: true,
              total: true,
              created_at: true,
            },
          })
        )
      );

      return { sale, sale_items: createdItems };
    });

    return NextResponse.json(
      {
        sale: result.sale,
        sale_items: result.sale_items,
        message: 'Sale and items created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create sale error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to create sale', details: error.message },
      { status: 500 }
    );
  }
}




export async function GET() {
  try {
    // Fetch all sales
    const sales = await prisma.sale.findMany({
      include: {
        sale_items: {
          select: {
            id: true,
            sale_id: true,
            product_id: true,
            tax_setting_id: true,
            quantity: true,
            unit_price: true,
            total: true,
            dis_per: true,
            dis_amount: true,
            tax_per: true,
            tax_amount: true,
            net_total: true,
            created_at: true,
            updated_at: true,
            product: {
              select: { item_name: true },
            },
          },
        },
        supplier: {  },
      },
    });

    // Flatten sale_items to include item_name in the same row
    const flattenedSales = sales.map(sale => ({
      ...sale,
      sale_items: sale.sale_items.map(item => ({
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        tax_setting_id: item.tax_setting_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        dis_per: item.dis_per,
        dis_amount: item.dis_amount,
        tax_per: item.tax_per,
        tax_amount: item.tax_amount,
        net_total: item.net_total,
        created_at: item.created_at,
        updated_at: item.updated_at,
        item_name: item.product.item_name,
      })),
    }));

    return NextResponse.json(flattenedSales , { status: 200 });
  } catch (error) {
    console.error('Get sales error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch sales', details: error.message },
      { status: 500 }
    );
  }
}