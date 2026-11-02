'use client';

import React, { useState, useEffect } from 'react';
import { DPAYGatewayOption } from '@/lib/types';
import { DPAY_GATEWAYS } from '@/lib/constants';
import {
  ShieldCheck,
  X,
  Smartphone,
  CreditCard,
  Building,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  FileText,
  Printer,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface DPAYGatewayModalProps {
  amount: number;
  purposeTitle: string;
  onSuccess: (transactionRef: string, gatewayId: string) => void;
  onClose: () => void;
  defaultGatewayId?: string;
}

type DPAYStep = 'SELECT_METHOD' | 'ENTER_DETAILS' | 'SMS_OTP' | 'PROCESSING' | 'SUCCESS';

export const DPAYGatewayModal: React.FC<DPAYGatewayModalProps> = ({
  amount,
  purposeTitle,
  onSuccess,
  onClose,
  defaultGatewayId = 'mobicash',
}) => {
  const [step, setStep] = useState<DPAYStep>('SELECT_METHOD');
  const [selectedGateway, setSelectedGateway] = useState<DPAYGatewayOption>(
    DPAY_GATEWAYS.find((g) => g.id === defaultGatewayId) || DPAY_GATEWAYS[0]
  );

  // Form Inputs
  const [phone, setPhone] = useState('0912345678');
  const [birthYear, setBirthYear] = useState('1994');
  const [sadadCategory, setSadadCategory] = useState('20');
  const [cardNumber, setCardNumber] = useState('1234567');
  const [cardExpiry, setCardExpiry] = useState('01/27');
  const [cardCvc, setCardCvc] = useState('321');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('111111');
  const [otpTimer, setOtpTimer] = useState(60);

  // State / Errors
  const [errorMsg, setErrorMsg] = useState('');
  const [transactionRef, setTransactionRef] = useState('');

  const selectGatewayAndSetDefaults = (gw: DPAYGatewayOption) => {
    setSelectedGateway(gw);
    if (gw.id === 'sadad' || gw.id === 'edfali' || gw.id === 'onepay') {
      setPhone('0912345678');
    } else if (gw.id === 'masrefypay') {
      setCardNumber('1234567');
    } else if (gw.id === 'yousrpay') {
      setCardNumber('331234567');
    } else if (gw.id === 'saharapay') {
      setCardNumber('661234567');
    } else if (gw.id === 'mobicash') {
      setCardNumber('7279627');
    } else if (gw.id === 'moamalat') {
      setCardNumber('6395043835180860');
      setCardExpiry('01/27');
    }
  };

  // OTP Countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'SMS_OTP' && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const handleStartPayment = () => {
    setErrorMsg('');
    if (!selectedGateway) return;

    // Standard official test OTP is 111111
    setGeneratedOtp('111111');
    setOtpTimer(60);
    setStep('ENTER_DETAILS');
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedGateway.id === 'sadad') {
      if (!phone.trim() || phone.length < 9) {
        setErrorMsg('يرجى إدخال رقم هاتف المدار (091 / 093)');
        return;
      }
      if (!birthYear || birthYear.length !== 4) {
        setErrorMsg('يرجى إدخال سنة الميلاد المكونة من 4 أرقام للمطابقة مع سجل سداد');
        return;
      }
    } else if (selectedGateway.id === 'edfali' || selectedGateway.id === 'onepay') {
      if (!phone.trim() || phone.length < 9) {
        setErrorMsg('يرجى إدخال رقم هاتف ليبي صحيح (091 / 092 / 094)');
        return;
      }
    } else if (['masrefypay', 'yousrpay', 'saharapay', 'mobicash'].includes(selectedGateway.id)) {
      if (!cardNumber.trim() || (cardNumber.length !== 7 && cardNumber.length !== 9)) {
        setErrorMsg('رقم البطاقة المصرفية يجب أن يتكون من 7 أرقام (نفس المصرف) أو 9 أرقام (عبر ون باي Cross-bank)');
        return;
      }
    } else if (selectedGateway.id === 'moamalat') {
      if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 16) {
        setErrorMsg('يرجى إدخال رقم بطاقة تداول/معاملات المكون من 16 رقم (اختباري: 6395043835180860)');
        return;
      }
    }

    setStep('SMS_OTP');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (otpCode.trim() !== '111111' && otpCode.trim() !== generatedOtp && otpCode.trim() !== '123456') {
      setErrorMsg(`رمز التوثيق غير صحيح. استخدم رمز الاختبار الرسمي (111111)`);
      return;
    }

    // Process Clearing
    setStep('PROCESSING');

    setTimeout(() => {
      const ref = `DPAY-LY-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setTransactionRef(ref);
      setStep('SUCCESS');
      onSuccess(ref, selectedGateway.id);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 dir-rtl">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden border border-emerald-200 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Top Header Branding Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 sm:p-5 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-emerald-950 flex items-center justify-center font-black shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide">بوابة الدفع الوطنية DPAY</span>
                <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  مرخصة 🇱🇾
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/80 font-medium">
                بوابة الدفع الموحدة تحت إشراف مصرف ليبيا المركزي
              </p>
            </div>
          </div>

          <div className="mt-3 bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-200/80 text-[10px] block">الغاية من الدفع:</span>
              <span className="font-bold text-white truncate max-w-[200px] block">{purposeTitle}</span>
            </div>
            <div className="text-left">
              <span className="text-emerald-200/80 text-[10px] block">القيمة الإجمالية:</span>
              <span className="font-black text-amber-300 text-sm">{amount.toFixed(2)} د.ل</span>
            </div>
          </div>
        </div>

        {/* Dynamic Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Select Gateway */}
          {step === 'SELECT_METHOD' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>اختر وسيلة الدفع المصرفية المحلية:</span>
                </h3>
                <span className="text-[10px] text-stone-400">تطبيق التشفير SSL 256-bit</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {DPAY_GATEWAYS.map((gw) => {
                  const isSelected = selectedGateway.id === gw.id;
                  return (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => selectGatewayAndSetDefaults(gw)}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs'
                          : 'bg-stone-50/60 hover:bg-stone-100 border-stone-200 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-white border border-stone-100 shadow-2xs">
                          {gw.icon}
                        </span>
                        <div>
                          <div className="font-bold text-xs">{gw.name_ar}</div>
                          <div className="text-[10px] text-stone-500 font-medium">
                            خدمة الدفع السريع والآمن من شبكة DPAY
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          {gw.processing_fee}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleStartPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>متابعة إدخال بيانات {selectedGateway.name_ar}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Enter Credentials */}
          {step === 'ENTER_DETAILS' && (
            <form onSubmit={handleRequestOtp} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_METHOD')}
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 font-bold"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  <span>تغيير الوسيلة</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl">
                  <span>{selectedGateway.icon}</span>
                  <span>{selectedGateway.name_ar}</span>
                </div>
              </div>

              {/* Sadad (Almadar Aljadid) */}
              {selectedGateway.id === 'sadad' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      رقم مشترك المدار (091 / 093):
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912345678"
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 pr-10 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dir-ltr text-right"
                      />
                      <Smartphone className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">
                        سنة الميلاد (4 أرقام):
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        placeholder="1994"
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none text-center dir-ltr"
                      />
                      <span className="text-[9px] text-stone-400 block mt-0.5">مطابقة سجل المدار</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">
                        تصنيف الخدمة:
                      </label>
                      <select
                        value={sadadCategory}
                        onChange={(e) => setSadadCategory(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none"
                      >
                        <option value="20">20 - البيع الإلكتروني</option>
                        <option value="8">8 - مقاهي ومطاعم</option>
                        <option value="11">11 - إلكترونيات</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* EDFali / OnePay */}
              {(selectedGateway.id === 'edfali' || selectedGateway.id === 'onepay') && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      رقم الموبايل المربوط بالخدمة:
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912345678"
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 pr-10 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dir-ltr text-right"
                      />
                      <Smartphone className="w-4 h-4 text-stone-400 absolute right-3 top-3.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Cards (MasrefyPay, YousrPay, SaharaPay, MobiCash) */}
              {['masrefypay', 'yousrpay', 'saharapay', 'mobicash'].includes(selectedGateway.id) && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      رقم الحساب/البطاقة (7 أرقام نفس المصرف أو 9 أرقام عبر ون باي):
                    </label>
                    <input
                      type="text"
                      maxLength={9}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234567 أو 331234567"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dir-ltr text-right"
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px] text-stone-500">
                      <span>بطاقات الاختبار الرسمية:</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setCardNumber('1234567')}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono"
                        >
                          1234567 (7 أرقام)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCardNumber('331234567')}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono"
                        >
                          331234567 (ون باي)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Moamalat LightBox / Card */}
              {selectedGateway.id === 'moamalat' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      رقم بطاقة تداول / المعاملات (16 رقم):
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="6395043835180860"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dir-ltr text-right"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber('6395043835180860');
                        setCardExpiry('01/27');
                      }}
                      className="text-[10px] text-emerald-700 font-bold hover:underline mt-1 block"
                    >
                      تعبئة بطاقة الاختبار الرسمية (6395043835180860)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">تاريخ الانتهاء:</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="01/27"
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none text-center dir-ltr"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">رمز CVC:</label>
                      <input
                        type="password"
                        maxLength={3}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="***"
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none text-center dir-ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">حماية مشددة وفق معايير PCI-DSS:</span>
                  <span className="text-[10px] text-amber-800">
                    بياناتك المشفرة تمر مباشرة إلى السيرفرات الرسمية لشبكة DPAY والمصرف المركزي دون تخزين.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>طلب رمز التوثيق المصرفي (SMS OTP)</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: SMS OTP Verification */}
          {step === 'SMS_OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              <div className="text-center bg-stone-50 rounded-2xl p-4 border border-stone-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-extrabold text-sm text-stone-900">توثيق العملية بلمسة أمان (OTP)</h3>
                <p className="text-xs text-stone-500 mt-1">
                  أرسلنا رمز التوثيق المؤقت إلى الرقم المربوط بالحساب المصرفي ({phone})
                </p>

                {/* Test Helper Notification */}
                <div className="mt-3 bg-amber-100/80 border border-amber-300 text-amber-900 rounded-xl p-2.5 text-xs font-bold flex items-center justify-between">
                  <span>رمز التوثيق للاختبار: <strong className="text-emerald-900 text-sm font-black dir-ltr inline-block tracking-widest">{generatedOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(generatedOtp)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                  >
                    تعبئة تلقائية
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1 text-center">
                  أدخل رمز التوثيق المؤقت المتكون من 6 أرقام:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="******"
                  className="w-full bg-white border-2 border-emerald-500 rounded-2xl p-3 text-center text-xl font-black tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/20 text-stone-900 dir-ltr"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>ينتهي الرمز خلال: <strong className="text-emerald-700">{otpTimer}s</strong></span>
                <button
                  type="button"
                  disabled={otpTimer > 0}
                  onClick={() => {
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    setGeneratedOtp(code);
                    setOtpTimer(60);
                  }}
                  className="text-emerald-700 font-bold hover:underline disabled:opacity-50"
                >
                  إعادة إرسال الرمز
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>تأكيد التوثيق وإتمام الدفع ({amount.toFixed(2)} د.ل)</span>
              </button>
            </form>
          )}

          {/* STEP 4: Processing Animation */}
          {step === 'PROCESSING' && (
            <div className="py-12 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto"></div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900">جاري إجراء المقاصة عبر شبكة DPAY...</h3>
                <p className="text-xs text-stone-500 mt-1">تأكيد التوثيق وتأمين السيولة المالية مع البنك المركزي</p>
              </div>
            </div>
          )}

          {/* STEP 5: Official Success Receipt */}
          {step === 'SUCCESS' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-3xl p-5 text-center relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-600/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-black text-lg text-emerald-950">تم التوثيق والدفع بنجاح!</h3>
                <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                  تم اعتماد المعاملة المالية وإضافة السيولة فوراً
                </p>

                <div className="mt-4 pt-4 border-t border-emerald-200/60 text-right space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">رقم المرجع الوطني:</span>
                    <strong className="font-mono text-stone-900 font-bold dir-ltr">{transactionRef}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">البوابة المالية:</span>
                    <strong className="text-stone-900 font-bold">{selectedGateway.name_ar}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">المبلغ المدفوع:</span>
                    <strong className="text-emerald-700 font-extrabold">{amount.toFixed(2)} د.ل</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">التاريخ والوقت:</span>
                    <strong className="text-stone-800 font-bold">
                      {new Date().toLocaleString('ar-LY')}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-stone-600" />
                  <span>طباعة الإيصال</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition-all"
                >
                  إغلاق والعودة للتطبيق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
