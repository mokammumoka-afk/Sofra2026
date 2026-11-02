'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { OrderStatus, Order } from '@/lib/types';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Phone,
  ChefHat,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Lock,
  FileText,
  Star,
  RotateCcw,
  XCircle,
  Copy,
  Check,
  Printer,
  Navigation,
  User,
  AlertCircle,
  Info,
  Search,
  Filter,
  ArrowUpDown,
  Share2,
  DollarSign,
  ExternalLink,
} from 'lucide-react';

interface MyOrdersViewProps {
  openMessengerForOrder?: (targetUserId: string, orderId?: string) => void;
  openDisputeModalForOrder?: (orderId: string) => void;
}

export const MyOrdersView: React.FC<MyOrdersViewProps> = ({
  openMessengerForOrder,
  openDisputeModalForOrder,
}) => {
  const { orders, currentUser, updateOrderStatus, confirmOrderDeliveryAndReleaseEscrow } = useStore();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<
    'all' | 'active' | 'pending' | 'preparing' | 'delivering' | 'delivered' | 'disputed'
  >('active');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high'>('newest');

  // Modals state inside MyOrdersView
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<Order | null>(null);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [confirmDeliveryOrderId, setConfirmDeliveryOrderId] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);

  // Copy order ID feedback
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Review Modal internal state
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewSubmittedToast, setReviewSubmittedToast] = useState<string | null>(null);

  const isChef = currentUser.role === 'chef';

  // Copy helper
  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  // Filter relevant orders
  const baseMyOrders = orders.filter((o) => {
    return isChef ? o.chef_id === currentUser.id : o.customer_id === currentUser.id;
  });

  // Analytics
  const activeOrdersCount = baseMyOrders.filter(
    (o) =>
      ['pending', 'accepted', 'preparing', 'out_for_delivery'].includes(o.status) ||
      (o.status === 'delivered' && !o.escrow_released_at)
  ).length;
  const completedOrdersCount = baseMyOrders.filter((o) => o.status === 'delivered').length;
  const disputedOrdersCount = baseMyOrders.filter((o) => o.status === 'disputed' || o.status === 'cancelled').length;
  const totalAmountSpent = baseMyOrders.reduce((acc, o) => acc + o.total_price, 0);

  // Filtered by tab
  let filteredOrders = baseMyOrders.filter((o) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = o.post_title.toLowerCase().includes(q);
      const matchId = o.id.toLowerCase().includes(q);
      const matchChef = o.chef_name.toLowerCase().includes(q);
      const matchCustomer = o.customer_name.toLowerCase().includes(q);
      const matchAddress = o.delivery_address.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchChef && !matchCustomer && !matchAddress) {
        return false;
      }
    }

    if (filterMode === 'active') {
      return (
        ['pending', 'accepted', 'preparing', 'out_for_delivery'].includes(o.status) ||
        (o.status === 'delivered' && !o.escrow_released_at)
      );
    }
    if (filterMode === 'pending') {
      return o.status === 'pending' || o.status === 'accepted';
    }
    if (filterMode === 'preparing') {
      return o.status === 'preparing';
    }
    if (filterMode === 'delivering') {
      return o.status === 'out_for_delivery';
    }
    if (filterMode === 'delivered') {
      return o.status === 'delivered';
    }
    if (filterMode === 'disputed') {
      return o.status === 'disputed' || o.status === 'cancelled';
    }
    return true; // 'all'
  });

  // Sort
  filteredOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortBy === 'price_high') {
      return b.total_price - a.total_price;
    }
    return 0;
  });

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 0;
    }
  };

  const steps = [
    { title: 'تأكيد الدفع', desc: 'مقبوض عبر DPAY' },
    { title: 'قبول المطبخ', desc: 'استلم الشيف الطلب' },
    { title: 'قيد الطهي', desc: 'تحضير الوجبة 🍳' },
    { title: 'مع المندوب', desc: 'جاري التوصيل 🚗' },
    { title: 'تم التسليم', desc: 'صحتين وعافية 😋' },
  ];

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewOrder) return;

    setReviewSubmittedToast(`شكراً لك! تم تسجيل تقييمك (${ratingStars} نجوم) للشيف ${selectedReviewOrder.chef_name} بنجاح ✨`);
    setTimeout(() => setReviewSubmittedToast(null), 4000);
    setSelectedReviewOrder(null);
    setReviewComment('');
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleReorder = (order: Order) => {
    setReviewSubmittedToast(`تم تجهيز طبق "${order.post_title}" في السلة للإعادة السريعة! 🛒`);
    setTimeout(() => setReviewSubmittedToast(null), 3500);
  };

  const handleCancelOrderCustomer = (order: Order) => {
    // Anti-fraud protection check: Only pending orders can be cancelled by customer
    if (order.status !== 'pending') {
      setReviewSubmittedToast('🔒 لا يمكن إلغاء الطلب بعد قبول الشيف وبدء التحضير لحماية مكونات وجهود الشيف.');
      setTimeout(() => setReviewSubmittedToast(null), 4000);
      return;
    }

    setCancellingOrder(order);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Review Submission Toast Notification */}
      {reviewSubmittedToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between text-sm font-bold animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{reviewSubmittedToast}</span>
          </div>
          <button onClick={() => setReviewSubmittedToast(null)} className="text-emerald-200 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Header Banner & Dashboard Summary */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle Decorative Backdrop Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">
                <ChefHat className="w-4 h-4" />
                <span>{isChef ? 'لوحة تحكم الطلبيات والمطبخ' : 'مركز متابعة طلباتي والمحفظة'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isChef ? 'طلبيات مطبخك الواردة' : 'قائمة الطلبيات الحية والسابقة'}
              </h1>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl">
                متابعة دقيقة لحالة الطهي والتوصيل، التتبع الجغرافي المباشر للمندوب، والفواتير الرقمية المحمية بنظام الضمان المالي.
              </p>
            </div>

            {/* DPAY Escrow Security Badge Button */}
            <button
              onClick={() => setShowEscrowModal(true)}
              className="bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 p-3 sm:p-4 rounded-2xl flex items-center gap-3 transition-all text-right group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block">نظام الحماية والضمان</span>
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
                  DPAY Escrow Protected
                  <Info className="w-3.5 h-3.5 text-stone-400" />
                </span>
              </div>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-700/60">
            <div className="bg-stone-800/50 backdrop-blur-xs p-3.5 rounded-2xl border border-stone-700/50">
              <span className="text-[11px] text-stone-400 font-bold block">إجمالي الطلبيات</span>
              <span className="text-lg font-black text-white mt-0.5 block">{baseMyOrders.length} طلب</span>
            </div>

            <div className="bg-stone-800/50 backdrop-blur-xs p-3.5 rounded-2xl border border-stone-700/50">
              <span className="text-[11px] text-orange-300 font-bold block">قيد التوصيل الآن 🚗</span>
              <span className="text-lg font-black text-orange-400 mt-0.5 block">{activeOrdersCount} نشط</span>
            </div>

            <div className="bg-stone-800/50 backdrop-blur-xs p-3.5 rounded-2xl border border-stone-700/50">
              <span className="text-[11px] text-emerald-300 font-bold block">المكتملة بنجاح ✨</span>
              <span className="text-lg font-black text-emerald-400 mt-0.5 block">{completedOrdersCount} مسلّم</span>
            </div>

            <div className="bg-stone-800/50 backdrop-blur-xs p-3.5 rounded-2xl border border-stone-700/50">
              <span className="text-[11px] text-stone-400 font-bold block">
                {isChef ? 'إجمالي المبيعات' : 'إجمالي الإنفاق'}
              </span>
              <span className="text-lg font-black text-amber-400 mt-0.5 block">{totalAmountSpent} د.ل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Escrow Release Alert Banner for Customer */}
      {!isChef && baseMyOrders.some((o) => (o.status === 'delivered' || o.status === 'out_for_delivery') && !o.escrow_released_at && o.dispute_status !== 'opened') && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 text-white p-4 sm:p-5 rounded-3xl shadow-lg border border-emerald-400 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
              <ShieldAlert className="w-5 h-5 text-emerald-200 shrink-0 animate-bounce" />
              <span>تنبيه هـام: لديك طلبيات جاهزة / مسلّمة بانتظار تأكيد استلامك! 📦🤝</span>
            </div>
            <span className="bg-emerald-900/80 text-emerald-100 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full border border-emerald-400/40">
              حماية الضمان Escrow
            </span>
          </div>
          <p className="text-xs text-emerald-100 leading-relaxed font-medium">
            أظهر المطبخ والمندوب وصول الوجبة. يرجى التأكد من الجودة والضغط على <strong className="underline decoration-emerald-300">&quot;تأكيد الاستلام ورضاي عن الوجبة&quot;</strong> لتحرير الأرباح للشيف فوراً وإيداعها في محفظته.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {baseMyOrders
              .filter((o) => (o.status === 'delivered' || o.status === 'out_for_delivery') && !o.escrow_released_at && o.dispute_status !== 'opened')
              .map((pendingOrd) => (
                <button
                  key={pendingOrd.id}
                  onClick={() => setConfirmDeliveryOrderId(pendingOrd.id)}
                  className="bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تأكيد استلام #{pendingOrd.id} («{pendingOrd.post_title}») 🤝</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Filter, Search & Sorting Control Bar */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الطلب #، اسم الأكلة، المطبخ، أو العنوان..."
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold"
              >
                مسح
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <ArrowUpDown className="w-4 h-4 text-stone-400" />
            <span className="text-xs text-stone-500 font-bold whitespace-nowrap">الترتيب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-2xl px-3 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="oldest">الأقدم أولاً</option>
              <option value="price_high">الأعلى سعراً</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <button
            onClick={() => setFilterMode('active')}
            className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterMode === 'active'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>التوصيل الحي النشط</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterMode === 'active' ? 'bg-orange-700 text-white' : 'bg-stone-200 text-stone-700'}`}>
              {activeOrdersCount}
            </span>
          </button>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            جميع الطلبيات ({baseMyOrders.length})
          </button>

          <button
            onClick={() => setFilterMode('preparing')}
            className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
              filterMode === 'preparing'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            في المطبخ 🍳
          </button>

          <button
            onClick={() => setFilterMode('delivering')}
            className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
              filterMode === 'delivering'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            مع المندوب 🚗
          </button>

          <button
            onClick={() => setFilterMode('delivered')}
            className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filterMode === 'delivered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>المكتملة ✨</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterMode === 'delivered' ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-700'}`}>
              {completedOrdersCount}
            </span>
          </button>

          {disputedOrdersCount > 0 && (
            <button
              onClick={() => setFilterMode('disputed')}
              className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterMode === 'disputed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span>بلاغات ونزاعات ⚠️</span>
              <span className="bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded-full text-[10px]">
                {disputedOrdersCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Orders Cards Feed */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300 space-y-3">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-stone-800">لا توجد طلبات تطابق الفلتر الحالي</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {searchQuery
              ? `لم نجد أي طلبات تحتوي على كلمة "${searchQuery}". جرّب البحث بكلمة أخرى.`
              : isChef
              ? 'لم تتلقَّ أي طلبات في هذا القسم بعد.'
              : 'تصفح أحدث الأطباق الشعبية من الطهاة المنزلية واطلب وجبتك المفضلة الآن!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const currentStep = getStatusStepIndex(order.status);
            const isDisputed = order.status === 'disputed';
            const isCancelled = order.status === 'cancelled';
            const isDelivered = order.status === 'delivered';
            const isCopied = copiedOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                  isDisputed
                    ? 'border-rose-300 bg-rose-50/20'
                    : isDelivered
                    ? 'border-emerald-200'
                    : 'border-orange-100'
                }`}
              >
                {/* Order Top Bar Info */}
                <div className="bg-stone-50/80 px-6 py-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-stone-900 bg-stone-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      #{order.id}
                      <button
                        onClick={() => handleCopyOrderId(order.id)}
                        title="نسخ رقم الطلب"
                        className="text-stone-500 hover:text-orange-600 transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </span>

                    <span className="text-xs text-stone-400 font-medium">•</span>
                    <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {new Date(order.created_at).toLocaleDateString('ar-LY', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {isDisputed ? (
                      <span className="bg-rose-100 text-rose-800 text-xs font-black px-3 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        قيد النزاع والبلاغ
                      </span>
                    ) : isCancelled ? (
                      <span className="bg-stone-100 text-stone-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-stone-400" />
                        ملغى (مسترد بالكامل)
                      </span>
                    ) : isDelivered ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        تم التسليم بنجاح
                      </span>
                    ) : (
                      <span className="bg-orange-100 text-orange-900 text-xs font-black px-3 py-1 rounded-full border border-orange-200 flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-orange-600" />
                        {order.status === 'out_for_delivery'
                          ? 'مع المندوب 🚗'
                          : order.status === 'preparing'
                          ? 'قيد الطهي 🍳'
                          : 'مؤكد - بانتظار الشيف'}
                      </span>
                    )}

                    {/* DPAY Payment Verified Badge */}
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      DPAY Escrow
                    </span>
                  </div>
                </div>

                {/* Main Order Content Body */}
                <div className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    {/* Dish & Quantity Details */}
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={order.post_image}
                        alt={order.post_title}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-xs"
                      />
                      <div className="space-y-1.5">
                        <h3 className="font-extrabold text-base text-stone-900 leading-snug">
                          {order.post_title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-600">
                          <span className="bg-stone-100 px-2.5 py-0.5 rounded-md text-stone-800">
                            الكمية: {order.quantity}X
                          </span>
                          <span>•</span>
                          <span className="text-stone-500">
                            {isChef ? `العميل: ${order.customer_name}` : `المطبخ: ${order.chef_name}`}
                          </span>
                        </div>

                        {/* Customer Notes */}
                        {order.notes && (
                          <div className="bg-amber-50 text-amber-900 border border-amber-200/80 px-3 py-1.5 rounded-xl text-xs font-medium inline-block">
                            <span className="font-bold">ملاحظات الطهي:</span> «{order.notes}»
                          </div>
                        )}

                        {/* Delivery address */}
                        <div className="flex items-center gap-1 text-xs text-stone-500 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>العنوان: {order.delivery_city} - {order.delivery_address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Delivery Provider Column */}
                    <div className="sm:text-left border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100 w-full sm:w-auto flex sm:flex-col justify-between items-end gap-2">
                      <div>
                        <span className="text-xs text-stone-400 font-bold block">إجمالي الطلب</span>
                        <span className="text-xl font-black text-stone-900">{order.total_price} د.ل</span>
                      </div>

                      <div className="bg-stone-100 text-stone-700 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-orange-600" />
                        <span>
                          {order.delivery_provider === 'talabk'
                            ? 'طَلبك Express 🚗'
                            : order.delivery_provider === 'drubi'
                            ? 'الدروبي Delivery 🛵'
                            : order.delivery_provider === 'express_ly'
                            ? 'أكسبرس ليبيا 📦'
                            : 'استلام مباشر 🛍️'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Status Progress Timeline Bar */}
                  {!isDisputed && !isCancelled && (
                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-600 mb-2">
                        <span>خطوات تحضير وتوصيل الشحنة:</span>
                        {order.status === 'out_for_delivery' && (
                          <span className="text-orange-600 font-extrabold animate-pulse">
                            الوقت المتبقي المتوقع: ~15 دقيقة ⏱️
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 my-3">
                        {steps.map((step, idx) => {
                          const isPassed = idx <= currentStep;
                          const isCurrent = idx === currentStep;

                          return (
                            <div key={idx} className="flex flex-col items-center text-center">
                              <div
                                className={`w-full h-2 rounded-full mb-1.5 transition-all duration-300 ${
                                  isPassed
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                                    : 'bg-stone-100'
                                }`}
                              />
                              <span
                                className={`text-[10px] font-bold leading-tight ${
                                  isCurrent
                                    ? 'text-orange-600 font-black scale-105'
                                    : isPassed
                                    ? 'text-stone-800'
                                    : 'text-stone-300'
                                }`}
                              >
                                {step.title}
                              </span>
                              <span className="text-[9px] text-stone-400 hidden sm:block mt-0.5">
                                {step.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Escrow System Status Banners */}
                  {(isDelivered || order.status === 'out_for_delivery') && (
                    <div className="pt-2">
                      {!order.escrow_released_at && !order.dispute_status && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-bold">
                              <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>الأرباح محفوظة بأمان نظام الضمان (Escrow) 🛡️</span>
                            </div>
                            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                              حجز مؤقت (48 ساعة)
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 leading-relaxed">
                            {isChef
                              ? 'أرباحك الصافية لهذا الطلب محجوزة في الضمان لحماية الزبون، وسوف تتحرر تلقائياً لمحفظتك القابلة للسحب بعد انقضاء 48 ساعة من التسليم ما لم يُفتح نزاع.'
                              : 'مبلغ هذا الطلب محمي في الحجز المؤقت. يمكنك تأكيد الاستلام ورضاك لتحرير أرباح الشيف فوراً، أو فتح نزاع في حال واجهتك مشكلة.'}
                          </p>
                          {!isChef && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                onClick={() => setConfirmDeliveryOrderId(order.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>تأكيد الاستلام ورضاي عن الوجبة (تحرير الرصيد للشيف) 🤝</span>
                              </button>
                              <button
                                onClick={() => openDisputeModalForOrder?.(order.id)}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1"
                              >
                                <ShieldAlert className="w-4 h-4 text-rose-600" />
                                <span>بلاغ / لم يصل الطلب 🚨</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {order.escrow_released_at && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 text-xs text-emerald-900 flex items-center gap-2 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>تم تحرير أرباح الضمان لهذا الطلب بنجاح ✅ ({new Date(order.escrow_released_at).toLocaleString('ar-LY')})</span>
                        </div>
                      )}

                      {order.dispute_status === 'opened' && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900 space-y-1">
                          <div className="flex items-center gap-2 font-bold text-rose-700">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>نزاع مفتوح - تم تجميد تحرير الأموال مؤقتاً ⛔</span>
                          </div>
                          <p className="text-[11px] text-rose-800">
                            السبب المذكور: «{order.dispute_reason || 'طلب لم يصل أو غير مطابق'}». يقوم فريق الدعم بمراجعة الحالة حالياً.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar Footer */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    {/* Left Actions: Chat & Invoice */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const otherUser = isChef ? order.customer_id : order.chef_id;
                          openMessengerForOrder?.(otherUser, order.id);
                        }}
                        className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4 text-orange-600" />
                        <span>مراسلة {isChef ? 'صاحب الطلب' : 'الشيف'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4 text-stone-600" />
                        <span>الفاتورة الرقمية</span>
                      </button>

                      {!isChef && (
                        <button
                          onClick={() => setSelectedTrackingOrder(order)}
                          className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Navigation className="w-4 h-4 text-amber-600" />
                          <span>تتبع الخريطة والمندوب 🗺️</span>
                        </button>
                      )}
                    </div>

                    {/* Right Actions: Re-order, Review, Cancel, Chef Advances */}
                    <div className="flex flex-wrap items-center gap-2">
                      {!isChef && isDelivered && (
                        <>
                          <button
                            onClick={() => setSelectedReviewOrder(order)}
                            className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                            <span>تقييم الوجبة الشيف</span>
                          </button>

                          <button
                            onClick={() => handleReorder(order)}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>إعادة الطلب بنقرة</span>
                          </button>
                        </>
                      )}

                      {!isChef && !isDelivered && !isDisputed && !isCancelled && (
                        <>
                          {order.status === 'pending' ? (
                            <button
                              onClick={() => handleCancelOrderCustomer(order)}
                              className="bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 font-bold text-xs py-2 px-3.5 rounded-xl transition-all"
                            >
                              إلغاء الطلب (قبل قبول المطبخ)
                            </button>
                          ) : (
                            <div className="bg-amber-50 text-amber-900 border border-amber-200/80 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>الطلب قيد التحضير/التوصيل: مقفل لحماية المطبخ 🔒</span>
                            </div>
                          )}

                          <button
                            onClick={() => openDisputeModalForOrder?.(order.id)}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            <span>بلاغ / عدم وصول الطلب</span>
                          </button>
                        </>
                      )}

                      {/* Chef Controls */}
                      {isChef && !isDelivered && !isDisputed && !isCancelled && (
                        <div className="flex flex-wrap items-center gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'accepted')}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-xs"
                              >
                                قبول وتأكيد الطلب ✅
                              </button>
                              <button
                                onClick={() => setRejectingOrder(order)}
                                className="bg-stone-100 hover:bg-rose-100 text-rose-700 border border-stone-200 font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer"
                              >
                                تعذر القبول ❌
                              </button>
                            </>
                          )}

                          {order.status === 'accepted' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-xs"
                            >
                              بدء الطهي في المطبخ 🍳
                            </button>
                          )}

                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-xs"
                            >
                              تسليم للمندوب للتوصيل 🚗
                            </button>
                          )}

                          {order.status === 'out_for_delivery' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'delivered')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-xs"
                            >
                              تأكيد الوصول والتسليم ✨
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Live Driver Tracking Modal */}
      {selectedTrackingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn border border-orange-100">
            <button
              onClick={() => setSelectedTrackingOrder(null)}
              className="absolute top-5 left-5 text-stone-400 hover:text-stone-700 font-bold bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                تتبع التوصيل المباشر #{selectedTrackingOrder.id}
              </span>
              <h2 className="font-extrabold text-lg text-stone-900">
                متابعة شحنة «{selectedTrackingOrder.post_title}»
              </h2>
            </div>

            {/* Simulated Live SVG Map */}
            <div className="bg-stone-900 rounded-2xl p-4 text-white relative overflow-hidden h-48 flex flex-col justify-between border border-stone-800">
              {/* Map SVG background representation */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 10 80 Q 100 20 200 100 T 380 40" stroke="#f97316" strokeWidth="4" fill="none" strokeDasharray="6 6" />
                <circle cx="50" cy="70" r="8" fill="#10b981" />
                <circle cx="320" cy="50" r="8" fill="#f97316" />
              </svg>

              <div className="relative z-10 flex items-center justify-between text-xs font-bold bg-stone-800/80 p-2.5 rounded-xl backdrop-blur-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  موقع المندوب الحي (Tripoli)
                </span>
                <span className="text-amber-300">متبقي ~18 دقيقة</span>
              </div>

              <div className="relative z-10 flex items-center justify-between text-xs text-stone-300">
                <div className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-orange-400" />
                  <span>مطبخ {selectedTrackingOrder.chef_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{selectedTrackingOrder.delivery_address}</span>
                </div>
              </div>
            </div>

            {/* Driver Profile & Phone Call */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                  علي
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">الكابتن: علي الطرابلسي 🚗</h4>
                  <p className="text-xs text-stone-500 font-medium">
                    شركة {selectedTrackingOrder.delivery_provider.toUpperCase()} | تويوتا فيتز بيضاء (#9281)
                  </p>
                </div>
              </div>

              <a
                href="tel:0912345678"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال</span>
              </a>
            </div>

            <button
              onClick={() => setSelectedTrackingOrder(null)}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 rounded-2xl text-xs transition-all"
            >
              إغلاق نافذة التتبع
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Digital Receipt / Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn border border-stone-200">
            <button
              onClick={() => setSelectedInvoiceOrder(null)}
              className="absolute top-5 left-5 text-stone-400 hover:text-stone-700 font-bold bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            {/* Invoice Printable Header */}
            <div className="border-b border-stone-200 pb-4 text-center space-y-1">
              <div className="inline-block bg-orange-600 text-white font-black px-3 py-1 rounded-xl text-sm mb-1">
                سُفرة SOFRA 🍲
              </div>
              <h2 className="font-extrabold text-base text-stone-900">فاتورة مقبوضات رقمية ماليّة</h2>
              <p className="text-xs text-stone-400 font-mono">
                رقم الجلسة: {selectedInvoiceOrder.payment_session_id || `DPAY-${selectedInvoiceOrder.id}`}
              </p>
            </div>

            {/* Receipt Table */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-stone-100 pb-2 text-stone-500 font-bold">
                <span>الصنف / البيان</span>
                <span>المبلغ</span>
              </div>

              <div className="flex justify-between font-bold text-stone-900">
                <span>{selectedInvoiceOrder.post_title} (x{selectedInvoiceOrder.quantity})</span>
                <span>{selectedInvoiceOrder.total_price - (selectedInvoiceOrder.delivery_fee ?? 10)} د.ل</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>رسوم التوصيل المحلي ({selectedInvoiceOrder.delivery_provider.toUpperCase()})</span>
                <span>{(selectedInvoiceOrder.delivery_fee ?? 10).toFixed(2)} د.ل</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>رسوم الضمان والخدمة الماليّة (DPAY Escrow)</span>
                <span className="text-emerald-600 font-bold">محتسبة مجاناً</span>
              </div>

              <div className="border-t-2 border-dashed border-stone-300 pt-3 flex justify-between font-black text-sm text-stone-900">
                <span>المجموع الكلي المدفوع</span>
                <span className="text-orange-600">{selectedInvoiceOrder.total_price} د.ل</span>
              </div>
            </div>

            {/* Barcode & Verification */}
            <div className="bg-stone-50 p-3 rounded-2xl text-center space-y-1 border border-stone-200">
              <span className="text-[10px] text-stone-400 font-bold block">رمز التحقق المالي المعزز</span>
              <div className="font-mono text-xs font-black text-stone-700 tracking-widest">
                ||| | |||| | ||| || |||| |||
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block">
                ✓ عملية مدفوعة ومؤكدة بموجب ضمان المنصة 2026
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-stone-600" />
                <span>طباعة الفاتورة</span>
              </button>

              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-2xl text-xs transition-all"
              >
                تم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Dish & Chef Review Modal */}
      {selectedReviewOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn border border-amber-100">
            <button
              onClick={() => setSelectedReviewOrder(null)}
              className="absolute top-5 left-5 text-stone-400 hover:text-stone-700 font-bold bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 fill-amber-500" />
              </div>
              <h2 className="font-extrabold text-lg text-stone-900">تقييم الوجبة والشيف</h2>
              <p className="text-xs text-stone-500">
                كيف كانت تجربتك مع «{selectedReviewOrder.post_title}» من مطبخ {selectedReviewOrder.chef_name}؟
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star Rating selector */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRatingStars(star)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingStars ? 'fill-amber-400 text-amber-500' : 'text-stone-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Tags Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">مميزات إيجابية اعجبتك:</label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    'طازج وساخن 🔥',
                    'تغليف فاخر 🎁',
                    'توصيل سريع ⚡',
                    'نكهة بيتية أصيلة 🍲',
                    'كمية وفيرة 🍽️',
                  ].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">رأيك بالتفصيل (اختياري):</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="اكتب تقييمك لم مساعدة الزبائن والشيف..."
                  className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md"
              >
                إرسال التقييم الآن ✨
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DPAY Escrow Information Modal */}
      {showEscrowModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn border border-emerald-100">
            <button
              onClick={() => setShowEscrowModal(false)}
              className="absolute top-5 left-5 text-stone-400 hover:text-stone-700 font-bold bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="font-black text-lg text-stone-900">نظام الضمان المالي (DPAY Escrow)</h2>
              <p className="text-xs text-stone-500 leading-relaxed">
                تلتزم منصة «سُفرة» بحماية كامل حقوق المستخدم والشيف عبر نظام الضمان المالي المعزز.
              </p>
            </div>

            <div className="space-y-3 text-xs bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="font-bold text-stone-900">تجميد المبلغ الآمن</h4>
                  <p className="text-stone-500">عند الشراء، يتم احتجاز المبلغ في حساب الضمان التابع لمنصة سفرة.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="font-bold text-stone-900">الطهي والتوصيل</h4>
                  <p className="text-stone-500">يقوم الشيف بتحضير الوجبة وتسليمها لمندوب التوصيل المعتمد.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="font-bold text-stone-900">تحرير الأرباح الشيف</h4>
                  <p className="text-stone-500">بمجرد استلامك للوجبة وتأكيد التسليم، تحول الأرباح تلقائياً لمحفظة الشيف.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowEscrowModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs transition-all"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: Confirm Delivery & Release Escrow Confirmation Dialog */}
      {confirmDeliveryOrderId && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn border border-emerald-100">
            <button
              onClick={() => setConfirmDeliveryOrderId(null)}
              className="absolute top-5 left-5 text-stone-400 hover:text-stone-700 font-bold bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-black text-lg text-stone-900">تأكيد الاستلام وتحرير الرصيد 🤝</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                هل أنت متأكد من استلام طلبك ورضاك الكامل عن الوجبة والخدمة؟ عند التأكيد، سيتم تحرير صافي الأرباح فوراً من نظام الضمان (Escrow) وإيداعها في محفظة الشيف.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>إشعار الأمان:</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                هذا الإجراء مباشر ولا يمكن التراجع عنه. في حال كان لديك أي تحفظ على الوجبة يمكنك إغلاق هذه النافذة وفتح بلاغ/نزاع بدلاً من ذلك.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  confirmOrderDeliveryAndReleaseEscrow(confirmDeliveryOrderId);
                  setConfirmDeliveryOrderId(null);
                  setReviewSubmittedToast('تم تأكيد الاستلام وتحرير الأرباح للشيف بنجاح! شكراً لك 🎉');
                  setTimeout(() => setReviewSubmittedToast(null), 4000);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد وتحرير الأرباح الآن</span>
              </button>
              <button
                onClick={() => setConfirmDeliveryOrderId(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Customer Cancel Order Confirmation */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn border border-rose-100 text-right dir-rtl">
            <button
              onClick={() => setCancellingOrder(null)}
              className="absolute top-5 left-5 text-stone-400 hover:text-stone-700 font-bold bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="font-black text-lg text-stone-900">إلغاء الطلب واسترداد المبلغ</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                هل أنت متأكد من إلغاء طلب <strong className="text-stone-900">&quot;{cancellingOrder.post_title}&quot;</strong>؟ سيتم إرجاع المبلغ المقتطع فوراً إلى رصيد محفظتك على DPAY.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  updateOrderStatus(cancellingOrder.id, 'cancelled');
                  setCancellingOrder(null);
                  setReviewSubmittedToast('تم إلغاء الطلب وإرجاع المبلغ المالي إلى محفظتك بنجاح 🔄');
                  setTimeout(() => setReviewSubmittedToast(null), 4000);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer"
              >
                تأكيد الإلغاء واسترجاع المبلغ
              </button>
              <button
                onClick={() => setCancellingOrder(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Chef Reject Order Confirmation */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn border border-amber-100 text-right dir-rtl">
            <button
              onClick={() => setRejectingOrder(null)}
              className="absolute top-5 left-5 text-stone-400 hover:text-stone-700 font-bold bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="font-black text-lg text-stone-900">الاعتذار عن قبول الطلب</h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                هل تعتذر عن قبول هذا الطلب بسبب نفاذ المكونات أو انشغال المطبخ؟ سيتم إرجاع المبلغ المدفوع بالكامل لحساب العميل فوراً.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  updateOrderStatus(rejectingOrder.id, 'rejected');
                  setRejectingOrder(null);
                  setReviewSubmittedToast('تم الاعتذار عن الطلب وإعادة المبلغ للعميل بنجاح.');
                  setTimeout(() => setReviewSubmittedToast(null), 4000);
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer"
              >
                تأكيد الاعتذار وإعادة المبلغ
              </button>
              <button
                onClick={() => setRejectingOrder(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
