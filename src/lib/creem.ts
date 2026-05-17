import crypto from 'crypto';

const DEFAULT_CREEM_BASE_URL = 'https://test-api.creem.io/v1';

export interface CreateCreemCheckoutPayload {
  productId: string;
  successUrl: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export function getCreemBaseUrl() {
  return process.env.CREEM_BASE_URL || DEFAULT_CREEM_BASE_URL;
}

export async function createCreemCheckoutSession(payload: CreateCreemCheckoutPayload) {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    throw new Error('CREEM_API_KEY 未配置');
  }

  const requestBody: Record<string, unknown> = {
    product_id: payload.productId,
    success_url: payload.successUrl,
  };

  if (payload.requestId) {
    requestBody.request_id = payload.requestId;
  }
  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    requestBody.metadata = payload.metadata;
  }

  const response = await fetch(`${getCreemBaseUrl()}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  const rawText = await response.text();
  const data = (() => {
    try {
      return JSON.parse(rawText) as Record<string, any>;
    } catch {
      return {} as Record<string, any>;
    }
  })();

  if (!response.ok) {
    const details = [
      typeof data?.message === 'string' ? data.message : null,
      typeof data?.error === 'string' ? data.error : null,
      typeof data?.error?.message === 'string' ? data.error.message : null,
      typeof data?.details === 'string' ? data.details : null,
      rawText && rawText.length <= 500 ? rawText : null,
      typeof data?.trace_id === 'string' ? `trace_id=${data.trace_id}` : null,
      `status=${response.status}`,
    ].filter(Boolean);

    throw new Error(details.join(' | ') || '创建 Creem Checkout 失败');
  }

  return data as Record<string, unknown>;
}

export function extractCheckoutUrl(data: Record<string, unknown>) {
  const checkoutUrl =
    (typeof data.checkout_url === 'string' && data.checkout_url) ||
    (typeof data.url === 'string' && data.url) ||
    (typeof data.checkoutUrl === 'string' && data.checkoutUrl) ||
    '';

  return checkoutUrl;
}

export function extractCheckoutId(data: Record<string, unknown>) {
  const checkoutId =
    (typeof data.checkout_id === 'string' && data.checkout_id) ||
    (typeof data.id === 'string' && data.id) ||
    (typeof data.checkoutId === 'string' && data.checkoutId) ||
    null;

  return checkoutId;
}

export function verifyCreemWebhookSignature(rawBody: string, signature: string, secret: string) {
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex').toLowerCase();

  const candidates = signature
    .split(',')
    .map((part) => part.trim())
    .flatMap((part) => {
      if (part.includes('=')) {
        const value = part.split('=').slice(1).join('=').trim();
        return [value, part.trim()];
      }
      return [part];
    })
    .map((part) => part.toLowerCase())
    .filter((part) => /^[a-f0-9]{64}$/.test(part));

  if (candidates.length === 0) {
    return false;
  }

  const computedBuffer = Buffer.from(computed, 'utf8');
  return candidates.some((candidate) => {
    const signatureBuffer = Buffer.from(candidate, 'utf8');
    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
  });
}

export function mapCreemEventToOrderStatus(eventType: string) {
  if (eventType === 'checkout.completed' || eventType === 'subscription.active' || eventType === 'subscription.paid') {
    return 'paid';
  }

  if (
    eventType === 'subscription.canceled' ||
    eventType === 'subscription.scheduled_cancel' ||
    eventType === 'subscription.past_due' ||
    eventType === 'subscription.expired' ||
    eventType === 'dispute.created' ||
    eventType === 'refund.created'
  ) {
    return 'failed';
  }

  return 'pending';
}
