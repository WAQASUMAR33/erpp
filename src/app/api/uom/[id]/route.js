import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid UOM ID is required' }, { status: 400 });
    }

    if (!prisma.unitOfMeasurement) {
      console.error('Prisma UnitOfMeasurement model is undefined');
      return NextResponse.json({ error: 'UnitOfMeasurement model not found' }, { status: 500 });
    }

    const uom = await prisma.unitOfMeasurement.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        uom_title: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!uom) {
      return NextResponse.json({ error: 'UOM not found' }, { status: 404 });
    }

    return NextResponse.json(uom, { status: 200 });
  } catch (error) {
    console.error('Get UOM error:', error);
    return NextResponse.json({ error: 'Failed to fetch UOM' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid UOM ID is required' }, { status: 400 });
    }

    const data = await request.json();
    const { uom_title } = data;

    if (uom_title && typeof uom_title !== 'string') {
      return NextResponse.json({ error: 'UOM title must be a string' }, { status: 400 });
    }

    if (uom_title && uom_title.length > 255) {
      return NextResponse.json({ error: 'UOM title exceeds 255 characters' }, { status: 400 });
    }

    if (!prisma.unitOfMeasurement) {
      console.error('Prisma UnitOfMeasurement model is undefined');
      return NextResponse.json({ error: 'UnitOfMeasurement model not found' }, { status: 500 });
    }

    // Check if UOM exists
    const uom = await prisma.unitOfMeasurement.findUnique({ where: { id: parseInt(id) } });
    if (!uom) {
      return NextResponse.json({ error: 'UOM not found' }, { status: 404 });
    }

    // Check for duplicate uom_title (excluding current UOM)
    if (uom_title && uom_title.trim() !== uom.uom_title) {
      const existingUOM = await prisma.unitOfMeasurement.findFirst({
        where: { uom_title: uom_title.trim() },
      });
      if (existingUOM) {
        return NextResponse.json({ error: 'UOM title already exists' }, { status: 400 });
      }
    }

    const updatedUOM = await prisma.unitOfMeasurement.update({
      where: { id: parseInt(id) },
      data: {
        uom_title: uom_title ? uom_title.trim() : uom.uom_title,
      },
      select: {
        id: true,
        uom_title: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      { uom: updatedUOM, message: 'UOM updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update UOM error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('uom_title')) {
      return NextResponse.json({ error: 'UOM title already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update UOM' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid UOM ID is required' }, { status: 400 });
    }

    if (!prisma.unitOfMeasurement) {
      console.error('Prisma UnitOfMeasurement model is undefined');
      return NextResponse.json({ error: 'UnitOfMeasurement model not found' }, { status: 500 });
    }

    // Check if UOM exists
    const uom = await prisma.unitOfMeasurement.findUnique({ where: { id: parseInt(id) } });
    if (!uom) {
      return NextResponse.json({ error: 'UOM not found' }, { status: 404 });
    }

    // Check for related products
    const relatedCounts = await prisma.unitOfMeasurement.findUnique({
      where: { id: parseInt(id) },
      select: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (relatedCounts._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete UOM with associated products' },
        { status: 400 }
      );
    }

    await prisma.unitOfMeasurement.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: 'UOM deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete UOM error:', error);
    return NextResponse.json({ error: 'Failed to delete UOM' }, { status: 500 });
  }
}