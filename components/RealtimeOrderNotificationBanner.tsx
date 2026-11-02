'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Order, OrderStatus } from '@/lib/types';
import { playOrderAlertChime } from '@/lib/audioNotification';
import {
  Truck,
  ChefHat,
  CheckCircle2,
  Clock,
  X,
  Volume2,
  VolumeX,
  MapPin,
  ExternalLink,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveOrderAlert {
  id: string;
  orderId: string;
  postTitle: string;
  postImage: string;
  chefName: string;
  customerName: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  city: string;
  timestamp: number;
}

interface RealtimeOrderNotificationBannerProps {
  onOpenOrderTracking?: (orderId: string) => void;
  onNavigateToOrders?: () => void;
  onNavigateToLiveMap?: () => void;
}

export const RealtimeOrderNotificationBanner: React.FC<RealtimeOrderNotificationBannerProps> = ({
  onOpenOrderTracking,
  onNavigateToOrders,
  onNavigateToLiveMap,
}) => {
  const { orders, currentUser } = useStore();
  const [activeAlerts, setActiveAlerts] = useState<ActiveOrderAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const previousOrdersRef = useRef<Map<string, OrderStatus>>(new Map());
  const isInitialMount = useRef<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

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

  // Listen to order status changes in real-time
  useEffect(() => {
    if (isInitialMount.current) {
      // Record initial states on first mount without triggering alerts
      orders.forEach((o) => {
        previousOrdersRef.current.set(o.id, o.status);
      });
      isInitialMount.current = false;
      return;
    }

    const prevMap = previousOrdersRef.current;
    const newAlerts: ActiveOrderAlert[] = [];

    orders.forEach((order) => {
      const prevStatus = prevMap.get(order.id);
      // Status transition detected
      if (prevStatus && prevStatus !== order.status) {
        // Check if the current user is involved (customer, chef, or admin)
        const isParticipant =
          order.customer_id === currentUser.id ||
          order.chef_id === currentUser.id ||
          currentUser.role === 'admin' ||
          currentUser.id === 'usr-1'; // guest / demo participant

        if (isParticipant) {
          newAlerts.push({
            id: `alert-${order.id}-${order.status}-${Date.now()}`,
            orderId: order.id,
            postTitle: order.post_title,
            postImage: order.post_image,
            chefName: order.chef_name,
            customerName: order.customer_name,
            previousStatus: prevStatus,
            newStatus: order.status,
            city: order.delivery_city,
            timestamp: Date.now(),
          });
        }
      }
      // Update record
      prevMap.set(order.id, order.status);
    });

    if (newAlerts.length > 0) {
      // Trigger chime sound if enabled
      if (soundEnabled) {
        playOrderAlertChime();
      }

      // Haptic feedback for mobile devices
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([120, 60, 120]);
        } catch {
          // ignore
        }
      }

      setActiveAlerts((prev) => [...newAlerts, ...prev].slice(0, 3));
    }
  }, [orders, currentUser, soundEnabled]);

  // Auto-dismiss alert after 7 seconds
  useEffect(() => {
    if (activeAlerts.length === 0) return;

    const timer = setTimeout(() => {
      setActiveAlerts((prev) => prev.slice(0, -1));
    }, 7000);

    return () => clearTimeout(timer);
  }, [activeAlerts]);

  const dismissAlert = (alertId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'accepted':
        return {
          icon: <ChefHat className="w-4 h-4 text-emerald-400" />,
          title: 'تم قبول طلبك! 🍳',
          desc: 'وافق الشيف على الطلب وبدأ تجهيز المطبخ.',
          bg: 'from-stone-900 via-stone-900 to-emerald-950',
          borderColor: 'border-emerald-500/50',
          accent: 'text-emerald-400',
        };
      case 'preparing':
        return {
          icon: <Flame className="w-4 h-4 text-amber-400" />,
          title: 'جاري طهي الوجبة الآن! 🔥',
          desc: 'الشيف بدأ تحضير المكونات والطهي الطازج.',
          bg: 'from-stone-900 via-stone-900 to-amber-950',
          borderColor: 'border-amber-500/50',
          accent: 'text-amber-400',
        };
      case 'out_for_delivery':
        return {
          icon: <Truck className="w-4 h-4 text-orange-400" />,
          title: 'خرج للتوصيل مع المندوب! 🚗💨',
          desc: 'استلم المندوب شحنتك وهو في طريقه إلى عنوانك.',
          bg: 'from-stone-900 via-stone-900 to-orange-950',
          borderColor: 'border-orange-500/50',
          accent: 'text-orange-400',
        };
      case 'delivered':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          title: 'تم تسليم الوجبة بنجاح! 🎉',
          desc: 'ألف صحة وعافية! نرجو تأكيد رضاك عن الوجبة.',
          bg: 'from-stone-900 via-stone-900 to-emerald-950',
          borderColor: 'border-emerald-500/60',
          accent: 'text-emerald-400',
        };
      case 'cancelled':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          title: 'تم إلغاء الطلب ❌',
          desc: 'تم استرداد المبلغ بالكامل إلى محفظتك.',
          bg: 'from-stone-900 via-stone-900 to-rose-950',
          borderColor: 'border-rose-500/50',
          accent: 'text-rose-400',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-stone-300" />,
          title: 'تحديث حالة الطلب',
          desc: `الحالة الجديدة: ${status}`,
          bg: 'from-stone-900 to-stone-850',
          borderColor: 'border-stone-700',
          accent: 'text-stone-300',
        };
    }
  };

  if (!isMounted || activeAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 sm:top-6 left-3 sm:left-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {activeAlerts.map((alert) => {
          const statusInfo = getStatusBadge(alert.newStatus);
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 25 }}
              className={`pointer-events-auto bg-gradient-to-r ${statusInfo.bg} text-white rounded-2xl p-3.5 shadow-2xl border ${statusInfo.borderColor} backdrop-blur-md relative overflow-hidden`}
              dir="rtl"
            >
              {/* Progress animation line on top */}
              <div className="absolute top-0 inset-x-0 h-1 bg-stone-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 animate-[progress_7s_linear]" />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Order thumbnail */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-stone-700 bg-stone-800">
                    <img
                      src={alert.postImage}
                      alt={alert.postTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-0.5 right-0.5 p-0.5 rounded-full bg-stone-950/80">
                      {statusInfo.icon}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-black text-xs text-orange-400">
                        #{alert.orderId}
                      </span>
                      <span className="font-black text-xs text-white truncate">
                        {statusInfo.title}
                      </span>
                      <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full font-bold">
                        الآن
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-300 font-bold truncate mt-0.5">
                      {alert.postTitle}
                    </div>

                    <div className="text-[10px] text-stone-400 mt-0.5 leading-snug">
                      {statusInfo.desc}
                    </div>
                  </div>
                </div>

                {/* Dismiss button & sound toggle */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={toggleSound}
                    className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
                    title={soundEnabled ? 'كتم صوت التنبيه' : 'تشغيل صوت التنبيه'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                    )}
                  </button>

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-stone-800/80">
                {alert.newStatus === 'out_for_delivery' && onNavigateToLiveMap && (
                  <button
                    onClick={() => {
                      dismissAlert(alert.id);
                      onNavigateToLiveMap();
                    }}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>تتبع مسار المندوب 🛰️</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    dismissAlert(alert.id);
                    if (onOpenOrderTracking) {
                      onOpenOrderTracking(alert.orderId);
                    } else if (onNavigateToOrders) {
                      onNavigateToOrders();
                    }
                  }}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-orange-400" />
                  <span>تفاصيل الشحنة</span>
                </button>

                <div className="mr-auto text-[10px] text-stone-400 font-bold">
                  {alert.city} • الشيف: {alert.chefName}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
