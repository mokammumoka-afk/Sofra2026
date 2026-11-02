import { NextRequest, NextResponse } from 'next/server';
import { getDeliveryProvider } from '@/lib/delivery/DeliveryProvider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = 'talabk', order } = body;

    const deliveryProvider = getDeliveryProvider(provider);
    const result = await deliveryProvider.createShipment(order || {});

    return NextResponse.json({
      success: true,
      provider: deliveryProvider.name,
      shipment: result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'فشل إنشاء شحنة التوصيل' }, { status: 500 });
  }
}
