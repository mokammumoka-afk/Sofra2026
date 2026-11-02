'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/lib/store';
import { LIBYAN_CITIES, CITY_SUBURBS_MAP } from '@/lib/constants';
import { Post, Order } from '@/lib/types';
import {
  User,
  Settings,
  MapPin,
  Bell,
  Wallet,
  CheckCircle2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Heart,
  ChefHat,
  ShoppingBag,
  Gift,
  Award,
  Sparkles,
  Phone,
  Clock,
  Truck,
  CreditCard,
  Edit3,
  HelpCircle,
  Copy,
  ChevronLeft,
  X,
  XCircle,
  Star,
  Trash2,
  Check,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  Download,
  Smartphone,
  Share2,
  ExternalLink,
  Eye,
  TrendingUp,
  BarChart3,
  Zap,
  MessageCircle,
  Upload,
  Play,
  Pause,
  Target,
  Megaphone,
  Save,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenDetail?: (post: Post) => void;
  onOpenOrder?: (post: Post) => void;
  onOpenGift?: (post: Post) => void;
  onOpenPromote?: (post: Post | null) => void;
  onOpenCreatePost?: () => void;
  onEditPost?: (post: Post) => void;
  openWalletModal?: () => void;
  setActiveTab?: (tab: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenDetail,
  onOpenOrder,
  onOpenGift,
  onOpenPromote,
  onOpenCreatePost,
  onEditPost,
  openWalletModal,
  setActiveTab,
}) => {
  const {
    currentUser,
    users,
    userCity,
    setUserCity,
    logoutUser,
    posts,
    userLikes,
    followedChefs,
    toggleFollowChef,
    orders,
    gifts,
    chefProfiles,
    sponsoredPosts,
    promotePost,
    applyChefVerification,
    switchRole,
    toggleUserVerificationAdmin,
    updateUserProfile,
    deletePost,
    updateOrderStatus,
    confirmOrderDeliveryAndReleaseEscrow,
  } = useStore();

  const isChefUser = currentUser.role === 'chef' || currentUser.role === 'business';

  // Customer Profile Sub Tabs
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [customerSubTab, setCustomerSubTab] = useState<
    'overview' | 'liked_dishes' | 'followed_chefs' | 'addresses' | 'settings'
  >('overview');

  // Chef Studio Sub Tabs
  const [chefSubTab, setChefSubTab] = useState<
    'dishes' | 'ads_center' | 'verification' | 'analytics' | 'kitchen_settings'
  >('dishes');

  const subTabNavRef = useRef<HTMLDivElement>(null);
  const isInitialSubtabMount = useRef(true);

  // Smoothly scroll down to subtab section whenever subtabs change
  useEffect(() => {
    if (isInitialSubtabMount.current) {
      isInitialSubtabMount.current = false;
      return;
    }
    if (subTabNavRef.current) {
      subTabNavRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [customerSubTab, chefSubTab]);

  // Customer Form State
  const [prevUserId, setPrevUserId] = useState(currentUser?.id);
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [district, setDistrict] = useState(currentUser?.district || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar_url);
  const [bio, setBio] = useState(currentUser?.bio || '');

  // Chef Studio Profile Info
  const currentChefProfile = chefProfiles[currentUser.id] || {
    kitchen_name: currentUser.full_name,
    cover_image_url:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
    rating_avg: 0,
    rating_count: 0,
    total_sales: 0,
    verification_status: currentUser.is_verified ? 'approved' : 'none',
  };

  const [kitchenName, setKitchenName] = useState(
    currentChefProfile.kitchen_name || currentUser.full_name
  );
  const [kitchenBio, setKitchenBio] = useState(currentUser.bio || '');
  const [workingHours, setWorkingHours] = useState('10:00 AM - 11:00 PM');
  const [whatsappPhone, setWhatsappPhone] = useState(currentUser.phone || '');
  const [deliveryRadius, setDeliveryRadius] = useState('كل مناطق المدينة');
  const [healthCertDoc, setHealthCertDoc] = useState('');

  // Adjust state during render when currentUser changes
  if (prevUserId !== currentUser?.id) {
    setPrevUserId(currentUser?.id);
    setFullName(currentUser?.full_name || '');
    setPhone(currentUser?.phone || '');
    setDistrict(currentUser?.district || '');
    setSelectedAvatar(currentUser?.avatar_url);
    setBio(currentUser?.bio || '');
    const chefProfile = chefProfiles[currentUser.id];
    if (chefProfile?.kitchen_name) {
      setKitchenName(chefProfile.kitchen_name);
    }
    setKitchenBio(chefProfile?.bio || currentUser.bio || '');
    setWhatsappPhone(currentUser?.phone || '');
  }

  // New Ad Campaign Creation Modal State inside Chef Ads Center
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [selectedAdDishId, setSelectedAdDishId] = useState<string>('');
  const [adTargetCity, setAdTargetCity] = useState<string>(userCity);
  const [adBudget, setAdBudget] = useState<number>(25);
  const [adDays, setAdDays] = useState<number>(7);

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<
    Array<{ id: string; city: string; district: string; street: string; isDefault: boolean }>
  >([]);
  const [showAddAddrModal, setShowAddAddrModal] = useState(false);
  const [newAddrDistrict, setNewAddrDistrict] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrCity, setNewAddrCity] = useState(userCity);

  // Confirm Delivery & Release Escrow Modal State
  const [confirmDeliveryOrder, setConfirmDeliveryOrder] = useState<Order | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered lists
  const likedPostsList = useMemo(() => {
    return posts.filter((p) => userLikes[p.id]);
  }, [posts, userLikes]);

  const followedChefsList = useMemo(() => {
    return users.filter((u) => (u.role === 'chef' || u.role === 'business') && followedChefs[u.id]);
  }, [users, followedChefs]);

  const myOrders = useMemo(() => {
    return orders.filter((o) => o.customer_id === currentUser.id);
  }, [orders, currentUser.id]);

  // Chef's own posts
  const myChefPosts = useMemo(() => {
    return posts.filter(
      (p) => p.chef_id === currentUser.id || p.chef_name.includes(currentUser.full_name)
    );
  }, [posts, currentUser.id, currentUser.full_name]);

  // Chef's received orders
  const myChefReceivedOrders = useMemo(() => {
    return orders.filter(
      (o) => o.chef_id === currentUser.id || o.chef_name.includes(currentUser.full_name)
    );
  }, [orders, currentUser.id, currentUser.full_name]);

  // Chef's active sponsored campaigns
  const mySponsoredCampaigns = useMemo(() => {
    return sponsoredPosts.filter((sp) => sp.business_id === currentUser.id);
  }, [sponsoredPosts, currentUser.id]);

  const totalSpent = useMemo(() => {
    return myOrders.reduce((acc, o) => acc + (o.total_price || 0), 0);
  }, [myOrders]);

  // Delivered orders count
  const deliveredOrdersCount = useMemo(() => {
    const deliveredCount = myChefReceivedOrders.filter((o) => o.status === 'delivered').length;
    return Math.max(deliveredCount, currentChefProfile.total_sales || 0);
  }, [myChefReceivedOrders, currentChefProfile.total_sales]);

  // Total Revenue from non-cancelled received orders
  const totalChefRevenue = useMemo(() => {
    return myChefReceivedOrders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'rejected')
      .reduce((acc, o) => acc + (o.total_price || 0), 0);
  }, [myChefReceivedOrders]);

  // Delivered revenue (already credited to wallet)
  const deliveredRevenue = useMemo(() => {
    return myChefReceivedOrders
      .filter((o) => o.status === 'delivered')
      .reduce((acc, o) => acc + (o.total_price || 0), 0);
  }, [myChefReceivedOrders]);

  // Pending Escrow revenue (awaiting delivery)
  const pendingEscrowRevenue = useMemo(() => {
    return myChefReceivedOrders
      .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'rejected')
      .reduce((acc, o) => acc + (o.total_price || 0), 0);
  }, [myChefReceivedOrders]);

  const handleSaveCustomerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      full_name: fullName,
      phone: phone,
      city: userCity,
      district: district,
      bio: bio,
      avatar_url: selectedAvatar,
    });
    triggerToast('تم تحديث بيانات ملفك الشخصي وحفظها بنجاح! 🌟');
  };

  const handleSaveKitchenSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      full_name: fullName,
      kitchen_name: kitchenName,
      kitchen_bio: kitchenBio,
      phone: whatsappPhone,
    });
    triggerToast('تم حفظ وتحديث إعدادات المطبخ وساعات العمل بنجاح! 👨‍🍳');
  };

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrDistrict.trim() || !newAddrStreet.trim()) return;

    const newAddr = {
      id: `addr-${Date.now()}`,
      city: newAddrCity,
      district: newAddrDistrict.trim(),
      street: newAddrStreet.trim(),
      isDefault: savedAddresses.length === 0,
    };

    setSavedAddresses([...savedAddresses, newAddr]);
    setShowAddAddrModal(false);
    setNewAddrDistrict('');
    setNewAddrStreet('');
    triggerToast('تمت إضافة عنوان التوصيل الجديد بنجاح 📍');
  };

  const handleSetDefaultAddress = (id: string) => {
    setSavedAddresses(
      savedAddresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    triggerToast('تم تعيين العنوان الافتراضي للتوصيل 📍');
  };

  const handleDeleteAddress = (id: string) => {
    setSavedAddresses(savedAddresses.filter((a) => a.id !== id));
    triggerToast('تم حذف العنوان من القائمة');
  };

  const handleApplyVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyChefVerification(kitchenName, kitchenBio, healthCertDoc);
    triggerToast('تم إرسال مستندات التوثيق بنجاح! سيتم المراجعة ومنح العلامة الزرقاء 💙');
  };

  const handleToggleVerifiedDemo = () => {
    toggleUserVerificationAdmin(currentUser.id);
    if (!currentUser.is_verified) {
      triggerToast('تم منح حسابك العلامة الزرقاء 💙 الموثقة بنجاح!');
    } else {
      triggerToast('تم إلغاء التوثيق بالعلامة الزرقاء.');
    }
  };

  // Launch New Ad Campaign Logic
  const handleLaunchNewAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPost = posts.find((p) => p.id === selectedAdDishId) || myChefPosts[0];
    if (!chosenPost) {
      triggerToast('يرجى اختيار طبق إعلاني أولاً!');
      return;
    }

    if (currentUser.wallet_balance < adBudget) {
      triggerToast('رصيدك في محفظة DPAY غير كافٍ. يرجى شحن المحفظة أولاً 💳');
      if (openWalletModal) openWalletModal();
      return;
    }

    const success = await promotePost(
      chosenPost.id,
      adBudget,
      [adTargetCity],
      new Date().toISOString(),
      new Date(Date.now() + adDays * 86400000).toISOString()
    );

    if (success) {
      setShowCreateAdModal(false);
      triggerToast(`تم إطلاق الحملة الإعلانية بنجاح للطبق "${chosenPost.title}"! 🚀🔥`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 backdrop-blur-md flex items-center gap-2.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* A. IF USER IS A CHEF (استوديو الشيف والمطبخ الاحترافي)                     */}
      {/* ========================================================================= */}
      {isChefUser ? (
        <div className="space-y-6">
          {/* Main Chef Header Banner (Auto Height, Clean Grid Layout, No Overlaps) */}
          <div className="bg-stone-950 rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl text-white relative p-5 sm:p-6 space-y-6">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

            {/* Top Bar: Clean badges header */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-md">
                  <ChefHat className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>استوديو الشيف والمركز الإعلاني 🇱🇾</span>
                </span>

                {currentUser.is_verified && (
                  <span className="bg-blue-600/90 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl border border-blue-400/50 flex items-center gap-1.5 shadow-md">
                    <CheckCircle2 className="w-4 h-4 text-white fill-blue-500 shrink-0" />
                    <span>حساب موثق بالعلامة الزرقاء 💙</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-stone-400 font-bold">
                المدينة: <span className="text-amber-400 font-extrabold">{userCity}</span>
              </div>
            </div>

            {/* Chef Profile Header & Kitchen Info */}
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                {/* Avatar Container with Verification Badge Overlay */}
                <div className="relative shrink-0">
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-amber-500/50 shadow-md bg-stone-800"
                  />
                  {currentUser.is_verified && (
                    <div
                      className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-lg ring-2 ring-stone-950"
                      title="حساب شيف موثق بالعلامة الزرقاء 💙"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white fill-blue-500" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-black text-white">
                      مطبخ ({currentChefProfile.kitchen_name})
                    </h1>
                    {currentUser.is_verified && (
                      <span title="علامة التوثيق الرسمية">
                        <CheckCircle2 className="w-5 h-5 text-blue-400 fill-blue-600 shrink-0" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-300 font-medium">
                    إدارة: الشيف <span className="font-bold text-white">{currentUser.full_name}</span>
                  </p>
                  <p className="text-xs text-stone-400 max-w-md line-clamp-1">
                    {kitchenBio}
                  </p>
                </div>
              </div>

              {/* Financial Box */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                <button
                  onClick={openWalletModal}
                  className="flex-1 sm:flex-initial bg-stone-900/90 hover:bg-stone-800 p-3 rounded-2xl border border-stone-800 hover:border-amber-500/50 text-center sm:text-right min-w-[140px] transition-all cursor-pointer group"
                  title="فتح المحفظة"
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] text-stone-400 font-bold block">أرباح المطبخ:</span>
                    <span className="text-[9px] text-amber-400 font-black bg-amber-950/80 border border-amber-500/30 px-1.5 py-0.5 rounded-md group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                      المحفظة 🏦
                    </span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-amber-400">{totalChefRevenue} د.ل</span>
                </button>

                <button
                  onClick={openWalletModal}
                  className="flex-1 sm:flex-initial bg-stone-900 hover:bg-stone-800 text-amber-400 p-3 rounded-2xl border border-amber-500/30 text-center sm:text-right flex items-center justify-center sm:justify-start gap-2 text-xs font-bold transition-all min-w-[130px]"
                >
                  <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block">محفظتي:</span>
                    <span className="text-xs font-extrabold text-white">{currentUser.wallet_balance} د.ل</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick KPI Metrics Grid */}
            <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-bold">الطلبات المسلمة</span>
                <span className="font-black text-sm sm:text-base text-white">+{deliveredOrdersCount}</span>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-bold">تقييم المطبخ</span>
                <span className="font-black text-sm sm:text-base text-amber-400 flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {currentChefProfile.rating_count > 0 ? currentChefProfile.rating_avg.toFixed(1) : 'جديد'}
                </span>
              </div>
              <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block font-bold">أطباق منشورة</span>
                <span className="font-black text-sm sm:text-base text-white">{myChefPosts.length}</span>
              </div>
            </div>

            {/* Chef Action Buttons Grid Bar (أزرار مرنّقة أسفل الجريد) */}
            <div className="relative z-10 border-t border-stone-800/80 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {onOpenCreatePost && (
                <button
                  onClick={onOpenCreatePost}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs py-3 px-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>نشر طبق جديد</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (onOpenPromote) {
                    onOpenPromote(myChefPosts[0] || null);
                  } else if (setActiveTab) {
                    setActiveTab('promote');
                  }
                }}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs py-3 px-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Flame className="w-4 h-4 text-amber-200 shrink-0" />
                <span>ترويج إعلاني 🔥</span>
              </button>

              {setActiveTab && (
                <button
                  onClick={() => setActiveTab('chefs')}
                  className="bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 font-extrabold text-xs py-3 px-3 rounded-2xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>معاينة الملف</span>
                </button>
              )}

              {!currentUser.is_verified ? (
                <button
                  onClick={() => setChefSubTab('verification')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-3 px-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>طلب التوثيق 💙</span>
                </button>
              ) : (
                <button
                  onClick={() => setChefSubTab('verification')}
                  className="bg-blue-950 text-blue-300 border border-blue-600/40 font-extrabold text-xs py-3 px-3 rounded-2xl transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>حساب موثق 💙</span>
                </button>
              )}
            </div>
          </div>

          {/* Chef Studio Sub Tabs Header */}
          <div ref={subTabNavRef} className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setChefSubTab('dishes')}
              className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                chefSubTab === 'dishes'
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-orange-600" />
              <span>قائمة أطباقي ({myChefPosts.length})</span>
            </button>

            <button
              onClick={() => setChefSubTab('ads_center')}
              className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                chefSubTab === 'ads_center'
                  ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-xl'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Megaphone className="w-4 h-4 text-amber-500" />
              <span>مركز الإعلانات الممولة ({mySponsoredCampaigns.length})</span>
              <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                جديد 🔥
              </span>
            </button>

            <button
              onClick={() => setChefSubTab('verification')}
              className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                chefSubTab === 'verification'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>التوثيق بالعلامة الزرقاء 💙</span>
            </button>

            <button
              onClick={() => setChefSubTab('analytics')}
              className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                chefSubTab === 'analytics'
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <span>إحصائيات المطبخ والمبيعات</span>
            </button>

            <button
              onClick={() => setChefSubTab('kitchen_settings')}
              className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                chefSubTab === 'kitchen_settings'
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>إعدادات المطبخ والتوصيل</span>
            </button>
          </div>

          {/* ==================== Chef Studio Tab Content ==================== */}

          {/* 1. Menu & Dishes Tab */}
          {chefSubTab === 'dishes' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                    <ShoppingBag className="w-4.5 h-4.5 text-orange-600" />
                    <span>إدارة منيو ومأكولات مطبخك</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    قم بفرز أطباقك المنشورة، ترويجها إعلانياً لزيادة مبيعاتك، أو إضافة أطباق جديدة.
                  </p>
                </div>

                {onOpenCreatePost && (
                  <button
                    onClick={onOpenCreatePost}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة طبق جديد</span>
                  </button>
                )}
              </div>

              {myChefPosts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-stone-200 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                  <h4 className="font-bold text-sm text-stone-800">لم تقم بنشر أي أطباق حتى الآن</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    اضغط على زر نشر طبق جديد لتضيف أول وصفة من مطبخك واستقبال طلبات الزبائن مباشرة!
                  </p>
                  {onOpenCreatePost && (
                    <button
                      onClick={onOpenCreatePost}
                      className="bg-stone-900 text-amber-400 font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-md"
                    >
                      نشر طبق الآن 🍲
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myChefPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-3xl overflow-hidden border border-orange-100 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="relative h-44 bg-stone-900 overflow-hidden">
                          <img
                            src={post.images[0]}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3 bg-stone-950/80 backdrop-blur-md text-white text-xs font-black px-3 py-1 rounded-xl">
                            {post.price ? `${post.price} د.ل` : 'غير مخصص للبيع'}
                          </div>

                          <div className="absolute top-3 left-3 flex items-center gap-1">
                            {onEditPost && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditPost(post);
                                }}
                                className="bg-white/90 hover:bg-white text-stone-800 p-2 rounded-xl shadow-md transition-all border border-stone-200 hover:text-orange-600"
                                title="تعديل هذا الطبق"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (deletingPostId !== post.id) {
                                  setDeletingPostId(post.id);
                                  setTimeout(() => setDeletingPostId(null), 3500);
                                  return;
                                }
                                const ok = deletePost(post.id);
                                if (ok) {
                                  setDeletingPostId(null);
                                }
                              }}
                              className={
                                deletingPostId === post.id
                                  ? "bg-rose-600 text-white px-2 py-1 rounded-xl shadow-md transition-all border border-rose-700 flex items-center gap-1 text-[10px] font-bold animate-pulse"
                                  : "bg-white/90 hover:bg-white text-stone-800 p-2 rounded-xl shadow-md transition-all border border-stone-200 hover:text-rose-600"
                              }
                              title={deletingPostId === post.id ? "انقر مجدداً لتأكيد الحذف" : "حذف هذا الطبق"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {deletingPostId === post.id && <span>تأكيد؟</span>}
                            </button>
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4 className="font-black text-sm text-stone-900 group-hover:text-orange-600 transition-colors">
                            {post.title}
                          </h4>
                          <p className="text-xs text-stone-600 line-clamp-2">{post.description}</p>
                          <div className="text-[11px] text-stone-400 font-bold flex items-center justify-between pt-2 border-t border-stone-100">
                            <span>المدينة: {post.city}</span>
                            <span>❤️ {post.likes_count} إعجاب</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 flex gap-2">
                        <button
                          onClick={() => {
                            if (onOpenPromote) {
                              onOpenPromote(post);
                            } else if (setActiveTab) {
                              setActiveTab('promote');
                            }
                          }}
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs py-2.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Flame className="w-4 h-4 text-amber-200" />
                          <span>ترويج بإعلان ممول 🔥</span>
                        </button>

                        {onOpenDetail && (
                          <button
                            onClick={() => onOpenDetail(post)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3 py-2.5 rounded-2xl border border-stone-200"
                          >
                            عرض
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Promoted Ads Center Tab (صفحة الإعلانات الممولة الاحترافية) */}
          {chefSubTab === 'ads_center' && (
            <div className="space-y-6">
              {/* Promoted Ads Header Banner */}
              <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950 rounded-3xl p-6 text-white border border-amber-500/30 shadow-xl space-y-4 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1">
                    <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>مركز الحملات الإعلانية الممولة 🚀</span>
                    </span>
                    <h2 className="text-xl font-black text-white">ضاعف مبيعات مطبخك وضاعف طلبياتك 5 أضعاف</h2>
                    <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
                      اعرض أطباقك المميزة في أعلى نتائج البحث وفي قسم الإكسبلور الممول. استهدف الزبائن في مدينتك وادفع بكل سهولة عبر محفظة DPAY.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (onOpenPromote) {
                        onOpenPromote(null);
                      } else if (setActiveTab) {
                        setActiveTab('promote');
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء حملة إعلانية جديدة 🔥</span>
                  </button>
                </div>

                {/* Ads Center Live Dashboard Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-800 relative z-10">
                  <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 text-right">
                    <span className="text-[10px] text-stone-400 font-bold block">إجمالي مرات الظهور:</span>
                    <span className="text-xl font-black text-amber-400 flex items-center gap-1">
                      <Eye className="w-4 h-4 text-amber-400" />
                      4,850
                    </span>
                  </div>

                  <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 text-right">
                    <span className="text-[10px] text-stone-400 font-bold block">النقارات المحققة:</span>
                    <span className="text-xl font-black text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      612
                    </span>
                  </div>

                  <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 text-right">
                    <span className="text-[10px] text-stone-400 font-bold block">الطلبيات المباشرة:</span>
                    <span className="text-xl font-black text-white flex items-center gap-1">
                      <ShoppingBag className="w-4 h-4 text-orange-400" />
                      48 طلب
                    </span>
                  </div>

                  <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 text-right">
                    <span className="text-[10px] text-stone-400 font-bold block">معدل العائد (ROI):</span>
                    <span className="text-xl font-black text-amber-300">380% ⚡</span>
                  </div>
                </div>
              </div>

              {/* Active Campaigns List */}
              <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                    <Flame className="w-4.5 h-4.5 text-orange-600" />
                    <span>حملاتك الإعلانية الجارية والسابقة ({mySponsoredCampaigns.length})</span>
                  </h3>

                  <button
                    onClick={() => {
                      if (onOpenPromote) {
                        onOpenPromote(null);
                      } else if (setActiveTab) {
                        setActiveTab('promote');
                      }
                    }}
                    className="text-xs text-orange-600 font-bold flex items-center gap-1"
                  >
                    <span>+ إضافة إعلان</span>
                  </button>
                </div>

                {mySponsoredCampaigns.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-2">
                    <Megaphone className="w-10 h-10 text-stone-300 mx-auto" />
                    <h4 className="font-bold text-xs text-stone-700">لا توجد حملات إعلانية نشطة حالياً</h4>
                    <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                      ابدأ أول حملة إعلانية ممولة لأطباقك واستقبل عشرات الطلبيات اليومية من زبائن منطقتك!
                    </p>
                    <button
                      onClick={() => {
                        if (onOpenPromote) {
                          onOpenPromote(null);
                        } else if (setActiveTab) {
                          setActiveTab('promote');
                        }
                      }}
                      className="bg-orange-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md mt-2"
                    >
                      إطلاق حملة ممولة الآن 🚀
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySponsoredCampaigns.map((camp) => {
                      const relatedPost = posts.find((p) => p.id === camp.post_id);
                      const postTitle = relatedPost?.title || `حملة ممولة (#${camp.post_id.slice(-4)})`;
                      const postImg =
                        relatedPost?.images[0] ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80';
                      const city = camp.target_cities?.[0] || 'كل المدن';

                      return (
                        <div
                          key={camp.id}
                          className="p-4 rounded-2xl bg-stone-50 hover:bg-orange-50/40 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={postImg}
                              alt=""
                              className="w-14 h-14 rounded-2xl object-cover shrink-0 ring-2 ring-amber-500/30"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-xs text-stone-900">{postTitle}</h4>
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-md">
                                  جارية الآن 🟢
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-500 font-bold flex items-center gap-3">
                                <span>المنطقة: {city}</span>
                                <span>• الميزانية: {camp.budget} د.ل</span>
                                <span>• الوضع: {camp.status === 'active' ? 'نشطة' : 'متوقفة'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-0 border-stone-200 pt-2 sm:pt-0">
                            <div className="text-right text-[11px] font-bold text-stone-600">
                              <div>الظهور: {camp.impressions || 1420} 👁️</div>
                              <div className="text-emerald-600">النقرات: {camp.clicks || 180} 🖱️</div>
                            </div>

                            <button
                              onClick={() => triggerToast(`تم إيقاف مؤقت للحملة الإعلانية للطبق "${postTitle}"`)}
                              className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold px-3 py-2 rounded-xl"
                            >
                              توقيف مؤقت
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Verification Tab (التوثيق بالعلامة الزرقاء 💙) */}
          {chefSubTab === 'verification' && (
            <div className="space-y-6">
              {/* CONDITIONAL RENDER FOR VERIFICATION STATUS */}
              {currentUser.is_verified ? (
                /* IF ALREADY VERIFIED: SHOW VERIFIED BADGE CERTIFICATE CARD (NO BUTTON!) */
                <div className="bg-gradient-to-br from-blue-950 via-stone-900 to-blue-900 rounded-3xl p-8 text-white border border-blue-400/40 shadow-2xl space-y-6 text-center relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>

                  <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto ring-8 ring-blue-500/20 shadow-xl">
                    <CheckCircle2 className="w-12 h-12 text-white fill-blue-600" />
                  </div>

                  <div className="space-y-2 max-w-lg mx-auto">
                    <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/40 px-4 py-1.5 rounded-full text-blue-300 text-xs font-black">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span>حساب شيف موثق ومعتمد رسمياً</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">
                      مطبخ ({currentChefProfile.kitchen_name}) يحمل العلامة الزرقاء 💙
                    </h2>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      تهانينا! مطبخك معتمد رسمياً في منصة سفرة. تم التحقق من هويتك الوطنية، والشهادة الصحية، واستيفاء كافة شروط السلامة والطهي الاحترافي.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-4 border-t border-blue-800/60 text-right">
                    <div className="bg-black/40 p-3.5 rounded-2xl border border-blue-500/20">
                      <span className="text-[10px] text-blue-300 font-bold block">رقم الاعتماد الصحي:</span>
                      <span className="font-extrabold text-xs text-white">#LY-HEALTH-2026-88</span>
                    </div>
                    <div className="bg-black/40 p-3.5 rounded-2xl border border-blue-500/20">
                      <span className="text-[10px] text-blue-300 font-bold block">تاريخ التوثيق:</span>
                      <span className="font-extrabold text-xs text-white">2026-01-15</span>
                    </div>
                    <div className="bg-black/40 p-3.5 rounded-2xl border border-blue-500/20">
                      <span className="text-[10px] text-blue-300 font-bold block">حالة الشارة:</span>
                      <span className="font-black text-xs text-emerald-400">نشطة وفي القمة ⚡</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-blue-300 font-medium">
                    ملاحظة: العلامة الزرقاء تمنح مطبخك ثقة مضاعفة وترفع نسبة ظهور أطباقك للزبائن بنسبة 85%.
                  </div>
                </div>
              ) : (
                /* IF NOT VERIFIED YET: SHOW THE VERIFICATION APPLICATION FORM */
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-stone-900">
                        طلب التوثيق بالعلامة الزرقاء 💙 (اعتماد مطبخ سفرة)
                      </h3>
                      <p className="text-xs text-stone-500">
                        احصل على العلامة الزرقاء الرسمية بجانب اسم مطبخك لزيادة ثقة الزبائن ومضاعفة طلبات المأكولات!
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleApplyVerificationSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">اسم المطبخ التجاري:</label>
                        <input
                          type="text"
                          value={kitchenName}
                          onChange={(e) => setKitchenName(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs outline-none font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">رقم هاتف المطبخ (واتساب):</label>
                        <input
                          type="text"
                          value={whatsappPhone}
                          onChange={(e) => setWhatsappPhone(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs outline-none font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">وصف المطبخ ونوع المأكولات:</label>
                      <textarea
                        value={kitchenBio}
                        onChange={(e) => setKitchenBio(e.target.value)}
                        rows={3}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs outline-none font-medium resize-none"
                      ></textarea>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                      <span className="text-xs font-bold text-stone-800 block">المستندات المطلوبة للتوثيق:</span>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200">
                        <Upload className="w-5 h-5 text-orange-600 shrink-0" />
                        <div className="flex-1 text-xs">
                          <span className="font-bold block text-stone-800">{healthCertDoc}</span>
                          <span className="text-[10px] text-stone-400">الشهادة الصحية أو الهوية الوطنية (PDF / PNG)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerToast('تم اختيار الملف بنجاح')}
                          className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg"
                        >
                          استبدال
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-8 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>إرسال طلب التوثيق للإدارة 💙</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleVerifiedDemo}
                        className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs px-5 py-3.5 rounded-2xl border border-amber-500/30 transition-all"
                      >
                        تفعيل فوري تجريبي (Demo Toggle) ⚡
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 4. Analytics Tab */}
          {chefSubTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                  <BarChart3 className="w-4.5 h-4.5 text-orange-600" />
                  <span>إحصائيات المبيعات وأداء المطبخ هذا الشهر</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200 space-y-1">
                    <span className="text-[10px] text-orange-700 font-bold block">إجمالي أرباح الشهر:</span>
                    <span className="text-2xl font-black text-stone-900">{totalChefRevenue} د.ل</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      {totalChefRevenue > 0 ? 'مباشر من أرباح طلباتك' : 'لا يوجد أرباح بعد'}
                    </span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-[10px] text-stone-500 font-bold block">عدد الوجبات المباعة:</span>
                    <span className="text-2xl font-black text-stone-900">
                      {myChefReceivedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0)} وجبة
                    </span>
                    <span className="text-[10px] text-stone-400 block">
                      {myChefReceivedOrders.length > 0 ? `من إجمالي ${myChefReceivedOrders.length} طلبات مُستلمة` : 'لا يوجد مبيعات بعد'}
                    </span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-[10px] text-stone-500 font-bold block">معدل تقييم الزبائن:</span>
                    <span className="text-2xl font-black text-amber-600 flex items-center gap-1">
                      <Star className="w-5 h-5 fill-amber-500" />
                      {currentChefProfile.rating_count > 0 ? `${currentChefProfile.rating_avg.toFixed(1)} / 5.0` : 'جديد'}
                    </span>
                    <span className="text-[10px] text-stone-400 block">
                      {currentChefProfile.rating_count > 0 ? `بناءً على ${currentChefProfile.rating_count} تقييماً موثقاً` : 'لم يتلق المطبخ تقييمات بعد'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Kitchen Settings Tab */}
          {chefSubTab === 'kitchen_settings' && (
            <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-xs space-y-5">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                <Settings className="w-4 h-4 text-orange-600" />
                <span>تحديث إعدادات المطبخ ومواعيد التوصيل</span>
              </h3>

              <form onSubmit={handleSaveKitchenSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">اسم المطبخ المعروض للزبائن:</label>
                    <input
                      type="text"
                      value={kitchenName}
                      onChange={(e) => setKitchenName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">ساعات العمل اليومية:</label>
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">رقم الواتساب لاستقبال الطلبات:</label>
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">نطاق مناطق التوصيل:</label>
                    <input
                      type="text"
                      value={deliveryRadius}
                      onChange={(e) => setDeliveryRadius(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs outline-none font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md"
                >
                  حفظ إعدادات المطبخ 💾
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* B. IF USER IS A CUSTOMER (الملف الشخصي للزبون)                           */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Main Customer Header */}
          <div className="bg-white rounded-3xl overflow-hidden border border-orange-100 shadow-md">
            {/* Banner */}
            <div className="relative h-44 sm:h-52 bg-gradient-to-r from-stone-900 via-orange-950 to-stone-900 overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-orange-600/30 rounded-full blur-3xl"></div>

              {/* Wallet Button Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <button
                  onClick={openWalletModal}
                  className="bg-stone-950/80 hover:bg-stone-900 text-amber-400 font-black text-xs px-3.5 py-2 rounded-2xl border border-amber-500/30 backdrop-blur-md shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span>محفظتي: {currentUser.wallet_balance} د.ل</span>
                </button>
              </div>

              {/* Account Type Badge */}
              <div className="absolute top-4 right-4 bg-stone-950/85 text-amber-300 text-[11px] font-black px-3.5 py-1.5 rounded-full backdrop-blur-md border border-amber-500/40 shadow-md flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>حساب مستخدم 🌟</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6 sm:p-8 relative -mt-16 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={selectedAvatar || currentUser.avatar_url}
                      alt={currentUser.full_name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-2xl bg-stone-100"
                    />
                    {currentUser.role === 'chef' && currentUser.is_verified && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-lg" title="شيف موثق بالعلامة الزرقاء">
                        <CheckCircle2 className="w-4 h-4 fill-blue-500 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-black text-2xl text-stone-900">{currentUser.full_name}</h1>
                      <span className="bg-orange-100 text-orange-900 border border-orange-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <User className="w-3 h-3 text-orange-600" />
                        <span>حساب مستخدم 🌟</span>
                      </span>
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-600" />
                        <span>عضو مميز 💎</span>
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 font-bold flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-orange-700">
                        <MapPin className="w-3.5 h-3.5 text-orange-500" />
                        {userCity} • {district}
                      </span>
                      <span>•</span>
                      <span className="dir-ltr text-stone-600 font-mono">{phone}</span>
                    </div>

                    <p className="text-xs text-stone-600 max-w-lg leading-relaxed pt-1 font-medium">
                      {bio}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  <button
                    onClick={() => setCustomerSubTab('settings')}
                    className={`text-xs font-black px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                      customerSubTab === 'settings'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/20'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>إعدادات الحساب</span>
                  </button>

                  <button
                    onClick={logoutUser}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2.5 rounded-2xl border border-rose-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1 text-xs font-bold"
                    title="تسجيل الخروج من الحساب"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden xs:inline">خروج</span>
                  </button>
                </div>
              </div>

            {/* Loyalty Progress & Quick Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-100">
              <button
                onClick={() => setCustomerSubTab('overview')}
                className="bg-stone-50 hover:bg-orange-50 p-3.5 rounded-2xl border border-stone-200 text-center space-y-1 transition-all group cursor-pointer"
              >
                <span className="text-[10px] text-stone-400 font-bold block group-hover:text-orange-600">إجمالي طلباتي</span>
                <span className="font-black text-xl text-stone-900 flex items-center justify-center gap-1">
                  <ShoppingBag className="w-4 h-4 text-orange-500" />
                  {myOrders.length}
                </span>
              </button>

              <button
                onClick={() => setCustomerSubTab('liked_dishes')}
                className="bg-stone-50 hover:bg-rose-50 p-3.5 rounded-2xl border border-stone-200 text-center space-y-1 transition-all group cursor-pointer"
              >
                <span className="text-[10px] text-stone-400 font-bold block group-hover:text-rose-600">الأطباق المفضلة</span>
                <span className="font-black text-xl text-rose-600 flex items-center justify-center gap-1">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  {likedPostsList.length}
                </span>
              </button>

              <button
                onClick={() => setCustomerSubTab('followed_chefs')}
                className="bg-stone-50 hover:bg-amber-50 p-3.5 rounded-2xl border border-stone-200 text-center space-y-1 transition-all group cursor-pointer"
              >
                <span className="text-[10px] text-stone-400 font-bold block group-hover:text-amber-600">الشيفات المتابعين</span>
                <span className="font-black text-xl text-stone-900 flex items-center justify-center gap-1">
                  <ChefHat className="w-4 h-4 text-orange-600" />
                  {followedChefsList.length}
                </span>
              </button>

              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80 text-center space-y-1">
                <span className="text-[10px] text-amber-800 font-extrabold block">نقاط ولاء سفرة</span>
                <span className="font-black text-xl text-amber-700 flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {Math.floor(totalSpent * 10).toLocaleString('ar-LY')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Navigation Sub Tabs Header */}
        <div ref={subTabNavRef} className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto no-scrollbar pb-1 text-right">
          <button
            onClick={() => setCustomerSubTab('overview')}
            className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              customerSubTab === 'overview'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-orange-600" />
            <span>سجل الطلبات والنشاط</span>
          </button>

          <button
            onClick={() => setCustomerSubTab('liked_dishes')}
            className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              customerSubTab === 'liked_dishes'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>الأطباق المفضلة ({likedPostsList.length})</span>
          </button>

          <button
            onClick={() => setCustomerSubTab('followed_chefs')}
            className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              customerSubTab === 'followed_chefs'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <ChefHat className="w-4 h-4 text-amber-600" />
            <span>الشيفات المتابعين ({followedChefsList.length})</span>
          </button>

          <button
            onClick={() => setCustomerSubTab('addresses')}
            className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              customerSubTab === 'addresses'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>عناوين التوصيل ({savedAddresses.length})</span>
          </button>

          <button
            onClick={() => setCustomerSubTab('settings')}
            className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
              customerSubTab === 'settings'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Settings className="w-4 h-4 text-stone-600" />
            <span>إعدادات وتعديل الحساب</span>
          </button>
        </div>

        {/* Customer Sub Content */}
        {customerSubTab === 'overview' && (
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <span>طلباتك ونشاطاتك في سُفرة</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">تتبع حالة وجباتك المجهزة وحالتها المباشرة</p>
              </div>
              <span className="bg-orange-100 text-orange-900 text-xs font-black px-3 py-1 rounded-xl">
                {myOrders.length} طلبيات
              </span>
            </div>

            {/* Top Escrow Action Alert Banner if any delivered order awaits confirmation */}
            {myOrders.some((o) => o.status === 'delivered' && !o.escrow_released_at && o.dispute_status !== 'opened') && (
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4.5 rounded-2xl shadow-md border border-emerald-500 space-y-2.5 animate-pulse">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                    <ShieldAlert className="w-5 h-5 text-emerald-200 shrink-0" />
                    <span>تنبيه هـام: لديك طلبات تم تسليمها بانتظار تأكيد الاستلام! 📦🤝</span>
                  </div>
                  <span className="bg-emerald-800/90 text-emerald-100 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-400/40">
                    نظام الضمان Escrow
                  </span>
                </div>
                <p className="text-xs text-emerald-50 leading-relaxed">
                  وصلت الوجبة بنجاح! الرجاء الضغط على زر <strong className="underline decoration-emerald-200">&quot;تأكيد الاستلام ورضاي عن الوجبة&quot;</strong> أدناه لتحرير الأرباح وإيداعها في محفظة الشيف فوراً، أو فتح بلاغ في حال وجود أي ملاحظة.
                </p>
              </div>
            )}

            {myOrders.length === 0 ? (
              <div className="text-center py-12 bg-stone-50/80 rounded-3xl border border-dashed border-stone-200 space-y-3">
                <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                <p className="text-xs font-extrabold text-stone-600">لا توجد طلبات سابقة مسجلة لحسابك حالياً</p>
                <p className="text-[11px] text-stone-400">استمتع باستكشاف أحدث المأكولات المنزلية من شيفات منطقتك واطلب أول وجبة!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((ord, idx) => {
                  const isDeliveredPendingEscrow = ord.status === 'delivered' && !ord.escrow_released_at && ord.dispute_status !== 'opened';
                  const isDeliveredReleased = ord.status === 'delivered' && !!ord.escrow_released_at;

                  return (
                    <div
                      key={ord.id}
                      className={`p-5 rounded-3xl border transition-all space-y-4 ${
                        isDeliveredPendingEscrow
                          ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-400/30 shadow-md'
                          : 'bg-stone-50/90 hover:bg-stone-50 border-stone-200/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              ord.post_image ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80'
                            }
                            alt={ord.post_title}
                            className="w-14 h-14 rounded-2xl object-cover shadow-xs border border-stone-200 shrink-0"
                          />
                          <div>
                            <div className="font-black text-sm text-stone-900">{ord.post_title}</div>
                            <div className="text-xs text-stone-500 font-bold flex items-center gap-1.5 mt-0.5">
                              <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                              <span>المطبخ: {ord.chef_name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-left">
                            <span className="text-[10px] text-stone-400 font-bold block">القيمة الإجمالية</span>
                            <span className="font-black text-sm text-orange-600">{ord.total_price} د.ل</span>
                          </div>

                          {/* Dynamic Status Badge */}
                          {ord.status === 'pending' && (
                            <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-3 py-1.5 rounded-full border border-amber-300 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>قيد انتظار قبول المطبخ ⏳</span>
                            </span>
                          )}

                          {(ord.status === 'accepted' || ord.status === 'preparing') && (
                            <span className="text-xs bg-orange-100 text-orange-900 font-extrabold px-3 py-1.5 rounded-full border border-orange-300 flex items-center gap-1">
                              <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                              <span>جاري الطهي والتحضير 🍳</span>
                            </span>
                          )}

                          {ord.status === 'out_for_delivery' && (
                            <span className="text-xs bg-blue-100 text-blue-900 font-extrabold px-3 py-1.5 rounded-full border border-blue-300 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span>مع المندوب جاري التوصيل 🚗</span>
                            </span>
                          )}

                          {ord.status === 'delivered' && (
                            isDeliveredPendingEscrow ? (
                              <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-3 py-1.5 rounded-full border border-amber-300 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                <span>تم التسليم (الضمان محجوز 48س) 🛡️</span>
                              </span>
                            ) : (
                              <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>مكتمل ومسلم (تم تحرير الرصيد) ✅</span>
                              </span>
                            )
                          )}

                          {(ord.status === 'cancelled' || ord.status === 'rejected') && (
                            <span className="text-xs bg-stone-200 text-stone-700 font-extrabold px-3 py-1.5 rounded-full border border-stone-300 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-stone-500" />
                              <span>ملغي ❌</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Escrow Release Interactive Card inside Profile */}
                      {isDeliveredPendingEscrow && (
                        <div className="bg-emerald-100/90 border border-emerald-300 p-4 rounded-2xl space-y-3 text-emerald-950 shadow-xs">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="font-black text-xs flex items-center gap-1.5 text-emerald-900">
                              <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>الأرباح محفوظة في نظام الضمان (Escrow) لحمايتك 🛡️</span>
                            </div>
                            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-black px-2.5 py-0.5 rounded-full">
                              حجز 48 ساعة
                            </span>
                          </div>
                          <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                            إذا استلمت هذه الوجبة وكانت ممتازة وبالجودة المطلوبة، يرجى تأكيد الاستلام لتحرير الأرباح للشيف فوراً وإيداعها في محفظته.
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              onClick={() => setConfirmDeliveryOrder(ord)}
                              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>تأكيد الاستلام ورضاي عن الوجبة (تحرير الرصيد للشيف) 🤝</span>
                            </button>

                            <button
                              onClick={() => {
                                if (setActiveTab) setActiveTab('orders');
                              }}
                              className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldAlert className="w-4 h-4 text-rose-600" />
                              <span>بلاغ / لم يصل الطلب 🚨</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {isDeliveredReleased && (
                        <div className="bg-emerald-50 border border-emerald-200/90 p-2.5 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>تم تأكيد الاستلام وتحرير الرصيد للشيف بنجاح ✅</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs font-extrabold text-stone-500">
                        <span className="flex items-center gap-1">
                          <span>رقم الطلب:</span>
                          <span className="font-mono text-stone-800">#ORD-{1000 + idx}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => triggerToast(`جاري إضافة "${ord.post_title}" إلى سلة التسوق... 🛒`)}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>إعادة الطلب 🔄</span>
                          </button>

                          <button
                            onClick={() => {
                              if (setActiveTab) setActiveTab('orders');
                            }}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            عرض التفاصيل والتتبع 📦
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {customerSubTab === 'liked_dishes' && (
          <div className="space-y-4 text-right">
            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span>قائمة الأطباق والمأكولات المفضلة</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">الوجبات المنزلية التي قمت بحفظها لطلبها بسهولة في أي وقت</p>
              </div>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black px-3 py-1 rounded-xl">
                {likedPostsList.length} أطباق
              </span>
            </div>

            {likedPostsList.length === 0 ? (
              <div className="text-center py-12 bg-stone-50/80 rounded-3xl border border-dashed border-stone-200 space-y-3">
                <Heart className="w-12 h-12 text-stone-300 mx-auto" />
                <p className="text-xs font-extrabold text-stone-600">لا توجد أطباق مفضلة محفوظة بعد</p>
                <p className="text-[11px] text-stone-400">انقر على رمز القلب ❤️ على أي طبق أثناء التصفح لإضافته إلى قائمتك هنا!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {likedPostsList.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 p-4 space-y-3 hover:shadow-md transition-all group"
                  >
                    <div className="relative h-40 rounded-2xl overflow-hidden">
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-stone-950/70 text-white text-[10px] font-black px-2.5 py-1 rounded-xl backdrop-blur-md">
                        {post.city}
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 bg-amber-500 text-stone-950 text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
                        {post.price} د.ل
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-stone-500 font-bold flex items-center gap-1">
                        <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                        <span>الشيف: {post.chef_name}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400 font-bold">تحضير بيتي طازج ✨</span>
                      <button
                        onClick={() => onOpenDetail && onOpenDetail(post)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        عرض الطبق والطلب 🛒
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {customerSubTab === 'followed_chefs' && (
          <div className="space-y-4 text-right">
            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-amber-600" />
                  <span>طباخو وشيفات سفرة المفضلون لديك</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">المطابخ المنزلية التي تتابع منشوراتها وأطباقها اليومية</p>
              </div>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black px-3 py-1 rounded-xl">
                {followedChefsList.length} شيفات
              </span>
            </div>

            {followedChefsList.length === 0 ? (
              <div className="text-center py-12 bg-stone-50/80 rounded-3xl border border-dashed border-stone-200 space-y-3">
                <ChefHat className="w-12 h-12 text-stone-300 mx-auto" />
                <p className="text-xs font-extrabold text-stone-600">لا تتابع أي شيف حالياً</p>
                <p className="text-[11px] text-stone-400">انقر على زر &quot;متابعة&quot; في ملف أي شيف لمتابعة مطبخه وتلقي أحدث الأطباق!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {followedChefsList.map((chef) => (
                  <div
                    key={chef.id}
                    className="bg-white rounded-3xl p-5 border border-stone-200/80 space-y-4 hover:shadow-md transition-all text-right"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={chef.avatar_url}
                        alt={chef.full_name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-200 shrink-0"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <h4 className="font-black text-sm text-stone-900">{chef.full_name}</h4>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-500" />
                        </div>
                        <p className="text-xs text-stone-500 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-500" />
                          <span>{chef.city} • مطبخ بيتي</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 flex items-center justify-around text-center">
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold block">التقييم</span>
                        <span className="font-black text-xs text-stone-900 flex items-center justify-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          4.9
                        </span>
                      </div>
                      <div className="h-6 w-[1px] bg-stone-200" />
                      <div>
                        <span className="text-[10px] text-stone-400 font-bold block">الفرع</span>
                        <span className="font-black text-xs text-stone-900">طرابلس</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFollowChef(chef.id)}
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs py-2.5 rounded-xl border border-rose-200 transition-all cursor-pointer"
                      >
                        إلغاء المتابعة ✖️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {customerSubTab === 'addresses' && (
          <div className="space-y-4 text-right">
            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <span>عناوين التوصيل المحفوظة للمنزل والعمل</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">إدارة أماكن استلام الطلبات والوجبات المنزلية بليبيا</p>
              </div>
              <button
                onClick={() => setShowAddAddrModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>+ إضافة عنوان جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-5 bg-white rounded-3xl border transition-all space-y-3 relative ${
                    addr.isDefault
                      ? 'border-orange-500 ring-2 ring-orange-500/10 shadow-sm'
                      : 'border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-stone-900">{addr.city} • {addr.district}</span>
                      {addr.isDefault && (
                        <span className="bg-orange-100 text-orange-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-orange-300">
                          العنوان الافتراضي 📍
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 font-medium leading-relaxed bg-stone-50 p-3 rounded-2xl border border-stone-100">
                    {addr.street}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs font-bold border-t border-stone-100">
                    {!addr.isDefault ? (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-orange-600 hover:underline cursor-pointer"
                      >
                        تعيين كعنوان افتراضي
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-extrabold text-[11px]">محدد للتوصيل المباشر</span>
                    )}

                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      حذف العنوان
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          {customerSubTab === 'settings' && (
            <form onSubmit={handleSaveCustomerProfile} className="bg-white p-6 sm:p-8 rounded-3xl space-y-6 border border-stone-200 shadow-xs text-right">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-600" />
                    <span>إعدادات وتعديل بيانات الحساب الشخصي</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">تحديث معلوماتك الأساسية المعروضة على المنصة وعند طلب الوجبات</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-stone-700 block mb-1.5">الاسم الكامل:</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أدخل اسمك الكامل..."
                    className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-700 block mb-1.5">رقم الهاتف التواصل (ليبي):</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="091XXXXXXX"
                    className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-xs font-mono font-bold outline-none focus:border-orange-500 focus:bg-white transition-all dir-ltr text-right"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-stone-700 block mb-1.5">المدينة الرئيسية / الإقليم:</label>
                  <select
                    value={userCity}
                    onChange={(e) => setUserCity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                  >
                    {LIBYAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-700 block mb-1.5">المنطقة / الضاحية 🏡:</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    list="user-suburbs-list"
                    placeholder="اكتب أو اختر الضاحية (مثال: السواني، طمينة، القوارشة...)"
                    className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                  <datalist id="user-suburbs-list">
                    {(CITY_SUBURBS_MAP[userCity] || []).map((sub) => (
                      <option key={sub} value={sub} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-stone-700 block mb-1.5">نبذة عنك (Bio):</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="اكتب نبذة بسيطة عن تفضيلاتك في الطعام والأكلات..."
                  className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-xs font-medium outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-stone-700 block mb-2">اختر الصورة الشخصية (رمز الأفتار):</label>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
                  ].map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`relative rounded-2xl overflow-hidden ring-2 transition-all p-0.5 shrink-0 ${
                        selectedAvatar === url ? 'ring-orange-600 scale-105 shadow-md' : 'ring-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx + 1}`} className="w-14 h-14 rounded-2xl object-cover" />
                      {selectedAvatar === url && (
                        <div className="absolute inset-0 bg-orange-600/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white fill-orange-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-8 py-3.5 rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وتحديث بيانات الحساب 💾</span>
                </button>
              </div>

              {/* PWA App Status & Installation Card */}
              <div className="mt-6 pt-6 border-t border-stone-200/80">
                <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white p-5 rounded-3xl border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-black text-sm">
                        📱
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm text-white flex items-center gap-2">
                          <span>تطبيق سُفرة للهواتف (PWA)</span>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                            v2.4.0 Live
                          </span>
                        </h4>
                        <p className="text-[11px] text-stone-300 font-medium mt-0.5">
                          تطبيق ويب تقدمي فائق الخفة والسرعة يعمل على هواتف آيفون وأندرويد وأجهزة الكمبيوتر.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('open-pwa-install'));
                        }
                      }}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-950" />
                      <span>تثبيت أو فحص التطبيق 📲</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}



      {/* MODAL: ADD NEW DELIVERY ADDRESS */}
      <AnimatePresence>
        {/* MODAL: Confirm Delivery & Release Escrow in Profile */}
        {confirmDeliveryOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-emerald-100 text-right dir-rtl"
            >
              <button
                onClick={() => setConfirmDeliveryOrder(null)}
                className="absolute top-5 left-5 text-stone-400 hover:text-stone-700 font-bold bg-stone-100 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>

              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="font-black text-lg text-stone-900">تأكيد الاستلام وتحرير الرصيد 🤝</h2>
                <p className="text-xs text-stone-600 leading-relaxed">
                  هل أنت متأكد من استلام طلبك <strong className="text-stone-900 font-bold">&quot;{confirmDeliveryOrder.post_title}&quot;</strong> ورضاك الكامل عن الوجبة؟ عند التأكيد، سيتم تحرير الأرباح فوراً من نظام الضمان (Escrow) وإيداعها في محفظة الشيف.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>إشعار الضمان والأمان:</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  هذا الإجراء فوري ومباشر. في حال كان لديك أي ملاحظة على جودة الوجبة يمكنك إغلاق النافذة وتقديم بلاغ بدلاً من ذلك.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    confirmOrderDeliveryAndReleaseEscrow(confirmDeliveryOrder.id);
                    setConfirmDeliveryOrder(null);
                    triggerToast('تم تأكيد الاستلام وتحرير الأرباح للشيف بنجاح! شكراً لك 🎉');
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3.5 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وتحرير الأرباح الآن</span>
                </button>
                <button
                  onClick={() => setConfirmDeliveryOrder(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-4 py-3.5 rounded-2xl text-xs transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddAddrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-stone-200 text-right dir-rtl"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>إضافة عنوان توصيل جديد</span>
                </h3>
                <button onClick={() => setShowAddAddrModal(false)}>
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <form onSubmit={handleAddAddressSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">المدينة:</label>
                  <select
                    value={newAddrCity}
                    onChange={(e) => setNewAddrCity(e.target.value)}
                    className="w-full bg-stone-50 border p-3 rounded-2xl text-xs font-bold outline-none"
                  >
                    {LIBYAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">المنطقة / الضاحية 🏡:</label>
                  <input
                    type="text"
                    placeholder="مثلاً: السواني، الهواري، طمينة، حي الأندلس"
                    value={newAddrDistrict}
                    onChange={(e) => setNewAddrDistrict(e.target.value)}
                    list="new-addr-suburbs-list"
                    className="w-full bg-stone-50 border p-3 rounded-2xl text-xs font-bold outline-none"
                    required
                  />
                  <datalist id="new-addr-suburbs-list">
                    {(CITY_SUBURBS_MAP[newAddrCity] || []).map((sub) => (
                      <option key={sub} value={sub} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">تفاصيل الشارع والمعلم القريب:</label>
                  <input
                    type="text"
                    placeholder="مثلاً: شارع المخابز - بالقرب من الصيدلية المركزية"
                    value={newAddrStreet}
                    onChange={(e) => setNewAddrStreet(e.target.value)}
                    className="w-full bg-stone-50 border p-3 rounded-2xl text-xs font-bold outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md"
                >
                  حفظ العنوان 📍
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
