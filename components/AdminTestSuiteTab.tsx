'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ShoppingBag,
  Scale,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Building2,
  Smartphone,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AdminTestSuiteTabProps {
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const AdminTestSuiteTab: React.FC<AdminTestSuiteTabProps> = ({ onShowToast, onNavigateTab }) => {
  const {
    simulateFullOrderCycle,
    simulateDisputeCycle,
    simulatePhoneLeakViolation,
    simulatePayoutRequest,
    simulateSponsoredAdCampaign,
    resetAndReseedSystemData,
    orders,
    disputes,
    filterViolations,
    payoutRequests,
    sponsoredPosts,
    auditLogs,
  } = useStore();

  const [lastExecutedTest, setLastExecutedTest] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const runTest = (testName: string, execute: () => string, targetTab: string, successMsg: string) => {
    setIsRunning(true);
    setLastExecutedTest(testName);
    try {
      const id = execute();
      setTimeout(() => {
        setIsRunning(false);
        onShowToast(`${successMsg} (معرف العنصر: ${id})`);
      }, 350);
    } catch (e) {
      setIsRunning(false);
      onShowToast('حدث خطأ أثناء تنفيذ الاختبار');
    }
  };

  const handleConfirmReset = () => {
    resetAndReseedSystemData();
    setShowConfirmReset(false);
    onShowToast('تمت إعادة ضبط البيانات التجريبية بنجاح 🔄');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950/50 to-stone-900 text-white rounded-3xl p-6 border border-stone-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white">مركز الاختبارات والمحاكاة التفاعلية (QA & Simulation Engine) 🧪</h2>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                100% Functional
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              أدوات تشغيل سيناريوهات حقيقية بنقرة واحدة لاختبار كافة مسارات الطلبات، الضمان، النزاعات، والرقابة
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfirmReset(true)}
          className="bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-xs font-black py-2.5 px-4 rounded-2xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة تهيئة البيانات الأصلية 🔄</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <h3 className="font-black text-lg text-stone-900">تأكيد استعادة وضبط البيانات الأصلية</h3>
            <p className="text-xs text-stone-600 font-bold leading-relaxed">
              هل أنت متأكد من رغبتك في إعادة ضبط وتصفير البيانات واستعادة النسخة الأصلية للبيانات الليبية؟ سيتم إعادة تعيين الطلبات، المحافظ، والنزاعات للقيم الافتراضية.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmReset}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs py-3 rounded-2xl transition-all cursor-pointer shadow-md"
              >
                تأكيد الاستعادة الآن 🔄
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Simulation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Test 1: Full Order + Escrow Cycle */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                الطلبيات والضمان
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-sm text-stone-900">محاكاة دورة طلب وضمان مكتملة 📦</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                إنشاء طلب وجبة كسكاسي ليبي، اقتطاع 100 د.ل من محفظة الزبون، تعيين شركة توصيل «طلبك»، وتفعيل فترة الضمان (Escrow).
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center gap-2">
            <button
              onClick={() =>
                runTest(
                  'order_cycle',
                  simulateFullOrderCycle,
                  'orders',
                  'تمت محاكاة دورة الطلب والضمان المالي بنجاح 📦'
                )
              }
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>تشغيل المحاكاة ⚡</span>
            </button>
            <button
              onClick={() => onNavigateTab('orders')}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="الانتقال لجدول الطلبيات"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* Test 2: Dispute Cycle */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between hover:border-rose-400 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-black">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md">
                النزاعات وحسم الشكاوى
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-sm text-stone-900">محاكاة فتح نزاع مع إثباتات صور ⚖️</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                إنشاء طلب متنازع عليه من زبون مع صور إثبات وحفظه في قائمة النزاعات المفتوحة لاختبار قرار الاسترداد أو الرفض.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center gap-2">
            <button
              onClick={() =>
                runTest(
                  'dispute_cycle',
                  simulateDisputeCycle,
                  'disputes',
                  'تم فتح نزاع تجريبي جديد بنجاح ⚖️'
                )
              }
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>إنشاء نزاع تجريبي 🚨</span>
            </button>
            <button
              onClick={() => onNavigateTab('disputes')}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="الانتقال لتبويب النزاعات"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* Test 3: Phone Leak Interception */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                الحماية ومنع الالتفاف
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-sm text-stone-900">محاكاة تسريب رقم هاتف ومحرك المخاطر 🛡️</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                اعتراض رسالة تحتوي رقماً ليبياً (092XXXXXXX) وتمريرها لمحرك حساب المخاطر السلوكية ووضع الشيف تحت المراقبة.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center gap-2">
            <button
              onClick={() =>
                runTest(
                  'phone_leak',
                  simulatePhoneLeakViolation,
                  'security_risk',
                  'تم تسجيل المخالفة وإعادة حساب مؤشر المخاطر بنجاح 🛡️'
                )
              }
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>تسجيل مخالفة تسريب 📞</span>
            </button>
            <button
              onClick={() => onNavigateTab('security_risk')}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="الانتقال لتبويب المخاطر"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* Test 4: Chef Payout Request */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-stone-900 text-amber-400 flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200 px-2 py-0.5 rounded-md">
                السحب المصرفي
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-sm text-stone-900">محاكاة طلب سحب أرباح شيف 💵</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                طلب سحب بقيمة 300 د.ل إلى مصرف ليبي (NCB) مع حساب عمولة المنصة 15% والصافي 255 د.ل.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center gap-2">
            <button
              onClick={() =>
                runTest(
                  'payout_req',
                  simulatePayoutRequest,
                  'payouts',
                  'تم إنشاء طلب سحب مصرفي تجريبي بنجاح 💵'
                )
              }
              className="flex-1 bg-stone-900 hover:bg-stone-850 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>طلب سحب مصرفي 🏛️</span>
            </button>
            <button
              onClick={() => onNavigateTab('payouts')}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="الانتقال لتبويب السحوبات"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* Test 5: Sponsored Ad Campaign */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between hover:border-purple-400 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md">
                الإعلانات الممولة
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-sm text-stone-900">محاكاة إطلاق حملة ترويجية ممولة 🚀</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                إطلاق إعلان ممول لطبق مع ميزانية 80 د.ل واستهداف مدن طرابلس وبنغازي ومصراتة وإحصائيات ظهور مباشرة.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center gap-2">
            <button
              onClick={() =>
                runTest(
                  'sponsored_ad',
                  simulateSponsoredAdCampaign,
                  'stories_ads',
                  'تم إطلاق الحملة الإعلانية الممولة بنجاح 🚀'
                )
              }
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>إطلاق إعلان ممول 📣</span>
            </button>
            <button
              onClick={() => onNavigateTab('stories_ads')}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="الانتقال لتبويب الإعلانات"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* System Summary Card */}
        <div className="bg-gradient-to-tr from-stone-900 to-stone-850 text-white rounded-3xl p-5 border border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">حالة النظام الحيّ 🇱🇾</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="text-xs space-y-1.5 text-stone-300 font-mono pt-1">
              <div className="flex justify-between">
                <span>الطلبيات النشطة:</span>
                <span className="font-bold text-white">{orders.length} طلب</span>
              </div>
              <div className="flex justify-between">
                <span>النزاعات المفتوحة:</span>
                <span className="font-bold text-rose-400">{disputes.filter((d) => d.status === 'open').length}</span>
              </div>
              <div className="flex justify-between">
                <span>المخالفات المحجوبة:</span>
                <span className="font-bold text-amber-400">{filterViolations.length}</span>
              </div>
              <div className="flex justify-between">
                <span>طلبات السحب المعلقة:</span>
                <span className="font-bold text-emerald-400">{payoutRequests.filter((p) => p.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between">
                <span>الحملات الممولة:</span>
                <span className="font-bold text-purple-400">{sponsoredPosts.length}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 text-[10px] text-stone-400">
            جميع العمليات تُسجل تلقائياً في سجل التدقيق الأمني (Audit Logs).
          </div>
        </div>
      </div>
    </div>
  );
};
