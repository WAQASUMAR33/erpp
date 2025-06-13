import prisma from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const subcategories = await prisma.SubCategory.findMany({
      where: { category_id: parseInt(id) },
    });

   
    return NextResponse.json(subcategories, { status: 200 });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}