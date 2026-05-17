import { NextRequest, NextResponse } from 'next/server';
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

  return NextResponse.json({ user }, { status: 200 });
}
