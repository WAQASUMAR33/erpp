import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Replace with a secure secret in production

// Input validation regex
const usernameRegex = /^.{2,50}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export async function POST(request) {
  try {
    // Check if request body is present
    const text = await request.text();
    if (!text) {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      );
    }

    // Parse JSON body
    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message, 'Raw body:', text);
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }

    const { username, password } = body;

    // Input validation
    if (!username || !usernameRegex.test(username)) {
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

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
      select: {
        id: true,
        username: true,
        fullname: true,
        password: true,
        role: true,
        status: true,
        store_id: true,
        route: true,
        terminal: true,
        p_sales: true,
        p_accounts: true,
        p_view_sales: true,
        p_purchases: true,
        p_view_purchases: true,
        p_sale_return: true,
        p_view_products: true,
        p_products_management: true,
        p_dayend: true,
        p_view_expences: true,
        p_customer_management: true,
        p_discounts: true,
        p_employee_management: true,
        p_printing: true,
        p_view_customers: true,
        p_users_management: true,
        p_supplier_management: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return NextResponse.json(
        { error: 'User account is not active' },
        { status: 403 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        store_id: user.store_id,
      },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Prepare user response (exclude password)
    const userResponse = {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      role: user.role,
      status: user.status,
      store_id: user.store_id,
      route: user.route,
      terminal: user.terminal,
      permissions: {
        p_sales: user.p_sales,
        p_accounts: user.p_accounts,
        p_view_sales: user.p_view_sales,
        p_purchases: user.p_purchases,
        p_view_purchases: user.p_view_purchases,
        p_sale_return: user.p_sale_return,
        p_view_products: user.p_view_products,
        p_products_management: user.p_products_management,
        p_dayend: user.p_dayend,
        p_view_expences: user.p_view_expences,
        p_customer_management: user.p_customer_management,
        p_discounts: user.p_discounts,
        p_employee_management: user.p_employee_management,
        p_printing: user.p_printing,
        p_view_customers: user.p_view_customers,
        p_users_management: user.p_users_management,
        p_supplier_management: user.p_supplier_management,
      },
    };

    return NextResponse.json(
      {
        user: userResponse,
        token,
        message: 'Login successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}