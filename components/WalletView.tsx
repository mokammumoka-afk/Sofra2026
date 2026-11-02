'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { DPAYGatewayModal } from './DPAYGatewayModal';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CreditCard,
  ShieldCheck,
  Send,
  Building,
  QrCode,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Filter,
  FileText,
  Printer,
  Sparkles,
  Smartphone,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowRight,
  X,
  History,
  TrendingUp,
  Gift,
  KeyRound,
  Shield,
  Lock,
} from 'lucide-react';
import { WalletTransaction, PayoutType } from '@/lib/types';
import { LIBYAN_BANKS } from '@/lib/constants';

interface WalletViewProps {
  onBackToExplore?: () => void;
  onOpenGiftsStore?: () => void;
}

type TabType = 'OVERVIEW' | 'DEPOSIT' | 'TRANSFER' | 'CASHOUT' | 'QR' | 'LEDGER';

export const WalletView: React.FC<WalletViewProps> = ({ onBackToExplore, onOpenGiftsStore }) => {
  const {
    currentUser,
    walletTransactions,
    depositWallet,
    transferWalletFunds,
    withdrawWalletFunds,
    payoutRequests,
    commissionSettings,
    platformSettings,
    requestChefPayout,
    convertGiftWalletToMainWallet,
    convertAffiliateBalanceToMainWallet,
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [showBalance, setShowBalance] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const tabContentRef = useRef<HTMLDivElement>(null);

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab);
    setTimeout(() => {
      tabContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [showDPAYGateway, setShowDPAYGateway] = useState(false);

  // Transfer Form State
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState<number | string>(50);
  const [transferNote, setTransferNote] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Cashout Form State
  const [payoutType, setPayoutType] = useState<PayoutType>('sales');
  const [selectedBank, setSelectedBank] = useState<string>(LIBYAN_BANKS[0]);
  const [bankAccountNo, setBankAccountNo] = useState('1234567');
  const [ibanNo, setIbanNo] = useState('LY820184920192000000000');
  const [cashoutAmount, setCashoutAmount] = useState<number | string>(100);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);
  const [cashoutError, setCashoutError] = useState('');

  // 2FA Security State
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('123456');
  const [resendTimer, setResendTimer] = useState(0);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [pendingCashoutExecution, setPendingCashoutExecution] = useState<(() => Promise<void>) | null>(null);

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Gift Convert Modal State
  const [showGiftConvertModal, setShowGiftConvertModal] = useState(false);
  const [giftConvertAmt, setGiftConvertAmt] = useState<number>(
    Math.min(currentUser.gift_wallet_balance || 0, 100)
  );
  const [giftConvertSuccess, setGiftConvertSuccess] = useState(false);
  const [giftConvertError, setGiftConvertError] = useState('');
  const [isConvertingGift, setIsConvertingGift] = useState(false);

  const handleConvertGiftWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setGiftConvertError('');
    setGiftConvertSuccess(false);
    setIsConvertingGift(true);

    const res = await convertGiftWalletToMainWallet(Number(giftConvertAmt));
    setIsConvertingGift(false);

    if (res.success) {
      setGiftConvertSuccess(true);
      setTimeout(() => {
        setShowGiftConvertModal(false);
        setGiftConvertSuccess(false);
      }, 2000);
    } else {
      setGiftConvertError(res.error || 'فشل تحويل الهدايا');
    }
  };

  // Ledger Filter & Search
  const [ledgerFilter, setLedgerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<WalletTransaction | null>(null);

  // User's DPAY Account ID
  const userDpayAccount = `DPAY-ACCOUNT-${currentUser.phone || '0912345678'}`;

  const userTxs = walletTransactions.filter((tx) => tx.user_id === currentUser.id);

  const filteredTxs = userTxs.filter((tx) => {
    const matchesQuery =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (ledgerFilter === 'all') return matchesQuery;
    if (ledgerFilter === 'deposit') return matchesQuery && tx.type === 'deposit';
    if (ledgerFilter === 'purchase') return matchesQuery && tx.type === 'purchase';
    if (ledgerFilter === 'gift') return matchesQuery && (tx.type === 'gift_sent' || tx.type === 'gift_received');
    if (ledgerFilter === 'withdrawal') return matchesQuery && tx.type === 'withdrawal';
    return matchesQuery;
  });

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(userDpayAccount);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleDPAYDepositSuccess = async (ref: string, gatewayId: string) => {
    await depositWallet(depositAmount, gatewayId);
    setShowDPAYGateway(false);
    setActiveTab('LEDGER');
  };

  const handleP2PTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess(false);

    const numAmount = Number(transferAmount);
    if (!numAmount || numAmount <= 0) {
      setTransferError('يرجى أدخال مبلغ تحويل صحيح');
      return;
    }

    if (!transferRecipient.trim()) {
      setTransferError('يرجى تحديد رقم أو اسم المستلم');
      return;
    }

    const result = await transferWalletFunds(transferRecipient, numAmount, transferNote);
    if (result.success) {
      setTransferSuccess(true);
      setTransferRecipient('');
      setTransferNote('');
    } else {
      setTransferError(result.error || 'فشل إتمام التحويل');
    }
  };

  const handleBankCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCashoutError('');
    setCashoutSuccess(false);

    const numAmount = Number(cashoutAmount);
    if (!numAmount || numAmount <= 0) {
      setCashoutError('الرجاء إدخال مبلغ سحب صحيح أكبر من الصفر.');
      return;
    }

    const minPayout = platformSettings?.min_payout_amount || 100;
    if (numAmount < minPayout) {
      setCashoutError(`أقل مبلغ مسموح به لطلب السحب للمصرف هو ${minPayout} د.ل.`);
      return;
    }

    if (numAmount > currentUser.wallet_balance) {
      setCashoutError(`رصيدك الحالي (${currentUser.wallet_balance.toFixed(1)} د.ل) لا يكفي لإتمام عملية السحب لمبلغ ${numAmount} د.ل.`);
      return;
    }

    if (!bankAccountNo.trim() || !ibanNo.trim()) {
      setCashoutError('يرجى التأكد من إدخال رقم الحساب المصرفي والآيبان بشكل صحيح.');
      return;
    }

    const executePayout = async () => {
      const result = await requestChefPayout(
        payoutType,
        numAmount,
        selectedBank,
        bankAccountNo,
        ibanNo
      );

      if (result.success) {
        setCashoutSuccess(true);
      } else {
        setCashoutError(result.error || 'فشل تقديم طلب السحب');
      }
    };

    if (is2FAEnabled) {
      // Trigger 2FA step before executing payout
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setTwoFactorCode('');
      setTwoFactorError('');
      setResendTimer(30);
      setPendingCashoutExecution(() => executePayout);
      setShow2FAModal(true);
    } else {
      // Direct payout execution without 2FA
      await executePayout();
    }
  };

  const handleVerifyAndConfirmCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');

    if (!twoFactorCode.trim()) {
      setTwoFactorError('يرجى إدخال رمز التحقق المؤلف من 6 أرقام');
      return;
    }

    // Accept generated code or fallback test code 123456
    if (twoFactorCode.trim() === generatedCode || twoFactorCode.trim() === '123456') {
      setIsVerifying2FA(true);
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate security verification
      setIsVerifying2FA(false);
      setShow2FAModal(false);

      if (pendingCashoutExecution) {
        await pendingCashoutExecution();
        setPendingCashoutExecution(null);
      }
    } else {
      setTwoFactorError('رمز التحقق الذي أدخلته غير صحيح. يرجى التأكد وإعادة المحاولة.');
    }
  };

  const handleResend2FACode = () => {
    if (resendTimer > 0) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(newCode);
    setResendTimer(30);
    setTwoFactorError('');
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-stone-800">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>محفظة DPAY الإلكترونية المشفرة 🇱🇾</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <span>المحفظة والرصيد الرقمي</span>
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl">
              شحن الرصيد الفوري عبر جميع المصارف الليبية (سداد، تداول، المدار، ليبيانا) مع ضمان الأمان وحفظ حقوق الضمان Escrow.
            </p>
          </div>

          {/* User Account ID Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-2xl flex items-center justify-between gap-4 w-full md:w-auto">
            <div className="text-right">
              <div className="text-[10px] text-stone-300 font-bold">معرف حساب DPAY الخاص بك:</div>
              <div className="font-mono text-xs font-black text-amber-300 dir-ltr">{userDpayAccount}</div>
            </div>
            <button
              onClick={handleCopyAccount}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="نسخ معرف الحساب"
            >
              {copiedAccount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Digital Credit Card & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DPAY Virtual Card Container */}
        <div className="lg:col-span-2 bg-gradient-to-tr from-stone-900 via-orange-950 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[230px] border border-orange-500/20">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-lg">
                <div className="w-full h-full bg-stone-900 rounded-[14px] flex items-center justify-center text-amber-400 font-black text-lg">
                  DP
                </div>
              </div>
              <div>
                <div className="text-xs text-orange-200/80 font-bold">بطاقة الدفع الرقمي</div>
                <div className="font-extrabold text-white text-base">{currentUser.full_name}</div>
              </div>
            </div>

            <button
              onClick={() => setShowBalance(!showBalance)}
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-stone-200 transition-colors cursor-pointer"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showBalance ? 'إخفاء الرصيد' : 'إظهار الرصيد'}</span>
            </button>
          </div>

          {/* Balance Display */}
          <div className="my-6 relative z-10">
            <div className="text-xs text-stone-300 font-bold mb-1">الرصيد المتاح حالياً</div>
            <div className="text-3xl sm:text-5xl font-black text-amber-400 tracking-tight flex items-baseline gap-2 dir-ltr justify-end sm:justify-start">
              <span>{showBalance ? currentUser.wallet_balance.toLocaleString('ar-LY') : '••••••••'}</span>
              <span className="text-lg font-bold text-stone-200">د.ل</span>
            </div>
          </div>

          {/* Quick Actions Row inside Card */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/10 relative z-10">
            <button
              onClick={() => handleSwitchTab('DEPOSIT')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'DEPOSIT'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white font-bold'
              }`}
            >
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-[11px]">إيداع شحن</span>
            </button>

            <button
              onClick={() => handleSwitchTab('TRANSFER')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'TRANSFER'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white font-bold'
              }`}
            >
              <Send className="w-5 h-5 mb-1" />
              <span className="text-[11px]">تحويل P2P</span>
            </button>

            <button
              onClick={() => handleSwitchTab('CASHOUT')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'CASHOUT'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white font-bold'
              }`}
            >
              <Building className="w-5 h-5 mb-1" />
              <span className="text-[11px]">سحب للمصرف</span>
            </button>

            <button
              onClick={() => handleSwitchTab('QR')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'QR'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white font-bold'
              }`}
            >
              <QrCode className="w-5 h-5 mb-1" />
              <span className="text-[11px]">كود QR</span>
            </button>
          </div>
        </div>

        {/* Side Balance Info & Role-Specific Card */}
        <div className="space-y-4">
          {/* Conditional Role Card: Chef (Gift Wallet) vs User (Share & Earn Affiliate Earnings) */}
          {currentUser.role === 'chef' ? (
            /* Chef Gift Wallet Card */
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-100/30 rounded-3xl p-6 border border-amber-300/60 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span>محفظة هدايا وإكراميات الشيف 🎁</span>
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                    مستقلة للشيفات
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-stone-600 font-bold">الرصيد المتاح من الهدايا المستلمة:</div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-900 dir-ltr text-right">
                    {(currentUser.gift_wallet_balance || 0).toFixed(1)}{' '}
                    <span className="text-xs font-bold text-stone-600">د.ل</span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed">
                  تصلك الإكراميات والهدايا المباشرة من متابعيك هنا. عند تحويلها إلى كاش يتم تطبيق{' '}
                  <strong className="text-amber-900">50% عمولة المنصة</strong> وتستلم الصافي فوراً في محفظتك.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-amber-200/50">
                {(currentUser.gift_wallet_balance || 0) > 0 && (
                  <button
                    onClick={() => {
                      setGiftConvertAmt(Math.min(currentUser.gift_wallet_balance || 0, 100));
                      setShowGiftConvertModal(true);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>تحويل رصيد الهدايا إلى كاش (50%)</span>
                  </button>
                )}

                {onOpenGiftsStore && (
                  <button
                    onClick={onOpenGiftsStore}
                    className="w-full py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>متجر الهدايا والإكراميات 🛍️</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Regular User Share & Earn Affiliate Earnings Card */
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-100/30 rounded-3xl p-6 border border-emerald-300/60 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>أرباح مشاركة المبيعات والتسويق 🤝</span>
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                    خاصة بالمستخدمين
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-stone-600 font-bold">الرصيد المتاح من عمولات المشاركة:</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-900 dir-ltr text-right">
                    {(currentUser.affiliate_balance || 0).toFixed(1)}{' '}
                    <span className="text-xs font-bold text-stone-600">د.ل</span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed">
                  تصلك أرباحك وعمولاتك عند مشاركة أطباق الشيفات عبر رابطك مع أصدقائك أو وسائل التواصل. ينزل رصيد أرباحك هنا فور كل عملية شراء!
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-emerald-200/50">
                {(currentUser.affiliate_balance || 0) > 0 && (
                  <button
                    onClick={async () => {
                      const res = await convertAffiliateBalanceToMainWallet();
                      if (res.success) {
                        alert(`🎉 تم تحويل ${res.convertedAmount?.toFixed(1)} د.ل من أرباح المشاركة إلى محفظتك الرئيسية بنجاح!`);
                      } else {
                        alert(`⚠️ ${res.error}`);
                      }
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>تحويل الأرباح إلى رصيد المحفظة الرئيسي 💸</span>
                  </button>
                )}

                {onOpenGiftsStore && (
                  <button
                    onClick={onOpenGiftsStore}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>شراء حزمة هدايا جديدة 🛍️</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* User Purchased Gifts Inventory Card (Shown for Users) */}
          {currentUser.role !== 'chef' && (
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-100/30 rounded-3xl p-5 border border-amber-300/60 shadow-sm flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>رصيد حزم الهدايا المشتراة 🎁</span>
                </div>
                <div className="text-xl font-black text-amber-900 dir-ltr text-right">
                  {(currentUser.gift_wallet_balance || 0).toFixed(1)}{' '}
                  <span className="text-xs font-bold text-stone-600">د.ل</span>
                </div>
                <p className="text-[10px] text-stone-600">
                  هذا الرصيد جاهز لإرسال إكرامات ورسائل دعم لشيفاتك المفضلين عند استعراض أطباقهم.
                </p>
              </div>
              {(onBackToExplore || onOpenGiftsStore) && (
                <button
                  onClick={onBackToExplore || onOpenGiftsStore}
                  className="py-2.5 px-3.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold text-xs rounded-2xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>إرسال هدية لشيف 🎁</span>
                </button>
              )}
            </div>
          )}

          <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-extrabold text-stone-700">حالة الضمان والتقارير</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                نشط وآمن
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between items-center py-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  محفظة الضمان (Escrow):
                </span>
                <span className="font-bold text-stone-900">محمية تلقائياً</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                  معاملات المحفظة:
                </span>
                <span className="font-extrabold text-stone-900">{userTxs.length}</span>
              </div>
            </div>

            <button
              onClick={() => handleSwitchTab('LEDGER')}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-stone-600" />
              <span>كشف الحساب الكامل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-stone-200 shadow-2xs flex items-center justify-between overflow-x-auto gap-1">
        <button
          onClick={() => handleSwitchTab('OVERVIEW')}
          className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
            activeTab === 'OVERVIEW'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          النظرة العامة
        </button>

        <button
          onClick={() => handleSwitchTab('DEPOSIT')}
          className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
            activeTab === 'DEPOSIT'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          إيداع وشحن
        </button>

        <button
          onClick={() => handleSwitchTab('TRANSFER')}
          className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
            activeTab === 'TRANSFER'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          تحويل P2P
        </button>

        <button
          onClick={() => handleSwitchTab('CASHOUT')}
          className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
            activeTab === 'CASHOUT'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          سحب بنكي
        </button>

        <button
          onClick={() => handleSwitchTab('LEDGER')}
          className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center ${
            activeTab === 'LEDGER'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          سجل الحساب
        </button>
      </div>

      {/* Tab Content Panels */}
      <div ref={tabContentRef} className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm min-h-[350px] scroll-mt-20">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>آخر المعاملات والعمليات الرقمية</span>
              </h3>
              <button
                onClick={() => handleSwitchTab('LEDGER')}
                className="text-xs font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <span>مشاهدة الكل</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </div>

            {userTxs.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="w-8 h-8" />
                </div>
                <div className="font-bold text-stone-800 text-sm">لا توجد معاملات في محفظتك حتى الآن</div>
                <p className="text-stone-500 text-xs max-w-sm mx-auto">
                  قم بشحن محفظتك الآن للبدء في طلب أشهى الأطباق المنزلية أو إرسال الهدايا للأصدقاء.
                </p>
                <button
                  onClick={() => handleSwitchTab('DEPOSIT')}
                  className="mt-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  شحن المحفظة الآن
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {userTxs.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between hover:bg-stone-50/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          tx.type === 'deposit' || tx.type === 'gift_received'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tx.type === 'deposit' || tx.type === 'gift_received' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-extrabold text-stone-900 text-xs sm:text-sm">{tx.title}</div>
                        <div className="text-[10px] text-stone-400 font-bold mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString('ar-LY', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <div
                        className={`font-black text-sm dir-ltr ${
                          tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} د.ل
                      </div>
                      <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 mt-0.5">
                        مكتملة ✅
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. DEPOSIT TAB */}
        {activeTab === 'DEPOSIT' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-stone-900">إيداع وشحن رصيد DPAY</h3>
              <p className="text-xs text-stone-500">اختر قيمة الشحن عبر بوابة الدفع الإلكتروني المعتمدة في ليبيا</p>
            </div>

            {/* Quick Amount Selector */}
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt)}
                  className={`py-3 rounded-2xl border font-black text-xs transition-all cursor-pointer ${
                    depositAmount === amt
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-xs ring-2 ring-orange-500/20'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                  }`}
                >
                  {amt} د.ل
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block text-right">أو أدخل مبلغاً مخصصاً (د.ل)</label>
              <input
                type="number"
                min="10"
                max="5000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 focus:border-orange-500 text-center font-black text-lg py-3 rounded-2xl outline-none"
              />
            </div>

            <button
              onClick={() => setShowDPAYGateway(true)}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              <span>متابعة الشحن الآن ({depositAmount} د.ل)</span>
            </button>
          </div>
        )}

        {/* 3. TRANSFER P2P TAB */}
        {activeTab === 'TRANSFER' && (
          <form onSubmit={handleP2PTransfer} className="space-y-5 max-w-xl mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-stone-900">تحويل رصيد مباشر P2P</h3>
              <p className="text-xs text-stone-500">حّول رصيد فوري إلى أي مستخدم، شيف، أو صديق عبر رقم الهاتف أو معرف DPAY</p>
            </div>

            {transferSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>تم التحويل بنجاح! تم تحديث رصيد حسابك فوراً.</span>
              </div>
            )}

            {transferError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">رقم هاتف أو اسم المستلم</label>
              <input
                type="text"
                placeholder="مثال: 0912345678 أو اسم المستلم"
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-orange-500 text-xs py-3 px-4 rounded-2xl outline-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">مبلغ التحويل (د.ل)</label>
              <input
                type="number"
                min="1"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-orange-500 text-base font-black py-3 px-4 rounded-2xl outline-none dir-ltr text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">ملاحظة أو سبب التحويل (اختياري)</label>
              <input
                type="text"
                placeholder="مثال: هدية وجبة غداء 🍲"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-orange-500 text-xs py-3 px-4 rounded-2xl outline-none font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>تأكيد إرسال التحويل</span>
            </button>
          </form>
        )}

        {/* 4. CASHOUT TAB */}
        {activeTab === 'CASHOUT' && (
          <form onSubmit={handleBankCashout} className="space-y-5 max-w-xl mx-auto">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-stone-900">سحب الأرباح للحساب المصرفي</h3>
              <p className="text-xs text-stone-500">تحويل الأرباح والمبيعات مباشرة إلى حسابك المصرفي في أي بنك ليبي</p>
            </div>

            {cashoutSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>تم إرسال طلب السحب بنجاح. سيتم تحويل المبلغ لحسابك المصرفي خلال 24 ساعة.</span>
              </div>
            )}

            {cashoutError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{cashoutError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">اختر المصرف الليبي</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 text-xs py-3 px-4 rounded-2xl outline-none font-bold text-stone-800"
              >
                {LIBYAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">رقم الحساب المصرفي</label>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-xs py-3 px-4 rounded-2xl outline-none font-bold dir-ltr text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">رمز الآيبان (IBAN)</label>
                <input
                  type="text"
                  value={ibanNo}
                  onChange={(e) => setIbanNo(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-xs py-3 px-4 rounded-2xl outline-none font-bold dir-ltr text-right"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">مبلغ السحب (د.ل)</label>
              <input
                type="number"
                min="10"
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 text-base font-black py-3 px-4 rounded-2xl outline-none dir-ltr text-right"
              />
            </div>

            {/* 2FA Security Option Card */}
            <div className="bg-stone-900 text-stone-100 p-4 rounded-2xl border border-stone-800 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>التحقق الثنائي للمحفظة (2FA Security)</span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                        مُوصى به
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-medium">
                      طلب رمز أمان مؤقت مرسل لهاتفك قبل تأكيد أي سحب لضمان حماية أرباحك.
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={is2FAEnabled}
                    onChange={(e) => setIs2FAEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Building className="w-4 h-4 text-amber-400" />
              <span>{is2FAEnabled ? 'متابعة السحب المصرفي للتحقق 2FA 🔐' : 'تقديم طلب السحب المصرفي'}</span>
            </button>
          </form>
        )}

        {/* 5. LEDGER TAB */}
        {activeTab === 'LEDGER' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-stone-900 text-sm">كشف جميع الحركات المالية (Ledger)</h3>

              {/* Search & Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 text-xs pr-7 pl-3 py-1.5 rounded-xl outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-2.5" />
                </div>

                <select
                  value={ledgerFilter}
                  onChange={(e) => setLedgerFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 text-xs py-1.5 px-2 rounded-xl font-bold text-stone-700"
                >
                  <option value="all">الكل</option>
                  <option value="deposit">شحن/إيداع</option>
                  <option value="purchase">مشتريات طعام</option>
                  <option value="gift">هدايا</option>
                  <option value="withdrawal">سحوبات</option>
                </select>
              </div>
            </div>

            {filteredTxs.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs font-bold">لا توجد نتائج مطابقة للبحث</div>
            ) : (
              <div className="divide-y divide-stone-100 overflow-x-auto">
                {filteredTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 px-2 flex items-center justify-between hover:bg-stone-50 rounded-xl transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          tx.amount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {tx.type === 'deposit'
                          ? 'إيداع'
                          : tx.type === 'purchase'
                          ? 'شراء'
                          : tx.type === 'gift_sent' || tx.type === 'gift_received'
                          ? 'هدية'
                          : 'سحب'}
                      </div>
                      <div>
                        <div className="font-extrabold text-stone-900">{tx.title}</div>
                        <div className="text-[10px] text-stone-400 dir-ltr text-right">{tx.id} • {new Date(tx.created_at).toLocaleString('ar-LY')}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`font-black text-sm dir-ltr ${tx.amount > 0 ? 'text-emerald-600' : 'text-stone-900'}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} د.ل
                      </div>

                      <button
                        onClick={() => setSelectedTxForReceipt(tx)}
                        className="p-1.5 bg-stone-100 hover:bg-orange-100 text-stone-600 hover:text-orange-700 rounded-lg transition-colors cursor-pointer"
                        title="طباعة إيصال معتمد"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. QR CODE TAB */}
        {activeTab === 'QR' && (
          <div className="text-center py-6 space-y-4 max-w-sm mx-auto">
            <h3 className="font-black text-stone-900 text-base">رمز QR الخاص بحسابك</h3>
            <p className="text-xs text-stone-500">امسح الكود عبر الكاميرا لاستلام المبالغ والهدايا فوراً</p>

            <div className="bg-stone-900 p-6 rounded-3xl inline-block shadow-xl border-4 border-amber-400">
              <div className="w-48 h-48 bg-white p-3 rounded-2xl flex flex-col items-center justify-center space-y-2">
                <QrCode className="w-32 h-32 text-stone-900" />
                <div className="text-[10px] font-mono text-stone-600 font-bold dir-ltr">{userDpayAccount}</div>
              </div>
            </div>

            <div className="text-xs font-extrabold text-orange-600">سُفرة DPAY • الدفع السريع المباشر</div>
          </div>
        )}
      </div>

      {/* Gateway Modal Popup if clicked deposit */}
      {showDPAYGateway && (
        <DPAYGatewayModal
          amount={depositAmount}
          purposeTitle="شحن رصيد المحفظة عبر DPAY 💳"
          onSuccess={handleDPAYDepositSuccess}
          onClose={() => setShowDPAYGateway(false)}
        />
      )}

      {/* Printable Receipt Modal */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedTxForReceipt(null)}
              className="absolute left-4 top-4 p-1.5 text-stone-400 hover:text-stone-800 rounded-full bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 font-black text-lg">
                سُفرة
              </div>
              <h4 className="font-black text-stone-900 text-base">إيصال معاملة مالية معتمدة</h4>
              <p className="text-[10px] text-stone-400 font-mono dir-ltr">{selectedTxForReceipt.id}</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl space-y-2.5 text-xs text-stone-700 border border-stone-200/80">
              <div className="flex justify-between">
                <span className="text-stone-400">نوع المعاملة:</span>
                <span className="font-bold text-stone-900">{selectedTxForReceipt.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">التاريخ والوقت:</span>
                <span className="font-bold text-stone-900 dir-ltr">{new Date(selectedTxForReceipt.created_at).toLocaleString('ar-LY')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">المبلغ الإجمالي:</span>
                <span className="font-black text-emerald-600 text-sm dir-ltr">{selectedTxForReceipt.amount} د.ل</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">الحالة:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                  مكتملة ومؤكدة ✅
                </span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>طباعة الإيصال الرسمية</span>
            </button>
          </div>
        </div>
      )}
      {/* Gift Conversion Modal Popup */}
      {showGiftConvertModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border border-amber-200 shadow-2xl p-6 relative space-y-5">
            <button
              onClick={() => setShowGiftConvertModal(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <RefreshCw className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-lg text-stone-900">تحويل محفظة الهدايا إلى كاش 💰</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                تحويل رصيد الهدايا إلى كاش مع خصم 50% عمولة المنصة وإيداع الصافي بمحفظة DPAY
              </p>
            </div>

            {giftConvertSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-4 rounded-2xl text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-extrabold text-sm">تم التحويل بنجاح! 🎉</div>
                <div className="text-xs">أضيف الرصيد الصافي المكتسب لمحفظتك الرئيسية.</div>
              </div>
            ) : (
              <form onSubmit={handleConvertGiftWallet} className="space-y-4">
                {giftConvertError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-800 p-3 rounded-xl text-xs font-bold text-center">
                    {giftConvertError}
                  </div>
                )}

                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">رصيد الهدايا المتاح:</span>
                  <span className="font-black text-sm text-amber-800 bg-white px-2.5 py-0.5 rounded-xl border border-amber-200">
                    {(currentUser.gift_wallet_balance || 0).toFixed(1)} د.ل
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    المبلغ المراد تحويله من الهدايا (د.ل):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={currentUser.gift_wallet_balance || 0}
                    value={giftConvertAmt}
                    onChange={(e) => setGiftConvertAmt(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-sm font-extrabold text-stone-900 outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white dir-ltr text-right"
                  />
                </div>

                {/* Calculation Breakdown */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>المبلغ المحوّل:</span>
                    <span className="font-bold dir-ltr">{giftConvertAmt || 0} د.ل</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>عمولة المنصة (50%):</span>
                    <span className="font-bold dir-ltr">
                      -{((Number(giftConvertAmt) || 0) * 0.5).toFixed(1)} د.ل
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-extrabold pt-1.5 border-t border-stone-200 text-sm">
                    <span>الصافي المودع بكاشك:</span>
                    <span className="dir-ltr">
                      +{((Number(giftConvertAmt) || 0) * 0.5).toFixed(1)} د.ل
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    isConvertingGift ||
                    !giftConvertAmt ||
                    giftConvertAmt > (currentUser.gift_wallet_balance || 0)
                  }
                  className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs py-3.5 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تأكيد تحويل (+{((Number(giftConvertAmt) || 0) * 0.5).toFixed(1)} د.ل)</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2FA VERIFICATION MODAL POPUP */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-5 relative overflow-hidden">
            {/* Decorative top bar */}
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 flex items-center gap-1.5">
                    <span>تأكيد التحقق الثنائي (2FA)</span>
                    <span className="text-[10px] bg-stone-900 text-amber-400 font-extrabold px-2 py-0.5 rounded-md">
                      DPAY Safe
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    حماية إضافية لحفظ واستلام أرباحك بآمان
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShow2FAModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-right">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span>تم إرسال رمز الأمان إلى الرقم:</span>
                <span className="font-mono text-stone-900 dir-ltr">
                  {currentUser.phone ? currentUser.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '091 **** 889'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-700 bg-amber-50/80 p-2 rounded-xl border border-amber-200/60">
                <span>مبلغ السحب المطلوب:</span>
                <span className="font-mono text-sm text-stone-900 dir-ltr">{cashoutAmount} د.ل</span>
              </div>
            </div>

            {/* Quick Test Helper Badge */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-stone-800">رمز الأمان للتجربة السريعة:</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTwoFactorCode(generatedCode);
                  setTwoFactorError('');
                }}
                className="bg-stone-900 hover:bg-stone-800 text-amber-400 text-xs font-mono font-black px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                title="انقر للتعبئة تلقائياً"
              >
                <span>{generatedCode}</span>
                <Copy className="w-3 h-3 text-amber-300" />
              </button>
            </div>

            {/* Error Message */}
            {twoFactorError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{twoFactorError}</span>
              </div>
            )}

            {/* Code Input Form */}
            <form onSubmit={handleVerifyAndConfirmCashout} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-bold text-stone-700 block">أدخل الرمز المكون من 6 أرقام</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value.replace(/\D/g, ''));
                    setTwoFactorError('');
                  }}
                  className="w-full bg-stone-50 border-2 border-stone-200 focus:border-amber-500 text-center text-2xl font-mono tracking-[0.5em] py-3.5 px-4 rounded-2xl outline-none font-black text-stone-900 transition-colors"
                  autoFocus
                />
              </div>

              {/* Resend Timer / Action */}
              <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                <span>لم يصلك الرمز؟</span>
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={handleResend2FACode}
                  className={`font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    resendTimer > 0 ? 'text-stone-400 cursor-not-allowed' : 'text-amber-600 hover:text-amber-700'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendTimer > 0 ? 'animate-spin' : ''}`} />
                  {resendTimer > 0 ? `إعادة الإرسال خلال ${resendTimer}ث` : 'إعادة إرسال الكود SMS'}
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isVerifying2FA}
                className="w-full py-4 bg-gradient-to-r from-stone-900 to-amber-950 hover:from-stone-800 hover:to-amber-900 text-amber-400 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isVerifying2FA ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>جاري التحقق من أمان المحفظة...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>تأكيد السحب وإتمام العملية 🔐</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
