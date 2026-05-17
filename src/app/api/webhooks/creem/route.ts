import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { mapCreemEventToOrderStatus, verifyCreemWebhookSignature } from '@/lib/creem';

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function resolvePeriodEndDate(eventData: Record<string, unknown>) {
  const subscription = asRecord(eventData.subscription);

  const candidates = [
    asString(subscription.current_period_end_date),
    asString(subscription.current_period_end),
    asString(eventData.current_period_end_date),
    asString(eventData.current_period_end),
  ];

  for (const value of candidates) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);
  return fallback;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'CREEM_WEBHOOK_SECRET 未配置' }, { status: 500 });
  }

  const signature = request.headers.get('creem-signature');
  if (!signature) {
    return NextResponse.json({ error: '缺少 creem-signature' }, { status: 400 });
  }

  const rawBody = await request.text();
  const isValidSignature = verifyCreemWebhookSignature(rawBody, signature, webhookSecret);
  if (!isValidSignature) {
    return NextResponse.json({ error: '签名校验失败' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch (error) {
    return NextResponse.json({ error: 'Webhook payload 不是合法 JSON' }, { status: 400 });
  }

  const eventType = asString(payload.eventType) || asString(payload.type) || 'unknown';
  const eventData = asRecord(payload.data);
  const checkout = asRecord(eventData.checkout);
  const payment = asRecord(eventData.payment);
  const subscription = asRecord(eventData.subscription);
  const metadata = asRecord(eventData.metadata);

  const orderNo =
    asString(metadata.orderNo) ||
    asString(metadata.order_no) ||
    asString(eventData.request_id) ||
    asString(checkout.request_id) ||
    asString(checkout.order_no);

  const checkoutId = asString(checkout.id) || asString(eventData.checkout_id);
  const paymentId = asString(payment.id) || asString(eventData.payment_id);
  const subscriptionId = asString(subscription.id) || asString(eventData.subscription_id);
  const customerEmail =
    asString(asRecord(eventData.customer).email) || asString(eventData.customer_email);
  const amount = asNumber(payment.amount) ?? asNumber(eventData.amount);
  const currency = asString(payment.currency) || asString(eventData.currency);
  const status = mapCreemEventToOrderStatus(eventType);

  const orderCandidate = orderNo || `WB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const upsertResult = await query(
    `INSERT INTO tryoutfit_orders (
       order_no,
       checkout_id,
       payment_id,
       subscription_id,
       customer_email,
       amount,
       currency,
       status,
       metadata,
       webhook_event_type,
       webhook_raw,
       paid_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::jsonb,
             CASE WHEN $8 = 'paid' THEN NOW() ELSE NULL END,
             NOW())
     ON CONFLICT (order_no)
     DO UPDATE SET
       checkout_id = COALESCE(EXCLUDED.checkout_id, tryoutfit_orders.checkout_id),
       payment_id = COALESCE(EXCLUDED.payment_id, tryoutfit_orders.payment_id),
       subscription_id = COALESCE(EXCLUDED.subscription_id, tryoutfit_orders.subscription_id),
       customer_email = COALESCE(EXCLUDED.customer_email, tryoutfit_orders.customer_email),
       amount = COALESCE(EXCLUDED.amount, tryoutfit_orders.amount),
       currency = COALESCE(EXCLUDED.currency, tryoutfit_orders.currency),
       status = EXCLUDED.status,
       metadata = tryoutfit_orders.metadata || EXCLUDED.metadata,
       webhook_event_type = EXCLUDED.webhook_event_type,
       webhook_raw = EXCLUDED.webhook_raw,
       paid_at = CASE
         WHEN EXCLUDED.status = 'paid' AND tryoutfit_orders.paid_at IS NULL THEN NOW()
         ELSE tryoutfit_orders.paid_at
       END,
       updated_at = NOW()
     RETURNING order_no, user_id`,
    [
      orderCandidate,
      checkoutId,
      paymentId,
      subscriptionId,
      customerEmail,
      amount,
      currency,
      status,
      JSON.stringify({
        eventType,
        metadata,
      }),
      eventType,
      rawBody,
    ]
  );

  if (status === 'paid') {
    const periodEnd = resolvePeriodEndDate(eventData);
    const metadataUserId = asString(metadata.userId) || asString(metadata.referenceId);
    const orderUserId = upsertResult.rows[0]?.user_id;
    const userId = metadataUserId ? Number(metadataUserId) : orderUserId;

    if (userId && Number.isFinite(userId)) {
      await query(
        `UPDATE tryoutfit_users
         SET membership = $1,
             membership_expiry_date = $2
         WHERE id = $3`,
        ['month', periodEnd.toISOString(), userId]
      );
    }
  }

  return NextResponse.json({ received: true });
}
