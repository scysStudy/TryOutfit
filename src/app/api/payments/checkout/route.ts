import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  createCreemCheckoutSession,
  extractCheckoutId,
  extractCheckoutUrl,
} from '@/lib/creem';
import { verifyToken } from '@/services/auth.service';

function createOrderNo() {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const user = token ? verifyToken(token) : null;

    if (!user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const productId = process.env.CREEM_PRODUCT_ID;
    if (!productId) {
      return NextResponse.json({ error: 'CREEM_PRODUCT_ID 未配置' }, { status: 500 });
    }

    const orderNo = createOrderNo();
    const successBaseUrl = (
      process.env.CREEM_SUCCESS_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin
    ).replace(/\/$/, '');
    const successUrl = process.env.CREEM_SUCCESS_URL || `${successBaseUrl}/`;

    const metadata = {
      orderNo,
      userId: String(user.id),
      membership: 'month',
    };

    await query(
      `INSERT INTO tryoutfit_orders (order_no, user_id, product_id, status, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderNo, user.id, productId, 'pending', JSON.stringify(metadata)]
    );

    let checkoutData: Record<string, unknown>;
    try {
      checkoutData = await createCreemCheckoutSession({
        productId,
        successUrl,
        requestId: orderNo,
        metadata,
        customerEmail: user.email,
      });
    } catch (error) {
      await query(
        `UPDATE tryoutfit_orders
         SET status = $1, updated_at = NOW(), metadata = metadata || $2::jsonb
         WHERE order_no = $3`,
        [
          'failed',
          JSON.stringify({
            checkout_error: error instanceof Error ? error.message : 'unknown',
          }),
          orderNo,
        ]
      );

      const message = error instanceof Error ? error.message : '创建支付会话失败';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const checkoutUrl = extractCheckoutUrl(checkoutData);
    const checkoutId = extractCheckoutId(checkoutData);

    if (!checkoutUrl) {
      await query(
        `UPDATE tryoutfit_orders
         SET status = $1, updated_at = NOW(), metadata = metadata || $2::jsonb
         WHERE order_no = $3`,
        [
          'failed',
          JSON.stringify({
            checkout_error: 'missing_checkout_url',
            creem_response: checkoutData,
          }),
          orderNo,
        ]
      );

      return NextResponse.json({ error: '创建支付会话失败：缺少 checkout 地址' }, { status: 502 });
    }

    await query(
      `UPDATE tryoutfit_orders
       SET checkout_id = $1, status = $2, updated_at = NOW(), metadata = metadata || $3::jsonb
       WHERE order_no = $4`,
      [
        checkoutId,
        'checkout_created',
        JSON.stringify({ creem_checkout: checkoutData }),
        orderNo,
      ]
    );

    return NextResponse.json({
      checkoutUrl,
      orderNo,
    });
  } catch (error) {
    console.error('[Creem Checkout] 创建支付会话失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
