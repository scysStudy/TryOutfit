import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/services/auth.service';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = verifyToken(token);

  if (!user) {
    const response = NextResponse.json({ user: null }, { status: 200 });
    response.cookies.delete({ name: 'token', path: '/' });
    return response;
  }

  const dbResult = await query(
    `SELECT id, email, username, created_at, membership, membership_expiry_date
     FROM tryoutfit_users
     WHERE id = $1
     LIMIT 1`,
    [user.id]
  );

  if (dbResult.rows.length === 0) {
    const response = NextResponse.json({ user: null }, { status: 200 });
    response.cookies.delete({ name: 'token', path: '/' });
    return response;
  }

  return NextResponse.json({ user: dbResult.rows[0] }, { status: 200 });
}
