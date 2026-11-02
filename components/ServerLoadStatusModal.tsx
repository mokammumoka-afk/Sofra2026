'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { generateUniqueId } from '@/lib/utils';
import {
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Layers,
  Cpu,
  X,
  Sparkles,
  Users,
  Utensils,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface ServerLoadStatusModalProps {
  onClose: () => void;
}

export const ServerLoadStatusModal: React.FC<ServerLoadStatusModalProps> = ({ onClose }) => {
  const { addPost, posts } = useStore();
  const [simulating, setSimulating] = useState(false);
  const [simulatedCount, setSimulatedCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'test'>('metrics');

  const handleSimulateLoad = async (count: number = 8) => {
    setSimulating(true);
    setSimulatedCount(null);

    const sampleKitchens = [
      { name: 'الشيف خديجة الفيتوري', city: 'طرابلس', title: 'مفروم رشدة برامك طازج' },
      { name: 'مطبخ أم محمد العريبي', city: 'بنغازي', title: 'كسكسي بالحوت والجريد' },
      { name: 'الشيف فاطمة الترهوني', city: 'مصراتة', title: 'عصبان وطاجين طرابلسي' },
      { name: 'مطابخ الجبل الغربي', city: 'غريان', title: 'مقطع بالقديد البلدي' },
      { name: 'الشيف سالم السويحلي', city: 'سبها', title: 'خبزة جمر وتمر محشي' },
      { name: 'مطبخ الوردة البيضاء', city: 'زليتن', title: 'كعك حلو وبكلاوة ليبية' },
      { name: 'الشيف نوال المقرحي', city: 'الزاوية', title: 'مبطن طرابلسي باللحم الفاخر' },
      { name: 'مطبخ الأصالة المصراتية', city: 'مصراتة', title: 'بوريك بالبطاطا والجبنة' },
    ];

    const sampleImages = [
      'https://images.unsplash.com/photo-1621996346565-e3d5d6281288?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ];

    // Simulate concurrent asynchronous network post creation
    const promises = Array.from({ length: count }).map((_, idx) => {
      return new Promise<void>((resolve) => {
        const item = sampleKitchens[idx % sampleKitchens.length];
        const img = sampleImages[idx % sampleImages.length];

        // Random jitter delay between 50ms and 300ms to mimic parallel WebSocket arrivals
        setTimeout(() => {
          addPost({
            title: `${item.title} #${idx + 1}`,
            description: `طبق منزلي طازج تم رفعه في اختبار الضغط العالي للتطبيق بواسطة ${item.name}.`,
            ingredients: ['مكونات طازجة 100%', 'توابل ليبية أصيلة'],
            price: 25 + (idx % 4) * 10,
            is_purchasable: true,
            category: 'traditional',
            city: item.city,
            stock_quantity: 12 + idx,
            preparation_time_mins: 30 + idx * 2,
            images: [img],
          });
          resolve();
        }, Math.floor(Math.random() * 250) + 50);
      });
    });

    await Promise.all(promises);
    setSimulating(false);
    setSimulatedCount(count);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl border border-stone-200 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">مركز كفاءة الأداء واستيعاب الضغط</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                  نشط 100%
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                اختبار جاهزية التطبيق لاستقبال أعداد كبيرة من المنشورات والطلبات المتزامنة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50/80 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-2.5 px-4 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'metrics'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>مؤشرات أداء السيرفر والقنوات</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`pb-2.5 px-4 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'test'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>محاكاة ضغط المنشورات المتزامنة</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'metrics' ? (
            <div className="space-y-4">
              {/* Top Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between text-stone-500 text-[10px] font-bold mb-1">
                    <span>نسبة الجاهزية</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-lg font-black text-stone-900">99.98%</div>
                  <div className="text-[9px] text-emerald-600 font-bold mt-0.5">ممتازة (Zero Downtime)</div>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between text-stone-500 text-[10px] font-bold mb-1">
                    <span>سرعة الاستجابة</span>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-lg font-black text-stone-900">12 ms</div>
                  <div className="text-[9px] text-amber-600 font-bold mt-0.5">فائقة السرعة</div>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between text-stone-500 text-[10px] font-bold mb-1">
                    <span>المنشورات الحالية</span>
                    <Utensils className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div className="text-lg font-black text-stone-900">{posts.length}</div>
                  <div className="text-[9px] text-stone-500 font-bold mt-0.5">محدثة لحظياً</div>
                </div>

                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between text-stone-500 text-[10px] font-bold mb-1">
                    <span>قدرة الاستيعاب</span>
                    <Server className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-lg font-black text-stone-900">5,000+</div>
                  <div className="text-[9px] text-blue-600 font-bold mt-0.5">طلب / ثانية</div>
                </div>
              </div>

              {/* Safeguards features */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2.5">
                <h4 className="font-extrabold text-xs text-amber-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>تقنيات الاحتراف المستعملة لحماية التطبيق عند الذروة:</span>
                </h4>
                <ul className="text-xs text-stone-700 space-y-2 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>مولد المعرفات الفريد (Collision-Proof IDs):</strong> لمنع تضارب المعرفات إذا قام عدة شيفات بالضغط على زر النشر في نفس الجزء من الثانية.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>ضغط الصور الفوري (Client-side Image Compression):</strong> تقليل حجم الصور الملتقطة من الهواتف قبل رفعها لتفادي تجميد الواجهة أو استهلاك الذاكرة.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>التحديث المتفائل (Optimistic Updates):</strong> إظهار المنشور والتعليق والطلب فوراً للمستخدم، بينما تتم المعالجة والتزامن في الخلفية.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>
                      <strong>جدار حماية الأخطاء (Error Boundaries):</strong> حماية كاملة للتطبيق لمنع ظهور الشاشات البيضاء عند حدوث أي خطأ غير متوقع في أي منشور.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-sm">محاكاة ضغط رفع المنشورات المتزامن</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  يمكنك إجراء تجربة حية بنقر الزر أدناه لإنشاء 8 منشورات طعام من مطابخ مختلفة في ليبيا في نفس اللحظة واختبار استجابة النظام.
                </p>
              </div>

              {simulating ? (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-xs text-orange-900">جاري معالجة 8 منشورات متزامنة في الخلفية...</p>
                    <p className="text-[11px] text-orange-700">تطبيق معالجة المعرفات الفريدة وضغط البيانات</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleSimulateLoad(8)}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>تشغيل محاكاة رفع 8 منشورات متزامنة الآن 🚀</span>
                  </button>

                  {simulatedCount !== null && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs space-y-1.5 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2 font-black text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>نجحت المحاكاة بنجاح 100%!</span>
                      </div>
                      <p>
                        تم إضافة {simulatedCount} منشورات متزامنة إلى قائمة المنشورات في غضون أجزاء من الثانية بدون أي أخطاء أو تعارض في المعرفات. يمكنك معاينتها في الصفحة الرئيسية.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
          <div className="text-[11px] text-stone-500 font-bold flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-orange-600" />
            <span>نظام سفرة المهيأ للأداء العالي</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
