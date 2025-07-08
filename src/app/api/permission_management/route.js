import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

// GET /api/permissions - Get all permissions or a single permission by ID via query parameter
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const permissionId = parseInt(id, 10);
      if (isNaN(permissionId)) {
        return NextResponse.json({ error: 'Invalid permission ID' }, { status: 400 });
      }

      const permission = await prisma.permission.findUnique({
        where: { permissionId },
        include: {
          rolePermissions: { include: { role: { select: { roleName: true } } } },
        },
      });

      if (!permission) {
        return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
      }

      return NextResponse.json(permission, { status: 200 });
    }

    const permissions = await prisma.permission.findMany({
      orderBy: { permissionName: 'asc' },
      include: {
        rolePermissions: { include: { role: { select: { roleName: true } } } },
      },
    });

    return NextResponse.json(permissions, { status: 200 });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// POST /api/permissions - Create a new permission
export async function POST(request) {
  try {
    const data = await request.json();
    const { permissionName, module, description } = data;

    // Validate required fields
    if (!permissionName || typeof permissionName !== 'string' || permissionName.trim().length === 0) {
      return NextResponse.json({ error: 'Permission name is required and must be a non-empty string' }, { status: 400 });
    }
    if (permissionName.trim().length > 100) {
      return NextResponse.json({ error: 'Permission name exceeds 100 characters' }, { status: 400 });
    }
    if (!module || typeof module !== 'string' || module.trim().length === 0) {
      return NextResponse.json({ error: 'Module is required and must be a non-empty string' }, { status: 400 });
    }
    if (module.trim().length > 50) {
      return NextResponse.json({ error: 'Module exceeds 50 characters' }, { status: 400 });
    }
    if (description && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }
    if (description && description.length > 500) {
      return NextResponse.json({ error: 'Description exceeds 500 characters' }, { status: 400 });
    }

    // Check for duplicate permissionName
    const existingPermission = await prisma.permission.findUnique({
      where: { permissionName: permissionName.trim() },
    });
    if (existingPermission) {
      return NextResponse.json({ error: 'Permission name already exists' }, { status: 409 });
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        permissionName: permissionName.trim(),
        module: module.trim(),
        description: description || null,
      },
      include: {
        rolePermissions: { include: { role: { select: { roleName: true } } } },
      },
    });

    return NextResponse.json(
      { permission, message: 'Permission created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create permission error:', error);
    return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 });
  }
}