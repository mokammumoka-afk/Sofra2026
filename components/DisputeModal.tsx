'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { DisputeReason } from '@/lib/types';
import {
  ShieldAlert,
  AlertTriangle,
  Upload,
  CheckCircle2,
  X,
  Package,
  Info,
  FileText,
  Lock,
} from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const REASON_OPTIONS: { value: DisputeReason; label: string; desc: string }[] = [
  {
    value: 'not_delivered',
    label: 'لم يصلني الطلب نهائياً 🚗❌',
    desc: 'انقضى وقت التوصيل ولم يقم المندوب أو الشيف بتسليم الوجبة.',
  },
  {
    value: 'wrong_item',
    label: 'الوجبة مختلفة عن الوصف أو ناقصة 🍲⚠️',
    desc: 'وصلت أصناف خطأ أو تنقصها المكونات المطلوبة.',
  },
  {
    value: 'damaged',
    label: 'مشكلة في جودة أو سلامة الطعام 🤢',
    desc: 'الطعام بارد جداً، غير طازج، أو تلف بسبب ظروف النقل.',
  },
  {
    value: 'unacceptable_delay',
    label: 'تأخير كبير أدى إلى تلف الطلب ⏱️',
    desc: 'تأخر التوصيل لأكثر من ساعتين عن الموعد المتفق عليه.',
  },
  {
    value: 'other',
    label: 'سبب آخر 📝',
    desc: 'توضيح مشكلة أخرى واجهتك أثناء الطلب.',
  },
];

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const { orders, raiseDispute } = useStore();

  const [selectedReason, setSelectedReason] = useState<DisputeReason>('not_delivered');
  const [reasonText, setReasonText] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const targetOrder = orders.find((o) => o.id === orderId);

  if (!isOpen || !targetOrder) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reasonText.trim() && selectedReason === 'other') {
      setErrorMsg('يرجى توضيح سبب النزاع باختصار.');
      return;
    }

    const res = raiseDispute(orderId, selectedReason, reasonText, evidenceUrls);
    if (!res.success) {
      setErrorMsg(res.error || 'فشل في تقديم النزاع.');
      return;
    }

    setIsSuccess(true);
  };

  const addSamplePhoto = () => {
    const samples = [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    ];
    setEvidenceUrls((prev) => [...prev, samples[prev.length % samples.length]]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 transition-all animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base">تقديم بلاغ نزاع وحفظ الأموال (Escrow)</h2>
              <p className="text-[11px] text-stone-400">الطلب رقم #{targetOrder.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-extrabold text-lg text-stone-900">تم تسجيل بلاغ النزاع بنجاح 🛡️</h3>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-right space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Lock className="w-4 h-4 text-amber-600" />
                حالة الأموال الآن: معلّقة بالضمان (Escrow Hold)
              </div>
              <p className="leading-relaxed">
                تم تجميد مبلغ الطلبية ({targetOrder.total_price} د.ل) ولن يتم تحريره للشيف. ستقوم إدارة سفرة بمراجعة المحادثة والأدلة والرد عليك خلال 24 ساعة.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-sm transition-all shadow-md"
            >
              تم، حسناً
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            
            {/* Order Brief */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <img
                  src={targetOrder.post_image}
                  alt={targetOrder.post_title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-bold text-stone-900 line-clamp-1">{targetOrder.post_title}</h4>
                  <p className="text-stone-500 text-[11px]">{targetOrder.chef_name}</p>
                </div>
              </div>
              <span className="font-extrabold text-orange-600 text-sm">{targetOrder.total_price} د.ل</span>
            </div>

            {/* Escrow Protection Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-tight">
                <strong>حماية سفرة الضامنة:</strong> بفتح هذا النزاع، تتدخل إدارة المنصة لتعليق الأموال في نظام الحجز المؤقت (Escrow) حتى التحقق من سلامة الطلبية والتسليم.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Reason Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-800">اختر سبب النزاع الرئيسية:</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REASON_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    onClick={() => setSelectedReason(opt.value)}
                    className={`block p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedReason === opt.value
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{opt.label}</span>
                      <input
                        type="radio"
                        name="dispute_reason"
                        checked={selectedReason === opt.value}
                        onChange={() => setSelectedReason(opt.value)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">{opt.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                تفاصيل إضافية عن المشكلة:
              </label>
              <textarea
                rows={3}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="وضح ما الذي حدث بالضبط (مثال: انتظرت المندوب ساعتين ولم يتصل، أو استلمت الوجبة باردة وبدون المكونات المتفق عليها)..."
                className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            {/* Photo Evidence Attachments */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-800">إرفاق أدلة وصور (اختياري):</label>
                <button
                  type="button"
                  onClick={addSamplePhoto}
                  className="text-[11px] text-orange-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  إضافة صورة إثبات
                </button>
              </div>

              {evidenceUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {evidenceUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="إثبات" className="w-14 h-14 rounded-lg object-cover border border-stone-300" />
                      <button
                        type="button"
                        onClick={() => setEvidenceUrls((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold rounded-xl text-xs transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                تأكيد فتح النزاع وتجميد الأموال 🛡️
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
