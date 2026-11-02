'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  ShieldCheck,
  Users,
  ChefHat,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Sparkles,
  AlertTriangle,
  MapPin,
  Clock,
  TrendingUp,
  CreditCard,
  Building2,
  Trash2,
  PlusCircle,
  Filter,
  DollarSign,
  Truck,
  Eye,
  RefreshCw,
  Award,
  SlidersHorizontal,
  Scale,
  Flag,
  RotateCcw,
  Check,
  ExternalLink,
  ShieldAlert,
  Database,
} from 'lucide-react';
import { OrderStatus, UserRole } from '@/lib/types';
import { DPAY_GATEWAYS } from '@/lib/constants';

import { PWAAnalyticsTabContent } from './PWAAnalyticsTabContent';
import { AdminDisputesTab } from './AdminDisputesTab';
import { AdminReportsTab } from './AdminReportsTab';
import { AdminTestSuiteTab } from './AdminTestSuiteTab';
import { SupabaseConfigTab } from './SupabaseConfigTab';
import { AdminDeliveryMiniMap } from './AdminDeliveryMiniMap';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    chefProfiles,
    orders,
    auditLogs,
    verifyChefAccount,
    addAuditLog,
    posts,
    stories,
    walletTransactions,
    gifts,
    sponsoredPosts,
    updateOrderStatus,
    deletePostAdmin,
    adjustUserWalletAdmin,
    updateUserRoleAdmin,
    toggleUserVerificationAdmin,
    payoutRequests,
    commissionSettings,
    processPayoutAdmin,
    updateCommissionSettingsAdmin,
    deleteStoryAdmin,
    toggleSponsoredAdStatusAdmin,
    clearAllSponsoredAds,
    platformSettings,
    updatePlatformSettingsAdmin,
    filterViolations,
    sellerRiskScores,
    recalculateRiskScores,
    resolveRiskStatusAdmin,
    clearViolationsAdmin,
    fastForwardEscrowReleaseAdmin,
    disputes,
    reports,
  } = useStore();

  const [activeAdminTab, setActiveAdminTab] = useState<
    | 'kpis'
    | 'verifications'
    | 'users'
    | 'posts'
    | 'orders'
    | 'live_map'
    | 'disputes'
    | 'reports'
    | 'dpay'
    | 'payouts'
    | 'security_risk'
    | 'stories_ads'
    | 'pwa_analytics'
    | 'test_suite'
    | 'settings'
    | 'audit'
    | 'supabase'
  >('kpis');

  const [showMiniMapInOrders, setShowMiniMapInOrders] = useState<boolean>(true);

  // Search and Filter states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserRole, setSelectedUserRole] = useState<string>('all');
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Payouts & Commission state
  const [salesCommPercent, setSalesCommPercent] = useState<number>(commissionSettings.sales_commission_percent);
  const [giftsCommPercent, setGiftsCommPercent] = useState<number>(commissionSettings.gifts_commission_percent);
  const [payoutFilterStatus, setPayoutFilterStatus] = useState<string>('all');
  const [rejectingPayoutId, setRejectingPayoutId] = useState<string | null>(null);
  const [payoutRejectReason, setPayoutRejectReason] = useState<string>('بيانات الحساب غير مطابقة مع السجل');

  // Wallet adjustment modal state
  const [adjustingUser, setAdjustingUser] = useState<{ id: string; name: string } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustNote, setAdjustNote] = useState<string>('تسوية حافز تشجيعي');

  // Chef Verification Reject Modal State
  const [rejectingChefUserId, setRejectingChefUserId] = useState<string | null>(null);
  const [chefRejectReason, setChefRejectReason] = useState<string>('الشهادة الصحية غير واضحة أو منتهية الصلاحية');

  // Chef Docs Preview Modal State
  const [previewingChefProfile, setPreviewingChefProfile] = useState<{
    kitchen_name: string;
    owner_name: string;
    doc_url: string;
  } | null>(null);

  // Risk Suspend Modal State
  const [suspendingChef, setSuspendingChef] = useState<{ chef_id: string; chef_name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('تكرار محاولات تداول أرقام الهواتف والتوجيه خارج التطبيق');

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Financial Metrics
  const totalUsers = users.length;
  const totalOrdersCount = orders.length;
  const totalSalesVolume = orders.reduce((acc, o) => acc + o.total_price, 0);
  const totalGiftsVolume = gifts.reduce((acc, g) => acc + g.amount, 0);
  const totalPlatformCommissions = totalSalesVolume * (commissionSettings.sales_commission_percent / 100);
  const totalUserWalletBalances = users.reduce((acc, u) => acc + u.wallet_balance, 0);

  // Pending chef verification requests
  const pendingChefs = Object.values(chefProfiles).filter((p) => p.verification_status === 'pending');
  const approvedChefs = Object.values(chefProfiles).filter((p) => p.verification_status === 'approved');

  // Badge counts
  const openDisputesCount = disputes.filter((d) => d.status === 'open').length;
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const pendingPayoutsCount = payoutRequests.filter((p) => p.status === 'pending').length;
  const activeDeliveriesCount = orders.filter((o) => ['out_for_delivery', 'preparing', 'accepted'].includes(o.status)).length;

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.full_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.city.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearchQuery));

    const matchesRole = selectedUserRole === 'all' || u.role === selectedUserRole;
    return matchesQuery && matchesRole;
  });

  const filteredPosts = posts.filter((p) => {
    const matchesQuery =
      p.title.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      p.chef_name.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(postSearchQuery.toLowerCase());

    const matchesCategory = postCategoryFilter === 'all' || p.category === postCategoryFilter;
    return matchesQuery && matchesCategory;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const handleAdjustWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    adjustUserWalletAdmin(adjustingUser.id, adjustAmount, adjustNote);
    showToast(`تم تعديل رصيد ${adjustingUser.name} بقيمة ${adjustAmount} د.ل بنجاح 💰`);
    setAdjustingUser(null);
  };

  const handleChefRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingChefUserId) return;
    verifyChefAccount(rejectingChefUserId, false, chefRejectReason);
    showToast('تم رفض طلب التوثيق وإرسال السبب للشيف بنجاح ❌');
    setRejectingChefUserId(null);
  };

  const handleSuspendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingChef) return;
    resolveRiskStatusAdmin(suspendingChef.chef_id, 'suspended', suspendReason);
    showToast(`تم تعليق وتجميد حساب ${suspendingChef.chef_name} بنجاح ⛔`);
    setSuspendingChef(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-black">{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 shadow-xl border border-stone-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-stone-950 flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-7 h-7 text-stone-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl text-white">لوحة الإدارة المركزية والرقابة المالية 🇱🇾</h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>DPAY Active</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              إدارة الشيفات الموثقين، تسويات DPAY والضمان، النزاعات، الرقابة على البلاغات، والمحاكاة
            </p>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-800/90 p-1.5 rounded-2xl text-xs font-bold border border-stone-700/80 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveAdminTab('kpis')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'kpis' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            📊 المبيعات KPIs
          </button>
          <button
            onClick={() => setActiveAdminTab('verifications')}
            className={`relative px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'verifications'
                ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <span>👨‍🍳 توثيق الشيفات</span>
            {pendingChefs.length > 0 && (
              <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1 animate-bounce">
                {pendingChefs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'users' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            👥 المستخدمون ({users.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('posts')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'posts' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            🍲 الأطباق والمنشورات ({posts.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('orders')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'orders' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            📦 الطلبيات والتوصيل ({orders.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('live_map')}
            className={`relative px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeAdminTab === 'live_map'
                ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <span>🗺️ خريطة التوصيل المباشرة</span>
            {activeDeliveriesCount > 0 && (
              <span className="bg-emerald-500 text-stone-950 text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {activeDeliveriesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('disputes')}
            className={`relative px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'disputes' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            <span>⚖️ النزاعات والضمان</span>
            {openDisputesCount > 0 && (
              <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1 animate-pulse">
                {openDisputesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`relative px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'reports' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            <span>🚨 البلاغات والرقابة</span>
            {pendingReportsCount > 0 && (
              <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {pendingReportsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('dpay')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'dpay' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            💳 تسويات DPAY
          </button>
          <button
            onClick={() => setActiveAdminTab('payouts')}
            className={`relative px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'payouts'
                ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <span>💵 السحب والعمولات</span>
            {pendingPayoutsCount > 0 && (
              <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1 animate-pulse">
                {pendingPayoutsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('security_risk')}
            className={`relative px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'security_risk'
                ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <span>🛡️ أمان الرسائل والمخاطر</span>
            {filterViolations.length > 0 && (
              <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {filterViolations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('stories_ads')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'stories_ads' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            🎬 القصص والإعلانات ({stories.length + sponsoredPosts.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('pwa_analytics')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'pwa_analytics' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            📱 إحصائيات PWA والزوار
          </button>
          <button
            onClick={() => setActiveAdminTab('test_suite')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'test_suite' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            🧪 مركز الاختبارات والمحاكاة
          </button>
          <button
            onClick={() => setActiveAdminTab('settings')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'settings' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            ⚙️ إعدادات المنصة
          </button>
          <button
            onClick={() => setActiveAdminTab('supabase')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeAdminTab === 'supabase' ? 'bg-emerald-500 text-stone-950 font-black shadow-xs' : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>قاعدة بيانات Supabase</span>
          </button>
          <button
            onClick={() => setActiveAdminTab('audit')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeAdminTab === 'audit' ? 'bg-amber-500 text-stone-950 font-black shadow-xs' : 'text-stone-300 hover:text-white'
            }`}
          >
            📜 سجل التدقيق
          </button>
        </div>
      </div>

      {/* Tab 1: KPIs & Financial Analytics */}
      {activeAdminTab === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
                <span>حجم المبيعات الكلي</span>
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="font-black text-3xl text-emerald-700">{totalSalesVolume.toFixed(0)} د.ل</div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-stone-400">عمولة المنصة ({commissionSettings.sales_commission_percent}%):</span>
                <span className="font-extrabold text-stone-900">{totalPlatformCommissions.toFixed(1)} د.ل</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
                <span>إجمالي أرصدة المحافظ (DPAY)</span>
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="font-black text-3xl text-stone-900">{totalUserWalletBalances.toFixed(0)} د.ل</div>
              <div className="mt-2 text-[11px] text-amber-700 font-bold">موزعة على {totalUsers} محفظة موثقة</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
                <span>حجم الهدايا التشجيعية</span>
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="font-black text-3xl text-purple-700">{totalGiftsVolume.toFixed(0)} د.ل</div>
              <div className="mt-2 text-[11px] text-stone-400 font-bold">إجمالي {gifts.length} هدية أُرسلت للشيفات</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
                <span>إجمالي الطلبيات المسجلة</span>
                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="font-black text-3xl text-stone-900">{totalOrdersCount} طلب</div>
              <div className="mt-2 text-[11px] text-blue-600 font-bold">نسبة النجاح 98.5% عبر الشركات</div>
            </div>
          </div>

          {/* Regional Performance Grid */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>إحصائيات المبيعات والنشاط عبر المدن والمناطق الليبية:</span>
              </h3>
              <span className="text-xs font-bold text-stone-500">19 مدينة مغطاة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {['طرابلس', 'بنغازي', 'مصراتة', 'سبها', 'الزاوية', 'الخمس', 'زليتن', 'سرت'].map((city) => {
                const cityPosts = posts.filter((p) => p.city === city).length;
                const cityOrders = orders.filter((o) => o.delivery_city === city);
                const citySales = cityOrders.reduce((acc, o) => acc + o.total_price, 0);

                return (
                  <div key={city} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 hover:border-orange-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-sm text-stone-900">{city}</span>
                      <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md font-bold">
                        {cityOrders.length} طلب
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>الأطباق المعروضة:</span>
                        <span className="font-bold text-stone-900">{cityPosts} أطباق</span>
                      </div>
                      <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-200/50">
                        <span>إجمالي المبيعات:</span>
                        <span className="font-extrabold text-emerald-700">{citySales} د.ل</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Chef Verification Queue */}
      {activeAdminTab === 'verifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-600" />
                <span>طلبات توثيق الشيفات والمطابخ المنزلية (قيد المراجعة)</span>
              </h3>
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-xl">
                {pendingChefs.length} طلب معلق
              </span>
            </div>

            {pendingChefs.length === 0 ? (
              <div className="p-10 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl">
                لا توجد طلبات توثيق معلقة حالياً! جميع المتقدمين تم النظر في طلباتهم.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingChefs.map((profile) => {
                  const user = users.find((u) => u.id === profile.user_id);
                  if (!user) return null;

                  return (
                    <div
                      key={profile.user_id}
                      className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img src={user.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-stone-900">{profile.kitchen_name}</h4>
                            <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {user.city}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5">
                            المالك: <span className="font-bold">{user.full_name}</span> (@{user.username}) • هاتف: {user.phone || '091XXXXXXX'}
                          </p>
                          <div className="mt-2 text-[11px] bg-white p-2 rounded-xl border border-amber-200 text-stone-700 flex items-center justify-between gap-3">
                            <span>📜 المستند: {profile.verification_docs?.health_cert_url || 'شهادة صحية ليبية معتمدة'}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewingChefProfile({
                                  kitchen_name: profile.kitchen_name,
                                  owner_name: user.full_name,
                                  doc_url: profile.verification_docs?.health_cert_url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
                                })
                              }
                              className="text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>معاينة المستند</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            verifyChefAccount(profile.user_id, true);
                            showToast(`تم قبول وتوثيق مطبخ ${profile.kitchen_name} بنجاح ✅`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>قبول وتوثيق المطبخ ✅</span>
                        </button>

                        <button
                          onClick={() => {
                            setRejectingChefUserId(profile.user_id);
                          }}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>رفض الطلب</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Approved Verified Chefs Table */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>قائمة الشيفات الموثقين بشارة التوثيق الزرقاء ({approvedChefs.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="p-3">المطبخ والشيف</th>
                    <th className="p-3">المدينة</th>
                    <th className="p-3">التقييم</th>
                    <th className="p-3">المبيعات</th>
                    <th className="p-3">حالة التوثيق</th>
                    <th className="p-3">إجراءات الإدارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {approvedChefs.map((profile) => {
                    const user = users.find((u) => u.id === profile.user_id);
                    if (!user) return null;

                    return (
                      <tr key={profile.user_id} className="hover:bg-stone-50/80">
                        <td className="p-3 flex items-center gap-2">
                          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="font-bold text-stone-900">{profile.kitchen_name}</div>
                            <div className="text-[10px] text-stone-400">{user.full_name}</div>
                          </div>
                        </td>
                        <td className="p-3 font-bold">{user.city}</td>
                        <td className="p-3 text-amber-600 font-bold">⭐ {profile.rating_avg} ({profile.rating_count})</td>
                        <td className="p-3 font-extrabold text-emerald-700">{profile.total_sales} د.ل</td>
                        <td className="p-3">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            موثق بالكامل ✅
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              toggleUserVerificationAdmin(user.id);
                              showToast('تم تعديل شارة التوثيق للشيف');
                            }}
                            className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            سحب التوثيق
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: User Management */}
      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">إدارة مستخدمي المنصة وسجل المحافظ</h3>
              <p className="text-xs text-stone-500">إدخال الصلاحيات، تعديل الأرصدة، وتوثيق الحسابات</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedUserRole}
                onChange={(e) => setSelectedUserRole(e.target.value)}
                className="bg-stone-100 text-xs font-bold px-3 py-2 rounded-xl outline-none border border-stone-200"
              >
                <option value="all">كل الأدوار</option>
                <option value="customer">مستخدم عادي</option>
                <option value="chef">شيف / مطبخ</option>
                <option value="admin">أدمن النظام</option>
              </select>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم، المدينة، أو الموبايل..."
                  className="w-full bg-stone-100 text-xs pr-8 pl-3 py-2 rounded-xl outline-none border border-stone-200"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold">
                <tr>
                  <th className="p-3">المستخدم</th>
                  <th className="p-3">الدور الحالي</th>
                  <th className="p-3">المدينة</th>
                  <th className="p-3">رقم الموبايل</th>
                  <th className="p-3">رصيد DPAY</th>
                  <th className="p-3">التوثيق</th>
                  <th className="p-3 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/80">
                    <td className="p-3 flex items-center gap-2">
                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border" />
                      <div>
                        <div className="font-bold text-stone-900">{u.full_name}</div>
                        <div className="text-[10px] text-stone-400">@{u.username}</div>
                      </div>
                    </td>

                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => {
                          updateUserRoleAdmin(u.id, e.target.value as UserRole);
                          showToast(`تم تغيير دور ${u.full_name} إلى ${e.target.value}`);
                        }}
                        className="bg-stone-100 border border-stone-200 font-bold text-[11px] rounded-lg px-2 py-1 outline-none"
                      >
                        <option value="customer">مستخدم عادي</option>
                        <option value="chef">شيف / مطبخ</option>
                        <option value="admin">أدمن</option>
                      </select>
                    </td>

                    <td className="p-3 font-medium">{u.city}</td>
                    <td className="p-3 font-mono dir-ltr text-right">{u.phone || '0912345678'}</td>

                    <td className="p-3 font-mono font-extrabold text-emerald-700">
                      {u.wallet_balance.toFixed(0)} د.ل
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => {
                          toggleUserVerificationAdmin(u.id);
                          showToast('تم تعديل شارة التوثيق للمستخدم');
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                          u.is_verified
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}
                      >
                        {u.is_verified ? 'موثق ✅' : 'غير موثق'}
                      </button>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setAdjustingUser({ id: u.id, name: u.full_name });
                        }}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                      >
                        ⚙️ تعديل الرصيد
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Posts & Menu Moderation */}
      {activeAdminTab === 'posts' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">إدارة الأطباق والمنشورات المعروضة</h3>
              <p className="text-xs text-stone-500">مراقبة جودة المحتوى وحذف الأطباق غير اللائقة</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={postCategoryFilter}
                onChange={(e) => setPostCategoryFilter(e.target.value)}
                className="bg-stone-100 text-xs font-bold px-3 py-2 rounded-xl outline-none border border-stone-200"
              >
                <option value="all">كل التصنيفات</option>
                <option value="وجبات رئيسية">وجبات رئيسية</option>
                <option value="حلويات ومخبوزات">حلويات ومخبوزات</option>
                <option value="معجنات ومقبلات">معجنات ومقبلات</option>
                <option value="أطباق رمضانية">أطباق رمضانية</option>
              </select>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={postSearchQuery}
                  onChange={(e) => setPostSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الطبق أو الشيف..."
                  className="w-full bg-stone-100 text-xs pr-8 pl-3 py-2 rounded-xl outline-none border border-stone-200"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex gap-3 relative">
                <img src={post.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-bold text-xs text-stone-900 truncate">{post.title}</div>
                  <div className="text-[10px] text-stone-500">
                    الشيف: <span className="font-bold">{post.chef_name}</span> • {post.city}
                  </div>
                  <div className="text-[11px] font-extrabold text-orange-700">
                    {post.price ? `${post.price} د.ل` : 'هدايا فقط 🎁'}
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[10px]">
                    <span className="bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-bold">
                      {post.category}
                    </span>

                    <button
                      onClick={() => {
                        deletePostAdmin(post.id);
                        showToast(`تم حذف منشور «${post.title}» بنجاح 🗑️`);
                      }}
                      className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف المنشور</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Orders & Logistics Tracking */}
      {activeAdminTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">متابعة شحنات الطلبيات والنزاعات</h3>
              <p className="text-xs text-stone-500">التحديث المباشر لحالات التوصيل وتحرير الضمان المالي</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveAdminTab('live_map')}
                className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-400/50 font-black text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🗺️ الخريطة الموسعة</span>
                <ExternalLink className="w-3 h-3 text-orange-600" />
              </button>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-stone-100 text-xs font-bold px-3 py-2 rounded-xl outline-none border border-stone-200"
              >
                <option value="all">كل حالات الطلب</option>
                <option value="pending">قيد الانتظار</option>
                <option value="accepted">تم القبول</option>
                <option value="preparing">جاري التحضير</option>
                <option value="out_for_delivery">خرج للتوصيل</option>
                <option value="delivered">تم التسليم</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>

          {/* Integrated Live Mini Map View for Real-Time Delivery Tracking */}
          <div className="rounded-3xl overflow-hidden border border-stone-200/90 shadow-2xs">
            <div className="p-3 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🗺️</span>
                <span className="text-xs font-black">خريطة مصغرة لمتابعة حركة المناديب في مسارات التوصيل (Live Mini Map)</span>
                <span className="bg-emerald-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {activeDeliveriesCount} شحنات نشطة
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveAdminTab('live_map')}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <span>فتح شاشة الخريطة الكاملة</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <AdminDeliveryMiniMap
              orders={orders}
              onUpdateOrderStatus={(orderId, status) => {
                updateOrderStatus(orderId, status);
                showToast(`تم تحديث حالة الطلب #${orderId} إلى ${status}`);
              }}
              className="h-[360px] rounded-none border-0"
            />
          </div>

          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img src={order.post_image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-stone-900">#{order.id}</span>
                      <span className="font-bold text-xs text-stone-700">• {order.post_title}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      صاحب الطلب: <span className="font-bold">{order.customer_name}</span> ({order.customer_phone}) • الشيف: {order.chef_name}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>العنوان: {order.delivery_address} ({order.delivery_city}) • شركة التوصيل: {order.delivery_provider}</span>
                      {order.status === 'delivered' && (
                        order.escrow_released_at ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                            الضمان: مُحرر للشيف ✅
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                            الضمان: محجوز 48س ⏳
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['accepted', 'preparing', 'out_for_delivery'].includes(order.status) && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAdminTab('live_map');
                      }}
                      className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-300 font-bold text-[11px] px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="تتبع مسار الطلب وموقع المندوب على الخريطة المباشرة"
                    >
                      <MapPin className="w-3 h-3 text-orange-600" />
                      <span>تتبع على الخريطة</span>
                    </button>
                  )}

                  <div className="text-left font-mono font-black text-sm text-emerald-700">
                    {order.total_price} د.ل
                  </div>

                  {order.status === 'delivered' && !order.escrow_released_at && (
                    <button
                      onClick={() => {
                        fastForwardEscrowReleaseAdmin(order.id);
                        showToast(`تم تحرير رصيد الضمان للشيف ${order.chef_name} بنجاح ⚡`);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                      title="تحرير رصيد الضمان للشيف فوراً"
                    >
                      ⚡ تحرير الضمان للشيف
                    </button>
                  )}

                  <select
                    value={order.status}
                    onChange={(e) => {
                      updateOrderStatus(order.id, e.target.value as OrderStatus);
                      showToast(`تم تحديث حالة الطلب #${order.id} إلى ${e.target.value}`);
                    }}
                    className="bg-white border border-stone-300 font-extrabold text-xs rounded-xl px-2.5 py-1.5 outline-none shadow-xs"
                  >
                    <option value="pending">⏳ قيد الانتظار</option>
                    <option value="accepted">✅ تم القبول</option>
                    <option value="preparing">🍳 جاري التجهيز</option>
                    <option value="out_for_delivery">🚗 خرج للتوصيل</option>
                    <option value="delivered">🎉 تم التسليم</option>
                    <option value="cancelled">❌ ملغي</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Dedicated Live Delivery Coordinates Mini Map */}
      {activeAdminTab === 'live_map' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl shadow-md">
                🛰️
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-2">
                  <span>خريطة التتبع المباشر وإحداثيات التوصيل (Live GPS Coordinates)</span>
                  <span className="bg-emerald-500/20 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                    مباشر GPS
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  تتبع موقع مندوبي التوصيل والطلبيات النشطة لحظياً باستخدام الإحداثيات الجغرافية لمناطق ومدن ليبيا
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-200 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-orange-600" />
                <span>الشحنات النشطة:</span>
                <strong className="text-emerald-700 font-mono text-sm">{activeDeliveriesCount}</strong>
              </span>
            </div>
          </div>

          <AdminDeliveryMiniMap
            orders={orders}
            onUpdateOrderStatus={(orderId, status) => {
              updateOrderStatus(orderId, status);
              showToast(`تم تحديث حالة الطلب #${orderId} إلى ${status}`);
            }}
            className="h-[540px]"
          />
        </div>
      )}

      {/* Tab 6: Disputes & Escrow Resolution */}
      {activeAdminTab === 'disputes' && <AdminDisputesTab onShowToast={showToast} />}

      {/* Tab 7: Reports & Content Moderation */}
      {activeAdminTab === 'reports' && <AdminReportsTab onShowToast={showToast} />}

      {/* Tab 8: DPAY Settlement Logs */}
      {activeAdminTab === 'dpay' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>سجل التسويات وبوابات الدفع الوطنية (DPAY Gateway)</span>
              </h3>
              <p className="text-xs text-stone-500">مربوطة مع البوابات المصرفية المعتمدة من مصرف ليبيا المركزي</p>
            </div>

            <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>الربط جاهز (REST API)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DPAY_GATEWAYS.map((gw) => (
              <div key={gw.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-2">
                <span className="text-xl">{gw.icon}</span>
                <div>
                  <div className="font-bold text-xs text-stone-900">{gw.name}</div>
                  <div className="text-[10px] text-stone-500">{gw.name_ar}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <h4 className="font-bold text-xs text-stone-800 mb-2">سجل عمليات المحافظ الأخيرة:</h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {walletTransactions.map((tx) => (
                <div key={tx.id} className="p-3 bg-stone-50 rounded-xl text-xs flex items-center justify-between font-mono">
                  <div>
                    <div className="font-bold text-stone-900">{tx.title}</div>
                    <div className="text-[10px] text-stone-400">
                      معرف العملية: {tx.id} • المستخدم: {users.find((u) => u.id === tx.user_id)?.full_name || tx.user_id}
                    </div>
                  </div>
                  <div className={`font-black ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} د.ل
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Payouts & Commissions */}
      {activeAdminTab === 'payouts' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Commission Settings Panel */}
          <div className="bg-gradient-to-tr from-stone-900 via-stone-850 to-stone-800 text-white rounded-3xl p-6 shadow-xl border border-stone-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-700/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">إعدادات نسب أرباح التطبيق والعمولات 🇱🇾</h3>
                  <p className="text-[11px] text-stone-400">
                    التحكم الديناميكي المباشر في نسبة اقتطاع المنصة لأرباح المبيعات وأرباح الهدايا
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-stone-800/80 p-2 rounded-2xl border border-stone-700 text-xs">
                <span className="text-amber-400 font-bold">العمولات الحالية:</span>
                <span className="text-emerald-400 font-mono font-black">مبيعات {commissionSettings.sales_commission_percent}%</span>
                <span className="text-stone-500">|</span>
                <span className="text-purple-400 font-mono font-black">هدايا {commissionSettings.gifts_commission_percent}%</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCommissionSettingsAdmin(salesCommPercent, giftsCommPercent);
                showToast('تم حفظ واعتماد نسب عمولات التطبيق الجديدة بنجاح ✅');
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
            >
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  نسبة اقتطاع مبيعات الوجبات (15% افتراضي):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={salesCommPercent}
                    onChange={(e) => setSalesCommPercent(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full bg-stone-950/80 border border-stone-700 rounded-2xl p-3 text-sm font-extrabold text-white outline-none focus:border-amber-500 pl-8"
                  />
                  <span className="absolute left-3 top-3.5 text-stone-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  نسبة اقتطاع أرباح الهدايا (50% افتراضي):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={giftsCommPercent}
                    onChange={(e) => setGiftsCommPercent(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full bg-stone-950/80 border border-stone-700 rounded-2xl p-3 text-sm font-extrabold text-white outline-none focus:border-amber-500 pl-8"
                  />
                  <span className="absolute left-3 top-3.5 text-stone-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ وإعتماد النسب الجديدة</span>
                </button>
              </div>
            </form>
          </div>

          {/* Payout Requests Section */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>جدول طلبات السحب المصرفي للشيفات</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  تأكيد سحب الأموال أو إرجاعها للمحفظة مع إرسال إشعار فوري للشيف
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => setPayoutFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    payoutFilterStatus === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  الكل ({payoutRequests.length})
                </button>
                <button
                  onClick={() => setPayoutFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    payoutFilterStatus === 'pending'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <span>قيد الانتظار</span>
                  <span className="bg-stone-900/10 px-1.5 py-0.2 rounded-full text-[10px]">
                    {payoutRequests.filter((p) => p.status === 'pending').length}
                  </span>
                </button>
                <button
                  onClick={() => setPayoutFilterStatus('completed')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    payoutFilterStatus === 'completed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  المكتملة ({payoutRequests.filter((p) => p.status === 'completed').length})
                </button>
                <button
                  onClick={() => setPayoutFilterStatus('rejected')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    payoutFilterStatus === 'rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  المرفوضة ({payoutRequests.filter((p) => p.status === 'rejected').length})
                </button>
              </div>
            </div>

            {payoutRequests.filter((p) => payoutFilterStatus === 'all' || p.status === payoutFilterStatus).length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <p className="text-xs font-bold text-stone-500">لا توجد طلبات سحب تطابق الفلتر المحدد حالياً.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payoutRequests
                  .filter((p) => payoutFilterStatus === 'all' || p.status === payoutFilterStatus)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-4 bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-2xl text-xs space-y-3 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.chef_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                            alt={p.chef_name}
                            className="w-10 h-10 rounded-2xl object-cover border border-stone-200 shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-stone-900 text-sm">{p.chef_name}</h4>
                              {p.kitchen_name && (
                                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {p.kitchen_name}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 mt-0.5 dir-ltr text-right">
                              تاريخ الطلب: {new Date(p.created_at).toLocaleString('ar-LY')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                              p.payout_type === 'sales'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            {p.payout_type === 'sales' ? '🛍️ أرباح مبيعات (15%)' : '🎁 أرباح هدايا (50%)'}
                          </span>

                          {p.status === 'pending' && (
                            <span className="bg-amber-500/10 text-amber-800 text-[11px] font-extrabold px-3 py-1 rounded-full border border-amber-300 animate-pulse">
                              ⏳ قيد الانتظار
                            </span>
                          )}
                          {p.status === 'completed' && (
                            <span className="bg-emerald-500/10 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full border border-emerald-300">
                              تم الاعتماد والتأكيد
                            </span>
                          )}
                          {p.status === 'rejected' && (
                            <span className="bg-rose-500/10 text-rose-800 text-[11px] font-extrabold px-3 py-1 rounded-full border border-rose-300">
                              ❌ تم الرفض وإعادة المبلغ
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-stone-200/60">
                        <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                          <div className="text-[10px] font-bold text-stone-400">بيانات المصرف المحلي المستهدف:</div>
                          <div className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-stone-600" />
                            <span>{p.bank_name}</span>
                          </div>
                          <div className="text-[11px] text-stone-700 font-mono">
                            رقم الحساب: <span className="font-bold text-stone-900">{p.account_number}</span>
                          </div>
                          <div className="text-[11px] text-stone-700 font-mono">
                            الآيبان IBAN: <span className="font-bold text-stone-900">{p.iban}</span>
                          </div>
                        </div>

                        <div className="bg-stone-900 text-white p-3 rounded-xl border border-stone-800 space-y-1 flex flex-col justify-center">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-stone-400">المبلغ الإجمالي المطلوب:</span>
                            <span className="font-mono font-bold text-white">{p.gross_amount.toFixed(2)} د.ل</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-amber-400">
                            <span>عمولة التطبيق ({p.commission_rate}%):</span>
                            <span className="font-mono font-bold">-{p.commission_amount.toFixed(2)} د.ل</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-black text-emerald-400 border-t border-stone-800 pt-1">
                            <span>الصافي للتحويل الفوري:</span>
                            <span className="font-mono text-sm">{p.net_amount.toFixed(2)} د.ل</span>
                          </div>
                        </div>
                      </div>

                      {p.admin_notes && (
                        <div className="bg-stone-100 text-stone-700 p-2.5 rounded-xl text-[11px] border border-stone-200">
                          <span className="font-bold">ملاحظات الإدارة: </span>
                          <span>{p.admin_notes}</span>
                        </div>
                      )}

                      {p.status === 'pending' && (
                        <div className="pt-2 flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={() => {
                              processPayoutAdmin(p.id, 'completed');
                              showToast(`تم تأكيد تحويل ${p.net_amount} د.ل لحساب الشيف ${p.chef_name} 💵`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تأكيد السحب وإكتمال التحويل</span>
                          </button>

                          <button
                            onClick={() => {
                              setRejectingPayoutId(p.id);
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>رفض وإعادة المبلغ للمحفظة</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 10: Stories & Sponsored Ads */}
      {activeAdminTab === 'stories_ads' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>إدارة ستوريات وقصص الشيفات المباشرة ({stories.length})</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">يمكن للإدارة مراجعة وحذف أي ستوري يخالف معايير جودة المنصة بنقرة واحدة</p>
              </div>
            </div>

            {stories.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs font-bold">لا توجد قصص نشطة حالياً</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stories.map((story) => (
                  <div key={story.id} className="bg-stone-50 rounded-2xl p-2 border border-stone-200 relative group overflow-hidden shadow-2xs">
                    <img src={story.media_url} alt="" className="w-full h-36 object-cover rounded-xl" />
                    <div className="mt-2 text-center">
                      <span className="font-black text-[11px] text-stone-900 block truncate">{story.chef_name}</span>
                      <span className="text-[9px] text-stone-500 block truncate">{story.caption || 'بدون توضيح'}</span>
                    </div>
                    <button
                      onClick={() => {
                        deleteStoryAdmin(story.id);
                        showToast('تم حذف القصة بنجاح 🗑️');
                      }}
                      className="mt-2 w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف الستوري</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span>إدارة الحملات الإعلانية الممولة ({sponsoredPosts.length})</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">التحكم المباشر في حالة تفعيل أو إيقاف الحملات الترويجية بالمنصة</p>
              </div>
              {sponsoredPosts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearAllSponsoredAds();
                    showToast('تم إلغاء وحذف جميع الحملات الممولة 🧹');
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  حذف وإلغاء جميع الحملات الممولة 🧹
                </button>
              )}
            </div>

            {sponsoredPosts.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs font-bold">لا توجد إعلانات ممولة مسجلة</div>
            ) : (
              <div className="space-y-3">
                {sponsoredPosts.map((ad) => (
                  <div key={ad.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-stone-900">إعلان طبق #{ad.post_id}</span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          ad.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {ad.status === 'active' ? 'نشط يعمل ✅' : 'متوقف مؤقتاً ⏸️'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 space-x-2 space-x-reverse">
                        <span>الميزانية: <strong className="text-stone-900">{ad.budget} د.ل</strong></span>
                        <span>•</span>
                        <span>المدن المستهدفة: <strong className="text-stone-900">{ad.target_cities.join(', ')}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        toggleSponsoredAdStatusAdmin(ad.id);
                        showToast(ad.status === 'active' ? 'تم إيقاف الحملة مؤقتاً ⏸️' : 'تم تنشيط الحملة الإعلانية ✅');
                      }}
                      className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-colors shadow-2xs cursor-pointer ${
                        ad.status === 'active'
                          ? 'bg-amber-500 hover:bg-amber-600 text-stone-950'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {ad.status === 'active' ? 'إيقاف الحملة مؤقتاً ⏸️' : 'تنشيط الحملة الآن ✅'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 11: Disintermediation Protection & Risk */}
      {activeAdminTab === 'security_risk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-500 block">إجمالي الرسائل المحجوبة تلقائياً</span>
                <span className="font-black text-2xl text-stone-900">{filterViolations.length} مخالفة</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-500 block">شيفات تحت قائمة المراقبة/التحذير</span>
                <span className="font-black text-2xl text-amber-600">
                  {Object.values(sellerRiskScores).filter((s) => s.status === 'watchlist' || s.status === 'warning').length} شيف
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-md">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-500 block">حسابات شيفات معلقة بسبب المخاطر</span>
                <span className="font-black text-2xl text-rose-600">
                  {Object.values(sellerRiskScores).filter((s) => s.status === 'suspended').length} حساب
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>سجل الرسائل المحجوبة تلقائياً بواسطة فلتر المنصة (Filter Violations Log)</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  فحص تلقائي على كل رسالة قبل حفظها لمنع تداول أرقام الهواتف الليبية أو الكلمات المحظورة
                </p>
              </div>

              {filterViolations.length > 0 && (
                <button
                  onClick={() => {
                    clearViolationsAdmin();
                    showToast('تم تفريغ سجل المخالفات بنجاح 🧹');
                  }}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ السجل</span>
                </button>
              )}
            </div>

            {filterViolations.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs font-bold">
                لا توجد مخالفات مسجلة حالياً 🎉 جميع الرسائل ممتثلة لسياسة البيع.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-extrabold bg-stone-50/80">
                      <th className="p-3">المستخدم / الشيف</th>
                      <th className="p-3">النمط المكتشف</th>
                      <th className="p-3">النص الأصلي المحجوب</th>
                      <th className="p-3">تاريخ المحاولة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {filterViolations.map((viol) => (
                      <tr key={viol.id} className="hover:bg-stone-50/50">
                        <td className="p-3 font-bold text-stone-900">{viol.user_name}</td>
                        <td className="p-3">
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-rose-200">
                            {viol.detected_pattern}
                          </span>
                        </td>
                        <td className="p-3 text-stone-700 font-mono text-[11px] max-w-xs truncate" title={viol.original_text}>
                          «{viol.original_text}»
                        </td>
                        <td className="p-3 text-stone-500 text-[10px]">
                          {new Date(viol.created_at).toLocaleString('ar-LY')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span>محرك الكشف السلوكي ومؤشرات المخاطر للشيفات (Seller Risk Scoring Engine)</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  خوارزمية تحلل نسبة الرسائل للطلبات، محادثات طويلة بدون طلبات، وتكرار محاولات مشاركة الهاتف
                </p>
              </div>

              <button
                onClick={() => {
                  recalculateRiskScores();
                  showToast('تمت إعادة تشغيل واحتساب مؤشرات المخاطر لكل الشيفات بنجاح 🔄');
                }}
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تشغيل خوارزمية التحليل الآن</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-extrabold bg-stone-50/80">
                    <th className="p-3">الشيف / المطبخ</th>
                    <th className="p-3">مؤشر المخاطر (0 - 100)</th>
                    <th className="p-3">الحالة الحالية</th>
                    <th className="p-3">مؤشرات الخوارزمية</th>
                    <th className="p-3 text-center">إجراءات التحكم الإداري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {Object.values(sellerRiskScores).map((risk) => {
                    const statusBadge =
                      risk.status === 'suspended'
                        ? 'bg-rose-600 text-white font-extrabold'
                        : risk.status === 'warning'
                        ? 'bg-orange-100 text-orange-900 font-extrabold border border-orange-300'
                        : risk.status === 'watchlist'
                        ? 'bg-amber-100 text-amber-800 font-bold'
                        : 'bg-emerald-100 text-emerald-800 font-bold';

                    const statusLabel =
                      risk.status === 'suspended'
                        ? '⛔ معلق مؤقتاً'
                        : risk.status === 'warning'
                        ? '⚠️ تحذير مرتفع'
                        : risk.status === 'watchlist'
                        ? '👀 قائمة المراقبة'
                        : '✅ عادي وممتثل';

                    return (
                      <tr key={risk.chef_id} className="hover:bg-stone-50/50">
                        <td className="p-3">
                          <span className="font-extrabold text-stone-900 block">{risk.chef_name}</span>
                          <span className="text-[10px] text-stone-500">{risk.kitchen_name}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-stone-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  risk.risk_score >= 85
                                    ? 'bg-rose-600'
                                    : risk.risk_score >= 60
                                    ? 'bg-orange-500'
                                    : risk.risk_score >= 30
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${risk.risk_score}%` }}
                              />
                            </div>
                            <span className="font-black text-stone-900 text-xs">{risk.risk_score}/100</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full ${statusBadge}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="p-3 text-[10.5px] text-stone-600 space-y-0.5">
                          {risk.flags.violation_count !== undefined && (
                            <div>• المحاولات المحجوبة: <strong>{risk.flags.violation_count}</strong></div>
                          )}
                          {risk.flags.message_to_purchase_ratio !== undefined && (
                            <div>• نسبة التحويل: <strong>{(risk.flags.message_to_purchase_ratio * 100).toFixed(0)}%</strong></div>
                          )}
                          {risk.flags.long_chat_zero_order && (
                            <div className="text-amber-700 font-bold">• محادثات طويلة بدون طلبات رسمية</div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {risk.status !== 'suspended' ? (
                              <button
                                onClick={() => {
                                  setSuspendingChef({ chef_id: risk.chef_id, chef_name: risk.chef_name });
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                تعليق الحساب ⛔
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  resolveRiskStatusAdmin(risk.chef_id, 'normal', 'إعادة تفعيل الحساب بعد مراجعة الإدارة');
                                  showToast(`تمت إعادة تفعيل حساب ${risk.chef_name} بنجاح ✅`);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                إعادة التفعيل ✅
                              </button>
                            )}

                            {risk.status !== 'normal' && (
                              <button
                                onClick={() => {
                                  resolveRiskStatusAdmin(risk.chef_id, 'normal', 'تصفير مؤشر المخاطر');
                                  showToast(`تم تصفير مؤشر المخاطر للشيف ${risk.chef_name}`);
                                }}
                                className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-[10px] px-2 py-1.5 rounded-lg cursor-pointer"
                              >
                                تصفير المخاطر
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 12: PWA Analytics */}
      {activeAdminTab === 'pwa_analytics' && <PWAAnalyticsTabContent />}

      {/* Tab 13: Interactive Test & Simulation Suite */}
      {activeAdminTab === 'test_suite' && (
        <AdminTestSuiteTab onShowToast={showToast} onNavigateTab={(t) => setActiveAdminTab(t)} />
      )}

      {/* Tab 14: Platform Settings */}
      {activeAdminTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span>إعدادات وتخصيص المنصة المركزية</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">التحكم في شريط الإعلانات، وضع الصيانة، والسياسات العامة للتطبيق</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
              <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>شريط التنويه والإعلانات المباشر أعلى التطبيق</span>
              </h4>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-700 block">نص التنويه العام:</label>
                <textarea
                  value={platformSettings.announcement_banner_text}
                  onChange={(e) => updatePlatformSettingsAdmin({ announcement_banner_text: e.target.value })}
                  rows={3}
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-bold outline-none resize-none"
                  placeholder="نص التنويه الإعلاني..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-stone-800">تفعيل ظهور الشريط للمستخدمين:</span>
                <button
                  onClick={() => {
                    updatePlatformSettingsAdmin({ announcement_active: !platformSettings.announcement_active });
                    showToast('تم تحديث حالة شريط التنويه الإعلاني');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
                    platformSettings.announcement_active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-300 text-stone-700'
                  }`}
                >
                  {platformSettings.announcement_active ? 'مفعل ✅' : 'معطل ❌'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
              <h4 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>السياسات المالية والحد الأدنى للسحوبات</span>
              </h4>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-700 block">الحد الأدنى لطلب سحب أرباح الشيف (د.ل):</label>
                <input
                  type="number"
                  value={platformSettings.min_payout_amount}
                  onChange={(e) => updatePlatformSettingsAdmin({ min_payout_amount: Number(e.target.value) })}
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-700 block">اسم المنصة الرسمي:</label>
                <input
                  type="text"
                  value={platformSettings.platform_name}
                  onChange={(e) => updatePlatformSettingsAdmin({ platform_name: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs font-bold outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">وضع الصيانة للطوارئ:</span>
                  <span className="text-[10px] text-stone-500">إيقاف استقبال طلبات جديدة مؤقتاً</span>
                </div>
                <button
                  onClick={() => {
                    updatePlatformSettingsAdmin({ maintenance_mode: !platformSettings.maintenance_mode });
                    showToast('تم تحديث وضع الصيانة بنجاح');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
                    platformSettings.maintenance_mode
                      ? 'bg-rose-600 text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {platformSettings.maintenance_mode ? 'وضع الصيانة نشط ⚠️' : 'المنصة تعمل طبيعياً 🟢'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 15: Security Audit Logs */}
      {activeAdminTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <span>سجل التدقيق الأمني والإداري (Audit Trail Log)</span>
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">تتبع الأنشطة بدقة عالية</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900">{log.action}</span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-mono">
                      {log.target_table}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    بواسطة: <span className="font-bold">{log.actor_name}</span> • الهدف: #{log.target_id}
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 dir-ltr">
                  {new Date(log.created_at).toLocaleString('ar-LY')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 16: Supabase Realtime Database Configuration */}
      {activeAdminTab === 'supabase' && <SupabaseConfigTab />}

      {/* Wallet Adjustment Modal */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-stone-900">تعديل رصيد محفظة {adjustingUser.name}</h3>
              <button onClick={() => setAdjustingUser(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustWalletSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">المبلغ المطلوب (د.ل):</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  placeholder="مثال: 50 أو -20"
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-extrabold outline-none text-center"
                />
                <span className="text-[10px] text-stone-400 mt-1 block text-center">
                  استخدم أرقاماً موجبة للإضافة (+) وسالبة للخصم (-)
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">السبب / الملاحظة الإدارية:</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="سبب التعديل..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold text-xs py-3 rounded-2xl shadow-xs transition-colors cursor-pointer"
                >
                  تأكيد التعديل 💰
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chef Verification Reject Modal */}
      {rejectingChefUserId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-stone-900">رفض طلب توثيق الشيف</h3>
              <button onClick={() => setRejectingChefUserId(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChefRejectSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">سبب الرفض (سيصل للشيف في الإشعار):</label>
                <textarea
                  value={chefRejectReason}
                  onChange={(e) => setChefRejectReason(e.target.value)}
                  rows={3}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none resize-none"
                  placeholder="سبب الرفض..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-xs transition-colors cursor-pointer"
                >
                  تأكيد الرفض ❌
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingChefUserId(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chef Document Preview Modal */}
      {previewingChefProfile && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900">مستند الشهادة الصحية للمطبخ</h3>
                <p className="text-[11px] text-stone-500">
                  {previewingChefProfile.kitchen_name} ({previewingChefProfile.owner_name})
                </p>
              </div>
              <button onClick={() => setPreviewingChefProfile(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-100 rounded-2xl overflow-hidden border border-stone-200">
              <img src={previewingChefProfile.doc_url} alt="Health Cert" className="w-full h-64 object-cover" />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewingChefProfile(null)}
                className="bg-stone-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Chef Modal */}
      {suspendingChef && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-stone-900">تعليق وتجميد حساب {suspendingChef.chef_name}</h3>
              <button onClick={() => setSuspendingChef(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSuspendSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">سبب التعليق وتجميد الحساب:</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none resize-none"
                  placeholder="سبب التعليق..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-xs transition-colors cursor-pointer"
                >
                  تأكيد التعليق ⛔
                </button>
                <button
                  type="button"
                  onClick={() => setSuspendingChef(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Rejection Modal */}
      {rejectingPayoutId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-stone-900">رفض طلب السحب المصرفي</h3>
              <button onClick={() => setRejectingPayoutId(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">سبب الرفض (سيصل كإشعار للشيف):</label>
                <textarea
                  value={payoutRejectReason}
                  onChange={(e) => setPayoutRejectReason(e.target.value)}
                  rows={3}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none resize-none"
                  placeholder="سبب الرفض..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    processPayoutAdmin(rejectingPayoutId, 'rejected', payoutRejectReason);
                    showToast('تم رفض طلب السحب وإعادة المبلغ كاملاً لمحفظة الشيف بنجاح ↩️');
                    setRejectingPayoutId(null);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-xs transition-colors cursor-pointer"
                >
                  تأكيد الرفض ❌
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingPayoutId(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
