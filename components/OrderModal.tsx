'use client';

import React, { useState } from 'react';
import { Post } from '@/lib/types';
import { useStore } from '@/lib/store';
import {
  MIN_ORDER_AMOUNT,
  DEFAULT_DELIVERY_FEES,
  getDeliveryFee,
} from '@/lib/delivery/DeliveryProvider';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  MapPin,
  Truck,
  Sparkles,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface OrderModalProps {
  post: Post | null;
  onClose: () => void;
  onSuccessOrder: () => void;
  openWalletModal: () => void;
}

const DELIVERY_PROVIDERS: {
  code: 'talabk' | 'drubi' | 'express_ly' | 'direct_pickup';
  name: string;
  badge: string;
  desc: string;
  fee: number;
}[] = [
  {
    code: 'talabk',
    name: 'طَلبك Express 🚗',
    badge: 'الأسرع',
    desc: 'توصيل سريع داخل المدينة',
    fee: DEFAULT_DELIVERY_FEES.talabk,
  },
  {
    code: 'drubi',
    name: 'الدروبي Delivery 🛵',
    badge: 'تتبع حي',
    desc: 'توصيل دقيق مع التتبع المباشر',
    fee: DEFAULT_DELIVERY_FEES.drubi,
  },
  {
    code: 'express_ly',
    name: 'أكسبرس ليبيا 📦',
    badge: 'كافة الضواحي',
    desc: 'تغطية واسعة وشاملة لكافة المناطق',
    fee: DEFAULT_DELIVERY_FEES.express_ly,
  },
  {
    code: 'direct_pickup',
    name: 'استلام مباشر 🛍️',
    badge: 'مجاناً',
    desc: 'استلام ذاتي من مطبخ الشيف بدون رسوم',
    fee: DEFAULT_DELIVERY_FEES.direct_pickup,
  },
];

