import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [rows]: any = await pool.query(
      'SELECT id, name, email, role, created_at FROM Users ORDER BY id DESC'
    );
    return NextResponse.json({ users: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id === session.user.id.toString()) {
      return NextResponse.json({ error: 'Tidak bisa menghapus diri sendiri' }, { status: 400 });
    }

    await pool.query('DELETE FROM Users WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, email, password, role } = body;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE Users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
        [name, email, hashedPassword, role, id]
      );
    } else {
      await pool.query(
        'UPDATE Users SET name = ?, email = ?, role = ? WHERE id = ?',
        [name, email, role, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
