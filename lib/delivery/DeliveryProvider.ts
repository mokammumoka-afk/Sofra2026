import { Order, OrderStatus } from '../types';

export interface DeliveryShipmentResult {
  trackingId: string;
  providerName: string;
  estimatedDeliveryMins: number;
  driverName?: string;
  driverPhone?: string;
}

export interface DeliveryStatusResult {
  status: OrderStatus;
  updatedAt: string;
  locationDescription?: string;
  driverName?: string;
  driverPhone?: string;
}

export interface DeliveryProvider {
  name: string;
  code: 'talabk' | 'drubi' | 'express_ly' | 'direct_pickup';
  createShipment(order: Partial<Order>): Promise<DeliveryShipmentResult>;
  getShipmentStatus(trackingId: string): Promise<DeliveryStatusResult>;
  cancelShipment(trackingId: string): Promise<boolean>;
}

export const MIN_ORDER_AMOUNT = 50; // 50 LYD الحد الأدنى للطلب

export const DEFAULT_DELIVERY_FEES: Record<'talabk' | 'drubi' | 'express_ly' | 'direct_pickup', number> = {
  talabk: 10,
  drubi: 10,
  express_ly: 15,
  direct_pickup: 0,
};

export function getDeliveryFee(code: 'talabk' | 'drubi' | 'express_ly' | 'direct_pickup' = 'talabk'): number {
  return DEFAULT_DELIVERY_FEES[code] ?? 10;
}

export class MockLibyanDeliveryProvider implements DeliveryProvider {
  name: string;
  code: 'talabk' | 'drubi' | 'express_ly' | 'direct_pickup';

  constructor(code: 'talabk' | 'drubi' | 'express_ly' | 'direct_pickup' = 'talabk') {
    this.code = code;
    this.name = code === 'talabk' 
      ? 'شركة طلبك للتوصيل (Talabk Express)' 
      : code === 'drubi' 
      ? 'شركة دروبي للتوصيل السريع (Drubi)' 
      : code === 'express_ly'
      ? 'أكسبرس ليبيا للشحن المحلي'
      : 'استلام مباشر من الشيف';
  }

  async createShipment(order: Partial<Order>): Promise<DeliveryShipmentResult> {
    // Simulate API delay
    await new Promise((res) => setTimeout(res, 600));

    const trackingId = `${this.code.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const drivers = [
      { name: 'علي الورفلي', phone: '091-8884433' },
      { name: 'محمد الفيتوري', phone: '092-7771122' },
      { name: 'سالم الشريف', phone: '091-5559900' },
      { name: 'عبد الرحمن القمودي', phone: '092-3332211' },
    ];
    const assignedDriver = drivers[Math.floor(Math.random() * drivers.length)];

    return {
      trackingId,
      providerName: this.name,
      estimatedDeliveryMins: Math.floor(25 + Math.random() * 20),
      driverName: assignedDriver.name,
      driverPhone: assignedDriver.phone,
    };
  }

  async getShipmentStatus(trackingId: string): Promise<DeliveryStatusResult> {
    await new Promise((res) => setTimeout(res, 300));
    return {
      status: 'out_for_delivery',
      updatedAt: new Date().toISOString(),
      locationDescription: 'المندوب متواجد حالياً بالقرب من حي الأندلس في طريقه للعنوان',
      driverName: 'محمد الفيتوري',
      driverPhone: '092-7771122',
    };
  }

  async cancelShipment(trackingId: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 300));
    return true;
  }
}

export function getDeliveryProvider(code: 'talabk' | 'drubi' | 'express_ly' | 'direct_pickup' = 'talabk'): DeliveryProvider {
  return new MockLibyanDeliveryProvider(code);
}
