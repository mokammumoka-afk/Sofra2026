'use client';

import React, { useState } from 'react';
import { Post } from '@/lib/types';
import { LIBYAN_CITIES } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { Sparkles, X, MapPin, Wallet, Check } from 'lucide-react';

interface PromotePostModalProps {
  post: Post | null;
  onClose: () => void;
}

export const PromotePostModal: React.FC<PromotePostModalProps> = ({ post, onClose }) => {
  const { promotePost, currentUser } = useStore();
  const [budget, setBudget] = useState<number>(100);
  const [selectedCities, setSelectedCities] = useState<string[]>(['طرابلس', 'مصراتة', 'بنغازي']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!post) return null;

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      setSelectedCities(selectedCities.filter((c) => c !== city));
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budget <= 0) return;
    if (selectedCities.length === 0) {
      alert('يرجى اختيار مدينة مستهدفة واحدة على الأقل');
      return;
    }

    setIsSubmitting(true);
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const success = await promotePost(post.id, budget, selectedCities, startDate, endDate);
    setIsSubmitting(false);

    if (success) {
      alert(`تم إطلاق الحملة الإعلانية الممولة لطبق (${post.title}) بنجاح بقيمة ${budget} د.ل! سيظهر الطبق في أعلى قائمة الإكسبلور.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border border-amber-100 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-extrabold text-base text-stone-900">ترويج وإعلان ممول للطبق ⚡</h2>
          <p className="text-xs text-stone-500 mt-0.5">زيادة المبيعات والوصول لآلاف عشاق الطعام في المدن الليبية</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">ميزانية الإعلان (د.ل):</label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[15, 25, 50, 100].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={`py-2 rounded-xl font-extrabold text-xs border transition-all ${
                    budget === b ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                >
                  {b} د.ل
                </button>
              ))}
            </div>
          </div>

          {/* Metrics breakdown */}
          {(() => {
            let reach = "220 – 600";
            let imp = "600 – 1,800";
            let eng = "15 – 50";
            let cart = "3 – 10";
            let orders = "1 – 5";

            if (budget === 25) {
              reach = "500 – 1,200";
              imp = "1,500 – 3,500";
              eng = "40 – 100";
              cart = "8 – 20";
              orders = "3 – 10";
            } else if (budget === 50) {
              reach = "1,200 – 2,800";
              imp = "3,500 – 8,000";
              eng = "80 – 220";
              cart = "15 – 45";
              orders = "6 – 20";
            } else if (budget === 100) {
              reach = "2,500 – 6,000";
              imp = "8,000 – 18,000";
              eng = "180 – 500";
              cart = "30 – 90";
              orders = "10 – 40";
            }

            return (
              <div className="bg-stone-900 text-stone-100 p-3.5 rounded-2xl space-y-2 border border-stone-800 text-[11px]">
                <div className="font-extrabold text-amber-400 border-b border-white/10 pb-1 flex items-center justify-between">
                  <span>📊 توقعات الأداء لباقة {budget} د.ل:</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">سُفرة إعلانات</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <div className="flex justify-between bg-white/5 p-1.5 rounded-lg">
                    <span className="text-stone-300">👥 الوصول:</span>
                    <span className="font-bold text-amber-300 font-mono">{reach}</span>
                  </div>
                  <div className="flex justify-between bg-white/5 p-1.5 rounded-lg">
                    <span className="text-stone-300">👁️ الظهور:</span>
                    <span className="font-bold text-sky-300 font-mono">{imp}</span>
                  </div>
                  <div className="flex justify-between bg-white/5 p-1.5 rounded-lg">
                    <span className="text-stone-300">❤️ التفاعلات:</span>
                    <span className="font-bold text-rose-300 font-mono">{eng}</span>
                  </div>
                  <div className="flex justify-between bg-white/5 p-1.5 rounded-lg">
                    <span className="text-stone-300">🛒 إضافات السلة:</span>
                    <span className="font-bold text-orange-300 font-mono">{cart}</span>
                  </div>
                </div>

                <div className="flex justify-between bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-300 font-extrabold">
                  <span>🍽️ الطلبات المتوقعة:</span>
                  <span className="font-mono text-emerald-400">{orders} طلبات</span>
                </div>

                <p className="text-[9px] text-stone-400/90 leading-tight pt-0.5">
                  💡 هذه أرقام تقديرية تعتمد على نشاط المستخدمين، جودة صور الأطباق، السعر، والتقييمات.
                </p>
              </div>
            );
          })()}

          <div>
            <label className="font-bold text-stone-700 block mb-1">المدن المستهدفة بالإعلان:</label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-stone-50 rounded-2xl border border-stone-200">
              {LIBYAN_CITIES.map((city) => {
                const isSelected = selectedCities.includes(city);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-stone-600 border border-stone-200'
                    }`}
                  >
                    {city} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition-all"
          >
            تأكيد إطلاق الترويج ({budget} د.ل) عبر DPAY
          </button>
        </form>
      </div>
    </div>
  );
};
