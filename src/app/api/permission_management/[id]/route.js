import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    if (!prisma.permission) {
      console.error('Prisma Permission model is undefined');
      return NextResponse.json({ error: 'Permission model not found' }, { status: 500 });
    }

    const permissionId = parseInt(params.id);
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
  } catch (error) {
    console.error('Get permission error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch permission' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const permissionId = parseInt(params.id);
    if (isNaN(permissionId)) {
      return NextResponse.json({ error: 'Invalid permission ID' }, { status: 400 });
    }

    const data = await request.json();
    const { permission_name, description } = data;

    // Check if permission exists
    const existingPermission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!existingPermission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Validate fields
    if (permission_name !== undefined) {
      if (typeof permission_name !== 'string' || permission_name.trim().length === 0) {
        return NextResponse.json({ error: 'Permission name must be a non-empty string' }, { status: 400 });
      }
      if (permission_name.trim().length > 50) {
        return NextResponse.json({ error: 'Permission name exceeds 50 characters' }, { status: 400 });
      }

      // Check for duplicate permission_name
      const duplicatePermission = await prisma.permission.findUnique({
        where: { permission_name: permission_name.trim() },
      });
      if (duplicatePermission && duplicatePermission.id !== permissionId) {
        return NextResponse.json({ error: 'Permission name already exists' }, { status: 409 });
      }
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string or null' }, { status: 400 });
    }

    // Update permission
    const permission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        permission_name: permission_name ? permission_name.trim() : existingPermission.permission_name,
        description: description !== undefined ? description : existingPermission.description,
      },
      include: {
        role_permissions: { include: { role: { select: { role_name: true } } } },
      },
    });

    return NextResponse.json(
      { permission, message: 'Permission updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update permission error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const permissionId = parseInt(params.id);
    if (isNaN(permissionId)) {
      return NextResponse.json({ error: 'Invalid permission ID' }, { status: 400 });
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        role_permissions: true,
      },
    });
    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Check for dependencies
    if (permission.role_permissions.length > 0) {
      return NextResponse.json({ error: 'Cannot delete permission assigned to roles' }, { status: 409 });
    }

    // Delete permission
    await prisma.permission.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({ message: 'Permission deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete permission error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
  }
}