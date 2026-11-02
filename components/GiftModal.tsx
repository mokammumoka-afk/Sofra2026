'use client';

import React, { useState } from 'react';
import { Post, GiftItem } from '@/lib/types';
import { DIGITAL_GIFTS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import {
  Gift,
  X,
  Sparkles,
  Wallet,
  CheckCircle2,
  Heart,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Download,
  Lock,
  Check,
} from 'lucide-react';

interface GiftModalProps {
  post: Post | null;
  onClose: () => void;
  onOpenStore?: () => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({ post, onClose, onOpenStore }) => {
  const { sendGift, currentUser } = useStore();
  const [selectedGift, setSelectedGift] = useState<GiftItem>(DIGITAL_GIFTS[2]); // Golden Plate by default
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState('');

  // Processing steps: 'select' -> 'processing' -> 'success'
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'dpay' | 'sadad' | 'bank_card'>('dpay');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [txId, setTxId] = useState('');

  if (!post) return null;

  const finalGiftAmount = customAmount ? parseFloat(customAmount) : selectedGift.amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalGiftAmount || finalGiftAmount <= 0) return;

    if (paymentMethod === 'dpay' && currentUser.wallet_balance < finalGiftAmount) {
      alert(
        `رصيد محفظة DPAY الحالية (${currentUser.wallet_balance.toFixed(1)} د.ل) غير كافٍ. يرجى شحن المحفظة.`
      );
      return;
    }

    setStep('processing');
    setProgress(20);
    setStatusText('🔐 الاتصال الآمن برابط التشفير المالي DPAY سوفرة...');

    await new Promise((r) => setTimeout(r, 600));
    setProgress(55);
    setStatusText('💳 اقتطاع قيمة الهدية وتحويلها المباشر إلى محفظة الشيف...');

    await new Promise((r) => setTimeout(r, 700));
    setProgress(85);
    setStatusText('📜 تسجيل القيد المحاسبي الموثوق وإصدار الإيصال المالي الرسمي...');

    const generatedTx = `DPAY-GIFT-${Math.floor(100000 + Math.random() * 900000)}`;

    const customGiftObj: GiftItem = {
      ...selectedGift,
      amount: finalGiftAmount,
    };

    const success = await sendGift(
      post.id,
      customGiftObj,
      message || `هدية تقدير وإعجاب بطبق (${post.title}) 🌺`
    );

    await new Promise((r) => setTimeout(r, 400));
    setProgress(100);

    if (success) {
      setTxId(generatedTx);
      setStep('success');
    } else {
      alert('حدث خطأ أثناء المعالجة، يرجى إعادة المحاولة.');
      setStep('select');
    }
  };

  const userGiftBal = currentUser.gift_wallet_balance || 0;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border border-amber-200 shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center shadow-md shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h2 className="font-black text-sm sm:text-base text-stone-900">
                إرسال هدية رقمية للشيف 🎁
              </h2>
              <p className="text-[11px] text-stone-500 font-bold truncate max-w-[210px] sm:max-w-[260px]">
                لـ {post.kitchen_name || post.chef_name} • {post.title}
              </p>
            </div>
          </div>

          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* STEP 1: SELECT GIFT & PAYMENT METHOD */}
        {step === 'select' && (
          <>
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* User Wallet Balance Summary */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-3.5 space-y-2 border border-stone-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-300 font-bold flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>محفظة DPAY الرئيسية:</span>
                  </span>
                  <span className="font-black text-emerald-400 text-sm dir-ltr">
                    {currentUser.wallet_balance.toFixed(1)} د.ل
                  </span>
                </div>

                {userGiftBal > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10">
                    <span className="text-stone-300 font-bold flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                      <span>رصيد الهدايا المتاح:</span>
                    </span>
                    <span className="font-black text-amber-300 text-sm dir-ltr">
                      {userGiftBal.toFixed(1)} د.ل
                    </span>
                  </div>
                )}
              </div>

              {/* Gift Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span>اختر نوع الهدية أو أضف قيمتها:</span>
                  {onOpenStore && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenStore();
                      }}
                      className="text-amber-700 hover:text-amber-800 text-[11px] font-extrabold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>متجر الهدايا 🛍️</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {DIGITAL_GIFTS.map((g) => {
                    const isSelected = !customAmount && selectedGift.id === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGift(g);
                          setCustomAmount('');
                        }}
                        className={`p-3 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                            : 'bg-white border-stone-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl shrink-0">{g.icon}</span>
                          <div>
                            <div className="font-bold text-xs text-stone-900">{g.name}</div>
                            <div className="text-[10px] text-stone-500 line-clamp-1">{g.description}</div>
                          </div>
                        </div>
                        <span className="font-black text-xs text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl shrink-0 dir-ltr">
                          {g.amount} د.ل
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Value Entry */}
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  أو تحديد مبلغ إكرامية مخصص (د.ل):
                </label>
                <input
                  type="number"
                  placeholder="مثلاً 15 أو 50 د.ل..."
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 text-xs font-black text-stone-900 outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-right"
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  رسالة تشجيعية للشيف (تظهر على الصفحة):
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب كلمة لطيفة تعبر عن إعجابك بجهد الشيف..."
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 text-xs font-bold text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-right"
                />
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50/80 shrink-0">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>معالجة وإرسال ({finalGiftAmount} د.ل) للشيف</span>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: PROCESSING ANIMATION */}
        {step === 'processing' && (
          <div className="p-8 text-center space-y-6 my-auto">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
              <ShieldCheck className="w-9 h-9 text-amber-600 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="font-black text-base text-stone-900">جاري معالجة الإرسال فوراً...</h3>
              <p className="text-xs font-bold text-amber-800">{statusText}</p>
            </div>

            <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS RECEIPT */}
        {step === 'success' && (
          <div className="p-5 overflow-y-auto space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-lg border-2 border-emerald-400 animate-bounce">
              ✓
            </div>

            <div>
              <h3 className="text-xl font-black text-stone-900">تم الإهداء بنجاح! 🎉</h3>
              <p className="text-xs text-stone-600 font-bold mt-1">
                تم تحويل قيمة الهدية ({finalGiftAmount} د.ل) إلى محفظة هدايا الشيف{' '}
                <strong>{post.kitchen_name || post.chef_name}</strong> فورا!
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs text-right space-y-2">
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500 font-bold">الرقم المرجعي:</span>
                <span className="font-extrabold text-stone-900 dir-ltr">{txId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-bold">الطبق المستهدف:</span>
                <span className="font-extrabold text-stone-900 truncate max-w-[180px]">{post.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-bold">القيمة المسددة:</span>
                <span className="font-black text-emerald-700 dir-ltr">{finalGiftAmount.toFixed(1)} د.ل</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => alert(`جاري تحميل الإيصال المالي رقم (${txId})...`)}
                className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل الإيصال</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs py-3 rounded-2xl transition-all shadow-md cursor-pointer"
              >
                تم الإغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
