'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Dispute } from '@/lib/types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Gift,
  X,
  MessageSquare,
  Package,
  User,
  ChefHat,
  Info,
  ExternalLink,
} from 'lucide-react';

interface AdminDisputesModalProps {
  isOpen: boolean;
  onClose: () => void;
  openMessengerForOrder?: (userId: string, orderId: string) => void;
}

export const AdminDisputesModal: React.FC<AdminDisputesModalProps> = ({
  isOpen,
  onClose,
  openMessengerForOrder,
}) => {
  const { disputes, orders, resolveDisputeAdmin } = useStore();
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeDispute = disputes.find((d) => d.id === selectedDisputeId) || disputes[0];
  const relatedOrder = activeDispute ? orders.find((o) => o.id === activeDispute.order_id) : null;

  const handleResolve = (action: 'refund_full' | 'refund_partial' | 'reject_release' | 'store_credit') => {
    if (!activeDispute) return;

    resolveDisputeAdmin(
      activeDispute.id,
      action,
      action === 'refund_partial' ? partialAmount : undefined,
      adminNotes
    );

    setAdminNotes('');
    setActionFeedback('تم تنفيذ قرار الإدارة بنجاح وتحديث أرصدة المحفظة والإشعارات للطرفين ✅');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 transition-all animate-fadeIn">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col md:flex-row">
        
        {/* Left Side: Dispute List */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-l border-stone-200 bg-stone-50 flex flex-col">
          <div className="p-3.5 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-extrabold text-sm text-stone-900">بلاغات النزاعات (Escrow)</h3>
            </div>
            <button onClick={onClose} className="md:hidden text-stone-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-200">
            {disputes.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                لا توجد نزاعات مفتوحة حالياً. جميع العمولات تسير بسلاسة!
              </div>
            ) : (
              disputes.map((d) => {
                const isSelected = activeDispute?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDisputeId(d.id);
                      setAdminNotes(d.admin_notes || '');
                    }}
                    className={`w-full p-3.5 text-right transition-colors flex flex-col gap-1 ${
                      isSelected ? 'bg-rose-50 border-r-4 border-rose-600' : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">طلب #{d.order_id}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          d.status === 'open'
                            ? 'bg-amber-100 text-amber-800'
                            : d.status === 'resolved_refund'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {d.status === 'open' ? 'قيد المراجعة ⏳' : d.status === 'resolved_refund' ? 'تم الاسترداد 💳' : 'مغلق'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 font-medium truncate">
                      مبلغ بواسطة: {d.raised_by_name}
                    </p>

                    <span className="text-[10px] text-stone-400">
                      {new Date(d.created_at).toLocaleDateString('ar-LY')}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Dispute Detail & Action Center */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto">
          {actionFeedback && (
            <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          )}

          {activeDispute && relatedOrder ? (
            <div className="p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-stone-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                      بلاغ نزاع جديد #{activeDispute.id}
                    </span>
                    <span className="text-xs text-stone-400">• طلب رقم #{relatedOrder.id}</span>
                  </div>
                  <h2 className="font-extrabold text-lg text-stone-900">{relatedOrder.post_title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dispute Info Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1">
                  <span className="text-stone-500 font-medium">المستخدم الشاكي:</span>
                  <p className="font-bold text-stone-900">{relatedOrder.customer_name} ({relatedOrder.customer_phone})</p>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1">
                  <span className="text-stone-500 font-medium">الشيف المعني:</span>
                  <p className="font-bold text-stone-900">{relatedOrder.chef_name}</p>
                </div>
              </div>

              {/* Order Escrow Money Box */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  <div>
                    <span className="font-bold">المبلغ المحتجز بالضمان (Escrow Hold):</span>
                    <p className="text-[11px] text-amber-700">محتجز في حساب الضمان ولن يُحرر إلا بقرار الإدارة</p>
                  </div>
                </div>
                <span className="font-extrabold text-base text-amber-900">{relatedOrder.total_price} د.ل</span>
              </div>

              {/* Reason Details */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-stone-800">تفاصيل الشكوى المقدمة من صاحب الطلب:</h4>
                <div className="p-3.5 bg-stone-100/80 rounded-xl text-xs text-stone-800 leading-relaxed font-medium">
                  <p className="font-bold text-rose-700 mb-1">سبب البلاغ: {activeDispute.reason}</p>
                  <p>{activeDispute.reason_text || 'لا تتوفر تفاصيل نصية إضافية.'}</p>
                </div>
              </div>

              {/* Evidence Photos if any */}
              {activeDispute.evidence_urls && activeDispute.evidence_urls.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-stone-800">صور وأدلة الشكوى المرفقة:</h4>
                  <div className="flex gap-2">
                    {activeDispute.evidence_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="دليل"
                        className="w-20 h-20 rounded-xl object-cover border border-stone-300"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Messenger Link */}
              {openMessengerForOrder && (
                <button
                  onClick={() => openMessengerForOrder(relatedOrder.customer_id, relatedOrder.id)}
                  className="w-full p-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                  مراجعة سجل رسائل المراسلة الداخلية بين الطرفين
                </button>
              )}

              {/* Admin Resolution Controls */}
              {activeDispute.status === 'open' ? (
                <div className="border-t border-stone-200 pt-4 space-y-3">
                  <h3 className="font-extrabold text-sm text-stone-900">اتخاذ القرار الإداري وحسم النزاع:</h3>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">ملاحظات وقرار الإدارة:</label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="اكتب توضيح الإدارة للقرار (سيتم إرساله للطرفين)..."
                      className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleResolve('refund_full')}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      استرداد كامل المبلغ للمستخدم ({relatedOrder.total_price} د.ل)
                    </button>

                    <button
                      onClick={() => handleResolve('reject_release')}
                      className="p-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      رفض النزاع وتحرير الأرباح للشيف
                    </button>

                    <button
                      onClick={() => handleResolve('store_credit')}
                      className="p-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all sm:col-span-2"
                    >
                      <Gift className="w-4 h-4" />
                      تعويض صاحب الطلب برصيد مجاني (30 د.ل) وتحرير كامل المبلغ للشيف
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <p className="font-bold">تم إغلاق هذا النزاع سابقاً بواسطة الإدارة.</p>
                  <p className="mt-1">ملاحظات القرار: {activeDispute.admin_notes || 'لا توجد ملاحظات مدونة'}</p>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-400">
              <ShieldAlert className="w-12 h-12 mb-2 opacity-30 text-rose-500" />
              <p className="text-sm font-semibold">اختر بلاغ نزاع من القائمة الجانبية لمراجعته</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
