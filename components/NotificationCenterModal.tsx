'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { NotificationItem, OrderStatus } from '@/lib/types';
import { playOrderAlertChime } from '@/lib/audioNotification';
import {
  Bell,
  CheckCircle2,
  Clock,
  Truck,
  ChefHat,
  Flame,
  ShieldAlert,
  Wallet,
  MessageSquare,
  AlertTriangle,
  Trash2,
  CheckCheck,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  MapPin,
  Sparkles,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOrderTracking?: (orderId: string) => void;
  onNavigateToOrders?: () => void;
  onNavigateToLiveMap?: () => void;
  onNavigateToWallet?: () => void;
}

type NotificationFilter = 'all' | 'orders' | 'wallet' | 'system';

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenOrderTracking,
  onNavigateToOrders,
  onNavigateToLiveMap,
  onNavigateToWallet,
}) => {
  const {
    notifications,
    orders,
    currentUser,
    markNotificationsRead,
    markSingleNotificationRead,
    deleteNotification,
    clearAllNotifications,
    updateOrderStatus,
    confirmOrderDeliveryAndReleaseEscrow,
  } = useStore();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  // Initialize sound preference
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('sofra_sound_enabled');
          if (saved !== null) {
            setSoundEnabled(saved === 'true');
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sofra_sound_enabled', String(nextVal));
    }
    if (nextVal) {
      playOrderAlertChime();
    }
  };

  // Filter notifications relevant to current user
  const userNotifications = useMemo(() => {
    return notifications.filter(
      (n) =>
        n.user_id === currentUser.id ||
        n.user_id === 'all' ||
        (currentUser.role === 'admin' && n.user_id === 'admin')
    );
  }, [notifications, currentUser]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => !n.is_read).length;
  }, [userNotifications]);

  // Filter by category
  const filteredNotifications = useMemo(() => {
    return userNotifications.filter((n) => {
      if (activeFilter === 'orders') {
        return n.type === 'order' || !!n.order_id || !!n.order_status;
      }
      if (activeFilter === 'wallet') {
        return (
          n.title.includes('محفظة') ||
          n.title.includes('الضمان') ||
          n.title.includes('Escrow') ||
          n.title.includes('سحب') ||
          n.title.includes('تحويل') ||
          n.title.includes('استرداد') ||
          n.content.includes('د.ل')
        );
      }
      if (activeFilter === 'system') {
        return (
          n.type === 'system' ||
          n.type === 'verification' ||
          n.type === 'dispute' ||
          n.type === 'warning'
        );
      }
      return true;
    });
  }, [userNotifications, activeFilter]);

  // Find a sample active order to simulate status transitions on
  const sampleOrder = useMemo(() => {
    return orders.find(
      (o) =>
        o.customer_id === currentUser.id ||
        ['pending', 'accepted', 'preparing', 'out_for_delivery'].includes(o.status)
    ) || orders[0];
  }, [orders, currentUser]);

  const handleSimulateOrderStatus = (targetStatus: OrderStatus) => {
    if (!sampleOrder) return;
    updateOrderStatus(sampleOrder.id, targetStatus);
    if (soundEnabled) {
      playOrderAlertChime();
    }
    const statusArabic =
      targetStatus === 'accepted'
        ? 'تم القبول 🍳'
        : targetStatus === 'preparing'
        ? 'جاري الطهي 🔥'
        : targetStatus === 'out_for_delivery'
        ? 'خرج للتوصيل 🚗'
        : targetStatus === 'delivered'
        ? 'تم التسليم 🎉'
        : targetStatus;

    setSimulationToast(`تم تحديث الطلب #${sampleOrder.id} إلى (${statusArabic}) وإرسال التنبيه الفوري!`);
    setTimeout(() => setSimulationToast(null), 3500);
  };

  const getNotificationIcon = (item: NotificationItem) => {
    if (item.order_status) {
      switch (item.order_status) {
        case 'accepted':
          return <ChefHat className="w-4 h-4 text-emerald-600" />;
        case 'preparing':
          return <Flame className="w-4 h-4 text-amber-600" />;
        case 'out_for_delivery':
          return <Truck className="w-4 h-4 text-orange-600" />;
        case 'delivered':
          return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
        case 'cancelled':
          return <AlertTriangle className="w-4 h-4 text-rose-600" />;
        default:
          return <ShoppingBag className="w-4 h-4 text-orange-600" />;
      }
    }

    switch (item.type) {
      case 'order':
        return <Truck className="w-4 h-4 text-orange-600" />;
      case 'gift':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'dispute':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-stone-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-950 via-stone-900 to-orange-950 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/30 text-orange-400 border border-orange-500/40 flex items-center justify-center relative">
              <Bell className="w-5 h-5 fill-orange-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  مركز الإشعارات والتنبيهات الحية
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time</span>
                </span>
                {unreadCount > 0 && (
                  <span className="bg-orange-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                تحديثات فورية لحالات طلباتك، وموقع المندوب، والضمان المالي والمحفظة
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Sound toggle button */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                soundEnabled
                  ? 'bg-stone-800 text-emerald-400 border-stone-700 hover:bg-stone-700'
                  : 'bg-stone-800/60 text-stone-400 border-stone-800 hover:text-stone-300'
              }`}
              title={soundEnabled ? 'صوت التنبيهات الحية مفعّل' : 'صوت التنبيهات مكتوم'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline text-[10px]">الصوت مفعّل</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-stone-400" />
                  <span className="hidden sm:inline text-[10px]">مكتوم</span>
                </>
              )}
            </button>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <button
                onClick={markNotificationsRead}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="تحديد كل الإشعارات كمقروءة"
              >
                <CheckCheck className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-[10px]">قراءة الكل</span>
              </button>
            )}

            {/* Close modal */}
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Order Simulation Playground Banner */}
        <div className="bg-amber-50/90 border-b border-amber-200/90 p-3 sm:px-5 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <div>
              <span className="font-black text-xs text-amber-950 block">
                تجربة التنبيهات المباشرة بالزمن الحقيقي:
              </span>
              <span className="text-[10px] text-amber-800">
                اضغط على أي مرحلة لاختبار صوت التنبيه وظهور البانر العلوي فوراً
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleSimulateOrderStatus('accepted')}
              className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-[11px] px-2.5 py-1 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              🍳 تم القبول
            </button>
            <button
              onClick={() => handleSimulateOrderStatus('preparing')}
              className="bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-extrabold text-[11px] px-2.5 py-1 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              🔥 جاري الطهي
            </button>
            <button
              onClick={() => handleSimulateOrderStatus('out_for_delivery')}
              className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              🚗 خرج للتوصيل
            </button>
            <button
              onClick={() => handleSimulateOrderStatus('delivered')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              🎉 تم التسليم
            </button>
          </div>
        </div>

        {/* Simulation Feedback Alert */}
        {simulationToast && (
          <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center transition-all animate-in fade-in">
            {simulationToast}
          </div>
        )}

        {/* Category Tabs */}
        <div className="p-3 bg-stone-100/80 border-b border-stone-200/90 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-white text-stone-900 font-black shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>الكل</span>
              <span className="bg-stone-200 text-stone-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {userNotifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('orders')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'orders'
                  ? 'bg-white text-orange-700 font-black shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-orange-600" />
              <span>الطلبيات والتوصيل</span>
            </button>

            <button
              onClick={() => setActiveFilter('wallet')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'wallet'
                  ? 'bg-white text-emerald-800 font-black shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>المحفظة والضمان</span>
            </button>

            <button
              onClick={() => setActiveFilter('system')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'system'
                  ? 'bg-white text-stone-900 font-black shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-stone-600" />
              <span>النظام</span>
            </button>
          </div>

          {userNotifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-[11px] font-bold text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              title="مسح كافة الإشعارات"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">مسح السجل</span>
            </button>
          )}
        </div>

        {/* Notifications List Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-stone-100">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-7 h-7 stroke-1" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-stone-800">لا توجد إشعارات حالياً</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  ستظهر هنا فوراً كل تحديثات طلباتك ومسار المندوب وحركات المحفظة بالزمن الحقيقي.
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const matchedOrder = notif.order_id
                ? orders.find((o) => o.id === notif.order_id)
                : null;

              return (
                <div
                  key={notif.id}
                  className={`pt-2.5 first:pt-0 p-3 rounded-2xl transition-all border ${
                    !notif.is_read
                      ? 'bg-orange-50/60 border-orange-200/90 shadow-2xs'
                      : 'bg-white hover:bg-stone-50/80 border-stone-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Icon or Order Photo */}
                      {notif.post_image || matchedOrder?.post_image ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                          <img
                            src={notif.post_image || matchedOrder?.post_image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 right-0 p-0.5 bg-white/90 rounded-tl-md">
                            {getNotificationIcon(notif)}
                          </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                          {getNotificationIcon(notif)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-xs text-stone-900">
                            {notif.title}
                          </h4>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse shrink-0" />
                          )}
                          {notif.order_status && (
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                notif.order_status === 'out_for_delivery'
                                  ? 'bg-orange-100 text-orange-800'
                                  : notif.order_status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : notif.order_status === 'preparing'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {notif.order_status === 'out_for_delivery'
                                ? '🚗 خرج للتوصيل'
                                : notif.order_status === 'delivered'
                                ? '🎉 تم التسليم'
                                : notif.order_status === 'preparing'
                                ? '🔥 جاري الطهي'
                                : notif.order_status === 'accepted'
                                ? '🍳 تم القبول'
                                : notif.order_status}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                          {notif.content}
                        </p>

                        {/* Order Timeline indicator if applicable */}
                        {notif.order_status && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-stone-500 mt-2 bg-stone-50 p-2 rounded-xl border border-stone-200/80">
                            <span
                              className={
                                ['accepted', 'preparing', 'out_for_delivery', 'delivered'].includes(
                                  notif.order_status
                                )
                                  ? 'text-emerald-700 font-black'
                                  : 'text-stone-400'
                              }
                            >
                              1. تم القبول
                            </span>
                            <span>←</span>
                            <span
                              className={
                                ['preparing', 'out_for_delivery', 'delivered'].includes(
                                  notif.order_status
                                )
                                  ? 'text-amber-700 font-black'
                                  : 'text-stone-400'
                              }
                            >
                              2. جاري الطهي
                            </span>
                            <span>←</span>
                            <span
                              className={
                                ['out_for_delivery', 'delivered'].includes(notif.order_status)
                                  ? 'text-orange-700 font-black'
                                  : 'text-stone-400'
                              }
                            >
                              3. خرج للتوصيل
                            </span>
                            <span>←</span>
                            <span
                              className={
                                notif.order_status === 'delivered'
                                  ? 'text-emerald-700 font-black'
                                  : 'text-stone-400'
                              }
                            >
                              4. تم التسليم
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-stone-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(notif.created_at).toLocaleTimeString('ar-LY', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {notif.order_id && (
                            <span className="font-mono text-stone-500">
                              #{notif.order_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions on this single notification */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1">
                        {!notif.is_read && (
                          <button
                            onClick={() => markSingleNotificationRead(notif.id)}
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                            title="تحديد كمقروء"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded-lg transition-colors"
                          title="حذف الإشعار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Interactive Target Action */}
                      {notif.order_id && (
                        <div className="flex items-center gap-1">
                          {notif.order_status === 'out_for_delivery' && onNavigateToLiveMap && (
                            <button
                              onClick={() => {
                                markSingleNotificationRead(notif.id);
                                onClose();
                                onNavigateToLiveMap();
                              }}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>الخريطة 🛰️</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              markSingleNotificationRead(notif.id);
                              onClose();
                              if (onOpenOrderTracking && notif.order_id) {
                                onOpenOrderTracking(notif.order_id);
                              } else if (onNavigateToOrders) {
                                onNavigateToOrders();
                              }
                            }}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-[10px] px-2 py-1 rounded-lg transition-all border border-stone-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span>تفاصيل</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}

                      {/* Deliveries confirmation direct action */}
                      {matchedOrder &&
                        matchedOrder.status === 'delivered' &&
                        !matchedOrder.escrow_released_at &&
                        matchedOrder.customer_id === currentUser.id && (
                          <button
                            onClick={() => {
                              confirmOrderDeliveryAndReleaseEscrow(matchedOrder.id);
                              markSingleNotificationRead(notif.id);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer"
                          >
                            تأكيد الاستلام ورضاك ✅
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px]">مربوطة مع نظام إشعارات المطبخ والمندوب المباشر</span>
          </div>

          <button
            onClick={onClose}
            className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-extrabold text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
