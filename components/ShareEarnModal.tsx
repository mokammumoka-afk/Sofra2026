'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Post } from '@/lib/types';
import { useStore } from '@/lib/store';
import {
  Share2,
  Copy,
  Check,
  X,
  Gift,
  Wallet,
  Sparkles,
  DollarSign,
  Send,
  MessageCircle,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface ShareEarnModalProps {
  post: Post | null;
  onClose: () => void;
  onOpenWallet?: () => void;
}

export const ShareEarnModal: React.FC<ShareEarnModalProps> = ({
  post,
  onClose,
  onOpenWallet,
}) => {
  const { currentUser, placeOrder, users } = useStore();
  const [copied, setCopied] = useState(false);
  const [simulatingOrder, setSimulatingOrder] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState<string | null>(null);

  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => 'https://sofra.ly'
  );

  if (!post) return null;

  const commissionPercent = post.affiliate_commission_percent || 5;
  const itemPrice = post.price || 0;
  const estimatedEarnPerUnit = (itemPrice * commissionPercent) / 100;

  // Generate unique referral link for current logged-in user
  const referralUrl = `${origin}/?post=${post.id}&ref=${currentUser.id}`;
  const shareText = `🍲 ذوّق طعم الأصالة واللذة الليبية! تجد طبق "${post.title}" الطازج من الشيف ${post.chef_name} على منصة سفرة. اطلبه الآن عبر هذا الرابط: ${referralUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleFacebookShare = () => {
    const encodedUrl = encodeURIComponent(referralUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
  };

  const handleTelegramShare = () => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(referralUrl);
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
  };

  // Test Simulation: simulate another customer purchasing using this user's link
  const handleSimulatePurchasedLink = async () => {
    setSimulatingOrder(true);
    setSimulatedSuccess(null);

    // Pick a test customer (e.g. user-customer-1 or user-chef-2) who is not current user
    const buyerCandidate = users.find((u) => u.id !== currentUser.id && u.id !== post.chef_id);
    if (!buyerCandidate) {
      setSimulatingOrder(false);
      return;
    }

    // Ensure simulated order respects the 50 LYD minimum order amount
    const simulatedQty = Math.max(1, Math.ceil(50 / (post.price || 50)));
    const totalEarned = estimatedEarnPerUnit * simulatedQty;

    // Call placeOrder simulating buyer placing an order with currentUser as affiliate
    const res = await placeOrder(
      post,
      simulatedQty,
      `${buyerCandidate.city} - حي النزهة`,
      'talabk',
      'mobicash',
      'طلب تجريبي عبر رابط مشاركة المستخدِم',
      currentUser.id // affiliate user ID
    );

    setSimulatingOrder(false);
    if (res.success) {
      setSimulatedSuccess(
        `🎉 تم محاكاة شراء الطلب بنجاح (الكمية: ${simulatedQty})! كسبت ${totalEarned.toFixed(1)} د.ل عمولة تمت إضافتها فوراً لمحفظتك DPAY!`
      );
    } else if (res.error) {
      setSimulatedSuccess(`تعذر إتمام المحاكاة: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden border border-amber-200 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="text-center space-y-2 pb-4 border-b border-stone-100">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 text-2xl">
            🎁
          </div>
          <span className="inline-block bg-amber-100 text-amber-900 text-[10px] font-black px-3 py-0.5 rounded-full border border-amber-300">
            برنامج التسويق بالعمولة 🔗
          </span>
          <h2 className="text-lg font-black text-stone-900">شارك هذا الطبق واكسب أرباحاً 💰</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            انشر رابط الطبق على حساباتك، وأي شخص يشتري عبر رابطك سيكسبك عمولة فورية بحسابك!
          </p>
        </div>

        {/* Dish Info Card */}
        <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/60 rounded-2xl border border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={post.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover border border-amber-300/60 shrink-0" />
            <div>
              <h3 className="font-extrabold text-xs text-stone-900">{post.title}</h3>
              <p className="text-[10px] text-stone-500">الشيف {post.chef_name} • {itemPrice} د.ل</p>
            </div>
          </div>

          <div className="text-left shrink-0">
            <span className="text-[10px] text-stone-500 block font-bold">ربحك عن كل طلب:</span>
            <span className="text-sm font-black text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
              +{estimatedEarnPerUnit.toFixed(1)} د.ل
            </span>
          </div>
        </div>

        {/* Commission Percentage Details */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
            <span className="text-[10px] font-bold text-stone-500 block">نسبة العمولة المحددة:</span>
            <span className="text-base font-black text-amber-600">{commissionPercent}% من القيمة</span>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
            <span className="text-[10px] font-bold text-stone-500 block">مكان إيداع الأرباح:</span>
            <span className="text-xs font-black text-emerald-700 flex items-center justify-center gap-1 mt-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>محفظة DPAY مباشرة</span>
            </span>
          </div>
        </div>

        {/* Link Copy Field */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-extrabold text-stone-800 block">
            رابط التسويق الشخصي الخاص بك:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="flex-1 bg-stone-100 border border-stone-200 rounded-2xl px-3 py-2.5 text-xs text-stone-700 font-mono outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all shrink-0 flex items-center gap-1.5 shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-extrabold text-stone-800 block">
            مشاركة سريعة عبر التواصل الاجتماعي:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>واتساب</span>
            </button>

            <button
              onClick={handleFacebookShare}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>فيسبوك</span>
            </button>

            <button
              onClick={handleTelegramShare}
              className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>تليجرام</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Box for testing */}
        <div className="mt-5 pt-4 border-t border-stone-100 space-y-2">
          <div className="bg-amber-500/10 border border-amber-300 p-3.5 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <h4 className="font-extrabold text-xs text-amber-950">
                اختبر تجربة الربح الفوري (وضع المحاكاة)
              </h4>
            </div>
            <p className="text-[11px] text-stone-600 mb-3 leading-relaxed">
              اضغط على الزر أدناه لمحاكاة قيام أحد الزبائن بشراء هذا الطبق باستخدام رابط مشاركتك لرؤية الأرباح تُضاف لمحفظتك مباشرة!
            </p>

            <button
              onClick={handleSimulatePurchasedLink}
              disabled={simulatingOrder}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Flame className="w-4 h-4 fill-stone-950" />
              <span>
                {simulatingOrder ? 'جاري تنفيذ محاكاة الشراء...' : 'تجربة شراء صديق عبر رابطك الآن 🧪'}
              </span>
            </button>

            {simulatedSuccess && (
              <div className="mt-2.5 p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold animate-in fade-in">
                {simulatedSuccess}
              </div>
            )}
          </div>
        </div>

        {/* Action to go to wallet */}
        {onOpenWallet && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                onClose();
                onOpenWallet();
              }}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4"
            >
              عرض رصيدك والأرباح في المحفظة 💳
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
