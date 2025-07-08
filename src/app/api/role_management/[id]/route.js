import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/roles/[id] - Get a specific role
export async function GET(request, { params }) {
  try {
    const roleId = idSchema.parse(params.id);

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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Get role error:', error);
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request, { params }) {
  try {
    const roleId = idSchema.parse(params.id);
    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (validatedData.roleName && validatedData.roleName !== existingRole.role_name) {
      const roleNameExists = await prisma.role.findUnique({
        where: { role_name: validatedData.roleName },
      });
      if (roleNameExists) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
      }
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        role_name: validatedData.roleName,
        description: validatedData.description,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Update role error:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(request, { params }) {
  try {
    const roleId = idSchema.parse(params.id);

    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({ message: 'Role deleted successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Delete role error:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}