import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/services/auth.service';

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const user = token ? verifyToken(token) : null;

    if (!user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const requestId = asString(body.request_id);
    const checkoutId = asString(body.checkout_id);
    const orderId = asString(body.order_id);
    const subscriptionId = asString(body.subscription_id);
    const productId = asString(body.product_id);
    const signature = asString(body.signature);

    if (!requestId || !checkoutId) {
      return NextResponse.json({ error: '缺少必要支付参数 request_id 或 checkout_id' }, { status: 400 });
    }

    const orderResult = await query(
      `SELECT id, user_id, checkout_id, product_id, status, paid_at
       FROM tryoutfit_orders
       WHERE order_no = $1
       ORDER BY id DESC
       LIMIT 1`,
      [requestId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: '未找到对应订单' }, { status: 404 });
    }

    const order = orderResult.rows[0] as {
      id: number;
      user_id: number;
      checkout_id: string | null;
      product_id: string | null;
      status: string | null;
      paid_at: string | null;
    };

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: '该订单不属于当前用户' }, { status: 403 });
    }

    if (order.checkout_id && order.checkout_id !== checkoutId) {
      return NextResponse.json({ error: '订单校验失败（checkout_id 不匹配）' }, { status: 400 });
    }

    if (productId && order.product_id && productId !== order.product_id) {
      return NextResponse.json({ error: '订单校验失败（product_id 不匹配）' }, { status: 400 });
    }

    await query(
      `UPDATE tryoutfit_orders
       SET status = $1,
           checkout_id = COALESCE($2, checkout_id),
           subscription_id = COALESCE($3, subscription_id),
           paid_at = COALESCE(paid_at, NOW()),
           metadata = metadata || $4::jsonb,
           updated_at = NOW()
       WHERE id = $5`,
      [
        'paid',
        checkoutId,
        subscriptionId,
        JSON.stringify({
          callback_confirmed_at: new Date().toISOString(),
          callback_query: {
            request_id: requestId,
            checkout_id: checkoutId,
            order_id: orderId,
            subscription_id: subscriptionId,
            product_id: productId,
            signature,
          },
        }),
        order.id,
      ]
    );

    await query(
      `UPDATE tryoutfit_users
       SET membership = $1,
           membership_expiry_date = GREATEST(COALESCE(membership_expiry_date, NOW()), NOW()) + INTERVAL '30 days'
       WHERE id = $2`,
      ['month', user.id]
    );

    const userResult = await query(
      `SELECT id, email, username, created_at, membership, membership_expiry_date
       FROM tryoutfit_users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      orderNo: requestId,
      statusBefore: order.status,
      membershipUpdated: true,
      user: userResult.rows[0] ?? null,
    });
  } catch (error) {
    console.error('[Payments Confirm] 处理支付回跳失败:', error);
    return NextResponse.json({ error: '处理支付回跳失败' }, { status: 500 });
  }
}
