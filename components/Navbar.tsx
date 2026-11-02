'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { useStore } from '@/lib/store';
import { LIBYAN_CITIES } from '@/lib/constants';
import { BrandLogo } from './BrandLogo';
import {
  UtensilsCrossed,
  MapPin,
  Wallet,
  Bell,
  PlusCircle,
  Search,
  ChefHat,
  Settings,
  ChevronDown,
  LogOut,
  LogIn,
  ArrowRight,
  Menu,
  X,
  ShoppingBag,
  ShieldCheck,
  Home,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Gift,
  Film,
  Smartphone,
  Download,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openWalletModal: () => void;
  openCreatePostModal: () => void;
  openBecomeChefModal: () => void;
  openAuthModal: () => void;
  openMessengerModal?: () => void;
  openAdminDisputesModal?: () => void;
  openNotificationCenterModal?: () => void;
  onOpenGiftsStore?: () => void;
  onOpenServerLoadModal?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const emptySubscribe = () => () => {};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openWalletModal,
  openCreatePostModal,
  openBecomeChefModal,
  openAuthModal,
  openMessengerModal,
  openAdminDisputesModal,
  openNotificationCenterModal,
  onOpenGiftsStore,
  onOpenServerLoadModal,
  searchQuery,
  setSearchQuery,
}) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const {
    currentUser,
    users,
    switchUser,
    isLoggedIn,
    logoutUser,
    userCity,
    setUserCity,
    notifications,
    markNotificationsRead,
    orders,
    unreadMessagesCount,
    platformSettings,
  } = useStore();

  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const activeOrdersCount = orders.filter((o) =>
    ['pending', 'accepted', 'preparing', 'out_for_delivery'].includes(o.status)
  ).length;

  return (
    <>
      {/* Backdrop overlay for closing open header dropdowns when clicking anywhere outside */}
      {(showCityDropdown || showNotifDropdown || showRoleDropdown) && (
        <div
          className="fixed inset-0 z-30 bg-black/5"
          onClick={() => {
            setShowCityDropdown(false);
            setShowNotifDropdown(false);
            setShowRoleDropdown(false);
          }}
        />
      )}


      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs transition-all w-full overflow-x-clip">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-3 w-full">
            {/* Left side (Visual Right in RTL): Side Drawer Menu Button & Permanent Brand Logo */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
              {/* Side Drawer Toggle Button */}
              <button
                onClick={() => setIsSideDrawerOpen(true)}
                className="flex items-center gap-1 bg-stone-900 hover:bg-orange-600 text-white font-extrabold text-xs p-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl shadow-xs transition-all active:scale-95 group shrink-0 cursor-pointer"
                title="فتح القائمة الجانبية للتطبيق"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300 text-orange-400 group-hover:text-white" />
                <span className="hidden sm:inline-block">القائمة الجانبية</span>
              </button>

              {/* Permanent Brand Logo (Always visible on all screens & tabs) */}
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink-0">
                <div
                  onClick={() => setActiveTab('explore')}
                  className="flex items-center gap-1.5 cursor-pointer group shrink-0"
                  title="العودة للإكسبلور الرئيسي"
                >
                  <BrandLogo size="sm" showText={true} />
                </div>

                {/* Current Page Pill Badge if not on Home */}
                {activeTab !== 'home' && (
                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    <span className="text-stone-300">/</span>
                    <span className="bg-orange-50 border border-orange-200/90 text-orange-950 font-black text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl shadow-2xs truncate max-w-[90px] sm:max-w-none">
                      {activeTab === 'explore'
                        ? 'الإكسبلور 🔥'
                        : activeTab === 'orders'
                        ? 'طلباتي 📦'
                        : activeTab === 'chefs'
                        ? 'الشيفات 👨‍🍳'
                        : activeTab === 'messages'
                        ? 'الرسائل 💬'
                        : activeTab === 'wallet'
                        ? 'المحفظة 💳'
                        : activeTab === 'gifts-store'
                        ? 'متجر الهدايا 🎁'
                        : activeTab === 'settings'
                        ? 'الإعدادات ⚙️'
                        : activeTab === 'admin'
                        ? 'الإدارة 🛡️'
                        : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar (Shown on desktop) */}
            <div className="hidden md:flex flex-1 max-w-xs relative mx-2">
              <input
                type="text"
                value={searchQuery ?? ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن طبق، شيف، أو مدينة..."
                className="w-full bg-stone-100/90 hover:bg-stone-100 focus:bg-white text-xs pr-8 pl-3 py-2 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all placeholder:text-stone-400"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
            </div>

            {/* Right Action Navigation Icons (Left side visually in RTL) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* City Switcher Dropdown */}
              <div className="relative shrink-0 z-40">
                <button
                  onClick={() => {
                    setShowCityDropdown(!showCityDropdown);
                    setShowRoleDropdown(false);
                    setShowNotifDropdown(false);
                  }}
                  className="flex items-center gap-0.5 sm:gap-1 bg-orange-50 hover:bg-orange-100 text-orange-900 text-[10px] sm:text-xs font-extrabold px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-orange-200/80 transition-all shadow-2xs shrink-0 cursor-pointer"
                  title="تغيير المدينة الحالية لتصفح الأطباق والشيفات"
                >
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 shrink-0" />
                  <span className="truncate max-w-[36px] xs:max-w-[65px] sm:max-w-none">{userCity}</span>
                  <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500 shrink-0" />
                </button>

                {showCityDropdown && (
                  <div className="absolute left-0 sm:left-auto right-0 sm:right-0 mt-2 w-48 sm:w-52 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto max-w-[calc(100vw-1rem)]">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-orange-600 uppercase tracking-wider border-b border-stone-100 flex items-center justify-between">
                      <span>اختر مدينتك في ليبيا 🇱🇾</span>
                    </div>
                    {LIBYAN_CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setUserCity(city);
                          setShowCityDropdown(false);
                        }}
                        className={`w-full text-right px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-orange-50 transition-colors cursor-pointer ${
                          userCity === city ? 'bg-orange-50 text-orange-700 font-extrabold' : 'text-stone-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <MapPin className={`w-3 h-3 ${userCity === city ? 'text-orange-600' : 'text-stone-400'}`} />
                          <span>{city}</span>
                        </span>
                        {userCity === city && <span className="w-2 h-2 rounded-full bg-orange-600 shadow-xs"></span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>



              {/* Sponsored Campaign Launch Button for Chefs & Admins */}
              {(currentUser.role === 'chef' || currentUser.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('promote')}
                  className={`hidden sm:flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    activeTab === 'promote'
                      ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                  title="صفحة إطلاق إدارة الحملات والإعلانات الممولة"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>حملة ممولة 🚀</span>
                </button>
              )}

              {/* Admin Disputes Button (for admin role) */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => openAdminDisputesModal?.()}
                  className="relative p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors border border-rose-200 shrink-0 cursor-pointer"
                  title="لوحة النزاعات وضمان Escrow"
                >
                  <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
                </button>
              )}

              {/* Notifications Dropdown */}
              <div className="relative shrink-0 z-40">
                <button
                  onClick={() => {
                    if (openNotificationCenterModal) {
                      openNotificationCenterModal();
                    } else {
                      setShowNotifDropdown(!showNotifDropdown);
                    }
                    setShowRoleDropdown(false);
                    setShowCityDropdown(false);
                  }}
                  suppressHydrationWarning
                  className="relative p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  title="الإشعارات والتحديثات"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute left-0 sm:left-auto right-auto sm:right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 max-w-[calc(100vw-1.5rem)] animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-800">الإشعارات والتحديثات</span>
                      <span className="text-[10px] text-stone-400">Realtime</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-50">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-stone-400">لا توجد إشعارات جديدة</div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div key={n.id} className="p-3 hover:bg-stone-50 transition-colors">
                            <p className="font-bold text-xs text-stone-800">{n.title}</p>
                            <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">{n.content}</p>
                            <span className="text-[9px] text-stone-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    {openNotificationCenterModal && (
                      <div className="p-2 border-t border-stone-100 bg-stone-50 rounded-b-2xl">
                        <button
                          onClick={() => {
                            setShowNotifDropdown(false);
                            openNotificationCenterModal();
                          }}
                          className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>فتح مركز الإشعارات الكامل 🔔</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Account Button & Dropdown */}
              <div className="relative shrink-0 z-40">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      setShowRoleDropdown(!showRoleDropdown);
                      setShowCityDropdown(false);
                      setShowNotifDropdown(false);
                    }}
                    className="flex items-center gap-1.5 bg-stone-100 hover:bg-orange-100/70 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-stone-200 text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
                    title="حسابي والملف الشخصي"
                  >
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-orange-500/60 shadow-xs shrink-0"
                    />
                    <div className="hidden lg:block text-right">
                      <div className="font-extrabold text-stone-900 truncate max-w-[80px] text-[11px]">
                        {(currentUser?.full_name || '').split(' ')[0] || currentUser?.username || 'حسابي'}
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-stone-500 hidden sm:block" />
                  </button>
                ) : (
                  <button
                    onClick={openAuthModal}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-[11px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>دخول</span>
                  </button>
                )}

                {isLoggedIn && showRoleDropdown && (
                  <div className="absolute left-0 mt-2 w-64 sm:w-70 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 max-w-[calc(100vw-1.5rem)] animate-in fade-in duration-150">
                  <div className="px-3 py-2 bg-orange-50/60 border-b border-stone-100 mb-1">
                    <div className="font-extrabold text-stone-900 text-xs truncate">{currentUser.full_name}</div>
                    <div className="text-[10px] text-orange-700 font-bold mt-0.5">
                      {currentUser.role === 'chef' ? 'شيف ومطبخ تجاري 👨‍🍳' : currentUser.role === 'admin' ? 'أدمن النظام 🛡️' : 'حساب مستخدم 🍲'}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1 flex items-center justify-between">
                      <span>رصيد المحفظة:</span>
                      <span className="font-mono font-bold text-emerald-700">{currentUser.wallet_balance} د.ل</span>
                    </div>
                  </div>

                  <div className="px-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setActiveTab('settings');
                      }}
                      className="w-full text-right px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-orange-600" />
                      <span>الملف الشخصي والإعدادات</span>
                    </button>

                    {currentUser.role === 'customer' ? (
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          openBecomeChefModal();
                        }}
                        className="w-full text-right px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <ChefHat className="w-4 h-4 text-amber-600" />
                        <span>انضمام كـ شيف / مطبخ تجاري</span>
                      </button>
                    ) : currentUser.role === 'chef' ? (
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          openCreatePostModal();
                        }}
                        className="w-full text-right px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-orange-600" />
                        <span>إضافة وجبة / طبق جديد</span>
                      </button>
                    ) : currentUser.role === 'admin' ? (
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          setActiveTab('admin');
                        }}
                        className="w-full text-right px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>لوحة إدارة النظام</span>
                      </button>
                    ) : null}
                  </div>

                  <div className="border-t border-stone-100 my-1.5 pt-1 px-3">
                    <div className="text-[10px] font-bold text-stone-400 mb-1">حسابات تجريبية للأدوار:</div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full text-right px-2 py-1.5 text-xs flex items-center gap-2 rounded-lg transition-colors ${
                            currentUser.id === u.id ? 'bg-orange-100/80 font-bold text-orange-800' : 'text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          <img src={u.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-[11px] font-semibold">{u.full_name}</div>
                            <div className="text-[9px] text-stone-400">
                              {u.role === 'chef' ? 'شيف / مطبخ تجاري' : u.role === 'admin' ? 'أدمن' : 'مستخدم'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-stone-100 mt-1 pt-1 px-2">
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        logoutUser();
                        openAuthModal();
                      }}
                      className="w-full text-right px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Side Navigation Drawer Overlay */}
    {isSideDrawerOpen && (
      <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-start transition-all">
        <div
          className="w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-stone-200"
          dir="rtl"
        >
          {/* Drawer Header */}
          <div className="p-4 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <BrandLogo size="lg" withGlow={true} />
              <div>
                <div className="font-extrabold text-base leading-tight">القائمة الجانبية</div>
                <div className="text-[10px] text-orange-100 font-bold">منصة سُفرة - ليبيا 🇱🇾</div>
              </div>
            </div>
            <button
              onClick={() => setIsSideDrawerOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Info Card */}
          {isLoggedIn ? (
            <div className="p-4 bg-orange-50/70 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-orange-300 shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-stone-900 text-sm truncate">{currentUser.full_name}</div>
                  <div className="inline-block bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200 mt-0.5">
                    {currentUser.role === 'chef' ? 'شيف / مطبخ تجاري 👨‍🍳' : currentUser.role === 'admin' ? 'أدمن النظام 🛡️' : 'مستخدم 🍲'}
                  </div>
                </div>
              </div>

              {/* Wallet quick summary */}
              <div className="mt-3 pt-3 border-t border-orange-200/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-500 text-[10px] block">رصيد محفظة DPAY:</span>
                  <span className="font-black text-emerald-700 text-sm">{currentUser.wallet_balance.toFixed(0)} د.ل</span>
                </div>
                <button
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    openWalletModal();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>شحن المحفظة</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100 space-y-3">
              <div>
                <div className="font-extrabold text-stone-900 text-sm">أهلاً بك في منصة سُفرة 🇱🇾</div>
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                  سجل دخولك لتتمكن من تصفح الأطباق، طلب الوجبات، ومراسلة الشيفات.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSideDrawerOpen(false);
                  openAuthModal();
                }}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول / إنشاء حساب</span>
              </button>
            </div>
          )}

          {/* Drawer Navigation Links */}
          <div className="p-3 space-y-1 flex-1">
            <div className="text-[10px] font-black text-stone-400 uppercase tracking-wider px-3 py-1">
              أقسام المنصة الرئيسية
            </div>

            <button
              onClick={() => {
                setActiveTab('home');
                setIsSideDrawerOpen(false);
              }}
              className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4" />
                <span>الرئيسية (تغذية المتابعات)</span>
              </div>
              <span className="text-[10px] opacity-80">آخر منشورات الشيفات</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('reels');
                setIsSideDrawerOpen(false);
              }}
              className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'reels'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-amber-600/20'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Film className="w-4 h-4 text-amber-600" />
                <span>ريلز الطبخ القصيرة 🎬</span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">جديد 🔥</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('explore');
                setIsSideDrawerOpen(false);
              }}
              className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                <span>الإكسبلور (استكشاف الأطباق)</span>
              </div>
              <span className="text-[10px] opacity-80">الأكثر شعبية وتفاعلاً</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('chefs');
                setIsSideDrawerOpen(false);
              }}
              className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'chefs'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-4 h-4" />
                <span>دليل الشيفات والمطابخ</span>
              </div>
              <span className="text-[10px] opacity-80">طهاة ليبيا</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders');
                setIsSideDrawerOpen(false);
              }}
              className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>طلباتي ونشاطاتي</span>
              </div>
              {activeOrdersCount > 0 ? (
                <span className="bg-amber-500 text-stone-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {activeOrdersCount} جاري
                </span>
              ) : (
                <span className="text-[10px] opacity-80">سجل الطلبات</span>
              )}
            </button>

            {/* Notification Center in Drawer */}
            <button
              onClick={() => {
                setIsSideDrawerOpen(false);
                if (openNotificationCenterModal) {
                  openNotificationCenterModal();
                }
              }}
              className="w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer text-stone-700 hover:bg-orange-50 hover:text-orange-950 border border-stone-200/60"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-orange-600" />
                <span>مركز الإشعارات والتنبيهات 🔔</span>
              </div>
              {unreadCount > 0 ? (
                <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {unreadCount} غير مقروء
                </span>
              ) : (
                <span className="text-[10px] text-stone-400">مباشر</span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('messages');
                setIsSideDrawerOpen(false);
              }}
              className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-orange-600" />
                <span>الرسائل والمحادثات</span>
              </div>
              {unreadMessagesCount > 0 ? (
                <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadMessagesCount} جديد
                </span>
              ) : (
                <span className="text-[10px] opacity-80">تواصل مباشر</span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('wallet');
                setIsSideDrawerOpen(false);
              }}
              className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'text-stone-700 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>المحفظة الرقمية (DPAY)</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">شحن وسحب</span>
            </button>

            {/* Sidebar Gifts Store Button */}
            <button
              onClick={() => {
                setActiveTab('gifts-store');
                setIsSideDrawerOpen(false);
              }}
              className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'gifts-store'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-800 bg-gradient-to-r from-amber-100/80 to-orange-100/80 hover:from-amber-200 hover:to-orange-200 border border-amber-300/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-amber-700" />
                <span>متجر شراء الهدايا والإكراميات 🎁</span>
              </div>
              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full shadow-2xs">
                شراء الحزم
              </span>
            </button>

            {/* Sponsored Campaigns Tab for Chefs & Admins */}
            {(currentUser.role === 'chef' || currentUser.role === 'admin') && (
              <button
                onClick={() => {
                  setActiveTab('promote');
                  setIsSideDrawerOpen(false);
                }}
                className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'promote'
                    ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>الحملات الإعلانية والممولة 🚀</span>
                </div>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">ترويج</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('settings');
                setIsSideDrawerOpen(false);
              }}
              className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>إعدادات الحساب والبروفايل</span>
              </div>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setIsSideDrawerOpen(false);
                }}
                className={`w-full text-right px-3.5 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>لوحة إدارة النظام</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Admin</span>
              </button>
            )}

            {/* PWA App Install Quick Action */}
            <button
              onClick={() => {
                setIsSideDrawerOpen(false);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-pwa-install'));
                }
              }}
              className="w-full text-right px-3.5 py-3 rounded-2xl font-black text-xs flex items-center justify-between transition-all bg-gradient-to-r from-stone-900 to-stone-950 text-white border border-amber-500/40 hover:border-amber-400 hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>تثبيت التطبيق على هاتفك 📲</span>
              </div>
              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full shadow-2xs">
                PWA
              </span>
            </button>

            {/* Quick Actions */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <div className="text-[10px] font-black text-stone-400 uppercase tracking-wider px-3">
                إجراءات سريعة
              </div>

              {currentUser.role === 'customer' ? (
                <button
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    openBecomeChefModal();
                  }}
                  className="w-full text-right px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 flex items-center gap-2 transition-colors"
                >
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  <span>انضم كـ شيف / مطبخ تجاري</span>
                </button>
              ) : currentUser.role === 'chef' ? (
                <button
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    openCreatePostModal();
                  }}
                  className="w-full text-right px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 transition-colors shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة وجبة / طبق جديد</span>
                </button>
              ) : null}
            </div>

            {/* Quick Test Accounts Switcher (Only 2 accounts: Customer & Chef) */}
            <div className="pt-3 border-t border-stone-100">
              <div className="text-[10px] font-black text-stone-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
                <span>تبديل الحساب السريع:</span>
                <span className="text-[9px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.2 rounded">مستخدم / شيف</span>
              </div>
              <div className="grid grid-cols-2 gap-2 px-1">
                {(() => {
                  const customerAcc = users.find((u) => u.id === 'user-customer-1') || users.find((u) => u.role === 'customer');
                  if (!customerAcc) return null;
                  const isCurrent = currentUser.id === customerAcc.id;
                  return (
                    <button
                      key={customerAcc.id}
                      onClick={() => {
                        switchUser(customerAcc.id);
                      }}
                      className={`text-right p-2 text-xs flex items-center gap-2 rounded-xl transition-all border cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-black shadow-2xs ring-1 ring-amber-400/50'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      <img src={customerAcc.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-amber-300" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-extrabold">{customerAcc.full_name}</div>
                        <div className="text-[9px] text-amber-700 font-bold">مستخدم 🌟</div>
                      </div>
                    </button>
                  );
                })()}

                {(() => {
                  const chefAcc = users.find((u) => u.id === 'user-chef-nizar') || users.find((u) => u.role === 'chef');
                  if (!chefAcc) return null;
                  const isCurrent = currentUser.id === chefAcc.id;
                  return (
                    <button
                      key={chefAcc.id}
                      onClick={() => {
                        switchUser(chefAcc.id);
                      }}
                      className={`text-right p-2 text-xs flex items-center gap-2 rounded-xl transition-all border cursor-pointer ${
                        isCurrent
                          ? 'bg-orange-100/90 border-orange-500 text-orange-950 font-black shadow-2xs ring-1 ring-orange-400/50'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-orange-50 hover:border-orange-300'
                      }`}
                    >
                      <img src={chefAcc.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-orange-400" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-extrabold">{chefAcc.full_name}</div>
                        <div className="text-[9px] text-orange-700 font-bold">شيف 👨‍🍳</div>
                      </div>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-stone-100 bg-stone-50 space-y-2">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  setIsSideDrawerOpen(false);
                  logoutUser();
                  openAuthModal();
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-2xl font-extrabold text-xs text-rose-600 hover:bg-rose-100/70 border border-rose-200/80 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>تسجيل الخروج</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSideDrawerOpen(false);
                  openAuthModal();
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-2xl font-extrabold text-xs text-orange-700 hover:bg-orange-100/70 border border-orange-200/80 flex items-center gap-2 transition-colors cursor-pointer bg-white"
              >
                <LogIn className="w-4 h-4 text-orange-600" />
                <span>تسجيل الدخول</span>
              </button>
            )}

            <div className="text-center text-[10px] text-stone-400 pt-1">
              سُفرة v2.5 • مدعوم ببوابة DPAY الموحدة 🇱🇾
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Floating Quick Publish Button for Chefs */}
    {currentUser.role === 'chef' && (
      <button
        onClick={() => openCreatePostModal()}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white font-black text-xs sm:text-sm px-4 py-3 rounded-full shadow-2xl shadow-orange-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/30 backdrop-blur-md"
        title="نشر طبق أو وجبة جديدة"
      >
        <PlusCircle className="w-5 h-5 shrink-0" />
        <span className="font-extrabold">نشر وجبة 🍲</span>
      </button>
    )}
  </>
);
};