export const OrderModal: React.FC<OrderModalProps> = ({
  post,
  onClose,
  onSuccessOrder,
  openWalletModal,
}) => {
  const { placeOrder, currentUser, userCity } = useStore();

  // Calculate minimum quantity to reach 50 LYD threshold
  const unitPrice = post?.price || 0;
  const minRequiredQuantity = Math.max(
    1,
    Math.ceil(MIN_ORDER_AMOUNT / (unitPrice || 1))
  );

  // Starts at minimum required quantity so it meets 50 LYD immediately, can be increased indefinitely
  const [quantity, setQuantity] = useState(minRequiredQuantity);
  const [address, setAddress] = useState(
    `${userCity} - ${currentUser.district || 'وسط المدينة'}`
  );
  const [deliveryCode, setDeliveryCode] = useState<
    'talabk' | 'drubi' | 'express_ly' | 'direct_pickup'
  >('talabk');
  const [gatewayId] = useState<string>('mobicash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderId: string;
    total: number;
    fee: number;
  } | null>(null);

  // Extract affiliate ref from URL if available
  const [affiliateUserId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ref') || undefined;
    }
    return undefined;
  });

  if (!post) return null;

  // Financial calculations
  const itemsTotal = unitPrice * quantity;
  const deliveryFee = getDeliveryFee(deliveryCode);
  const finalTotal = itemsTotal + deliveryFee;
  const isBelowMinOrder = itemsTotal < MIN_ORDER_AMOUNT;
  const minOrderDeficit = Math.max(0, MIN_ORDER_AMOUNT - itemsTotal);
  const hasEnoughBalance = currentUser.wallet_balance >= finalTotal;

  const selectedProvider =
    DELIVERY_PROVIDERS.find((p) => p.code === deliveryCode) || DELIVERY_PROVIDERS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBelowMinOrder) {
      setErrorMsg(
        `الحد الأدنى لقيمة الوجبات في الطلب هو ${MIN_ORDER_AMOUNT} د.ل. يرجى زيادة الكمية للوصول للحد الأدنى.`
      );
      return;
    }

    if (!hasEnoughBalance) {
      setErrorMsg(
        `رصيد محفظتك (${currentUser.wallet_balance.toFixed(0)} د.ل) غير كافٍ لإتمام الطلب بقيمة ${finalTotal} د.ل (تشمل التوصيل).`
      );
      return;
    }

    if (!address.trim()) {
      setErrorMsg('يرجى تحديد عنوان التوصيل بدقة');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await placeOrder(
      post,
      quantity,
      address,
      deliveryCode,
      gatewayId,
      notes,
      affiliateUserId,
      deliveryFee
    );
    setIsSubmitting(false);

    if (res.success && res.orderId) {
      setOrderSuccessData({
        orderId: res.orderId,
        total: finalTotal,
        fee: deliveryFee,
      });
      onSuccessOrder();
    } else {
      setErrorMsg(res.error || 'فشل إتمام الطلب');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden border border-orange-100 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Order Success View */}
        {orderSuccessData ? (
          <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                تم استلام طلبك وتأكيده بنجاح 🇱🇾
              </span>
              <h2 className="text-lg font-black text-stone-900 mt-2">
                رقم الطلب: #{orderSuccessData.orderId}
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                تم خصم المبلغ بأمان عبر محفظة DPAY، وإشعار الشيف لبدء التحضير مع شركة التوصيل المختارة.
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs space-y-2 text-right">
              <div className="flex justify-between text-stone-600">
                <span>الوجبة:</span>
                <span className="font-bold text-stone-900">{post.title} × {quantity}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>شركة التوصيل:</span>
                <span className="font-bold text-stone-900">{selectedProvider?.name}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>رسوم التوصيل:</span>
                <span className="font-bold text-stone-900">{orderSuccessData.fee} د.ل</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-black text-stone-900 text-sm">
                <span>الإجمالي المدفوع:</span>
                <span className="text-orange-600">{orderSuccessData.total} د.ل</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
              >
                متابعة الطلب في قسم طلباتي 📦
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Title Header */}
        <div className="flex items-center gap-3 mb-4 border-b border-stone-100 pb-3">
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                إتمام الطلب
              </span>
            </div>
            <h2 className="font-extrabold text-base text-stone-900 mt-0.5">
              {post.title}
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              الشيف {post.chef_name} • {post.city}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity Selector with Minimum Order Notice */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-stone-900 block">
                  الكمية المطلوبة ({post.unit_name || 'قطع/وجبات'}):
                </label>
                <span className="text-[10px] text-stone-500 font-bold block">
                  سعر الـ {post.unit_name || 'وجبة'} الواحدة: {unitPrice} د.ل
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-white text-stone-800 font-bold border border-stone-300 flex items-center justify-center hover:bg-stone-100 cursor-pointer"
                  title="إنقاص الكمية"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center font-black text-sm bg-white border border-stone-300 rounded-xl py-1 text-stone-900 outline-none focus:border-orange-500"
                  title="أدخل أي كمية ترغب بها دون حد أقصى"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-white text-stone-800 font-bold border border-stone-300 flex items-center justify-center hover:bg-stone-100 cursor-pointer"
                  title="زيادة الكمية بمقدار 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="زيادة 10 قطع إضافية"
                  onClick={() => setQuantity((q) => q + 10)}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-black rounded-xl border border-stone-300 cursor-pointer transition-colors"
                >
                  +10
                </button>
                <button
                  type="button"
                  title="زيادة 50 قطعة إضافية"
                  onClick={() => setQuantity((q) => q + 50)}
                  className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-900 text-[11px] font-black rounded-xl border border-orange-200 cursor-pointer transition-colors"
                >
                  +50
                </button>
              </div>
            </div>

            {/* Subtotal */}
            <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between text-xs font-bold text-stone-800">
              <span>
                سعر الوجبات ({quantity} {post.unit_name || 'وجبة'}):
              </span>
              <span className="text-sm font-black text-stone-900">
                {itemsTotal} د.ل
              </span>
            </div>

            {/* Minimum Order Alert */}
            {isBelowMinOrder && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold">
                    أقل مبلغ للطلب {MIN_ORDER_AMOUNT} د.ل (ينقصك {minOrderDeficit} د.ل)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(minRequiredQuantity)}
                  className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-black py-1.5 px-3 rounded-xl transition-colors text-xs shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  تعديل للحد الأدنى ({minRequiredQuantity} {post.unit_name || 'وجبة'})
                </button>
              </div>
            )}
          </div>

          {/* Delivery Address */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>عنوان التوصيل (المدينة والحي والشارع):</span>
            </label>
            <input
              type="text"
              value={address ?? ''}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: طرابلس - حي الأندلس بالقرب من المدار"
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
            />
          </div>

          {/* Delivery Provider Options with Price Badges */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-orange-600" />
                <span>اختر شركة التوصيل وسعر الخدمة:</span>
              </label>
              <span className="text-[10px] text-stone-400 font-medium">
                تضاف للتكلفة النهائية تلقائياً
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DELIVERY_PROVIDERS.map((provider) => {
                const isSelected = deliveryCode === provider.code;
                return (
                  <button
                    key={provider.code}
                    type="button"
                    onClick={() => setDeliveryCode(provider.code)}
                    className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-orange-50 border-orange-500 font-bold text-orange-950 shadow-sm ring-1 ring-orange-400'
                        : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-extrabold">{provider.name}</span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-orange-600 text-white'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {provider.fee === 0 ? 'مجاناً' : `${provider.fee} د.ل`}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 leading-tight">
                      {provider.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transparent Invoice / Bill Summary (بيان الحساب النهائي مع التوصيل) */}
          <div className="bg-stone-900 text-white p-3.5 rounded-2xl space-y-2 border border-stone-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-stone-300">
              <span>سعر الوجبات ({quantity} × {unitPrice} د.ل):</span>
              <span className="font-bold text-white">{itemsTotal} د.ل</span>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-300">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-orange-400" />
                <span>رسوم التوصيل ({selectedProvider?.name ? selectedProvider.name.split(' ')[0] : 'التوصيل'}):</span>
              </span>
              <span
                className={`font-bold ${
                  deliveryFee === 0 ? 'text-emerald-400' : 'text-orange-400'
                }`}
              >
                {deliveryFee === 0 ? 'مجاناً (0 د.ل)' : `+ ${deliveryFee} د.ل`}
              </span>
            </div>

            <div className="border-t border-stone-800 pt-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 block font-bold">
                  الإجمالي النهائي الشامل للتوصيل:
                </span>
                <span className="text-lg font-black text-amber-400">
                  {finalTotal} د.ل
                </span>
              </div>

              <div className="text-left">
                <span className="text-[10px] text-stone-400 block font-bold">
                  رصيد محفظتك المتاح:
                </span>
                <span
                  className={`text-xs font-black ${
                    hasEnoughBalance ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currentUser.wallet_balance.toFixed(0)} د.ل
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method - DPAY Wallet */}
          <div>
            <div
              className={`p-3 rounded-2xl border transition-all ${
                hasEnoughBalance
                  ? 'bg-gradient-to-r from-emerald-50/70 to-teal-50/40 border-emerald-300'
                  : 'bg-rose-50/80 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      hasEnoughBalance
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-stone-900">
                      محفظة DPAY
                    </h4>
                    <p className="text-[10px] text-stone-500">
                      سداد مباشر من رصيد المحفظة
                    </p>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span
                    className={`text-xs font-black ${
                      hasEnoughBalance ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {hasEnoughBalance ? 'رصيد كافٍ' : 'رصيد غير كافٍ'}
                  </span>
                </div>
              </div>

              {!hasEnoughBalance && (
                <div className="mt-2.5 pt-2 border-t border-rose-200/80 flex flex-col gap-2">
                  <div className="flex items-center gap-1 text-rose-700 text-[11px] font-bold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>
                      ينقصك {(finalTotal - currentUser.wallet_balance).toFixed(0)} د.ل
                      لإتمام الطلب.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openWalletModal();
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2 px-3 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>شحن رصيد المحفظة</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              ملاحظات إضافية للشيف:
            </label>
            <input
              type="text"
              value={notes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: بدون فلفل حار، أو التسليم بعد صلاة العصر"
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 text-xs outline-none focus:bg-white"
            />
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            disabled={isSubmitting || isBelowMinOrder || !hasEnoughBalance}
            className={`w-full font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
              isBelowMinOrder
                ? 'bg-stone-300 text-stone-600 cursor-not-allowed shadow-none'
                : !hasEnoughBalance
                ? 'bg-rose-100 text-rose-700 cursor-not-allowed shadow-none border border-rose-200'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20 active:scale-98 cursor-pointer'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            {isBelowMinOrder ? (
              <span>
                أقل مبلغ للطلب هو {MIN_ORDER_AMOUNT} د.ل (ينقصك {minOrderDeficit} د.ل)
              </span>
            ) : !hasEnoughBalance ? (
              <span>
                رصيد المحفظة غير كافٍ لإتمام الطلب ({finalTotal} د.ل)
              </span>
            ) : (
              <span>
                تأكيد وشراء الطلب الآن ({finalTotal} د.ل شامل التوصيل)
              </span>
            )}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
};
