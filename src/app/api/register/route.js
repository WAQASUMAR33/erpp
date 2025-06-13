import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password complexity: at least 8 chars, 1 letter, 1 number
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export async function POST(request) {
  try {
    const { username, email, password, first_name, last_name } = await request.json();

    // Input validation
    if (!username || typeof username !== 'string' || username.length < 2 || username.length > 50) {
      return NextResponse.json(
        { error: 'Username is required, must be 2-50 characters' },
        { status: 400 }
      );
    }
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json(
        { error: 'Valid email is required, max 255 characters' },
        { status: 400 }
      );
    }
    if (!password || !passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with at least one letter and one number' },
        { status: 400 }
      );
    }
    if (first_name && (typeof first_name !== 'string' || first_name.length > 50)) {
      return NextResponse.json(
        { error: 'Invalid first name, max 50 characters' },
        { status: 400 }
      );
    }
    if (last_name && (typeof last_name !== 'string' || last_name.length > 50)) {
      return NextResponse.json(
        { error: 'Invalid last name, max 50 characters' },
        { status: 400 }
      );
    }

    // Check for existing username or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.trim() }, { email: email.trim() }],
      },
    });
    if (existingUser) {
      return NextResponse.json(
        {
          error:
            existingUser.username === username.trim()
              ? 'Username already exists'
              : 'Email already exists',
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        password_hash: hashedPassword,
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        is_active: true, // Default to true
      },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
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
            : 'Email already exists',
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