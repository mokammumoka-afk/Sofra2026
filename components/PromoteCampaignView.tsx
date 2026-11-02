'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Post, SponsoredPost } from '@/lib/types';
import { LIBYAN_CITIES } from '@/lib/constants';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  Clock,
  Eye,
  Zap,
  MapPin,
  Wallet,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Award,
  Layers,
  ShoppingBag,
  Bell,
  BarChart3,
  Flame,
  PlusCircle,
  Check,
  ChevronLeft,
} from 'lucide-react';

interface PromoteCampaignViewProps {
  initialPost?: Post | null;
  onBack?: () => void;
  onSuccess?: () => void;
}

export const PromoteCampaignView: React.FC<PromoteCampaignViewProps> = ({
  initialPost,
  onBack,
  onSuccess,
}) => {
  const { posts, currentUser, promotePost, sponsoredPosts } = useStore();

  // Active sub-tab in campaign page
  const [subTab, setSubTab] = useState<'create' | 'manage'>('create');

  // Chef's dishes list
  const chefDishes = posts.filter(
    (p) => p.chef_id === currentUser.id || currentUser.role === 'admin'
  );

  // Selected dish for campaign
  const [selectedPostId, setSelectedPostId] = useState<string>(
    initialPost?.id || (chefDishes[0]?.id ?? posts[0]?.id ?? '')
  );

  // Campaign Objectives
  const [campaignGoal, setCampaignGoal] = useState<
    'sales' | 'views' | 'followers' | 'special_offer'
  >('sales');

  // Selected Cities
  const [selectedCities, setSelectedCities] = useState<string[]>([
    'طرابلس',
    'مصراتة',
    'بنغازي',
  ]);

  // Placements
  const [placements, setPlacements] = useState<{
    feed: boolean;
    stories: boolean;
    notification: boolean;
  }>({
    feed: true,
    stories: true,
    notification: false,
  });

  // Budget & Days
  const [budget, setBudget] = useState<number>(100);
  const [durationDays, setDurationDays] = useState<number>(7);

  // Custom budget input
  const [customBudgetInput, setCustomBudgetInput] = useState<string>('');

  // Statuses
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);

  // Get active dish object
  const activePost =
    posts.find((p) => p.id === selectedPostId) || initialPost || posts[0];

  // City Toggle
  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      if (selectedCities.length === 1) {
        alert('يجب اختيار مدينة مستهدفة واحدة على الأقل للحملة');
        return;
      }
      setSelectedCities(selectedCities.filter((c) => c !== city));
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  // Estimate calculations based on budget (Meta / Sufra Ad Estimator)
  const getCampaignEstimates = (b: number) => {
    const safeBudget = Math.max(b, 1);

    let reachMin = Math.round(safeBudget * 22);
    let reachMax = Math.round(safeBudget * 58);
    if (b === 15) { reachMin = 220; reachMax = 600; }
    else if (b === 25) { reachMin = 500; reachMax = 1200; }
    else if (b === 50) { reachMin = 1200; reachMax = 2800; }
    else if (b === 100) { reachMin = 2500; reachMax = 6000; }

    let impMin = Math.round(reachMin * 2.6);
    let impMax = Math.round(reachMax * 3.0);
    if (b === 15) { impMin = 600; impMax = 1800; }
    else if (b === 25) { impMin = 1500; impMax = 3500; }
    else if (b === 50) { impMin = 3500; impMax = 8000; }
    else if (b === 100) { impMin = 8000; impMax = 18000; }

    let engMin = Math.round(safeBudget * 1.5);
    let engMax = Math.round(safeBudget * 4.8);
    if (b === 15) { engMin = 15; engMax = 50; }
    else if (b === 25) { engMin = 40; engMax = 100; }
    else if (b === 50) { engMin = 80; engMax = 220; }
    else if (b === 100) { engMin = 180; engMax = 500; }

    let cartMin = Math.round(safeBudget * 0.25);
    let cartMax = Math.round(safeBudget * 0.88);
    if (b === 15) { cartMin = 3; cartMax = 10; }
    else if (b === 25) { cartMin = 8; cartMax = 20; }
    else if (b === 50) { cartMin = 15; cartMax = 45; }
    else if (b === 100) { cartMin = 30; cartMax = 90; }

    let ordersMin = Math.round(safeBudget * 0.08);
    let ordersMax = Math.round(safeBudget * 0.38);
    if (b === 15) { ordersMin = 1; ordersMax = 5; }
    else if (b === 25) { ordersMin = 3; ordersMax = 10; }
    else if (b === 50) { ordersMin = 6; ordersMax = 20; }
    else if (b === 100) { ordersMin = 10; ordersMax = 40; }

    return {
      reachMin,
      reachMax,
      impMin,
      impMax,
      engMin,
      engMax,
      cartMin,
      cartMax,
      ordersMin,
      ordersMax,
    };
  };

  const currentEstimates = getCampaignEstimates(budget);

  const handleSubmitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activePost) {
      alert('يرجى اختيار طبق أو وجبة للترويج لها أولاً');
      return;
    }

    if (budget < 10) {
      alert('الميزانية الأدنى للحملة الإعلانية هي 10 د.ل');
      return;
    }

    if (currentUser.wallet_balance < budget) {
      alert(
        `رصيد محفظتك الرقمية (${currentUser.wallet_balance} د.ل) غير كافٍ لتغطية تكلفة الحملة (${budget} د.ل). يرجى إعادة شحن المحفظة.`
      );
      return;
    }

    setIsSubmitting(true);

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];

    const success = await promotePost(
      activePost.id,
      budget,
      selectedCities,
      startDate,
      endDate
    );

    setIsSubmitting(false);

    if (success) {
      setLaunchSuccess(true);
      setTimeout(() => {
        setSubTab('manage');
        setLaunchSuccess(false);
        if (onSuccess) onSuccess();
      }, 1500);
    }
  };

  // Filter user's campaigns
  const myCampaigns = sponsoredPosts.filter(
    (sp) =>
      sp.business_id === currentUser.id ||
      sp.post_id === activePost?.id ||
      currentUser.role === 'admin'
  );

  return (
    <div className="w-full space-y-6 pb-28 animate-in fade-in duration-300">
      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-6 shadow-xl border border-amber-900/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-orange-600/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/10"
                title="العودة"
              >
                <ArrowRight className="w-5 h-5 rtl:-scale-x-100" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-500/30 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>منصة الإعلانات الممولة والحملات 🚀</span>
                </span>
                <span className="text-stone-400 text-xs hidden sm:inline">
                  • زيادة المبيعات والانتشار في ليبيا
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                استوديو إطلاق الحملات والترويج الفوري
              </h1>
            </div>
          </div>

          {/* Quick Wallet Stats Pill */}
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <Wallet className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-stone-400 font-bold">رصيد الإعلانات بالمحفظة</div>
              <div className="text-sm font-black text-emerald-400 font-mono">
                {currentUser.wallet_balance.toFixed(0)} د.ل
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubTab('create')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              subTab === 'create'
                ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30'
                : 'bg-white/10 text-stone-300 hover:bg-white/20'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>إطلاق حملة جديدة 🚀</span>
          </button>

          <button
            onClick={() => setSubTab('manage')}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              subTab === 'manage'
                ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30'
                : 'bg-white/10 text-stone-300 hover:bg-white/20'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>حملاتي النشطة والإحصائيات ({myCampaigns.length})</span>
          </button>
        </div>
      </div>

      {/* SUCCESS OVERLAY */}
      {launchSuccess && (
        <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base">تم إطلاق حملتك الإعلانية بنجاح! 🎉</h3>
              <p className="text-emerald-100 text-xs font-medium">
                تم خصم قيمة الحملة ({budget} د.ل) وسيطهر أطباقك الآن في أعلى نتائج البحث والإكسبلور.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: CREATE NEW CAMPAIGN */}
      {subTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Campaign Form (Left 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/90 shadow-md p-5 sm:p-7 space-y-6">
            <form onSubmit={handleSubmitCampaign} className="space-y-6">
              {/* Step 1: Select Dish */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                    <h2 className="font-black text-stone-900 text-base">
                      1. اختر الطبق أو الوجبة للترويج
                    </h2>
                  </div>
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full">
                    {chefDishes.length} مأكولات متاحة
                  </span>
                </div>

                {chefDishes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                    {chefDishes.map((p) => {
                      const isSelected = selectedPostId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPostId(p.id)}
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 relative ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20'
                              : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                          }`}
                        >
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200"
                          />
                          <div className="overflow-hidden flex-1">
                            <h4 className="font-extrabold text-stone-900 text-xs truncate">
                              {p.title}
                            </h4>
                            <p className="text-[11px] font-bold text-amber-600 mt-0.5">
                              {p.price ? `${p.price} د.ل` : 'عرض'}
                            </p>
                            <span className="text-[10px] text-stone-400 font-medium">
                              📍 {p.city}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs shrink-0 shadow-md">
                              ✓
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-stone-600 font-bold">
                      لا يوجد لديك أطباق منشورة حالياً باسم حسابك. يمكنك اختيار طبق عام للبدء:
                    </p>
                    <select
                      value={selectedPostId}
                      onChange={(e) => setSelectedPostId(e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2.5 rounded-xl font-bold text-xs"
                    >
                      {posts.map((p) => (
                        <option key={p.id} value={p.id}>
                          🍲 {p.title} - ({p.chef_name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Step 2: Campaign Goals */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Target className="w-5 h-5 text-amber-600" />
                  <h2 className="font-black text-stone-900 text-base">2. هدف الحملة الإعلانية</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'sales',
                      title: 'مضاعفة المبيعات والطلبات',
                      desc: 'تركيز الإعلان على أزرار "اطلب الآن" والطلب المباشر',
                      icon: <Flame className="w-5 h-5 text-orange-500" />,
                    },
                    {
                      id: 'views',
                      title: 'أقصى وصول ومشاركات',
                      desc: 'عرض الطبق لجميع المستخدمين في المدينة للوصول للآلاف',
                      icon: <Eye className="w-5 h-5 text-amber-500" />,
                    },
                    {
                      id: 'followers',
                      title: 'زيارات مطبخك ومتابعينه',
                      desc: 'جذب المكتشفين لزيارة بروفايلك الشيف ومتابعة وجباتك',
                      icon: <Award className="w-5 h-5 text-emerald-500" />,
                    },
                    {
                      id: 'special_offer',
                      title: 'ترويج عرض خاص أو هدايا',
                      desc: 'إبراز الخصومات وشارات الهدايا للمتابعين الدائمين',
                      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
                    },
                  ].map((g) => {
                    const isSelected = campaignGoal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setCampaignGoal(g.id as any)}
                        className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                            : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white border border-stone-200 shrink-0 shadow-2xs">
                          {g.icon}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-xs">{g.title}</h4>
                          <p className="text-[11px] text-stone-500 font-medium leading-tight mt-1">
                            {g.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Geo Targeting */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <h2 className="font-black text-stone-900 text-base">3. الاستهداف الجغرافي (المدن)</h2>
                  </div>
                  <span className="text-[11px] font-bold text-stone-500">
                    محدد ({selectedCities.length}) مدن
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/90">
                  {LIBYAN_CITIES.map((city) => {
                    const isSelected = selectedCities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleCity(city)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span>📍 {city}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Budget & Duration */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  <h2 className="font-black text-stone-900 text-base">4. ميزانية الحملة والإطار الزمني</h2>
                </div>

                <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-200/90">
                  {/* Budget Presets */}
                  <div>
                    <label className="font-extrabold text-stone-800 text-xs block mb-2">
                      اختر الباقة الإعلانية المناسبة (بالدينار الليبي):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { b: 15, label: '15 د.ل', title: 'الانطلاقة 🧪' },
                        { b: 25, label: '25 د.ل', title: 'النمو والانتشار 🌱' },
                        { b: 50, label: '50 د.ل', title: 'التميز والتصدر ⚡' },
                        { b: 100, label: '100 د.ل', title: 'الملكية 👑' },
                      ].map((preset) => (
                        <button
                          key={preset.b}
                          type="button"
                          onClick={() => {
                            setBudget(preset.b);
                            setCustomBudgetInput('');
                          }}
                          className={`p-3 rounded-2xl font-black text-xs border transition-all cursor-pointer text-center ${
                            budget === preset.b && !customBudgetInput
                              ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-102'
                              : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-100'
                          }`}
                        >
                          <div className="text-sm font-black">{preset.label}</div>
                          <div className={`text-[10px] mt-0.5 ${budget === preset.b && !customBudgetInput ? 'text-amber-100 font-bold' : 'text-stone-500 font-medium'}`}>
                            {preset.title}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mt-2.5">
                      <input
                        type="number"
                        placeholder="أو اكتب ميزانية خاصة (مثلاً 75 د.ل أو 150 د.ل)..."
                        value={customBudgetInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomBudgetInput(val);
                          if (val && Number(val) > 0) {
                            setBudget(Number(val));
                          }
                        }}
                        className="flex-1 bg-white border border-stone-200 text-xs p-2.5 rounded-xl font-bold outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Duration Slider / Select */}
                  <div>
                    <label className="font-extrabold text-stone-800 text-xs block mb-2">
                      مدة تفعيل الحملة الإعلانية:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { days: 3, label: '3 أيام' },
                        { days: 7, label: 'أسبوع (7 أيام)' },
                        { days: 14, label: '14 يوم' },
                        { days: 30, label: 'شهر كامل' },
                      ].map((d) => (
                        <button
                          key={d.days}
                          type="button"
                          onClick={() => setDurationDays(d.days)}
                          className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            durationDays === d.days
                              ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Placement Selection */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Layers className="w-5 h-5 text-amber-600" />
                  <h2 className="font-black text-stone-900 text-base">5. أين سيظهر إعلانك؟</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                      placements.feed
                        ? 'border-amber-500 bg-amber-50/40 font-black text-stone-900'
                        : 'border-stone-200 bg-stone-50 opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={placements.feed}
                      onChange={(e) =>
                        setPlacements({ ...placements, feed: e.target.checked })
                      }
                      className="accent-amber-600 w-4 h-4"
                    />
                    <div className="text-xs">
                      <div className="font-black">أعلى خلاصة الإكسبلور ⚡</div>
                      <div className="text-[10px] text-stone-500 font-medium">الظهور في أول الصفحة</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                      placements.stories
                        ? 'border-amber-500 bg-amber-50/40 font-black text-stone-900'
                        : 'border-stone-200 bg-stone-50 opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={placements.stories}
                      onChange={(e) =>
                        setPlacements({ ...placements, stories: e.target.checked })
                      }
                      className="accent-amber-600 w-4 h-4"
                    />
                    <div className="text-xs">
                      <div className="font-black">شريط الستوريات المميزة 📸</div>
                      <div className="text-[10px] text-stone-500 font-medium">إضاءة حلقة البروفايل</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                      placements.notification
                        ? 'border-amber-500 bg-amber-50/40 font-black text-stone-900'
                        : 'border-stone-200 bg-stone-50 opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={placements.notification}
                      onChange={(e) =>
                        setPlacements({ ...placements, notification: e.target.checked })
                      }
                      className="accent-amber-600 w-4 h-4"
                    />
                    <div className="text-xs">
                      <div className="font-black">إشعار مباشر للمستخدمين 🔔</div>
                      <div className="text-[10px] text-stone-500 font-medium">تنبيه في جوالات مدينتك</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 text-amber-200" />
                  <span>تأكيد وإطلاق الحملة الإعلانية ({budget} د.ل) 🚀</span>
                </button>

                <div className="flex items-center justify-between text-xs text-stone-500 font-bold px-1">
                  <span>طريقة الدفع: محفظة DPAY الرقمية</span>
                  <span className="text-emerald-600">خصم فوري وآمن 🛡️</span>
                </div>
              </div>
            </form>
          </div>

          {/* Right Live Ad Preview & ROI Breakdown (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            {/* ROI Estimation Card */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white p-5.5 rounded-3xl shadow-xl border border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-extrabold text-sm text-stone-100">مؤشرات الأداء والنتائج المتوقعة</h3>
                    <p className="text-[10px] text-stone-400">تقديرات الحملة بناءً على الميزانية المحددة</p>
                  </div>
                </div>
                <span className="bg-white/10 text-stone-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-white/10 shrink-0">
                  تقديري
                </span>
              </div>

              {/* Comprehensive Meta-Style Ad Metrics Breakdown */}
              <div className="space-y-2.5">
                {/* Metric 1: Reach */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-stone-300 font-extrabold flex items-center gap-1.5">
                      <span>👥</span>
                      <span>الوصول التقديري:</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">عدد الأشخاص الفريدين المستهدفين</div>
                  </div>
                  <div className="text-left font-black text-amber-400 text-sm font-mono dir-ltr">
                    {currentEstimates.reachMin.toLocaleString()} – {currentEstimates.reachMax.toLocaleString()} <span className="text-[10px] text-stone-300">شخص</span>
                  </div>
                </div>

                {/* Metric 2: Impressions */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-stone-300 font-extrabold flex items-center gap-1.5">
                      <span>👁️</span>
                      <span>مرات الظهور:</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">مجموع مرات عرض طبقك بالشاشة</div>
                  </div>
                  <div className="text-left font-black text-sky-400 text-sm font-mono dir-ltr">
                    {currentEstimates.impMin.toLocaleString()} – {currentEstimates.impMax.toLocaleString()} <span className="text-[10px] text-stone-300">مرة</span>
                  </div>
                </div>

                {/* Metric 3: Engagement */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-stone-300 font-extrabold flex items-center gap-1.5">
                      <span>❤️</span>
                      <span>التفاعلات المتوقعة:</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">إعجاب، حفظ، مشاركة، وفتح الصفحة</div>
                  </div>
                  <div className="text-left font-black text-rose-400 text-sm font-mono dir-ltr">
                    {currentEstimates.engMin.toLocaleString()} – {currentEstimates.engMax.toLocaleString()} <span className="text-[10px] text-stone-300">تفاعل</span>
                  </div>
                </div>

                {/* Metric 4: Cart Additions */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-stone-300 font-extrabold flex items-center gap-1.5">
                      <span>🛒</span>
                      <span>إضافات إلى السلة:</span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">المستخدمون المهتمون بالشراء الفوري</div>
                  </div>
                  <div className="text-left font-black text-orange-400 text-sm font-mono dir-ltr">
                    {currentEstimates.cartMin} – {currentEstimates.cartMax} <span className="text-[10px] text-stone-300">عنصر</span>
                  </div>
                </div>

                {/* Metric 5: Expected Orders */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-emerald-300 font-extrabold flex items-center gap-1.5">
                      <span>🍽️</span>
                      <span>الطلبات المتوقعة:</span>
                    </div>
                    <div className="text-[10px] text-emerald-200/80 mt-0.5">طلبات طعام حقيقية ومكتملة</div>
                  </div>
                  <div className="text-left font-black text-emerald-400 text-base font-mono dir-ltr">
                    {currentEstimates.ordersMin} – {currentEstimates.ordersMax} <span className="text-xs text-emerald-300">طلب</span>
                  </div>
                </div>
              </div>

              {/* Small Note of Transparency for Chef */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] text-stone-300/90 leading-relaxed">
                💡 <span className="font-semibold">تنويه الشفافية:</span> هذه أرقام تقديرية تعتمد على نشاط المستخدمين، جودة صور الأطباق، السعر، والتقييمات.
              </div>

              <div className="text-xs text-stone-300 space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex justify-between">
                  <span>الميزانية الإجمالية:</span>
                  <span className="font-black text-white font-mono">{budget} د.ل</span>
                </div>
                <div className="flex justify-between">
                  <span>التكلفة اليومية:</span>
                  <span className="font-black text-stone-300 font-mono">
                    {(budget / durationDays).toFixed(1)} د.ل / يوم
                  </span>
                </div>
              </div>
            </div>

            {/* Live Interactive Ad Preview */}
            <div className="bg-white rounded-3xl overflow-hidden border border-amber-200 shadow-xl space-y-0">
              <div className="bg-amber-500 text-stone-950 font-black text-xs px-4 py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>معاينة شكل الإعلان الممول المباشر للمستخدمين</span>
                </span>
                <span className="text-[10px] bg-black/10 px-2 py-0.5 rounded-full">معاينة حية</span>
              </div>

              {activePost ? (
                <div className="p-4 space-y-3 relative">
                  {/* Sponsored Tag */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={currentUser.avatar_url || 'https://picsum.photos/seed/chef/200/200'}
                        alt=""
                        className="w-9 h-9 rounded-2xl object-cover border border-stone-200"
                      />
                      <div>
                        <h4 className="font-black text-stone-900 text-xs">
                          {activePost.chef_name}
                        </h4>
                        <span className="text-[10px] text-amber-600 font-black flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-amber-500" />
                          <span>إعلان ممول 🚀</span>
                        </span>
                      </div>
                    </div>

                    <span className="bg-orange-100 text-orange-900 text-[10px] font-black px-2.5 py-1 rounded-full">
                      📍 {activePost.city}
                    </span>
                  </div>

                  {/* Post Image */}
                  <div className="relative rounded-2xl overflow-hidden h-48 bg-stone-100">
                    <img
                      src={activePost.images[0]}
                      alt={activePost.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-stone-900/90 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-md">
                      {activePost.price ? `${activePost.price} د.ل` : 'عرض'}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-stone-900 text-sm">{activePost.title}</h3>
                    <p className="text-stone-600 text-xs mt-1 line-clamp-2">
                      {activePost.description}
                    </p>
                  </div>

                  <button className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5">
                    <span>اطلب الآن من الإعلان الممول 🛒</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-stone-400 text-xs">
                  يرجى اختيار طبق لعرض المعاينة
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY ACTIVE & PAST CAMPAIGNS */}
      {subTab === 'manage' && (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-md p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h2 className="font-black text-stone-900 text-lg">سجل الحملات الإعلانية الممولة</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                إدارة حملاتك، متابعة الوصول الحقيقي والنتائج في الوقت الفعلي
              </p>
            </div>
            <button
              onClick={() => setSubTab('create')}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إطلاق حملة جديدة</span>
            </button>
          </div>

          {myCampaigns.length > 0 ? (
            <div className="space-y-4">
              {myCampaigns.map((camp) => {
                const targetPost = posts.find((p) => p.id === camp.post_id);
                return (
                  <div
                    key={camp.id}
                    className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-300 transition-all shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {targetPost?.images[0] ? (
                          <img
                            src={targetPost.images[0]}
                            alt=""
                            className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-stone-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-black text-xs">
                            إعلان
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>حملة نشطة ⚡</span>
                            </span>
                            <span className="text-stone-400 text-xs font-mono">#{camp.id}</span>
                          </div>
                          <h4 className="font-black text-stone-900 text-sm mt-1">
                            {targetPost?.title || 'حملة ترويج مأكولات'}
                          </h4>
                          <p className="text-stone-500 text-xs font-medium">
                            المدن المستهدفة: {camp.target_cities.join('، ')}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-2xl border border-stone-200 flex items-center gap-4 shrink-0">
                        <div>
                          <div className="text-[10px] text-stone-400 font-bold">الميزانية</div>
                          <div className="text-xs font-black text-stone-900 font-mono">
                            {camp.budget} د.ل
                          </div>
                        </div>
                        <div className="w-px h-6 bg-stone-200" />
                        <div>
                          <div className="text-[10px] text-stone-400 font-bold">تاريخ الانتهاء</div>
                          <div className="text-xs font-black text-stone-700 font-mono">
                            {camp.end_date}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Real-time Campaign Performance Stats Grid */}
                    <div className="space-y-3 pt-2 border-t border-stone-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-stone-800 flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-amber-600" />
                          <span>إحصائيات الأداء الحقيقية والمباشرة (100% Real Live Analytics):</span>
                        </span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                          تحديث حي
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div className="bg-white p-3 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                          <div className="text-[10px] text-stone-500 font-bold">👁️ مشاهدات الظهور</div>
                          <div className="text-base font-black text-stone-900 font-mono mt-1">
                            {(camp.impressions || 0).toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                          <div className="text-[10px] text-stone-500 font-bold">🖱️ النقرات وتصفح الطبق</div>
                          <div className="text-base font-black text-amber-600 font-mono mt-1">
                            {camp.clicks || 0}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                          <div className="text-[10px] text-stone-500 font-bold">❤️ الإعجابات الحقيقية</div>
                          <div className="text-base font-black text-rose-600 font-mono mt-1">
                            {camp.likes_count || 0}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                          <div className="text-[10px] text-stone-500 font-bold">🛒 نقرات بدء الطلب</div>
                          <div className="text-base font-black text-orange-600 font-mono mt-1">
                            {camp.cart_adds || 0}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-stone-200/80 text-center shadow-2xs col-span-2 sm:col-span-1">
                          <div className="text-[10px] text-stone-500 font-bold">🍽️ الطلبات الفعلية</div>
                          <div className="text-base font-black text-emerald-600 font-mono mt-1">
                            {camp.orders_count || 0}
                          </div>
                        </div>
                      </div>

                      {/* How to test notice banner */}
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1">
                        <div className="font-black flex items-center gap-1.5 text-amber-900">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>كيف تختبر وتتأكد من النتائج الحقيقية لإعلانك الممول؟</span>
                        </div>
                        <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                          إعلانك منشور حالياً بنجاح لجميع الزبائن بشارة (ممول ⚡). لاختباره: قم بالتبديل إلى حساب مستخدم آخر (مثل: أحمد الزوي)، تصفح الرئيسية أو الإكسبلور، انقر على طبقك الممول، اضغط إعجاب أو اطلب الطبق. ثم عُد لحساب الشيف هذا لتشاهد رصد وتسجيل الأرقام مباشرة بدون أي تزييف!
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-black text-stone-900 text-base">لا توجد حملات إعلانية سابقة</h3>
              <p className="text-stone-500 text-xs max-w-sm mx-auto font-medium">
                قم بإطلاق أول حملة إعلانية ممولة لأطباقك وسوف تظهر هنا إحصائيات الوصول والطلبات مباشرة.
              </p>
              <button
                onClick={() => setSubTab('create')}
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إطلاق أول حملة الآن 🚀</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
