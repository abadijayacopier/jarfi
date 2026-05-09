import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Find user by email
    const [rows]: any = await pool.query(
      'SELECT * FROM Users WHERE email = ?',
      [email]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      );
    }

    // Create session
    const userSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    await login(userSession);

    return NextResponse.json({
      success: true,
      user: userSession,
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
