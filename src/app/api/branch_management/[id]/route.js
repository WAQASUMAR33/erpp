import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const category = await prisma.Store.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error('Get Store error:', error);
    return NextResponse.json({ error: 'Failed to fetch Store' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { branch_title, sub_title, address, phone, email, logo_path, website, tax_no} = await request.json();

    if (!branch_title) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }

    const existingstore = await prisma.Store.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingstore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const store = await prisma.Store.update({
      where: { id: parseInt(id) },
      data: { 
        branch_title, 
        address,
        phone,
        sub_title,
        email,
        website,
        logo_path,
        tax_no         
       },
    });

    return NextResponse.json(store, { status: 200 });
  } catch (error) {
    console.error('Update Store error:', error);
    return NextResponse.json({ error: 'Failed to update Store' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const existingCategory = await prisma.Store.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }



    await prisma.Store.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}