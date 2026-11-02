'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { DPAYGatewayModal } from './DPAYGatewayModal';
import {
  Wallet,
  X,
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
} from 'lucide-react';
import { WalletTransaction, PayoutType } from '@/lib/types';
import { LIBYAN_BANKS } from '@/lib/constants';

interface WalletModalProps {
  onClose: () => void;
}

type TabType = 'OVERVIEW' | 'DEPOSIT' | 'TRANSFER' | 'CASHOUT' | 'QR' | 'LEDGER';

export const WalletModal: React.FC<WalletModalProps> = ({ onClose }) => {
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
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [showBalance, setShowBalance] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const modalContentRef = useRef<HTMLDivElement>(null);

  const handleSwitchTab = (tab: TabType) => {
    setActiveTab(tab);
    setTimeout(() => {
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
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

    const result = await requestChefPayout(
      payoutType,
      numAmount,
      selectedBank,
      bankAccountNo,
      ibanNo
    );

    if (result.success) {
      setCashoutSuccess(true);
      setTimeout(() => setCashoutSuccess(false), 6000);
    } else {
      setCashoutError(result.error || 'فشل إجراء طلب السحب');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 dir-rtl">
      <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden border border-emerald-100 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Virtual DPAY Platinum Card Section */}
        <div className="bg-gradient-to-tr from-emerald-900 via-emerald-800 to-teal-800 text-white p-5 sm:p-6 relative overflow-hidden shrink-0 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-extrabold border border-amber-400/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-amber-300 block">المحفظة الوطنية الرقمية (DPAY)</span>
                <span className="text-[10px] text-emerald-200/80">حساب موحد موثق مع المصرف المركزي</span>
              </div>
            </div>

            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 backdrop-blur-md transition-colors"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Balance View */}
          <div className="mb-4 bg-emerald-950/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-emerald-200/90 text-xs font-semibold block">السيولة المتاحة للإنفاق:</span>
              {currentUser.role === 'chef' ? (
                <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                  🎁 هدايا مستلمة: {(currentUser.gift_wallet_balance || 0).toFixed(1)} د.ل
                </span>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-xl">
                    🎁 هدايا مشتراة: {(currentUser.gift_wallet_balance || 0).toFixed(1)} د.ل
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/30 px-2 py-0.5 rounded-xl">
                    🤝 أرباح مشاركة: {(currentUser.affiliate_balance || 0).toFixed(1)} د.ل
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-black text-3xl sm:text-4xl text-white tracking-tight">
                {showBalance ? currentUser.wallet_balance.toFixed(2) : '••••••'}
              </span>
              <span className="text-emerald-300 font-extrabold text-lg">د.ل ليبية</span>
            </div>

            {/* Account Details Row */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="truncate max-w-[240px] sm:max-w-none">
                <span className="text-emerald-200/70 text-[10px] block">رقم حساب المحفظة الموحد (DPAY Account):</span>
                <span className="font-mono text-white font-bold dir-ltr block tracking-wider">
                  {userDpayAccount}
                </span>
              </div>
              <button
                onClick={handleCopyAccount}
                className="bg-white/15 hover:bg-white/25 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-colors shrink-0"
              >
                {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAccount ? 'تم النسخ' : 'نسخ رقم الحساب'}</span>
              </button>
            </div>

            {(currentUser.role === 'chef' || currentUser.role === 'business') && (
              <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] text-amber-200/90 font-medium flex items-center gap-1.5">
                <span className="shrink-0 bg-amber-500/20 p-1 rounded-md text-amber-300">💡</span>
                <span>
                  <strong>أرباح المطبخ:</strong> تُضاف أرباح الطلبات المسلّمة تلقائياً لمبروك إلى رصيد محفظتك هنا، ويمكنك سحبها لحسابك المصرفي من تبويب &quot;سحب للمصرف&quot;.
                </span>
              </div>
            )}
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <button
              onClick={() => handleSwitchTab('DEPOSIT')}
              className={`p-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'DEPOSIT'
                  ? 'bg-amber-400 text-stone-950 shadow-md scale-105 font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="text-[11px]">شحن</span>
            </button>

            <button
              onClick={() => handleSwitchTab('TRANSFER')}
              className={`p-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'TRANSFER'
                  ? 'bg-amber-400 text-stone-950 shadow-md scale-105 font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="text-[11px]">تحويل</span>
            </button>

            <button
              onClick={() => handleSwitchTab('CASHOUT')}
              className={`p-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'CASHOUT'
                  ? 'bg-amber-400 text-stone-950 shadow-md scale-105 font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span className="text-[11px]">سحب للمصرف</span>
            </button>

            <button
              onClick={() => handleSwitchTab('QR')}
              className={`p-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === 'QR'
                  ? 'bg-amber-400 text-stone-950 shadow-md scale-105 font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="text-[11px]">كيو آر QR</span>
            </button>
          </div>
        </div>

        {/* Sub-Views Content Area */}
        <div ref={modalContentRef} className="p-5 overflow-y-auto flex-1">
          {/* TAB 1: OVERVIEW / DEFAULT LEDGER VIEW */}
          {(activeTab === 'OVERVIEW' || activeTab === 'LEDGER') && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-xs text-stone-900">سجل المعاملات والسيولة الموثقة</h3>
                </div>

                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-[10px] font-bold">
                  {['all', 'deposit', 'purchase', 'withdrawal'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setLedgerFilter(f)}
                      className={`px-2 py-1 rounded-lg transition-all ${
                        ledgerFilter === f
                          ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {f === 'all'
                        ? 'الكل'
                        : f === 'deposit'
                        ? 'شحن'
                        : f === 'purchase'
                        ? 'مشتريات'
                        : 'سحوبات/تحويل'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredTxs.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50 rounded-2xl border border-stone-100">
                    <Clock className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-stone-600">لا توجد معاملات مسجلة تطابق التصفية</p>
                  </div>
                ) : (
                  filteredTxs.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTxForReceipt(tx)}
                        className="p-3 bg-stone-50/80 hover:bg-stone-100 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 truncate max-w-[220px] sm:max-w-[280px]">
                              {tx.title}
                            </div>
                            <div className="text-[10px] text-stone-400 font-medium">
                              {new Date(tx.created_at).toLocaleString('ar-LY')} • مرجع DPAY
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <span
                            className={`font-black text-sm block ${
                              isPositive ? 'text-emerald-700' : 'text-stone-900'
                            }`}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount} د.ل
                          </span>
                          <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md font-bold">
                            معتمدة
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DEPOSIT / RECHARGE VIA DPAY */}
          {activeTab === 'DEPOSIT' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>شحن المحفظة فوراً عبر بوابة DPAY الوطنية</span>
                </h3>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  بدون عمولات إضافية
                </span>
              </div>

              {/* Amount Selector */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-2">اختر قيمة الشحن (د.ل):</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[25, 50, 100, 250].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-2.5 rounded-2xl text-xs font-black border transition-all ${
                        depositAmount === amt
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100'
                      }`}
                    >
                      {amt} د.ل
                    </button>
                  ))}
                </div>

                <label className="text-xs font-bold text-stone-700 block mb-1">أو أدخل مبلغاً مخصصاً (د.ل):</label>
                <input
                  type="number"
                  value={depositAmount ?? ''}
                  onChange={(e) => setDepositAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  min={5}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                />
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>بوابات الدفع المدعومة في ليبيا:</span>
                </div>
                <p className="text-[10px] text-emerald-800">
                  سداد (المدار) • موبي كاش (التجاري) • تداول ومعاملات • إدفعلي (التجارة والتنمية) • ون باي (ليبيانا) • مصرفي باي (الجمهورية)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDPAYGateway(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>الانتقال لبوابة DPAY لشحن ({depositAmount} د.ل)</span>
              </button>
            </div>
          )}

          {/* TAB 3: P2P MONEY TRANSFER */}
          {activeTab === 'TRANSFER' && (
            <form onSubmit={handleP2PTransfer} className="space-y-4 animate-in fade-in">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>تحويل سيولة فورية لأي حساب أو شيف على المنصة</span>
                </h3>
              </div>

              {transferError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {transferSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-2xl flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تم إتمام التحويل الفوري بنجاح وخصم المبلغ من محفظتك!</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">
                  المستلم (رقم هاتف / اسم المستخدم / الاسم):
                </label>
                <input
                  type="text"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  placeholder="مثال: 0912345678 أو الشيف فاطمة الترهوني"
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">مبلغ التحويل (د.ل):</label>
                <input
                  type="number"
                  value={transferAmount ?? ''}
                  onChange={(e) => setTransferAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  min={1}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">ملاحظة للعملية (اختياري):</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="مثال: سداد عربون طلبية غداء"
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>تأكيد التحويل الفوري</span>
              </button>
            </form>
          )}

          {/* TAB 4: CASHOUT TO BANK ACCOUNT */}
          {activeTab === 'CASHOUT' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>سحب أرباح المبيعات والهدايا لجميع المصارف الليبية 🇱🇾</span>
                </h3>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  تقديم طلب سحب الأرباح مباشرة للمشرفين ليتم تأكيدها وتحويل المبلغ لحسابك المصرفي المحلي
                </p>
              </div>

              {cashoutSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 font-bold animate-in fade-in">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black">تم إرسال طلب السحب بنجاح إلى المشرفين! 🎉</p>
                    <p className="text-[10px] font-medium text-emerald-800">
                      سيقوم الفريق الإداري بمراجعة وتأكيد تحويل المبلغ لحسابك في {selectedBank} قريباً.
                    </p>
                  </div>
                </div>
              )}

              {cashoutError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-center gap-2 font-bold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cashoutError}</span>
                </div>
              )}

              <form onSubmit={handleBankCashout} className="space-y-4">
                {/* Payout Type Selector */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1.5">اختر نوع الأرباح المراد سحبها:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutType('sales')}
                      className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                        payoutType === 'sales'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className="font-extrabold text-xs flex items-center justify-between">
                        <span>🛍️ أرباح المبيعات</span>
                        {payoutType === 'sales' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </span>
                      <span className="text-[10px] text-emerald-800 mt-1 font-bold">
                        نسبة التطبيق: {commissionSettings.sales_commission_percent}%
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayoutType('gifts')}
                      className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                        payoutType === 'gifts'
                          ? 'border-purple-600 bg-purple-50/70 text-purple-950 shadow-xs ring-2 ring-purple-500/20'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className="font-extrabold text-xs flex items-center justify-between">
                        <span>🎁 أرباح الهدايا</span>
                        {payoutType === 'gifts' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                      </span>
                      <span className="text-[10px] text-purple-800 mt-1 font-bold">
                        نسبة التطبيق: {commissionSettings.gifts_commission_percent}%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">المبلغ المراد سحبه (د.ل):</label>
                  <input
                    type="number"
                    value={cashoutAmount ?? ''}
                    onChange={(e) => setCashoutAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    min={1}
                    max={currentUser.wallet_balance}
                    placeholder="مثال: 100"
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                  />
                </div>

                {/* Live Commission Breakdown Calculator */}
                {Number(cashoutAmount) > 0 && (
                  <div className="bg-stone-900 text-stone-100 rounded-2xl p-3.5 text-xs space-y-1.5 shadow-md border border-stone-800">
                    <div className="flex justify-between items-center text-stone-300">
                      <span>إجمالي المبلغ المطلوب:</span>
                      <span className="font-mono font-bold text-white">{Number(cashoutAmount).toFixed(2)} د.ل</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-400">
                      <span>
                        عمولة التطبيق ({payoutType === 'sales' ? commissionSettings.sales_commission_percent : commissionSettings.gifts_commission_percent}%):
                      </span>
                      <span className="font-mono font-bold">
                        -(
                        {(
                          (Number(cashoutAmount) *
                            (payoutType === 'sales'
                              ? commissionSettings.sales_commission_percent
                              : commissionSettings.gifts_commission_percent)) /
                          100
                        ).toFixed(2)}{' '}
                        د.ل)
                      </span>
                    </div>
                    <div className="border-t border-stone-800 pt-1.5 flex justify-between items-center font-extrabold text-emerald-400 text-sm">
                      <span>الصافي المحول لحسابك المصرفي:</span>
                      <span className="font-mono text-base font-black">
                        {(
                          Number(cashoutAmount) -
                          (Number(cashoutAmount) *
                            (payoutType === 'sales'
                              ? commissionSettings.sales_commission_percent
                              : commissionSettings.gifts_commission_percent)) /
                            100
                        ).toFixed(2)}{' '}
                        د.ل
                      </span>
                    </div>
                  </div>
                )}

                {/* Bank Selection */}
                <div>
                  <label className="text-xs font-bold text-stone-800 block mb-1">اختر المصرف المحلي:</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none focus:bg-white"
                  >
                    {LIBYAN_BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bank Account Number & IBAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">رقم الحساب المصرفي:</label>
                    <input
                      type="text"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      placeholder="مثال: 0184920192"
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-mono font-bold outline-none dir-ltr text-right focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">رقم الآيبان (IBAN):</label>
                    <input
                      type="text"
                      value={ibanNo}
                      onChange={(e) => setIbanNo(e.target.value)}
                      placeholder="LY..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-mono font-bold outline-none dir-ltr text-right focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Building className="w-4 h-4 text-white" />
                  <span>إرسال طلب السحب إلى المشرفين</span>
                </button>
              </form>

              {/* Chef's Previous Payout Requests List */}
              <div className="pt-3 border-t border-stone-100">
                <h4 className="font-extrabold text-xs text-stone-800 mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>سجل طلبات السحب الخاصة بك:</span>
                </h4>

                {payoutRequests.filter((p) => p.chef_id === currentUser.id).length === 0 ? (
                  <p className="text-[11px] text-stone-400 text-center py-3 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    لا توجد طلبات سحب سابقة بحسابك بعد.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {payoutRequests
                      .filter((p) => p.chef_id === currentUser.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-stone-900">
                              <span>{p.payout_type === 'sales' ? '🛍️ أرباح مبيعات' : '🎁 أرباح هدايا'}</span>
                              <span className="text-[10px] text-stone-400 font-normal">({p.bank_name})</span>
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5">
                              مبلغ: <span className="font-bold text-stone-800">{p.gross_amount} د.ل</span> | صافي: {' '}
                              <span className="font-bold text-emerald-700">{p.net_amount.toFixed(2)} د.ل</span>
                            </div>
                          </div>

                          <div>
                            {p.status === 'pending' && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                                ⏳ قيد المراجعة
                              </span>
                            )}
                            {p.status === 'completed' && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                                 تم السحب
                              </span>
                            )}
                            {p.status === 'rejected' && (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300">
                                ❌ مرفوض
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: QR SCANNER & PERSONAL QR */}
          {activeTab === 'QR' && (
            <div className="space-y-4 animate-in fade-in text-center">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="font-extrabold text-xs text-stone-900">رمز الدفع السريع (QR Code) الخاص بحسابك</h3>
                <p className="text-[10px] text-stone-400">اعرض هذا الرمز للشيف أو الطرف الآخر للدفع الفوري المباشر</p>
              </div>

              <div className="p-6 bg-stone-50 rounded-3xl border-2 border-dashed border-emerald-300 inline-block mx-auto relative">
                <div className="w-48 h-48 bg-white p-3 rounded-2xl border border-stone-200 shadow-md flex items-center justify-center mx-auto">
                  {/* Generated QR visual */}
                  <div className="grid grid-cols-6 gap-1.5 w-full h-full p-2 bg-stone-900 rounded-xl">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${
                          i % 2 === 0 || i % 5 === 0 ? 'bg-amber-400' : 'bg-white'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 font-extrabold text-xs text-stone-800">{currentUser.full_name}</div>
                <div className="text-[10px] text-stone-500 font-mono dir-ltr">{userDpayAccount}</div>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3 text-xs text-emerald-900 font-bold">
                يمكن استلام وتفعيل الدفع المباشر عبر الكاميرا عند التسليم من المندوب أو بالمطابخ.
              </div>
            </div>
          )}
        </div>

        {/* DPAY Gateway Modal Trigger */}
        {showDPAYGateway && (
          <DPAYGatewayModal
            amount={depositAmount}
            purposeTitle={`شحن المحفظة الرقمية لـ ${currentUser.full_name}`}
            onSuccess={handleDPAYDepositSuccess}
            onClose={() => setShowDPAYGateway(false)}
          />
        )}

        {/* Printable Transaction Receipt Modal */}
        {selectedTxForReceipt && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border border-emerald-200 shadow-2xl p-6 relative text-right">
              <button
                onClick={() => setSelectedTxForReceipt(null)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-4 border-b border-stone-100 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 font-black shadow-md">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-base text-stone-900">إيصال معاملة مالية معتمد</h3>
                <p className="text-[10px] text-stone-400">بوابة الدفع الإلكتروني الوطنية DPAY 🇱🇾</p>
              </div>

              <div className="space-y-2.5 text-xs text-stone-700 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-400">عنوان العملية:</span>
                  <strong className="text-stone-900 font-bold">{selectedTxForReceipt.title}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">رقم المعاملة:</span>
                  <strong className="font-mono text-stone-900 font-bold dir-ltr">{selectedTxForReceipt.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">المبلغ:</span>
                  <strong
                    className={`font-black text-sm ${
                      selectedTxForReceipt.amount > 0 ? 'text-emerald-700' : 'text-stone-900'
                    }`}
                  >
                    {selectedTxForReceipt.amount} د.ل
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">الحالة:</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    مكتملة وموثقة
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">التاريخ:</span>
                  <strong className="text-stone-800 font-bold">
                    {new Date(selectedTxForReceipt.created_at).toLocaleString('ar-LY')}
                  </strong>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-stone-600" />
                  <span>طباعة الإيصال</span>
                </button>
                <button
                  onClick={() => setSelectedTxForReceipt(null)}
                  className="flex-1 bg-emerald-600 text-white font-bold text-xs py-3 rounded-2xl"
                >
                  تم
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
