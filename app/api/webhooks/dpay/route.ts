import { NextRequest, NextResponse } from 'next/server';
import { verifyDPAYHmacSignature } from '@/lib/dpay/dpay-service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('X-DPAY-Signature') || '';

    // Verify HMAC signature
    const isValid = verifyDPAYHmacSignature(signature, rawBody);
    if (!isValid) {
      return NextResponse.json({ error: 'توقيع HMAC غير صالح' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Process webhook event
    if (payload.event === 'payment.completed') {
      // In production, update database order status or wallet balance
      return NextResponse.json({
        received: true,
        status: 'processed',
        order_updated: payload.metadata?.order_id || null,
        transaction_ref: payload.transaction_ref,
      });
    }

    return NextResponse.json({ received: true, status: 'ignored' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطأ في معالجة الإشعار' }, { status: 500 });
  }
}
