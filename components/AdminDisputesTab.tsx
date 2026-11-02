'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Clock,
  Search,
  Eye,
  DollarSign,
  Info,
} from 'lucide-react';
import { Dispute } from '@/lib/types';

interface AdminDisputesTabProps {
  onShowToast: (msg: string) => void;
}

export const AdminDisputesTab: React.FC<AdminDisputesTabProps> = ({ onShowToast }) => {
  const { disputes, orders, resolveDisputeAdmin, fastForwardEscrowReleaseAdmin, users } = useStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Resolution Modal State
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [actionType, setActionType] = useState<'refund_full' | 'refund_partial' | 'reject_release' | 'store_credit'>('refund_full');
  const [partialAmount, setPartialAmount] = useState<number>(30);
  const [adminNotes, setAdminNotes] = useState<string>('تم حل النزاع بعد مراجعة إثباتات الطرفين وسياسة الضمان المالي.');

  const filteredDisputes = disputes.filter((disp) => {
    if (filterStatus === 'open' && disp.status !== 'open' && disp.status !== 'under_review') return false;
    if (filterStatus === 'resolved' && disp.status !== 'resolved_refund' && disp.status !== 'resolved_rejected' && disp.status !== 'closed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = disp.raised_by_name?.toLowerCase().includes(q);
      const matchReason = disp.reason_text?.toLowerCase().includes(q);
      const matchOrder = disp.order_id?.toLowerCase().includes(q);
      if (!matchName && !matchReason && !matchOrder) return false;
    }
    return true;
  });

  const openDisputesCount = disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length;
  const resolvedDisputesCount = disputes.filter((d) => d.status === 'resolved_refund' || d.status === 'resolved_rejected' || d.status === 'closed').length;

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    resolveDisputeAdmin(
      selectedDispute.id,
      actionType,
      actionType === 'refund_partial' ? partialAmount : undefined,
      adminNotes
    );

    let feedback = '';
    if (actionType === 'refund_full') feedback = `تم استرداد كامل المبلغ (${selectedDispute.amount} د.ل) لمحفظة الزبون بنجاح ✅`;
    else if (actionType === 'refund_partial') feedback = `تم استرداد (${partialAmount} د.ل) جزئياً وتحرير المتبقي للشيف بنجاح ✅`;
    else if (actionType === 'reject_release') feedback = `تم رفض النزاع وتحرير كامل مبلغ الضمان للشيف بنجاح 🛡️`;
    else if (actionType === 'store_credit') feedback = `تم إصدار رصيد تعويضي للمحفظة وإنهاء النزاع 💳`;

    onShowToast(feedback);
    setSelectedDispute(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/40 to-stone-900 text-white rounded-3xl p-6 border border-stone-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shadow-md">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white">مركز حسم النزاعات وضمان الـ 48 ساعة (Escrow) 🛡️</h2>
              {openDisputesCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                  {openDisputesCount} نزاع مفتوح
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-1">
              متابعة شكاوى الزبائن، فحص أدلة الصور، ورد المبالغ للمحافظ أو تحرير الضمان للشيفات بنقرة واحدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            حماية المشتري والبائع مفعلة 🇱🇾
          </span>
        </div>
      </div>

      {/* Disputes Table & Management Card */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'all' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              الكل ({disputes.length})
            </button>
            <button
              onClick={() => setFilterStatus('open')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterStatus === 'open'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span>نزاعات مفتوحة</span>
              <span className="bg-rose-900/30 px-1.5 py-0.2 rounded-full text-[10px]">{openDisputesCount}</span>
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              تمت التسوية ({resolvedDisputesCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الطلب، اسم الزبون، أو السبب..."
              className="w-full bg-stone-100 text-xs pr-8 pl-3 py-2 rounded-xl outline-none border border-stone-200"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
          </div>
        </div>

        {filteredDisputes.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-stone-600">لا توجد نزاعات أو شكاوى مطابقة للفلاتر الحالية 🎉</p>
            <p className="text-[11px] text-stone-400 mt-1">كل العمليات والطلبيات تمر بسلاسة عبر الضمان المالي.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((disp) => {
              const order = orders.find((o) => o.id === disp.order_id);
              const buyer = users.find((u) => u.id === disp.raised_by);

              return (
                <div
                  key={disp.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    disp.status === 'open'
                      ? 'bg-amber-50/60 border-amber-200 shadow-2xs'
                      : 'bg-stone-50/80 border-stone-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                          disp.status === 'open'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <Scale className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-stone-900">#{disp.id}</span>
                          <span className="text-stone-400">•</span>
                          <span className="font-bold text-xs text-stone-800">
                            طلب: <span className="font-mono font-black text-stone-900">#{disp.order_id}</span>
                          </span>
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              disp.status === 'open'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {disp.status === 'open' ? '⚠️ نزاع مفتوح قيد المراجعة' : '✅ تم حسم النزاع'}
                          </span>
                        </div>

                        <div className="text-xs text-stone-700">
                          الشاكي: <span className="font-bold text-stone-900">{disp.raised_by_name || buyer?.full_name}</span> •
                          الشيف المعني: <span className="font-bold text-stone-900">{order?.chef_name || 'الشيف'}</span>
                        </div>

                        <div className="text-xs text-stone-600 bg-white/80 p-3 rounded-xl border border-stone-200 mt-2">
                          <span className="font-bold text-rose-800 block mb-0.5">سبب الشكوى والبيان:</span>
                          <p className="text-stone-800 leading-relaxed font-medium">{disp.reason_text}</p>
                        </div>

                        {disp.evidence_urls && disp.evidence_urls.length > 0 && (
                          <div className="pt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-stone-500">الأدلة المصورة المرفقة:</span>
                            {disp.evidence_urls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block relative group"
                              >
                                <img
                                  src={url}
                                  alt="Evidence"
                                  className="w-12 h-12 object-cover rounded-xl border-2 border-stone-200 group-hover:border-amber-500 transition-colors shadow-2xs"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-stone-500 block font-bold">مبلغ النزاع الإجمالي:</span>
                        <span className="font-mono font-black text-base text-stone-900">{disp.amount ?? 0} د.ل</span>
                      </div>

                      {disp.status === 'open' ? (
                        <button
                          onClick={() => {
                            setSelectedDispute(disp);
                            setPartialAmount(Math.round((disp.amount ?? 0) / 2));
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs py-2 px-4 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Scale className="w-4 h-4" />
                          <span>اتخاذ قرار وحسم النزاع ⚖️</span>
                        </button>
                      ) : (
                        <div className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold">
                          تم الحسم وتحديث الأرصدة
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispute Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm text-stone-900">
                  حسم النزاع للطلب #{selectedDispute.order_id}
                </h3>
              </div>
              <button onClick={() => setSelectedDispute(null)} className="text-stone-400 hover:text-stone-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>مقدم الشكوى:</span>
                  <span className="font-bold text-stone-900">{selectedDispute.raised_by_name}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>قيمة الطلب المتنازع عليه:</span>
                  <span className="font-mono font-black text-amber-700">{selectedDispute.amount ?? 0} د.ل</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-stone-900 block mb-2">اختر الإجراء الإداري المناسب:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 cursor-pointer">
                    <input
                      type="radio"
                      name="dispute_action"
                      checked={actionType === 'refund_full'}
                      onChange={() => setActionType('refund_full')}
                      className="accent-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-stone-900 block">استرداد كامل للزبون (Full Refund)</span>
                      <span className="text-[10.5px] text-stone-500">إرجاع {selectedDispute.amount ?? 0} د.ل لمحفظة الزبون وإلغاء ضمان الشيف.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 cursor-pointer">
                    <input
                      type="radio"
                      name="dispute_action"
                      checked={actionType === 'refund_partial'}
                      onChange={() => setActionType('refund_partial')}
                      className="accent-amber-500"
                    />
                    <div className="text-xs flex-1">
                      <span className="font-bold text-stone-900 block">استرداد جزئي (Partial Refund)</span>
                      <span className="text-[10.5px] text-stone-500">تقسيم المبلغ بين الزبون والشيف كحل وسطي منصف.</span>
                    </div>
                  </label>

                  {actionType === 'refund_partial' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 mr-6">
                      <label className="text-[11px] font-bold text-stone-700 block">المبلغ المسترد للزبون (د.ل):</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedDispute.amount ?? 100}
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(Number(e.target.value))}
                        className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold text-stone-900"
                      />
                      <span className="text-[10px] text-stone-500 block">
                        المتبقي للشيف: {((selectedDispute.amount ?? 0) - partialAmount).toFixed(2)} د.ل
                      </span>
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 cursor-pointer">
                    <input
                      type="radio"
                      name="dispute_action"
                      checked={actionType === 'reject_release'}
                      onChange={() => setActionType('reject_release')}
                      className="accent-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-stone-900 block">رفض النزاع وتحرير كامل المبلغ للشيف (Release Escrow)</span>
                      <span className="text-[10.5px] text-stone-500">إذا ثبت التزام الشيف بالمواصفات وسلامة التوصيل.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 cursor-pointer">
                    <input
                      type="radio"
                      name="dispute_action"
                      checked={actionType === 'store_credit'}
                      onChange={() => setActionType('store_credit')}
                      className="accent-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-stone-900 block">رصيد تعويضي من المنصة (Store Credit)</span>
                      <span className="text-[10.5px] text-stone-500">تعويض الزبون برصيد محفظة تشجيعي دون الخصم من الشيف.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">ملاحظة القرار الإداري:</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-bold outline-none resize-none"
                  placeholder="ملاحظات توضيحية..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-2xl shadow-xs transition-colors cursor-pointer"
                >
                  اعتماد القرار وتنفيذ التسوية 🛡️
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
