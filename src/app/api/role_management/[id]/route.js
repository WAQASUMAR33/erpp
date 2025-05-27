import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    if (!prisma.role) {
      console.error('Prisma Role model is undefined');
      return NextResponse.json({ error: 'Role model not found' }, { status: 500 });
    }

    const roleId = parseInt(params.id);
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
  } catch (error) {
    console.error('Get role error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const roleId = parseInt(params.id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const data = await request.json();
    const { role_name, description } = data;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Validate fields
    if (role_name !== undefined) {
      if (typeof role_name !== 'string' || role_name.trim().length === 0) {
        return NextResponse.json({ error: 'Role name must be a non-empty string' }, { status: 400 });
      }
      if (role_name.trim().length > 50) {
        return NextResponse.json({ error: 'Role name exceeds 50 characters' }, { status: 400 });
      }

      // Check for duplicate role_name
      const duplicateRole = await prisma.role.findUnique({
        where: { role_name: role_name.trim() },
      });
      if (duplicateRole && duplicateRole.id !== roleId) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
      }
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string or null' }, { status: 400 });
    }

    // Update role
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        role_name: role_name ? role_name.trim() : existingRole.role_name,
        description: description !== undefined ? description : existingRole.description,
      },
      include: {
        user_roles: { select: { user_id: true } },
        role_permissions: { include: { permission: { select: { permission_name: true } } } },
      },
    });

    return NextResponse.json(
      { role, message: 'Role updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update role error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const roleId = parseInt(params.id);
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        user_roles: true,
        role_permissions: true,
      },
    });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check for dependencies
    if (role.user_roles.length > 0) {
      return NextResponse.json({ error: 'Cannot delete role with assigned users' }, { status: 409 });
    }
    if (role.role_permissions.length > 0) {
      return NextResponse.json({ error: 'Cannot delete role with assigned permissions' }, { status: 409 });
    }

    // Delete role
    await prisma.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({ message: 'Role deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete role error:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}