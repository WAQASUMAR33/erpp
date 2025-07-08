import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

// POST /api/assign-roles-permissions - Assign multiple roles to a user and permissions to each role
export async function POST(request) {
  try {
    const data = await request.json();
    const { userId, roles } = data;

    // Validate input
    if (!userId || isNaN(parseInt(userId, 10))) {
      return NextResponse.json({ error: 'Valid user ID is required' }, { status: 400 });
    }
    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: 'Roles must be a non-empty array' }, { status: 400 });
    }

    // Validate each role entry
    for (const role of roles) {
      if (!role.roleId || isNaN(parseInt(role.roleId, 10))) {
        return NextResponse.json({ error: 'Valid role ID is required for each role' }, { status: 400 });
      }
      if (role.permissionIds && !Array.isArray(role.permissionIds)) {
        return NextResponse.json({ error: 'permissionIds must be an array' }, { status: 400 });
      }
      if (role.permissionIds) {
        for (const permId of role.permissionIds) {
          if (isNaN(parseInt(permId, 10))) {
            return NextResponse.json({ error: 'Valid permission ID is required for each permission' }, { status: 400 });
          }
        }
      }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId, 10) } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate roles and permissions, and check for duplicates
    const userRoleData = [];
    const rolePermissionData = [];
    const uniqueRoleIds = new Set();
    const uniqueRolePermissionPairs = new Set();

    for (const role of roles) {
      const roleId = parseInt(role.roleId, 10);

      // Check if role exists
      const roleRecord = await prisma.role.findUnique({ where: { id: roleId } });
      if (!roleRecord) {
        return NextResponse.json({ error: `Role with ID ${roleId} not found` }, { status: 404 });
      }

      // Check for duplicate role assignment
      const userRoleKey = `${userId}-${roleId}`;
      if (uniqueRoleIds.has(userRoleKey)) {
        return NextResponse.json({ error: `Duplicate role ID ${roleId} for user` }, { status: 400 });
      }
      uniqueRoleIds.add(userRoleKey);

      // Check for existing user-role assignment
      const existingUserRole = await prisma.userRole.findUnique({
        where: { userId_roleId: { userId: parseInt(userId, 10), roleId } },
      });
      if (existingUserRole) {
        return NextResponse.json({ error: `User already assigned to role ID ${roleId}` }, { status: 409 });
      }

      userRoleData.push({ userId: parseInt(userId, 10), roleId });

      // Process permissions for the role
      if (role.permissionIds && role.permissionIds.length > 0) {
        for (const permId of role.permissionIds) {
          const permissionId = parseInt(permId, 10);

          // Check if permission exists
          const permission = await prisma.permission.findUnique({ where: { permissionId } });
          if (!permission) {
            return NextResponse.json({ error: `Permission with ID ${permissionId} not found` }, { status: 404 });
          }

          // Check for duplicate role-permission pair
          const rolePermKey = `${roleId}-${permissionId}`;
          if (uniqueRolePermissionPairs.has(rolePermKey)) {
            return NextResponse.json({ error: `Duplicate permission ID ${permissionId} for role ID ${roleId}` }, { status: 400 });
          }
          uniqueRolePermissionPairs.add(rolePermKey);

          // Check for existing role-permission assignment
          const existingRolePerm = await prisma.rolePermission.findUnique({
            where: { roleId_permissionId: { roleId, permissionId } },
          });
          if (existingRolePerm) {
            return NextResponse.json({ error: `Permission ID ${permissionId} already assigned to role ID ${roleId}` }, { status: 409 });
          }

          rolePermissionData.push({ roleId, permissionId });
        }
      }
    }

    // Create all assignments in a transaction
    await prisma.$transaction([
      prisma.userRole.createMany({ data: userRoleData }),
      prisma.rolePermission.createMany({ data: rolePermissionData }),
    ]);

    // Fetch the created records for response
    const userRoles = await prisma.userRole.findMany({
      where: { userId: parseInt(userId, 10), roleId: { in: roles.map(r => parseInt(r.roleId, 10)) } },
      include: {
        user: { select: { username: true, fullname: true } },
        role: { select: { roleName: true } },
      },
    });

    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: { in: roles.map(r => parseInt(r.roleId, 10)) },
        permissionId: { in: roles.flatMap(r => r.permissionIds || []).map(p => parseInt(p, 10)) },
      },
      include: {
        role: { select: { roleName: true } },
        permission: { select: { permissionName: true, module: true } },
      },
    });

    return NextResponse.json(
      {
        userRoles,
        rolePermissions,
        message: 'Roles and permissions assigned successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Assign roles and permissions error:', error);
    return NextResponse.json({ error: 'Failed to assign roles and permissions' }, { status: 500 });
  }
}