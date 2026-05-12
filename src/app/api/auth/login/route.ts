import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { login } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Find user by email
    const [rows]: any = await pool.query(
      'SELECT * FROM Users WHERE LOWER(email) = ?',
      [normalizedEmail]
    );

    const user = rows[0];
    console.log(`[AUTH] Login attempt for: ${normalizedEmail} from mobile/network`);

    if (!user) {
      console.warn(`[AUTH] User NOT found: ${normalizedEmail}`);
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      console.warn(`[AUTH] Password mismatch for: ${normalizedEmail}`);
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

    console.log(`[AUTH] Login SUCCESS for: ${normalizedEmail}`);
    await login(userSession);

    return NextResponse.json({
      success: true,
      user: userSession,
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: `Terjadi kesalahan server: ${error.message}` },
      { status: 500 }
    );
  }
}
