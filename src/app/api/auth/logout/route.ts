import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: '登出成功' }, { status: 200 });
  response.cookies.delete('token');
  return response;
}
