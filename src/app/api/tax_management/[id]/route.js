import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid tax ID is required' }, { status: 400 });
    }

    if (!prisma.taxSetting) {
      console.error('Prisma TaxSetting model is undefined');
      return NextResponse.json({ error: 'TaxSetting model not found' }, { status: 500 });
    }

    const tax = await prisma.taxSetting.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        tax_name: true,
        tax_per: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!tax) {
      return NextResponse.json({ error: 'Tax not found' }, { status: 404 });
    }

    return NextResponse.json(tax, { status: 200 });
  } catch (error) {
    console.error('Get tax error:', error);
    return NextResponse.json({ error: 'Failed to fetch tax' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid tax ID is required' }, { status: 400 });
    }

    const data = await request.json();
    const { tax_name, tax_per } = data;

    if (tax_name && typeof tax_name !== 'string') {
      return NextResponse.json({ error: 'Tax name must be a string' }, { status: 400 });
    }

    if (tax_name && tax_name.length > 255) {
      return NextResponse.json({ error: 'Tax name exceeds 255 characters' }, { status: 400 });
    }

    if (tax_per !== undefined && (typeof tax_per !== 'number' || isNaN(tax_per))) {
      return NextResponse.json({ error: 'Tax percentage must be a number' }, { status: 400 });
    }

    if (tax_per !== undefined && tax_per < 0) {
      return NextResponse.json({ error: 'Tax percentage cannot be negative' }, { status: 400 });
    }

    if (!prisma.taxSetting) {
      console.error('Prisma TaxSetting model is undefined');
      return NextResponse.json({ error: 'TaxSetting model not found' }, { status: 500 });
    }

    // Check if tax exists
    const tax = await prisma.taxSetting.findUnique({ where: { id: parseInt(id) } });
    if (!tax) {
      return NextResponse.json({ error: 'Tax not found' }, { status: 404 });
    }

    // Check for duplicate tax_name (excluding current tax)
    if (tax_name && tax_name.trim() !== tax.tax_name) {
      const existingTax = await prisma.taxSetting.findFirst({
        where: { tax_name: tax_name.trim() },
      });
      if (existingTax) {
        return NextResponse.json({ error: 'Tax name already exists' }, { status: 400 });
      }
    }

    const updatedTax = await prisma.taxSetting.update({
      where: { id: parseInt(id) },
      data: {
        tax_name: tax_name ? tax_name.trim() : tax.tax_name,
        tax_per: tax_per !== undefined ? parseFloat(tax_per) : tax.tax_per,
      },
      select: {
        id: true,
        tax_name: true,
        tax_per: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      { tax: updatedTax, message: 'Tax updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update tax error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('tax_name')) {
      return NextResponse.json({ error: 'Tax name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update tax' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid tax ID is required' }, { status: 400 });
    }

    if (!prisma.taxSetting) {
      console.error('Prisma TaxSetting model is undefined');
      return NextResponse.json({ error: 'TaxSetting model not found' }, { status: 500 });
    }

    // Check if tax exists
    const tax = await prisma.taxSetting.findUnique({ where: { id: parseInt(id) } });
    if (!tax) {
      return NextResponse.json({ error: 'Tax not found' }, { status: 404 });
    }

    // Check for related invoice_items or sale_items
    const relatedCounts = await prisma.taxSetting.findUnique({
      where: { id: parseInt(id) },
      select: {
        _count: {
          select: {
            invoice_items: true,
            sale_items: true,
          },
        },
      },
    });

    if (relatedCounts._count.invoice_items > 0 || relatedCounts._count.sale_items > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tax with associated invoice items or sale items' },
        { status: 400 }
      );
    }

    await prisma.taxSetting.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: 'Tax deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete tax error:', error);
    return NextResponse.json({ error: 'Failed to delete tax' }, { status: 500 });
  }
}