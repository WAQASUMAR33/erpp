import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    if (!prisma.role) {
      console.error('Prisma Role model is undefined');
      return NextResponse.json({ error: 'Role model not found' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const roleId = parseInt(id);
      if (isNaN(roleId)) {
        return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
      }

      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          user_roles: { select: { user_id: true } },
          role_permissions: { include: { permission: { select: { permission_name: true } } } },
        },
      });

      if (!role) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }

      return NextResponse.json(role, { status: 200 });
    }

    const roles = await prisma.role.findMany({
      orderBy: { role_name: 'asc' },
      include: {
        user_roles: { select: { user_id: true } },
        role_permissions: { include: { permission: { select: { permission_name: true } } } },
      },
    });

    return NextResponse.json(roles, { status: 200 });
  } catch (error) {
    console.error('Get roles error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { role_name, description } = data;

    // Validate required fields
    if (!role_name || typeof role_name !== 'string' || role_name.trim().length === 0) {
      return NextResponse.json({ error: 'Role name is required and must be a non-empty string' }, { status: 400 });
    }
    if (role_name.trim().length > 50) {
      return NextResponse.json({ error: 'Role name exceeds 50 characters' }, { status: 400 });
    }
    if (description && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    // Check for duplicate role_name
    const existingRole = await prisma.role.findUnique({
      where: { role_name: role_name.trim() },
    });
    if (existingRole) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        role_name: role_name.trim(),
        description: description || null,
      },
      include: {
        user_roles: { select: { user_id: true } },
        role_permissions: { include: { permission: { select: { permission_name: true } } } },
      },
    });

    return NextResponse.json(
      { role, message: 'Role created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create role error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}