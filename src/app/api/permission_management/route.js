import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    if (!prisma.permission) {
      console.error('Prisma Permission model is undefined');
      return NextResponse.json({ error: 'Permission model not found' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const permissionId = parseInt(id);
      if (isNaN(permissionId)) {
        return NextResponse.json({ error: 'Invalid permission ID' }, { status: 400 });
      }

      const permission = await prisma.permission.findUnique({
        where: { id: permissionId },
        include: {
          role_permissions: { include: { role: { select: { role_name: true } } } },
        },
      });

      if (!permission) {
        return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
      }

      return NextResponse.json(permission, { status: 200 });
    }

    const permissions = await prisma.permission.findMany({
      orderBy: { permission_name: 'asc' },
      include: {
        role_permissions: { include: { role: { select: { role_name: true } } } },
      },
    });

    return NextResponse.json(permissions, { status: 200 });
  } catch (error) {
    console.error('Get permissions error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { permission_name, description } = data;

    // Validate required fields
    if (!permission_name || typeof permission_name !== 'string' || permission_name.trim().length === 0) {
      return NextResponse.json({ error: 'Permission name is required and must be a non-empty string' }, { status: 400 });
    }
    if (permission_name.trim().length > 50) {
      return NextResponse.json({ error: 'Permission name exceeds 50 characters' }, { status: 400 });
    }
    if (description && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    // Check for duplicate permission_name
    const existingPermission = await prisma.permission.findUnique({
      where: { permission_name: permission_name.trim() },
    });
    if (existingPermission) {
      return NextResponse.json({ error: 'Permission name already exists' }, { status: 409 });
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        permission_name: permission_name.trim(),
        description: description || null,
      },
      include: {
        role_permissions: { include: { role: { select: { role_name: true } } } },
      },
    });

    return NextResponse.json(
      { permission, message: 'Permission created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create permission error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}