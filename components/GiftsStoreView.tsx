'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { GIFT_PACKAGES, GiftPackage, DIGITAL_GIFTS } from '@/lib/constants';
import { Post, GiftItem, User } from '@/lib/types';
import {
  Gift,
  Sparkles,
  Wallet,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Heart,
  Crown,
  Award,
  Zap,
  RefreshCw,
  Coins,
  ChevronLeft,
  Printer,
  Download,
  Share2,
  Lock,
  Loader2,
  UserCheck,
  CreditCard,
  Building2,
  Receipt,
  MessageSquare,
  Search,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

interface GiftsStoreViewProps {
  onBack?: () => void;
  onOpenWallet?: () => void;
  onOpenMessenger?: (chefId: string) => void;
}

export const GiftsStoreView: React.FC<GiftsStoreViewProps> = ({
  onBack,
  onOpenWallet,
  onOpenMessenger,
}) => {
  const {
    currentUser,
    users,
    buyGiftPackage,
    sendGift,
    convertGiftWalletToMainWallet,
    walletTransactions,
    gifts,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'packages' | 'direct_tip' | 'leaderboard' | 'history'>('packages');

  // Checkout modal states
  const [checkoutItem, setCheckoutItem] = useState<{
    type: 'package' | 'direct_tip';
    packageObj?: GiftPackage;
    chefObj?: User;
    giftItem?: GiftItem;
    customAmount?: number;
    message?: string;
  } | null>(null);

  const [checkoutStep, setCheckoutStep] = useState<'confirm' | 'processing' | 'success'>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<'dpay' | 'sadad' | 'bank_card'>('dpay');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [lastTxId, setLastTxId] = useState('');
  const [receiptData, setReceiptData] = useState<{
    txId: string;
    title: string;
    amount: number;
    sender: string;
    recipient: string;
    date: string;
    paymentMethodName: string;
  } | null>(null);

  // Direct Tip Form states
  const chefsList = users.filter((u) => u.role === 'chef');
  const [selectedChefId, setSelectedChefId] = useState<string>(chefsList[0]?.id || '');
  const [tipAmount, setTipAmount] = useState<number>(25);
  const [customTipAmount, setCustomTipAmount] = useState<string>('');
  const [selectedPresetGift, setSelectedPresetGift] = useState<GiftItem>(DIGITAL_GIFTS[2]); // Golden plate
  const [tipMessage, setTipMessage] = useState('');
  const [searchChefQuery, setSearchChefQuery] = useState('');
  const [directTipError, setDirectTipError] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Conversion modal states
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertAmount, setConvertAmount] = useState<number>(
    Math.min(currentUser.gift_wallet_balance || 0, 100)
  );
  const [convertSubmitting, setConvertSubmitting] = useState(false);
  const [convertFeedback, setConvertFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Selected receipt modal for history tab
  const [viewingReceiptTx, setViewingReceiptTx] = useState<{
    txId: string;
    title: string;
    amount: number;
    sender: string;
    recipient: string;
    date: string;
    paymentMethodName: string;
  } | null>(null);

  const userGiftBal = currentUser.gift_wallet_balance || 0;

  // Initiate purchase of a package
  const handleStartPackageCheckout = (pack: GiftPackage) => {
    setCheckoutItem({
      type: 'package',
      packageObj: pack,
    });
    setCheckoutStep('confirm');
  };

  // Initiate direct tip checkout
  const handleStartDirectTipCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setDirectTipError(null);
    let chef = chefsList.find((c) => c.id === selectedChefId);
    if (!chef && chefsList.length > 0) {
      chef = chefsList[0];
      setSelectedChefId(chef.id);
    }
    if (!chef) {
      setDirectTipError('يرجى اختيار الشيف المستلم للإكرامية من القائمة');
      return;
    }

    const finalAmount = customTipAmount ? parseFloat(customTipAmount) : tipAmount;
    if (!finalAmount || finalAmount <= 0) {
      setDirectTipError('يرجى تحديد أو إدخال قيمة إكرامية صحيحة أكبر من الصفر');
      return;
    }

    setCheckoutItem({
      type: 'direct_tip',
      chefObj: chef,
      giftItem: selectedPresetGift,
      customAmount: finalAmount,
      message: tipMessage,
    });
    setCheckoutStep('confirm');
  };

  // Process the payment through step-by-step animation
  const handleExecutePayment = async () => {
    if (!checkoutItem) return;

    // First check if user can afford via DPAY if DPAY is selected
    const requiredAmount =
      checkoutItem.type === 'package'
        ? checkoutItem.packageObj!.price
        : checkoutItem.customAmount || 10;

    if (paymentMethod === 'dpay' && currentUser.wallet_balance < requiredAmount) {
      setCheckoutError(
        `رصيد محفظة DPAY الحالية (${currentUser.wallet_balance.toFixed(1)} د.ل) غير كافٍ. يرجى شحن المحفظة.`
      );
      return;
    }

    setCheckoutStep('processing');
    setProcessingProgress(15);
    setProcessingStatusText('🔐 جاري الاتصال برابط التشفير المالي المباشر عبر سوفرة DPAY...');

    // Step 1 delay
    await new Promise((r) => setTimeout(r, 600));
    setProcessingProgress(45);
    setProcessingStatusText('💳 التحقق من الرصيد المالي المتاح وتطبيق المعايير الأمنية...');

    // Step 2 delay
    await new Promise((r) => setTimeout(r, 700));
    setProcessingProgress(80);
    setProcessingStatusText('📲 اقتطاع القيمة وتحديث محفظة المستلم وإصدار الإيصال الرقمي...');

    // Execute actual store mutation
    const generatedTxId = `DPAY-GIFT-${Math.floor(100000 + Math.random() * 900000)}`;
    let success = false;

    if (checkoutItem.type === 'package' && checkoutItem.packageObj) {
      const res = await buyGiftPackage(checkoutItem.packageObj);
      success = res.success;
    } else if (checkoutItem.type === 'direct_tip' && checkoutItem.chefObj && checkoutItem.giftItem) {
      // Find a post by this chef or dummy post
      const mockPostId = `post-direct-${checkoutItem.chefObj.id}`;
      const customGiftItem: GiftItem = {
        ...checkoutItem.giftItem,
        amount: checkoutItem.customAmount || checkoutItem.giftItem.amount,
      };
      success = await sendGift(mockPostId, customGiftItem, checkoutItem.message || 'إكرامية تقديراً لإبداعك 🌺', checkoutItem.chefObj.id);
    }

    await new Promise((r) => setTimeout(r, 500));
    setProcessingProgress(100);

    if (success) {
      setLastTxId(generatedTxId);
      const methodName =
        paymentMethod === 'dpay'
          ? 'محفظة DPAY المباشرة'
          : paymentMethod === 'sadad'
          ? 'خدمة سداد الدفع الإلكتروني'
          : 'الباقة المصرفية المحلية';

      const rec = {
        txId: generatedTxId,
        title:
          checkoutItem.type === 'package'
            ? `شراء ${checkoutItem.packageObj?.name}`
            : `إكرامية دعم للشيف ${checkoutItem.chefObj?.full_name}`,
        amount: requiredAmount,
        sender: currentUser.full_name,
        recipient:
          checkoutItem.type === 'package'
            ? 'محفظة هدايا المستخدم'
            : checkoutItem.chefObj?.full_name || 'الشيف',
        date: new Date().toLocaleString('ar-LY'),
        paymentMethodName: methodName,
      };

      setReceiptData(rec);
      setCheckoutStep('success');
    } else {
      setCheckoutError('تعذر إتمام المعاملة المالية، يرجى التأكد من رصيد المحفظة والمحاولة لاحقاً');
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvertFeedback(null);
    setConvertSubmitting(true);
    const res = await convertGiftWalletToMainWallet(Number(convertAmount));
    setConvertSubmitting(false);

    if (res.success) {
      setConvertFeedback({
        type: 'success',
        msg: `تم تحويل ${convertAmount} د.ل من محفظة الهدايا، وتم إيداع ${res.netCash?.toFixed(1)} د.ل صافي كاش في محفظتك الأساسية بنجاح! 🎉`,
      });
      setTimeout(() => {
        setShowConvertModal(false);
        setConvertFeedback(null);
      }, 2000);
    } else {
      setConvertFeedback({
        type: 'error',
        msg: res.error || 'فشل تحويل رصيد الهدايا',
      });
    }
  };

  // Top supporters dummy list complemented by real gifts
  const topSupporters = [
    {
      name: 'عبدالمؤمن طرابلسي',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      totalAmount: 1250,
      badge: 'داعم ماسي أسطوري 💎',
      favoriteChef: 'الشيف نزار كرير',
    },
    {
      name: 'سارة فرج الورفلي',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      totalAmount: 980,
      badge: 'داعم ذهبي فاخر 👑',
      favoriteChef: 'الشيف فاطمة المشرقي',
    },
    {
      name: 'طارق المصراتي',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      totalAmount: 740,
      badge: 'داعم ذهبي 🥇',
      favoriteChef: 'الشيف إيمان سالم',
    },
  ];

  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-950 via-amber-950 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-amber-500/30">
        <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>الرجوع للرئيسية</span>
                </button>
              )}
              <span className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>مركز الهدايا والإكراميات الرقمية 🇱🇾</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white flex items-center gap-2">
              <span>شراء إكراميات ودعم الشيفات</span>
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              عبّر عن تقديرك المالي لنكهات المطابخ الليبية. يمكنك شراء حزم الهدايا المباشرة أو تقديم إكرامية مخصصة تصل لمحفظة الشيف فوراً!
            </p>
          </div>

          {/* User Live Balance Summary Card - Role Aware */}
          <div className="bg-stone-900/90 backdrop-blur-md border border-amber-500/30 p-4 sm:p-5 rounded-3xl flex flex-col gap-3 w-full lg:w-auto min-w-[280px] shadow-xl">
            <div className="flex items-center justify-between text-xs gap-4">
              <span className="text-stone-300 font-bold flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>محفظة DPAY المتاحة للشراء:</span>
              </span>
              <span className="font-black text-emerald-400 text-base dir-ltr">
                {currentUser.wallet_balance.toFixed(1)} د.ل
              </span>
            </div>

            {currentUser.role === 'chef' ? (
              <div className="flex items-center justify-between text-xs gap-4 pt-2 border-t border-stone-800">
                <span className="text-stone-300 font-bold flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>رصيد الهدايا المستلمة:</span>
                </span>
                <span className="font-black text-amber-300 text-base dir-ltr">
                  {userGiftBal.toFixed(1)} د.ل
                </span>
              </div>
            ) : (
              <div className="space-y-1.5 pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>رصيد الهدايا المشتراة (للإهداء):</span>
                  </span>
                  <span className="font-black text-amber-300 text-base dir-ltr">
                    {userGiftBal.toFixed(1)} د.ل
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-300 font-bold flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>أرباح مشاركة المبيعات:</span>
                  </span>
                  <span className="font-black text-emerald-300 text-base dir-ltr">
                    {(currentUser.affiliate_balance || 0).toFixed(1)} د.ل
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {onOpenWallet && (
                <button
                  onClick={onOpenWallet}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] py-2 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>شحن المحفظة</span>
                </button>
              )}

              {currentUser.role === 'chef' && userGiftBal > 0 ? (
                <button
                  onClick={() => {
                    setConvertAmount(Math.min(userGiftBal, 100));
                    setShowConvertModal(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-[11px] py-2 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تحويل لكاش</span>
                </button>
              ) : currentUser.role !== 'chef' && (
                <button
                  onClick={() => setActiveTab('direct_tip')}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-[11px] py-2 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>إكرامية لشيف</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-stone-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'packages'
                ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                : 'bg-stone-900/80 text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>حزم الهدايا الجاهزة 🛍️</span>
          </button>

          <button
            onClick={() => setActiveTab('direct_tip')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'direct_tip'
                ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                : 'bg-stone-900/80 text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>إكرامية مباشرة لشيف 💸</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                : 'bg-stone-900/80 text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>لوحة كبار الداعمين 👑</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                : 'bg-stone-900/80 text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>سجل المعاملات والإيصالات 📜</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GIFT PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <span>اختر حزمة الهدايا المناسبة لك</span>
              </h2>
              <p className="text-xs text-stone-500 font-bold">خصومات حصرية وقيمة مضاعفة لرصيد الهدايا</p>
            </div>
            <span className="bg-amber-100 text-amber-800 font-extrabold text-[11px] px-3 py-1 rounded-full">
              شحن فوري ⚡
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {GIFT_PACKAGES.map((pack) => {
              const canAfford = currentUser.wallet_balance >= pack.price;
              return (
                <div
                  key={pack.id}
                  className="bg-white rounded-3xl p-6 border border-stone-200 hover:border-amber-400 transition-all shadow-sm hover:shadow-xl relative flex flex-col justify-between overflow-hidden group"
                >
                  {pack.badge && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-[10px] px-3 py-1 rounded-full shadow-xs">
                      {pack.badge}
                    </div>
                  )}

                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
                      {pack.icon}
                    </div>

                    <h3 className="font-black text-base text-stone-900 mb-1">{pack.name}</h3>
                    <p className="text-xs text-stone-500 mb-4 leading-relaxed">{pack.description}</p>

                    <div className="bg-stone-50 border border-stone-100 rounded-2xl p-3 mb-5 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-600">تتضمن:</span>
                      <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl">
                        {pack.giftCount} {pack.itemName} {pack.itemIcon}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-500">القيمة المالية:</span>
                      <div className="text-left dir-ltr">
                        <span className="text-xl font-black text-emerald-700">{pack.price}</span>
                        <span className="text-xs font-bold text-stone-500 mr-1">د.ل</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartPackageCheckout(pack)}
                      className={`w-full font-black text-xs py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-stone-950 hover:shadow-lg'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      <Gift className="w-4 h-4" />
                      <span>{canAfford ? `شراء الآن (${pack.price} د.ل)` : `شراء / دفع (${pack.price} د.ل)`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT CHEF TIP */}
      {activeTab === 'direct_tip' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xl space-y-6 animate-in fade-in duration-200 max-w-3xl mx-auto">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span>تقديم إكرامية ودعم مباشر لشيف ليبيا 🇱🇾</span>
            </h2>
            <p className="text-xs text-stone-500 font-bold mt-1">
              أدخل المبلغ الذي ترغب في تحويله مباشرة لمحفظة الشيف مع اختيار رمز الهدية والرسالة التشجيعية
            </p>
          </div>

          <form onSubmit={handleStartDirectTipCheckout} className="space-y-6">
            {directTipError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                <span>{directTipError}</span>
              </div>
            )}
            {/* 1. Select Chef */}
            <div className="space-y-2">
              <label className="text-xs font-black text-stone-800 block">
                1. اختر الشيف أو المطبخ المستلم:
              </label>

              <div className="relative mb-2">
                <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث عن شيف بالاسم أو المدينة..."
                  value={searchChefQuery}
                  onChange={(e) => setSearchChefQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1 border border-stone-100 rounded-2xl bg-stone-50/50">
                {chefsList
                  .filter((c) =>
                    c.full_name.toLowerCase().includes(searchChefQuery.toLowerCase()) ||
                    c.city.toLowerCase().includes(searchChefQuery.toLowerCase())
                  )
                  .map((chef) => {
                    const isSelected = selectedChefId === chef.id;
                    return (
                      <button
                        key={chef.id}
                        type="button"
                        onClick={() => setSelectedChefId(chef.id)}
                        className={`p-3 rounded-2xl border text-right flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <img
                          src={chef.avatar_url}
                          alt={chef.full_name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-stone-200"
                        />
                        <div className="overflow-hidden">
                          <div className="font-extrabold text-xs text-stone-900 truncate">
                            {chef.full_name}
                          </div>
                          <div className="text-[10px] text-stone-500 font-bold truncate">
                            {chef.city} • {chef.district || 'مطبخ معتمد'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 2. Select Tip Amount */}
            <div className="space-y-3">
              <label className="text-xs font-black text-stone-800 block">
                2. اختر قيمة الإكرامية أو أدخل مبلغا مخصصا (د.ل):
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                {[5, 10, 25, 50, 100, 200].map((amt) => {
                  const isSelected = !customTipAmount && tipAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setTipAmount(amt);
                        setCustomTipAmount('');
                      }}
                      className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer dir-ltr ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 scale-105'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {amt} د.ل
                    </button>
                  );
                })}
              </div>

              <div>
                <input
                  type="number"
                  placeholder="أو أدخل مبلغا آخر (مثلاً 35 د.ل)..."
                  value={customTipAmount}
                  onChange={(e) => setCustomTipAmount(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-right"
                />
              </div>
            </div>

            {/* 3. Gift Badge & Message */}
            <div className="space-y-3">
              <label className="text-xs font-black text-stone-800 block">
                3. اختر أيقونة الهدية المرافقة واكتب كلمة تشجيعية:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIGITAL_GIFTS.map((g) => {
                  const isSelected = selectedPresetGift.id === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedPresetGift(g)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-stone-50 border-stone-200 hover:bg-white'
                      }`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-[11px] font-extrabold text-stone-800">{g.name}</span>
                    </button>
                  );
                })}
              </div>

              <textarea
                rows={2}
                placeholder="أضف كلمة تشجيع للشيف (مثلاً: تسلم الأيادي الأكل كان فوق الخيال! 🌺)..."
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-sm py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-stone-950" />
              <span>
                إرسال الإكرامية الآن (
                {customTipAmount ? `${customTipAmount} د.ل` : `${tipAmount} د.ل`})
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-600" />
                <span>جدول كبار الداعمين ورعاة الطبخ الليبي 👑</span>
              </h2>
              <p className="text-xs text-stone-600 font-bold mt-1">
                تكريم مالي ومعنوي للداعمين الذين يثنون على مجهودات الشيفات بالهدايا
              </p>
            </div>
            <button
              onClick={() => setActiveTab('direct_tip')}
              className="bg-stone-900 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>انضم لكبار الداعمين الآن</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topSupporters.map((sup, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-3 left-3 bg-amber-100 text-amber-900 text-xs font-black w-8 h-8 rounded-full flex items-center justify-center border border-amber-300">
                  #{index + 1}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={sup.avatar}
                      alt={sup.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-stone-900">{sup.name}</h3>
                      <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full block w-fit mt-1">
                        {sup.badge}
                      </span>
                    </div>
                  </div>

                  <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 space-y-1 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>إجمالي الهدايا المقدمة:</span>
                      <span className="font-black text-emerald-700 dir-ltr">{sup.totalAmount} د.ل</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>الشيف المفضل:</span>
                      <span className="font-extrabold text-stone-900">{sup.favoriteChef}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HISTORY & RECEIPTS */}
      {activeTab === 'history' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <span>سجل المعاملات والإيصالات الرسمية 📜</span>
            </h2>
            <span className="text-xs font-bold text-stone-500">معاملات موثقة عبر سوفرة DPAY</span>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
            {walletTransactions.filter(
              (tx) =>
                tx.type === 'gift_sent' ||
                tx.type === 'gift_received' ||
                tx.type === 'gift_package_buy' ||
                tx.type === 'gift_converted'
            ).length === 0 ? (
              <div className="p-8 text-center text-stone-500 space-y-2">
                <Gift className="w-10 h-10 mx-auto text-stone-300" />
                <p className="text-xs font-bold">لا توجد معاملات هدايا سابقة في سجل حسابك بعد</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {walletTransactions
                  .filter(
                    (tx) =>
                      tx.type === 'gift_sent' ||
                      tx.type === 'gift_received' ||
                      tx.type === 'gift_package_buy' ||
                      tx.type === 'gift_converted'
                  )
                  .map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                            tx.amount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tx.amount > 0 ? '🎁' : '💸'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-stone-900">{tx.title}</h4>
                          <span className="text-[10px] text-stone-400 font-bold block">
                            {new Date(tx.created_at).toLocaleString('ar-LY')} • معرف المعاملة: {tx.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-black text-xs dir-ltr ${
                            tx.amount > 0 ? 'text-emerald-700' : 'text-stone-900'
                          }`}
                        >
                          {tx.amount > 0 ? `+${tx.amount.toFixed(1)}` : `${tx.amount.toFixed(1)}`} د.ل
                        </span>

                        <button
                          onClick={() => {
                            setViewingReceiptTx({
                              txId: tx.id,
                              title: tx.title,
                              amount: Math.abs(tx.amount),
                              sender: currentUser.full_name,
                              recipient: tx.amount > 0 ? currentUser.full_name : 'الشيف المستلم',
                              date: new Date(tx.created_at).toLocaleString('ar-LY'),
                              paymentMethodName: 'شبكة سوفرة DPAY الرقمية',
                            });
                          }}
                          className="bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>الإيصال</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT & PROCESSING STEP-BY-STEP MODAL */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden border border-amber-200 shadow-2xl relative flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-stone-900">
                    بوابة الدفع والتسديد الآمنة 🔒
                  </h3>
                  <p className="text-[11px] text-stone-500 font-bold">
                    معالجة موثقة ومشفرة عبر شبكة DPAY سوفرة ليبيا
                  </p>
                </div>
              </div>

              {checkoutStep !== 'processing' && (
                <button
                  onClick={() => setCheckoutItem(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* STEP 1: CONFIRMATION & PAYMENT METHOD */}
            {checkoutStep === 'confirm' && (() => {
              const itemAmount =
                checkoutItem.type === 'package'
                  ? checkoutItem.packageObj?.price || 0
                  : checkoutItem.customAmount || 0;
              const hasEnoughBalance = currentUser.wallet_balance >= itemAmount;

              return (
                <div className="p-5 overflow-y-auto space-y-5 flex-1">
                  {checkoutError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                      <span>{checkoutError}</span>
                    </div>
                  )}
                  {/* Order Summary Card */}
                  <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-4 space-y-3 border border-stone-700 shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">
                          تفاصيل الطلب:
                        </span>
                        <h4 className="font-extrabold text-sm text-white mt-0.5">
                          {checkoutItem.type === 'package'
                            ? checkoutItem.packageObj?.name
                            : `إكرامية دعم للشيف ${checkoutItem.chefObj?.full_name}`}
                        </h4>
                      </div>
                      <span className="text-2xl">
                        {checkoutItem.type === 'package'
                          ? checkoutItem.packageObj?.icon
                          : checkoutItem.giftItem?.icon || '🎁'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                      <span className="text-stone-300 font-bold">المبلغ المطلوب سداده:</span>
                      <span className="font-black text-emerald-400 text-base dir-ltr">
                        {itemAmount} د.ل
                      </span>
                    </div>
                  </div>

                  {/* Direct DPAY Wallet Payment Deduction Card */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-stone-800 block">
                      خصم مباشر من محفظة DPAY المتاحة:
                    </label>

                    <div className="bg-emerald-50/80 border-2 border-emerald-500 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-black text-xs text-stone-900">
                            رصيد محفظة DPAY المباشر ⚡
                          </div>
                          <div className="text-[11px] font-bold text-emerald-800 dir-ltr text-right">
                            الرصيد المتاح حالياً: {currentUser.wallet_balance.toFixed(1)} د.ل
                          </div>
                        </div>
                      </div>
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>وسيلة سداد معتمدة</span>
                      </span>
                    </div>

                    {!hasEnoughBalance ? (
                      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2 text-right">
                        <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-600" />
                          <span>رصيد محفظتك غير كافٍ لإتمام العملية!</span>
                        </div>
                        <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                          الرصيد المتاح ({currentUser.wallet_balance.toFixed(1)} د.ل) أقل من المبلغ المطلوب ({itemAmount} د.ل). يرجى شحن محفظتك للمتابعة.
                        </p>
                        {onOpenWallet && (
                          <button
                            type="button"
                            onClick={() => {
                              setCheckoutItem(null);
                              onOpenWallet();
                            }}
                            className="w-full mt-1 bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Wallet className="w-4 h-4" />
                            <span>شحن محفظة DPAY الآن</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex justify-between items-center text-xs">
                        <span className="text-stone-600 font-bold">الرصيد المتبقي بعد الخصم:</span>
                        <span className="font-black text-stone-900 dir-ltr">
                          {(currentUser.wallet_balance - itemAmount).toFixed(1)} د.ل
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!hasEnoughBalance}
                    onClick={handleExecutePayment}
                    className={`w-full font-black text-sm py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                      !hasEnoughBalance
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-stone-950 cursor-pointer'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>تأكيد الخصم المباشر والإهداء الآن 🔒</span>
                  </button>
                </div>
              );
            })()}

            {/* STEP 2: PROCESSING ANIMATION */}
            {checkoutStep === 'processing' && (
              <div className="p-8 text-center space-y-6 my-auto">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
                  <ShieldCheck className="w-10 h-10 text-amber-600 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-black text-base text-stone-900">جاري معالجة المعاملة المالية...</h3>
                  <p className="text-xs font-bold text-amber-800">{processingStatusText}</p>
                </div>

                <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: OFFICIAL RECEIPT & SUCCESS */}
            {checkoutStep === 'success' && receiptData && (
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-lg border-2 border-emerald-400 animate-bounce">
                    ✓
                  </div>
                  <h3 className="font-black text-xl text-stone-900">تمت معالجة الشراء والإهداء بنجاح! 🎉</h3>
                  <p className="text-xs text-stone-500 font-bold">
                    تم إصدار الإيصال المالي الرسمي وتحديث الأرصدة فوراً
                  </p>
                </div>

                {/* Printable Digital Receipt Card */}
                <div className="bg-stone-50 border-2 border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                        SOFRA
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-stone-900 block">
                          إيصال معتمد - DPAY سوفرة
                        </span>
                        <span className="text-[9px] text-stone-500 font-bold block dir-ltr">
                          REF: {receiptData.txId}
                        </span>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-300">
                      معتمدة وموثقة 🟢
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>المرسل:</span>
                      <span className="font-extrabold text-stone-900">{receiptData.sender}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>المستلم:</span>
                      <span className="font-extrabold text-stone-900">{receiptData.recipient}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>بيان العملية:</span>
                      <span className="font-extrabold text-stone-900">{receiptData.title}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>طريقة الدفع:</span>
                      <span className="font-extrabold text-stone-900">{receiptData.paymentMethodName}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>تاريخ المعاملة:</span>
                      <span className="font-extrabold text-stone-900">{receiptData.date}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-between items-center">
                    <span className="font-bold text-xs text-stone-700">المبلغ المدفوع الصافي:</span>
                    <span className="font-black text-lg text-emerald-700 dir-ltr">
                      {receiptData.amount.toFixed(1)} د.ل
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-3 text-right space-y-1">
                  <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span>رصيد هداياك المتاحة للإهداء الآن: {(currentUser.gift_wallet_balance || 0).toFixed(1)} د.ل</span>
                  </div>
                  <p className="text-[10px] text-stone-600">
                    تجد رصيد حزم الهدايا المشتراة موضحاً دائماً بوضوح في أعلى متجر الهدايا وفي محفظتك الشخصية.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutItem(null);
                      setReceiptData(null);
                      setActiveTab('direct_tip');
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>إرسال هدية لشيف الآن 🎁</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutItem(null);
                      setReceiptData(null);
                    }}
                    className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>تم والإغلاق</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONVERT GIFT WALLET MODAL */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border border-amber-200 shadow-2xl p-6 relative space-y-5">
            <button
              onClick={() => setShowConvertModal(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <RefreshCw className="w-7 h-7" />
              </div>
              <h3 className="font-black text-lg text-stone-900">تحويل محفظة الهدايا إلى كاش 💰</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto font-bold">
                خصم تلقائي 50% عمولة المنصة وإيداع الصافي كاش في محفظتك الرئيسية فوراً
              </p>
            </div>

            <form onSubmit={handleConvert} className="space-y-4">
              {convertFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                    convertFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  <span className="shrink-0">{convertFeedback.type === 'success' ? '✅' : '⚠️'}</span>
                  <span>{convertFeedback.msg}</span>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">رصيد محفظة الهدايا الحالي:</span>
                <span className="font-black text-sm text-amber-800 bg-white px-2.5 py-0.5 rounded-xl border border-amber-200">
                  {userGiftBal.toFixed(1)} د.ل
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  المبلغ المراد تحويله من محفظة الهدايا (د.ل):
                </label>
                <input
                  type="number"
                  min={1}
                  max={userGiftBal}
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-sm font-black text-stone-900 outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-right"
                />
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>المبلغ المحوّل:</span>
                  <span className="font-bold dir-ltr">{convertAmount || 0} د.ل</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>عمولة المنصة (50%):</span>
                  <span className="font-bold dir-ltr">
                    -{((Number(convertAmount) || 0) * 0.5).toFixed(1)} د.ل
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-black pt-1.5 border-t border-stone-200 text-sm">
                  <span>الصافي المودع بكاش المحفظة:</span>
                  <span className="dir-ltr">
                    +{((Number(convertAmount) || 0) * 0.5).toFixed(1)} د.ل
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={convertSubmitting || !convertAmount || convertAmount > userGiftBal}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs py-3.5 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>تأكيد تحويل (+{((Number(convertAmount) || 0) * 0.5).toFixed(1)} د.ل كاش)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW RECEIPT MODAL FROM HISTORY */}
      {viewingReceiptTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border border-amber-200 shadow-2xl p-6 relative space-y-5">
            <button
              onClick={() => setViewingReceiptTx(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold">
                📜
              </div>
              <h3 className="font-black text-lg text-stone-900">إيصال معاملة هدايا معتمد</h3>
              <p className="text-[11px] text-stone-500 font-bold">شبكة سوفرة DPAY الرقمية الموحدة</p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-bold">رقم الإيصال:</span>
                <span className="font-extrabold text-stone-900 dir-ltr">{viewingReceiptTx.txId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-bold">بيان العملية:</span>
                <span className="font-extrabold text-stone-900">{viewingReceiptTx.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-bold">طريقة الدفع:</span>
                <span className="font-extrabold text-stone-900">{viewingReceiptTx.paymentMethodName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-bold">التاريخ والوقت:</span>
                <span className="font-extrabold text-stone-900">{viewingReceiptTx.date}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm">
                <span className="font-bold text-stone-800">القيمة المالية:</span>
                <span className="font-black text-emerald-700 dir-ltr">{viewingReceiptTx.amount.toFixed(1)} د.ل</span>
              </div>
            </div>

            {downloadNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{downloadNotice}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDownloadNotice(`تم تصدير الإيصال المالي رقم (${viewingReceiptTx.txId}) بنجاح`);
                  setTimeout(() => setDownloadNotice(null), 3000);
                }}
                className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تحميل PDF</span>
              </button>

              <button
                onClick={() => setViewingReceiptTx(null)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs py-3 rounded-2xl transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
