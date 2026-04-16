import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '请填写用户名和密码' }, { status: 400 });
    }

    const result = await login(username, password);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // 设置cookie
    const response = NextResponse.json(result, { status: 200 });
    response.cookies.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7天
    });

    return response;
  } catch (error) {
    console.error('登录API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
