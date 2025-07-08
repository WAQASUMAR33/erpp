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

      const role = await prisma.Role.findUnique({
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

    const roles = await prisma.Role.findMany({
      orderBy: { roleName: 'asc' },
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
    const { roleName, description } = data;

    // Validate required fields
    if (!roleName || typeof roleName !== 'string' || roleName.trim().length === 0) {
      return NextResponse.json({ error: 'Role name is required and must be a non-empty string' }, { status: 400 });
    }
    if (roleName.trim().length > 50) {
      return NextResponse.json({ error: 'Role name exceeds 50 characters' }, { status: 400 });
    }
    if (description && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    // Check for duplicate roleName
    const existingRole = await prisma.Role.findUnique({
      where: { roleName: roleName.trim() },
    });
    if (existingRole) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
    }

    // Create role
    const role = await prisma.Role.create({
      data: {
        roleName: roleName.trim(),
        description: description || null,
      },
      // include: {
      //   UserRole: { select: { userId: true } },
      //   RolePermission: { include: { Permission: { select: { permissionName: true } } } },
      // },
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