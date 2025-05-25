import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!prisma.unitOfMeasurement) {
      console.error('Prisma UnitOfMeasurement model is undefined');
      return NextResponse.json({ error: 'UnitOfMeasurement model not found' }, { status: 500 });
    }

    const uoms = await prisma.unitOfMeasurement.findMany({
      orderBy: { uom_title: 'asc' },
      select: {
        id: true,
        uom_title: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(uoms, { status: 200 });
  } catch (error) {
    console.error('Get UOMs error:', error);
    return NextResponse.json({ error: 'Failed to fetch UOMs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { uom_title } = data;

    if (!uom_title) {
      return NextResponse.json({ error: 'UOM title is required' }, { status: 400 });
    }

    if (typeof uom_title !== 'string') {
      return NextResponse.json({ error: 'UOM title must be a string' }, { status: 400 });
    }

    if (uom_title.length > 255) {
      return NextResponse.json({ error: 'UOM title exceeds 255 characters' }, { status: 400 });
    }

    if (!prisma.unitOfMeasurement) {
      console.error('Prisma UnitOfMeasurement model is undefined');
      return NextResponse.json({ error: 'UnitOfMeasurement model not found' }, { status: 500 });
    }

    // Check for duplicate uom_title
    const existingUOM = await prisma.unitOfMeasurement.findFirst({
      where: { uom_title: uom_title.trim() },
    });
    if (existingUOM) {
      return NextResponse.json({ error: 'UOM title already exists' }, { status: 400 });
    }

    const uom = await prisma.unitOfMeasurement.create({
      data: {
        uom_title: uom_title.trim(),
      },
      select: {
        id: true,
        uom_title: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json(
      { uom, message: 'UOM created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create UOM error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('uom_title')) {
      return NextResponse.json({ error: 'UOM title already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create UOM' }, { status: 500 });
  }
}