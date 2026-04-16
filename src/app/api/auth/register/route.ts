import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    if (!email || !username || !password) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    const result = await register(email, username, password);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message }, { status: 201 });
  } catch (error) {
    console.error('注册API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
