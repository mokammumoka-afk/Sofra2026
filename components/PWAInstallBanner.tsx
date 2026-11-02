'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { BrandLogo } from './BrandLogo';
import {
  Download,
  Smartphone,
  X,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  Zap,
  Bell,
  WifiOff,
  HardDrive,
  ExternalLink,
  ChevronLeft,
  ArrowDown,
  Monitor,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallBanner: React.FC = () => {
  const { trackPWAInstall, trackVisit } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(true); // start true until client verifies
  const [showFullBanner, setShowFullBanner] = useState(false);
  const [showMiniPill, setShowMiniPill] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Check if app is installed
  const checkIsInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;

    // 1. Standalone CSS Media Query
    const isStandaloneMQ = window.matchMedia('(display-mode: standalone)').matches;

    // 2. iOS Safari standalone property
    const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // 3. Android TWA / app referrer
    const isAndroidApp =
      typeof document !== 'undefined' &&
      (document.referrer.includes('android-app://') || window.location.search.includes('source=pwa'));

    // 4. LocalStorage persistent flag
    const isLocallyMarked = localStorage.getItem('sofra_pwa_installed') === 'true';

    return isStandaloneMQ || isIOSStandalone || isAndroidApp || isLocallyMarked;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }

    // 2. Device detection
    const ua = navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    const installed = checkIsInstalled();

    let devType: 'android' | 'ios' | 'desktop' = 'desktop';
    if (isAndroidDevice) devType = 'android';
    else if (isIosDevice) devType = 'ios';

    // Initialize device detection and listeners without auto-showing intrusive banners
    const timer = setTimeout(() => {
      setIsIOS(isIosDevice);
      setIsAndroid(isAndroidDevice);
      setIsInstalled(installed);
      trackVisit(devType, window.location.pathname);
    }, 1000);

    // 5. Android/Chrome native beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 6. App Installed Event Handler
    const handleAppInstalled = () => {
      localStorage.setItem('sofra_pwa_installed', 'true');
      setIsInstalled(true);
      setShowFullBanner(false);
      setShowMiniPill(false);
      setShowInstallModal(false);
      setDeferredPrompt(null);
      setInstallSuccess(true);

      let installedDev: 'android' | 'ios' | 'desktop' = 'android';
      if (isIosDevice) installedDev = 'ios';
      else if (!isAndroidDevice) installedDev = 'desktop';

      trackPWAInstall(installedDev);

      setToastMessage('🎉 تم تثبيت تطبيق سُفرة بنجاح! التطبيق جاهز الآن على شاشتك الرئيسية.');
      setTimeout(() => setToastMessage(null), 6000);
    };

    // 7. Listen to standalone changes dynamically
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        localStorage.setItem('sofra_pwa_installed', 'true');
        setIsInstalled(true);
        setShowFullBanner(false);
        setShowMiniPill(false);
      }
    };

    // 8. Custom Event for opening install modal anywhere in the app
    const handleCustomOpen = () => {
      if (!checkIsInstalled()) {
        setShowInstallModal(true);
      } else {
        setToastMessage('تطبيق سفرة مثبت بالفعل على جهازك! 📱');
        setTimeout(() => setToastMessage(null), 3500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-pwa-install', handleCustomOpen);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install', handleCustomOpen);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, [checkIsInstalled, trackPWAInstall, trackVisit]);

  // Trigger Install Flow
  const handleInstallNow = async () => {
    if (isIOS) {
      setShowInstallModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          localStorage.setItem('sofra_pwa_installed', 'true');
          setIsInstalled(true);
          setShowFullBanner(false);
          setShowMiniPill(false);
          setShowInstallModal(false);

          let dev: 'android' | 'ios' | 'desktop' = 'android';
          if (!isAndroid) dev = 'desktop';
          trackPWAInstall(dev);

          setToastMessage('تم بدء تثبيت تطبيق سفرة بنجاح! 🚀');
          setTimeout(() => setToastMessage(null), 5000);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('[PWA Prompt Error]:', err);
        setShowInstallModal(true);
      }
    } else {
      // If native prompt is unavailable, show guided instructions
      setShowInstallModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowFullBanner(false);
    setShowMiniPill(true);
    sessionStorage.setItem('sofra_pwa_dismissed_session', 'true');
  };

  const handleCloseMiniPill = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMiniPill(false);
    localStorage.setItem('sofra_pwa_dismissed_permanent', 'true');
  };

  // If user has already installed the PWA, render NOTHING
  if (isInstalled) return null;

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl border border-amber-500/50 flex items-center gap-2.5 animate-bounce max-w-[90vw]">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Main Floating Luxury Install Card (Polite & High-Converting) */}
      {showFullBanner && (
        <div className="fixed bottom-6 right-3 left-3 sm:right-auto sm:left-6 sm:max-w-md z-40 animate-fadeIn transition-all duration-300">
          <div className="bg-stone-950/95 backdrop-blur-xl text-white rounded-3xl p-5 border border-stone-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden space-y-4">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header: App Info + Close Button */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <BrandLogo size="lg" withGlow={true} />
                  <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 p-0.5 rounded-full shadow-xs">
                    <Sparkles className="w-3 h-3 text-stone-950" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-white tracking-tight">سُفرة ليبيا</h3>
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                      PWA رسمي
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 font-medium mt-0.5">
                    أول تطبيق ومجتمع للأكل المنزلي في ليبيا 🇱🇾
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismissBanner}
                className="text-stone-400 hover:text-white bg-stone-900/80 hover:bg-stone-800 p-1.5 rounded-full transition-colors cursor-pointer shrink-0 border border-stone-800"
                title="إغلاق التنبيه والاحتفاظ بزر التثبيت المصغر"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Key Value Proposition Chips */}
            <div className="grid grid-cols-2 gap-2 relative z-10">
              <div className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-stone-200">أسرع 3x وتصفح سلس</span>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-stone-200">إشعارات فورية للطلبات</span>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <WifiOff className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-stone-200">توفير رصيد النت</span>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 p-2 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-stone-200">خفيف جداً (&lt; 2MB)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 relative z-10">
              <button
                onClick={handleInstallNow}
                className="flex-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-stone-950 font-black text-xs py-3 px-4 rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-950 shrink-0" />
                <span>
                  {isIOS
                    ? 'تثبيت على آيفون (iOS) 🍎'
                    : isAndroid
                    ? 'تثبيت فوري على أندرويد ⚡'
                    : 'تثبيت التطبيق الآن 💻'}
                </span>
              </button>

              <button
                onClick={handleDismissBanner}
                className="bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-bold text-xs py-3 px-3.5 rounded-2xl transition-all border border-stone-800 cursor-pointer"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Minimized Floating Pill (When user clicked 'Later', stays discreetly ready) */}
      {showMiniPill && !showFullBanner && (
        <div className="fixed bottom-6 left-3 sm:left-6 z-40 animate-fadeIn">
          <div
            onClick={() => setShowInstallModal(true)}
            className="group bg-gradient-to-r from-stone-900 to-stone-950 hover:from-orange-950 hover:to-stone-900 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-full shadow-2xl border border-amber-500/40 hover:border-amber-400 flex items-center gap-2.5 cursor-pointer transition-all duration-300 hover:scale-105"
            title="انقر لتثبيت تطبيق سفرة على هاتفك"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-stone-950 font-black shrink-0 shadow-xs">
              <Download className="w-3.5 h-3.5 text-stone-950" />
            </div>

            <div className="flex flex-col text-right">
              <span className="text-xs font-black text-white flex items-center gap-1">
                <span>تثبيت التطبيق 📲</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-[9px] text-amber-300 font-bold hidden sm:inline-block">
                بدون متجر • مجاناً
              </span>
            </div>

            <button
              onClick={handleCloseMiniPill}
              className="text-stone-500 hover:text-white p-1 rounded-full hover:bg-stone-800 transition-colors ml-1"
              title="إخفاء نهائي"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Comprehensive Step-by-Step Installation Modal (For iOS Safari or fallback) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn border border-stone-200 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 left-4 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="relative inline-block">
                <BrandLogo size="xl" withGlow={true} />
                <span className="absolute -bottom-1 -right-1 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                  PWA
                </span>
              </div>
              <h3 className="font-black text-lg text-stone-900">
                {isIOS ? 'تثبيت سفرة على آيفون (iOS Safari) 🍏' : 'تثبيت تطبيق سفرة على جهازك 📱'}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed font-medium">
                استمتع بتجربة تطبيق أصلية وسريعة بدون الحاجة لتنزيل من متجر التطبيقات.
              </p>
            </div>

            {/* Device Specific Step by Step Instructions */}
            {isIOS ? (
              <div className="bg-stone-50 border border-stone-200/90 p-4 rounded-2xl space-y-3.5 text-xs text-stone-800">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">
                      اضغط على زر <span className="text-orange-600">«المشاركة»</span> في أسفل المتصفح:
                    </p>
                    <div className="inline-flex items-center gap-1 bg-white border border-stone-200 text-stone-700 px-2.5 py-1 rounded-lg mt-1 font-bold text-[11px] shadow-2xs">
                      <Share2 className="w-4 h-4 text-blue-600" />
                      <span>زر المشاركة (Share Icon)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">
                      مرر القائمة لأسفل واضغط على <span className="text-orange-600">«إضافة إلى الشاشة الرئيسية»</span>:
                    </p>
                    <div className="inline-flex items-center gap-1.5 bg-white border border-stone-200 text-stone-700 px-2.5 py-1 rounded-lg mt-1 font-bold text-[11px] shadow-2xs">
                      <PlusSquare className="w-4 h-4 text-stone-900" />
                      <span>إضافة إلى الصفحة الرئيسية (Add to Home Screen)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">
                      اضغط على <span className="text-emerald-700 font-black">«إضافة Add»</span> في أعلى الزاوية.
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      سيظهر شعار التطبيق فوراً على شاشة هاتفك مع باقي تطبيقاتك اليومية!
                    </p>
                  </div>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="bg-stone-50 border border-stone-200/90 p-4 rounded-2xl space-y-3 text-xs text-stone-800">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">
                      إذا لم يظهر التثبيت التلقائي، اضغط على زر الخيارات <strong className="text-stone-900">« الثلاث نقاط ⋮ »</strong> في زاوية المتصفح (Chrome / Edge / Samsung).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">
                      اختر <strong className="text-orange-600">«تثبيت التطبيق Install App»</strong> أو <strong className="text-orange-600">«إضافة إلى الشاشة الرئيسية»</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 border border-stone-200/90 p-4 rounded-2xl space-y-3 text-xs text-stone-800">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">تثبيت التطبيق على الكمبيوتر (Windows / Mac):</p>
                    <p className="text-stone-600 mt-1 leading-relaxed">
                      انقر على أيقونة التثبيت <strong className="text-orange-600">« ⊕ Install »</strong> الموجودة في نهاية شريط العنوان بمتصفح Chrome أو Edge لتشغيل سفرة كتطبيق سطح مكتب منفصل وسريع.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Action */}
            <div className="space-y-2">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallNow}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 font-black text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-stone-950" />
                  <span>بدء التثبيت الآن ⚡</span>
                </button>
              )}

              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black text-xs py-3 rounded-2xl transition-all shadow-sm cursor-pointer"
              >
                فهمت الطريقة 👍
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
