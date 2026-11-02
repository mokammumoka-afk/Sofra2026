'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { LIBYAN_CITIES, CITY_SUBURBS_MAP } from '@/lib/constants';
import { ChefHat, X, Upload, ShieldCheck, Sparkles, ScrollText, CheckCircle2, AlertTriangle, AlertCircle, ArrowLeft } from 'lucide-react';

interface BecomeChefModalProps {
  onClose: () => void;
}

export const BecomeChefModal: React.FC<BecomeChefModalProps> = ({ onClose }) => {
  const { applyChefVerification, currentUser, userCity } = useStore();

  // Wizard Steps: 1 = Mandatory Seller Policy, 2 = Kitchen Details & Verification Docs
  const [step, setStep] = useState<1 | 2>(1);

  // Policy Agreement State
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const policyScrollRef = useRef<HTMLDivElement>(null);

  // Form State
  const [kitchenName, setKitchenName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState(userCity);
  const [healthCertDoc, setHealthCertDoc] = useState('شهادة_صحية_ليبية_معتمدة.pdf');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePolicyScroll = () => {
    if (policyScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = policyScrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 25) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHealthCertDoc(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!policyAccepted) {
      setErrorMsg('يجب الموافقة الصريحة على سياسة البيع والشروط للمتابعة.');
      return;
    }
    if (!kitchenName.trim() || !bio.trim()) {
      setErrorMsg('يرجى إدخال اسم المطبخ ونبذة تعريفية عن أطباقك ومطبخك.');
      return;
    }

    applyChefVerification(kitchenName.trim(), bio.trim(), healthCertDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden border border-orange-100 shadow-2xl p-5 sm:p-6 relative max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-orange-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <h2 className="font-black text-base text-stone-900">انضم كـ شيف ومطبخ موثق 🇱🇾</h2>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {step === 1 ? 'الخطوة 1 من 2: سياسة البيع الإلزامية وحماية الصفقات' : 'الخطوة 2 من 2: بيانات المطبخ والشهادة الصحية'}
          </p>
        </div>

        {/* STEP 1: Mandatory Seller Policy (Scroll-to-accept) */}
        {step === 1 && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-900 block mb-0.5">سياسة البيع الإلزامية (يرجى القراءة حتى النهاية)</span>
                <p className="text-[11px] leading-snug">
                  يرجى التمرير لقراءة نص السياسة كاملاً. زر «الموافقة والمتابعة» ينشط فقط بعد قراءة الشروط والتأكيد.
                </p>
              </div>
            </div>

            {/* Scrollable Policy Box */}
            <div
              ref={policyScrollRef}
              onScroll={handlePolicyScroll}
              className="flex-1 border border-stone-200 bg-stone-50/80 rounded-2xl p-4 overflow-y-auto space-y-3 text-stone-800 text-xs leading-relaxed max-h-[300px] shadow-inner select-none"
            >
              <div className="text-center pb-2 border-b border-stone-200">
                <span className="font-black text-stone-900 text-sm">سياسة البيع — منصة سفرة (Sofra)</span>
                <p className="text-[10px] text-stone-500">إصدار السياسة: v1.0-LY (إلزامي للجميع)</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-black text-emerald-800 text-xs flex items-center gap-1">
                  <span>✅ المسموح (الاستخدام القانوني):</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-700 pr-1">
                  <li>التفاوض على تفاصيل الطلب (الكمية، التوقيت، التخصيصات) عبر نظام المراسلة الداخلي فقط.</li>
                  <li>الاستفسار عن المكونات، الحساسية الغذائية، وطريقة التحضير.</li>
                  <li>التواصل بخصوص طلب قائم ومحجوز بالفعل داخل المنصة.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-black text-rose-800 text-xs flex items-center gap-1">
                  <span>❌ الممنوع منعاً باتاً (مخالفة لسياسة المنصة):</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-700 pr-1">
                  <li>مشاركة رقم الهاتف أو أي وسيلة تواصل خارجية (واتساب، تيليجرام، فيسبوك، انستغرام، فايبر) بأي شكل أو صيغة.</li>
                  <li>الاتفاق على إتمام أي عملية بيع أو دفع خارج نظام الدفع الرسمي للمنصة (DPAY).</li>
                  <li>توجيه العميل لمقابلة الشيف مباشرة لتفادي الدفع والحجز عبر التطبيق.</li>
                  <li>استخدام رموز أو تهجئة ملتوية لتمرير أرقام (مثل: «0 9 1 * 2 3 4» أو «٠٩١»).</li>
                  <li>إرسال صور تحتوي أرقام هواتف أو عناوين تواصل خارجية.</li>
                </ul>
              </div>

              <div className="space-y-1.5 bg-rose-50/70 p-2.5 rounded-xl border border-rose-200/80">
                <h4 className="font-black text-rose-900 text-xs">⚠️ العقوبات ونظام التصعيد:</h4>
                <ul className="list-disc list-inside space-y-1 text-[10.5px] text-rose-900 font-medium pr-1">
                  <li><strong>المخالفة الأولى:</strong> تحذير رسمي مسجّل في سجل الحساب.</li>
                  <li><strong>المخالفة الثانية:</strong> تقييد مؤقت للحساب (حد أقصى من الرسائل وتجميد الإكسبلور).</li>
                  <li><strong>أي مخالفة مؤكدة إضافية أو محاولة تحايل مباشرة:</strong> تعليق الحساب نهائياً، مع حرمان صاحب الحساب من استرجاع أي رصيد متبقٍ في محفظته وتجميد المبيعات.</li>
                </ul>
              </div>

              <p className="text-[10px] text-stone-500 text-center font-bold pt-2 border-t border-stone-200">
                بموافقتك على هذه السياسة، فإنك تقر بأنك اطلعت على كل ما سبق وتوافق على الالتزام الكامل به.
              </p>
            </div>

            {/* Scroll Indicator Badge */}
            {!hasScrolledToBottom && (
              <div className="text-center text-[10px] font-bold text-orange-600 animate-pulse">
                ⬇️ يرجى التمرير لأسفل النص لتفعيل زر الموافقة
              </div>
            )}

            {/* Agreement Checkbox */}
            <label className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
              hasScrolledToBottom ? 'bg-orange-50/80 border-orange-300' : 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed'
            }`}>
              <input
                type="checkbox"
                disabled={!hasScrolledToBottom}
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500 mt-0.5 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-stone-800 leading-snug">
                لقد قرأت وفهمت ووافقت على سياسة البيع والشروط الإلزامية بحظر التواصل والدفع خارج المنصة.
              </span>
            </label>

            {/* Continue Button */}
            <button
              type="button"
              disabled={!policyAccepted || !hasScrolledToBottom}
              onClick={() => setStep(2)}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-extrabold py-3 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs cursor-pointer shrink-0"
            >
              <span>المتابعة لإنشاء حساب الشيف 🚀</span>
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>
        )}

        {/* STEP 2: Kitchen Details & Verification Docs Form */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1 mb-1"
            >
              ← الرجوع إلى سياسة البيع
            </button>

            <div>
              <label className="font-bold text-stone-700 block mb-1">اسم المطبخ / العلامة التجارية:</label>
              <input
                type="text"
                value={kitchenName ?? ''}
                onChange={(e) => setKitchenName(e.target.value)}
                placeholder="مثال: مطبخ الأصالة للحلويات والمأكولات الطرابلسية"
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">نبذة تعريفية بالخبرة والأطباق:</label>
              <textarea
                value={bio ?? ''}
                onChange={(e) => setBio(e.target.value)}
                placeholder="خبرتي 10 سنوات في إعداد الأكلات الشعبية والمقروض والمبكبكة على الأصول..."
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">المدينة / الإقليم:</label>
                <select
                  value={city ?? 'طرابلس'}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 outline-none font-bold text-xs"
                >
                  {LIBYAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">المنطقة / الضاحية 🏡:</label>
                <select
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 outline-none font-bold text-xs"
                >
                  {(CITY_SUBURBS_MAP[city] || ['وسط المدينة', 'الضواحي القريبة']).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error message banner */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Health Cert Upload Box */}
            <div className="p-3 bg-orange-50/80 rounded-2xl border border-orange-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-orange-900">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>مستند التوثيق (الشهادة الصحية أو الهوية الوطنية):</span>
              </div>
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-stone-200 text-stone-600">
                <span className="truncate max-w-[200px] text-xs font-medium">{healthCertDoc}</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  رفع مستند 📁
                </button>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 text-[11px] text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تمت الموافقة وتوقيع سياسة البيع والشروط الإلزامية بنجاح 📜</span>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              تقديم طلب التوثيق والإرسال للإدارة 🚀
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

