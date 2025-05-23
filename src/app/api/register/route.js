import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';
import { sendVerificationEmail } from '../../lib/email';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

// Basic email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    // Input validation
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with default role 'USER'
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER', // Hardcode to USER for security
        isVerified: false,
      },
    });

    // Generate and store verification token
    let token;
    let tokenExists;
    do {
      token = randomUUID();
      tokenExists = await prisma.verificationToken.findUnique({ where: { token } });
    } while (tokenExists); // Ensure token is unique

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      // Log the email error for debugging
      console.error('Failed to send verification email:', emailError);
      // Delete user to avoid orphaned accounts
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'User created. Please check your email to verify.' },
      { status: 201 }
    );
  } catch (error) {
    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}