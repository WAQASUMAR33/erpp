import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Password complexity: at least 8 chars, 1 letter, 1 number
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export async function POST(request) {
  try {
    const { 
      username, 
      password, 
      fullname, 
      role, 
      status, 
      store_id, 
      route, 
      terminal, 
      p_sales, 
      p_accounts, 
      p_view_sales, 
      p_purchases, 
      p_view_purchases, 
      p_sale_return, 
      p_view_products, 
      p_products_management, 
      p_dayend, 
      p_view_expences, 
      p_customer_management, 
      p_discounts, 
      p_employee_management, 
      p_printing, 
      p_view_customers, 
      p_users_management, 
      p_supplier_management 
    } = await request.json();

    // Input validation
    if (!username || typeof username !== 'string' || username.length < 2 || username.length > 50) {
      return NextResponse.json(
        { error: 'Username is required, must be 2-50 characters' },
        { status: 400 }
      );
    }
    if (!password || !passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with at least one letter and one number' },
        { status: 400 }
      );
    }
    if (!fullname || typeof fullname !== 'string' || fullname.length > 100) {
      return NextResponse.json(
        { error: 'Full name is required, max 100 characters' },
        { status: 400 }
      );
    }
    if (!role || typeof role !== 'string' || role.length > 50) {
      return NextResponse.json(
        { error: 'Role is required, max 50 characters' },
        { status: 400 }
      );
    }
    if (!status || typeof status !== 'string' || status.length > 50) {
      return NextResponse.json(
        { error: 'Status is required, max 50 characters' },
        { status: 400 }
      );
    }
    if (!store_id || typeof store_id !== 'string' || store_id.length > 50) {
      return NextResponse.json(
        { error: 'Store ID is required, max 50 characters' },
        { status: 400 }
      );
    }
    if (route && (typeof route !== 'string' || route.length > 255)) {
      return NextResponse.json(
        { error: 'Invalid route, max 255 characters' },
        { status: 400 }
      );
    }
    if (terminal && (typeof terminal !== 'string' || terminal.length > 50)) {
      return NextResponse.json(
        { error: 'Invalid terminal, max 50 characters' },
        { status: 400 }
      );
    }
    // Validate permission fields (optional, but if provided, must be strings <= 50 chars)
    const permissions = [
      p_sales, p_accounts, p_view_sales, p_purchases, p_view_purchases, 
      p_sale_return, p_view_products, p_products_management, p_dayend, 
      p_view_expences, p_customer_management, p_discounts, p_employee_management, 
      p_printing, p_view_customers, p_users_management, p_supplier_management
    ];
    for (const perm of permissions) {
      if (perm && (typeof perm !== 'string' || perm.length > 50)) {
        return NextResponse.json(
          { error: 'Invalid permission value, max 50 characters' },
          { status: 400 }
        );
      }
    }

    // Check for existing username
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
      },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        fullname: fullname.trim(),
        role: role.trim(),
        status: status.trim(),
        store_id: store_id.trim(),
        route: route?.trim() || null,
        terminal: terminal?.trim() || null,
        p_sales: p_sales?.trim() || 'false',
        p_accounts: p_accounts?.trim() || 'false',
        p_view_sales: p_view_sales?.trim() || 'false',
        p_purchases: p_purchases?.trim() || 'false',
        p_view_purchases: p_view_purchases?.trim() || 'false',
        p_sale_return: p_sale_return?.trim() || 'false',
        p_view_products: p_view_products?.trim() || 'false',
        p_products_management: p_products_management?.trim() || 'false',
        p_dayend: p_dayend?.trim() || 'false',
        p_view_expences: p_view_expences?.trim() || 'false',
        p_customer_management: p_customer_management?.trim() || 'false',
        p_discounts: p_discounts?.trim() || 'false',
        p_employee_management: p_employee_management?.trim() || 'false',
        p_printing: p_printing?.trim() || 'false',
        p_view_customers: p_view_customers?.trim() || 'false',
        p_users_management: p_users_management?.trim() || 'false',
        p_supplier_management: p_supplier_management?.trim() || 'false',
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        role: true,
        status: true,
        store_id: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      { user, message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error.message, error.stack);
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: error.meta?.target?.includes('username')
            ? 'Username already exists'
            : 'Registration failed',
        },
        { status: 400 }
      );
    }
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}