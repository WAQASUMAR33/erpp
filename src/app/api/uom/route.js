import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const uoms = await prisma.unitOfMeasurement.findMany();
    return NextResponse.json(uoms, { status: 200 });
  } catch (error) {
    console.error('Get UOMs error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch UOMs', details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { uom_title } = data;

    // Validate input
    if (!uom_title) {
      return NextResponse.json({ error: 'UOM title is required' }, { status: 400 });
    }
    if (typeof uom_title !== 'string') {
      return NextResponse.json({ error: 'UOM title must be a string' }, { status: 400 });
    }
    if (uom_title.trim().length > 255) {
      return NextResponse.json({ error: 'UOM title exceeds 255 characters' }, { status: 400 });
    }

    // Create UOM
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
    console.error('Create UOM error:', error.message, error.stack);
    if (error.code === 'P2002' && error.meta?.target?.includes('uom_title')) {
      return NextResponse.json({ error: 'UOM title already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create UOM', details: error.message }, { status: 500 });
  }
}