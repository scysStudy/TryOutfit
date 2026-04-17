import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, turnstileToken } = body;

    if (!email || !username || !password) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
    }

    if (!turnstileToken) {
      return NextResponse.json({ error: '请完成人机验证' }, { status: 400 });
    }

    // 去 Cloudflare 验证这个 token 是不是真的
    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
        }),
      }
    )

    const verifyResult = await verifyResponse.json()

    // 如果验证失败，直接拒绝
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: '人机验证失败，请重试' },
        { status: 403 }
      )
    }

    // 验证通过，继续正常的注册流程...
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
