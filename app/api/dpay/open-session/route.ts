import { NextRequest, NextResponse } from 'next/server';
import { dpayService } from '@/lib/dpay/dpay-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await dpayService.openPaymentSession(body);
    return NextResponse.json(session);
  } catch (error) {
    console.error('DPAY open-session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'فشل فتح جلسة الدفع عبر DPAY' },
      { status: 500 }
    );
  }
}
