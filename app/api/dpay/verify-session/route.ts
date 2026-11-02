import { NextRequest, NextResponse } from 'next/server';
import { dpayService } from '@/lib/dpay/dpay-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await dpayService.verifyPaymentSession(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('DPAY verify-session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'فشل التوثيق عبر بوابة DPAY' },
      { status: 500 }
    );
  }
}
