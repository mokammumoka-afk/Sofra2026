'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  ChefProfile,
  Post,
  Comment,
  Order,
  WalletTransaction,
  Gift,
  GiftItem,
  SponsoredPost,
  NotificationItem,
  AuditLog,
  Story,
  OrderStatus,
  UserRole,
  Conversation,
  Message,
  Dispute,
  DisputeReason,
  TransactionStatus,
  PayoutType,
  PayoutRequest,
  AppCommissionSettings,
  SystemPlatformSettings,
  FilterViolation,
  SellerRiskScore,
  ContentReport,
  SiteVisit,
  PWAAnalyticsSummary,
  ChefReview,
} from './types';
import { checkDisintermediationFilter } from './securityFilter';
import {
  INITIAL_USERS,
  INITIAL_CHEF_PROFILES,
  INITIAL_POSTS,
  INITIAL_STORIES,
  INITIAL_REVIEWS,
  GiftPackage,
  GIFT_PACKAGES,
} from './constants';
import { getDeliveryProvider, getDeliveryFee, MIN_ORDER_AMOUNT } from './delivery/DeliveryProvider';
import { resolveLocationCoordinates } from './delivery/coordinates';
import { dpayService } from './dpay/dpay-service';
import { generateUniqueId, compressImage } from './utils';

const STATIC_BASE_TIME = 1754280000000; // Fixed timestamp for purity

const INITIAL_SITE_VISITS: SiteVisit[] = Array.from({ length: 168 }, (_, idx) => {
  const devices: ('android' | 'ios' | 'desktop')[] = ['android', 'ios', 'desktop', 'android', 'android', 'ios'];
  const cities = ['طرابلس', 'بنغازي', 'مصراتة', 'سبها', 'البيضاء', 'الزاوية', 'زليتن', 'الخمس'];
  const dev = devices[idx % devices.length];
  const city = cities[idx % cities.length];
  const daysAgo = Math.floor(idx / 6);
  const createdDate = new Date(STATIC_BASE_TIME - daysAgo * 86400000 - (idx % 24) * 3600000).toISOString();
  const isPWA = idx % 4 === 0;

  return {
    id: `vst-${1000 + idx}`,
    session_id: `sess-${Math.floor(idx / 2)}`,
    user_id: idx % 3 === 0 ? `usr-${(idx % 5) + 1}` : null,
    device_type: dev,
    is_pwa_install: isPWA,
    entry_page: idx % 3 === 0 ? '/' : idx % 3 === 1 ? '/explore' : '/chefs',
    city,
    created_at: createdDate,
  };
});

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-init-welcome-all',
    user_id: 'all',
    type: 'system',
    title: 'مرحباً بك في منصة سفرة 🍽️Libya',
    content: 'أول منصة ليبية متكاملة لربط الأسر المنتجة والشيفات مع محبي الأكل المنزلي الأصيل.',
    is_read: false,
    created_at: new Date(STATIC_BASE_TIME).toISOString(),
  },
  {
    id: 'notif-init-salem',
    user_id: 'usr-1',
    type: 'system',
    title: 'شحن المحفظة جاهز 💳',
    content: 'رصيدك جاهز لطلب أشهى الأطباق من طباخين مدينتك مباشرة عبر كرت تداول أو المحافظ الرقمية.',
    is_read: false,
    created_at: new Date(STATIC_BASE_TIME - 3600000).toISOString(),
  },
  {
    id: 'notif-init-fatima',
    user_id: 'usr-chef-1',
    type: 'order',
    title: 'تنبيه الشيف الموثق 👨‍🍳',
    content: 'حساب مطبخك جاهز لاستقبال الطلبات وتوثيق الشارة الخضراء. جميع مستحقاتك محفوظة بنظام الضمان.',
    is_read: false,
    created_at: new Date(STATIC_BASE_TIME - 7200000).toISOString(),
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    customer_id: 'usr-1',
    customer_name: 'سالم بن علي',
    customer_phone: '0912345678',
    post_id: 'post-1',
    post_title: 'كسكسي ليبي بالبصلة ولحم الخروف الوطني',
    post_image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80',
    chef_id: 'usr-chef-1',
    chef_name: 'شيف فاطمة الزهراء',
    quantity: 2,
    unit_price: 45,
    total_price: 100,
    delivery_provider: 'talabk',
    delivery_id: 'dlv-7819',
    delivery_address: 'بن عاشور، قرب جامع الصقع',
    delivery_city: 'طرابلس',
    status: 'delivered',
    payment_status: 'paid',
    dispute_status: 'none',
    escrow_amount: 85,
    commission_amount: 15,
    delivered_at: new Date(STATIC_BASE_TIME - 3600000 * 20).toISOString(),
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 24).toISOString(),
    updated_at: new Date(STATIC_BASE_TIME - 3600000 * 20).toISOString(),
  },
  {
    id: 'ord-102',
    customer_id: 'usr-2',
    customer_name: 'مروان الطرابلسي',
    customer_phone: '0925551234',
    post_id: 'post-2',
    post_title: 'طاجين جبن ومحشي بوريك ليبي مشكل',
    post_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    chef_id: 'usr-chef-1',
    chef_name: 'شيف فاطمة الزهراء',
    quantity: 1,
    unit_price: 35,
    total_price: 45,
    delivery_provider: 'drubi',
    delivery_id: 'dlv-7820',
    delivery_address: 'حي الأندلس، طرابلس',
    delivery_city: 'طرابلس',
    status: 'out_for_delivery',
    payment_status: 'paid',
    dispute_status: 'none',
    escrow_amount: 38.25,
    commission_amount: 6.75,
    pickup_lat: 32.8805,
    pickup_lng: 13.2045,
    delivery_lat: 32.8885,
    delivery_lng: 13.1420,
    driver_lat: 32.8845,
    driver_lng: 13.1730,
    driver_name: 'محمد الفيتوري',
    driver_phone: '092-7771122',
    driver_speed_kmh: 42,
    delivery_progress_percent: 65,
    estimated_arrival_mins: 11,
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 2).toISOString(),
    updated_at: new Date(STATIC_BASE_TIME - 3600000 * 1).toISOString(),
  },
  {
    id: 'ord-104',
    customer_id: 'usr-1',
    customer_name: 'سالم بن علي',
    customer_phone: '0912345678',
    post_id: 'post-4',
    post_title: 'كباب طرابلسي وشيش مشكل على الفحم',
    post_image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    chef_id: 'usr-chef-3',
    chef_name: 'شيف طارق الفرجاني',
    quantity: 2,
    unit_price: 40,
    total_price: 90,
    delivery_provider: 'talabk',
    delivery_id: 'dlv-9941',
    delivery_address: 'النوفليين، قرب طريق الشط',
    delivery_city: 'طرابلس',
    status: 'out_for_delivery',
    payment_status: 'paid',
    dispute_status: 'none',
    escrow_amount: 76.5,
    commission_amount: 13.5,
    pickup_lat: 32.8720,
    pickup_lng: 13.2450,
    delivery_lat: 32.8752,
    delivery_lng: 13.2180,
    driver_lat: 32.8735,
    driver_lng: 13.2310,
    driver_name: 'علي الورفلي',
    driver_phone: '091-8884433',
    driver_speed_kmh: 38,
    delivery_progress_percent: 48,
    estimated_arrival_mins: 15,
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 1.5).toISOString(),
    updated_at: new Date(STATIC_BASE_TIME - 3600000 * 0.8).toISOString(),
  },
  {
    id: 'ord-105',
    customer_id: 'usr-3',
    customer_name: 'أيمن الفيتوري',
    customer_phone: '0947778899',
    post_id: 'post-6',
    post_title: 'شوربة سيبيا وطاجين سمك دنيس طازج',
    post_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80',
    chef_id: 'usr-chef-5',
    chef_name: 'شيف ناصر السنوسي',
    quantity: 1,
    unit_price: 65,
    total_price: 75,
    delivery_provider: 'drubi',
    delivery_id: 'dlv-5520',
    delivery_address: 'طابلينو، بنغازي',
    delivery_city: 'بنغازي',
    status: 'out_for_delivery',
    payment_status: 'paid',
    dispute_status: 'none',
    escrow_amount: 63.75,
    commission_amount: 11.25,
    pickup_lat: 32.1080,
    pickup_lng: 20.0650,
    delivery_lat: 32.1020,
    delivery_lng: 20.0480,
    driver_lat: 32.1055,
    driver_lng: 20.0570,
    driver_name: 'سالم الشريف',
    driver_phone: '091-5559900',
    driver_speed_kmh: 46,
    delivery_progress_percent: 72,
    estimated_arrival_mins: 8,
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 1.2).toISOString(),
    updated_at: new Date(STATIC_BASE_TIME - 3600000 * 0.4).toISOString(),
  },
  {
    id: 'ord-106',
    customer_id: 'usr-2',
    customer_name: 'مروان الطرابلسي',
    customer_phone: '0925551234',
    post_id: 'post-5',
    post_title: 'بوكس مقروض ليبي بالعسل الحر وغريبة',
    post_image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    chef_id: 'usr-chef-4',
    chef_name: 'شيف خديجة الورفلي',
    quantity: 2,
    unit_price: 30,
    total_price: 70,
    delivery_provider: 'express_ly',
    delivery_id: 'dlv-3390',
    delivery_address: 'الرويسات، مصراتة',
    delivery_city: 'مصراتة',
    status: 'preparing',
    payment_status: 'paid',
    dispute_status: 'none',
    escrow_amount: 59.5,
    commission_amount: 10.5,
    pickup_lat: 32.3810,
    pickup_lng: 15.0920,
    delivery_lat: 32.3650,
    delivery_lng: 15.1950,
    driver_lat: 32.3810,
    driver_lng: 15.0920,
    driver_name: 'عبد الرحمن القمودي',
    driver_phone: '092-3332211',
    driver_speed_kmh: 0,
    delivery_progress_percent: 15,
    estimated_arrival_mins: 35,
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 0.5).toISOString(),
    updated_at: new Date(STATIC_BASE_TIME - 3600000 * 0.1).toISOString(),
  },
  {
    id: 'ord-103',
    customer_id: 'usr-3',
    customer_name: 'أيمن الفيتوري',
    customer_phone: '0947778899',
    post_id: 'post-3',
    post_title: 'رشتة كسكاس فاخرة بالقديد والصلصة',
    post_image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    chef_id: 'usr-chef-2',
    chef_name: 'شيف عائشة المصراتي',
    quantity: 1,
    unit_price: 50,
    total_price: 60,
    delivery_provider: 'express_ly',
    delivery_id: 'dlv-7821',
    delivery_address: 'الفويهات، بنغازي',
    delivery_city: 'بنغازي',
    status: 'disputed',
    payment_status: 'paid',
    dispute_status: 'opened',
    escrow_amount: 51,
    commission_amount: 9,
    delivered_at: new Date(STATIC_BASE_TIME - 3600000 * 10).toISOString(),
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 12).toISOString(),
    updated_at: new Date(STATIC_BASE_TIME - 3600000 * 10).toISOString(),
  },
];

const INITIAL_DISPUTES: Dispute[] = [
  {
    id: 'disp-1',
    order_id: 'ord-103',
    raised_by: 'usr-3',
    raised_by_name: 'أيمن الفيتوري',
    reason: 'damaged',
    reason_text: 'وصلت الوجبة باردة وغير مطابقة للصورة المعلنة مع تأخر مندوب التوصيل ساعتين.',
    evidence_urls: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    ],
    status: 'open',
    amount: 60,
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 9).toISOString(),
  },
];

const INITIAL_REPORTS: ContentReport[] = [
  {
    id: 'rep-1',
    reporter_id: 'usr-1',
    reporter_name: 'سالم بن علي',
    target_type: 'post',
    target_id: 'post-1',
    target_title_or_name: 'طبق معلن بصورة تجارية جاهزة',
    reason: 'استخدام صور إنترنت تجارية غير مطابقة للطبخ المنزلي الفعلي',
    details: 'الصورة مأخوذة من مطعم خارجي وليست من تجهيز المطبخ المنزلي نفسه',
    status: 'pending',
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 5).toISOString(),
  },
  {
    id: 'rep-2',
    reporter_id: 'usr-2',
    reporter_name: 'مروان الطرابلسي',
    target_type: 'user',
    target_id: 'usr-chef-2',
    target_title_or_name: 'شيف عائشة المصراتي',
    reason: 'محاولة توجيه الزبائن للتحويل النقدي خارج منصة سفرة',
    details: 'طلب تحويل رصيد مدار مباشرة قبل إرسال الطلب',
    status: 'pending',
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 3).toISOString(),
  },
];

const INITIAL_PAYOUT_REQUESTS: PayoutRequest[] = [
  {
    id: 'pay-1',
    chef_id: 'usr-chef-1',
    chef_name: 'شيف فاطمة الزهراء',
    kitchen_name: 'مطبخ ست الحبايب',
    chef_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    payout_type: 'sales',
    gross_amount: 250,
    commission_rate: 15,
    commission_amount: 37.5,
    net_amount: 212.5,
    bank_name: 'مصرف الجمهورية',
    account_number: '012-3456789-001',
    iban: 'LY65REP00010123456789001',
    status: 'pending',
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 8).toISOString(),
  },
  {
    id: 'pay-2',
    chef_id: 'usr-chef-2',
    chef_name: 'شيف عائشة المصراتي',
    kitchen_name: 'مطبخ المصراتية الأصيلة',
    chef_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    payout_type: 'gifts',
    gross_amount: 100,
    commission_rate: 50,
    commission_amount: 50,
    net_amount: 50,
    bank_name: 'مصرف التجارة والتنمية (TDB)',
    account_number: '088-998877-002',
    iban: 'LY34TDB0001088998877002',
    status: 'completed',
    admin_notes: 'تمت مطابقة بيانات الآيبان والتحويل بنجاح',
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 48).toISOString(),
    processed_at: new Date(STATIC_BASE_TIME - 3600000 * 24).toISOString(),
  },
];

const INITIAL_FILTER_VIOLATIONS: FilterViolation[] = [
  {
    id: 'viol-1',
    user_id: 'usr-chef-2',
    user_name: 'شيف عائشة المصراتي',
    conversation_id: 'conv-101',
    original_text: 'رقمي 091-2345678 كلمني على الواتساب ونتفاهموا',
    detected_pattern: 'libyan_phone_number (رقم ليبي)',
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 6).toISOString(),
  },
  {
    id: 'viol-2',
    user_id: 'usr-chef-2',
    user_name: 'شيف عائشة المصراتي',
    conversation_id: 'conv-102',
    original_text: 'ابعثلي على الواتساب احسن',
    detected_pattern: 'external_channel (واتساب)',
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 4).toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    actor_id: 'admin',
    actor_name: 'إدارة سفرة المركزية',
    action: 'SYSTEM_BOOTSTRAP',
    target_table: 'system',
    target_id: 'sys-core',
    details: { version: 'v3.5', engine: 'DPAY_LIBYA_CLEAN' },
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 72).toISOString(),
  },
  {
    id: 'log-2',
    actor_id: 'admin',
    actor_name: 'إدارة سفرة المركزية',
    action: 'VERIFY_CHEF',
    target_table: 'chef_profiles',
    target_id: 'usr-chef-1',
    details: { kitchen_name: 'مطبخ ست الحبايب', status: 'approved' },
    created_at: new Date(STATIC_BASE_TIME - 3600000 * 40).toISOString(),
  },
];

interface StoreContextType {
  siteVisits: SiteVisit[];
  trackVisit: (deviceType?: 'android' | 'ios' | 'desktop', entryPage?: string, city?: string) => void;
  trackPWAInstall: (deviceType?: 'android' | 'ios' | 'desktop') => void;
  getPWAAnalyticsSummary: () => PWAAnalyticsSummary;
  currentUser: User;
  users: User[];
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  logoutUser: () => void;
  chefProfiles: Record<string, ChefProfile>;
  userCity: string;
  setUserCity: (city: string) => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  registerUser: (userData: Partial<User>) => User;
  updateUserProfile: (data: {
    full_name?: string;
    phone?: string;
    city?: string;
    district?: string;
    bio?: string;
    avatar_url?: string;
    kitchen_name?: string;
    kitchen_bio?: string;
  }) => void;
  
  posts: Post[];
  stories: Story[];
  orders: Order[];
  walletTransactions: WalletTransaction[];
  gifts: Gift[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  sponsoredPosts: SponsoredPost[];
  comments: Record<string, Comment[]>;
  userLikes: Record<string, boolean>;
  storyLikes: Record<string, boolean>;
  followedChefs: Record<string, boolean>;
  userBookmarks: Record<string, boolean>;
  // Reports Actions
  reports: ContentReport[];
  resolveReportAdmin: (reportId: string, action: 'dismiss' | 'delete_target' | 'warn_user' | 'reviewed', adminNotes?: string) => void;

  // Test Suite & Interactive Simulation
  simulateFullOrderCycle: () => string;
  simulateDisputeCycle: () => string;
  simulatePhoneLeakViolation: () => string;
  simulatePayoutRequest: () => string;
  simulateSponsoredAdCampaign: () => string;
  resetAndReseedSystemData: () => void;

  // Bookmarks, Reports, Password & Security Actions
  toggleBookmark: (postId: string) => void;
  reportContent: (type: 'post' | 'user' | 'comment', targetId: string, reason: string, details?: string) => void;
  resetUserPassword: (emailOrPhone: string, newPassword: string) => { success: boolean; message: string; user?: User };
  changeCurrentPassword: (oldPassword: string, newPassword: string) => { success: boolean; message: string };
  toggleTwoFactor: () => void;

  // Stories Actions
  toggleLikeStory: (storyId: string) => void;
  markStorySeen: (storyId: string) => void;
  addStory: (storyData: Partial<Story>) => void;

  // Payouts & Commissions State & Actions
  payoutRequests: PayoutRequest[];
  commissionSettings: AppCommissionSettings;
  requestChefPayout: (payoutType: PayoutType, grossAmount: number, bankName: string, accountNumber: string, iban: string) => Promise<{ success: boolean; error?: string }>;
  processPayoutAdmin: (payoutId: string, action: 'completed' | 'rejected', adminNotes?: string) => void;
  updateCommissionSettingsAdmin: (salesPercent: number, giftsPercent: number) => void;

  // Messenger State & Functions
  conversations: Conversation[];
  messages: Message[];
  unreadMessagesCount: number;
  getOrCreateConversation: (otherUserId: string, orderId?: string) => Conversation;
  sendMessage: (conversationId: string, content: string, messageType?: 'text' | 'emoji' | 'image', orderId?: string) => Message;
  markConversationRead: (conversationId: string) => void;
  deleteExpiredMessages: () => void;

  // Disintermediation Protection & Behavioral Detection
  filterViolations: FilterViolation[];
  sellerRiskScores: Record<string, SellerRiskScore>;
  recalculateRiskScores: () => void;
  resolveRiskStatusAdmin: (chefId: string, status: 'normal' | 'watchlist' | 'warning' | 'suspended', notes?: string) => void;
  clearViolationsAdmin: (userId?: string) => void;

  // Disputes & Escrow State & Functions
  disputes: Dispute[];
  raiseDispute: (orderId: string, reason: DisputeReason, reasonText?: string, evidenceUrls?: string[]) => { success: boolean; disputeId?: string; error?: string };
  resolveDisputeAdmin: (disputeId: string, action: 'refund_full' | 'refund_partial' | 'reject_release' | 'store_credit', refundAmount?: number, adminNotes?: string) => void;
  releaseEscrowForOrder: (orderId: string) => void;
  confirmOrderDeliveryAndReleaseEscrow: (orderId: string) => { success: boolean; error?: string };
  fastForwardEscrowReleaseAdmin: (orderId: string) => void;

  addPost: (postData: Partial<Post>) => void;
  updatePost: (postId: string, updatedData: Partial<Post>) => boolean;
  deletePost: (postId: string) => boolean;
  toggleLike: (postId: string) => void;
  toggleFollowChef: (chefId: string) => void;
  addComment: (postId: string, content: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  sendGift: (postId: string, giftItem: GiftItem, message?: string, targetChefId?: string) => Promise<boolean>;
  buyGiftPackage: (pack: GiftPackage) => Promise<{ success: boolean; error?: string }>;
  convertGiftWalletToMainWallet: (amountToConvert: number) => Promise<{ success: boolean; netCash?: number; error?: string }>;
  convertAffiliateBalanceToMainWallet: (amountToConvert?: number) => Promise<{ success: boolean; convertedAmount?: number; error?: string }>;
  placeOrder: (
    post: Post,
    quantity: number,
    address: string,
    deliveryProviderCode: 'talabk' | 'drubi' | 'express_ly' | 'direct_pickup',
    gatewayId: string,
    notes?: string,
    affiliateUserId?: string,
    customDeliveryFee?: number
  ) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  depositWallet: (amount: number, gateway: string) => Promise<boolean>;
  transferWalletFunds: (recipientQuery: string, amount: number, note?: string) => Promise<{ success: boolean; error?: string }>;
  withdrawWalletFunds: (amount: number, bankName: string, iban: string) => Promise<{ success: boolean; error?: string }>;
  promotePost: (postId: string, budget: number, targetCities: string[], startDate: string, endDate: string) => Promise<boolean>;
  isPostActiveSponsored: (postId: string, city?: string) => boolean;
  trackSponsoredImpression: (postId: string) => void;
  trackSponsoredClick: (postId: string) => void;
  trackSponsoredCartAdd: (postId: string) => void;
  trackSponsoredOrder: (postId: string) => void;
  applyChefVerification: (kitchenName: string, bio: string, healthCertUrl?: string) => void;
  verifyChefAccount: (chefUserId: string, approve: boolean, notes?: string) => void;
  markNotificationsRead: () => void;
  markSingleNotificationRead: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  addAuditLog: (action: string, targetTable: string, targetId: string, details?: Record<string, unknown>) => void;
  deletePostAdmin: (postId: string) => void;
  adjustUserWalletAdmin: (userId: string, amount: number, note: string) => void;
  updateUserRoleAdmin: (userId: string, role: UserRole) => void;
  toggleUserVerificationAdmin: (userId: string) => void;
  platformSettings: SystemPlatformSettings;
  updatePlatformSettingsAdmin: (settings: Partial<SystemPlatformSettings>) => void;
  deleteStoryAdmin: (storyId: string) => void;
  toggleSponsoredAdStatusAdmin: (adId: string) => void;
  clearAllSponsoredAds: () => void;

  // Chef Reviews & Ratings
  chefReviews: Record<string, ChefReview[]>;
  addChefReview: (reviewData: {
    chef_id: string;
    order_id?: string;
    rating: number;
    food_quality_rating: number;
    service_rating: number;
    cleanliness_rating?: number;
    value_rating?: number;
    comment: string;
    dish_name?: string;
    post_id?: string;
  }) => { success: boolean; review?: ChefReview; error?: string };
  voteReviewHelpful: (chefId: string, reviewId: string) => void;
  replyToChefReview: (chefId: string, reviewId: string, replyText: string) => { success: boolean };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'sofra_libya_clean_v3';

const GUEST_USER: User = {
  id: 'guest',
  full_name: 'زائر (غير مسجل)',
  username: 'guest',
  role: 'customer',
  city: 'طرابلس',
  district: 'وسط المدينة',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  bio: 'حساب زائر',
  is_verified: false,
  wallet_balance: 0,
  gift_wallet_balance: 0,
  affiliate_balance: 0,
  phone: '',
  email: '',
  created_at: new Date(STATIC_BASE_TIME).toISOString(),
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [chefProfiles, setChefProfiles] = useState<Record<string, ChefProfile>>(INITIAL_CHEF_PROFILES);
  const [userCity, setUserCity] = useState<string>('طرابلس');
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [storyLikes, setStoryLikes] = useState<Record<string, boolean>>({});
  const [followedChefs, setFollowedChefs] = useState<Record<string, boolean>>({});
  const [userBookmarks, setUserBookmarks] = useState<Record<string, boolean>>({});
  const [reports, setReports] = useState<ContentReport[]>(INITIAL_REPORTS);

  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(INITIAL_SITE_VISITS);

  // Commission Percentages Settings State
  const [commissionSettings, setCommissionSettings] = useState<AppCommissionSettings>({
    sales_commission_percent: 15,
    gifts_commission_percent: 50,
  });

  // System Platform Settings State
  const [platformSettings, setPlatformSettings] = useState<SystemPlatformSettings>({
    announcement_banner_text: '',
    announcement_active: false,
    maintenance_mode: false,
    min_payout_amount: 100,
    platform_name: 'سفرة (Sofra)',
    default_city: 'طرابلس',
  });

  // Filter Violations & Disintermediation Protection State
  const [filterViolations, setFilterViolations] = useState<FilterViolation[]>(INITIAL_FILTER_VIOLATIONS);

  // Seller Risk Scores State
  const [sellerRiskScores, setSellerRiskScores] = useState<Record<string, SellerRiskScore>>({});

  // Payout Requests State
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(INITIAL_PAYOUT_REQUESTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [sponsoredPosts, setSponsoredPosts] = useState<SponsoredPost[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [chefReviews, setChefReviews] = useState<Record<string, ChefReview[]>>(INITIAL_REVIEWS);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>(INITIAL_DISPUTES);

  // Load state from localStorage on initial render
  const isLoadedRef = React.useRef(false);
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0) {
              // Guarantee all initial verified chefs remain available so suggested chefs never renders empty
              const savedIds = new Set(parsed.users.map((u: User) => u.id));
              const missingInitialChefs = INITIAL_USERS.filter((u) => u.role === 'chef' && !savedIds.has(u.id));
              setUsers([...parsed.users, ...missingInitialChefs]);
            }
            if (parsed.currentUser) setCurrentUser(parsed.currentUser);
            if (parsed.chefProfiles) setChefProfiles(parsed.chefProfiles);
            if (parsed.orders && parsed.orders.length > 0) setOrders(parsed.orders);
            if (parsed.walletTransactions) setWalletTransactions(parsed.walletTransactions);
            if (parsed.gifts) setGifts(parsed.gifts);
            if (parsed.comments) setComments(parsed.comments);
            if (parsed.notifications) setNotifications(parsed.notifications);
            if (parsed.auditLogs && parsed.auditLogs.length > 0) setAuditLogs(parsed.auditLogs);
            if (parsed.chefReviews && Object.keys(parsed.chefReviews).length > 0) setChefReviews(parsed.chefReviews);
            if (parsed.reports && parsed.reports.length > 0) setReports(parsed.reports);
            if (parsed.payoutRequests && parsed.payoutRequests.length > 0) setPayoutRequests(parsed.payoutRequests);
            if (parsed.filterViolations && parsed.filterViolations.length > 0) setFilterViolations(parsed.filterViolations);
            if (parsed.sellerRiskScores) setSellerRiskScores(parsed.sellerRiskScores);
            if (parsed.commissionSettings) setCommissionSettings(parsed.commissionSettings);
            if (parsed.platformSettings) {
              const cleanSettings = {
                ...parsed.platformSettings,
                announcement_active: false,
                announcement_banner_text: '',
              };
              setPlatformSettings(cleanSettings);
            }
            if (parsed.conversations && Array.isArray(parsed.conversations)) {
              const uniqueConvsMap = new Map<string, Conversation>();
              parsed.conversations.forEach((c: Conversation) => {
                if (c && c.id && !uniqueConvsMap.has(c.id)) {
                  uniqueConvsMap.set(c.id, c);
                }
              });
              setConversations(Array.from(uniqueConvsMap.values()));
            }
            if (parsed.messages) setMessages(parsed.messages);
            if (parsed.disputes && parsed.disputes.length > 0) setDisputes(parsed.disputes);
            if (parsed.sponsoredPosts && Array.isArray(parsed.sponsoredPosts)) {
              const nowMs = STATIC_BASE_TIME;
              // Filter out expired or legacy test campaigns
              const validActiveSp = parsed.sponsoredPosts.filter((sp: SponsoredPost) => {
                if (!sp || sp.status !== 'active') return false;
                if (sp.end_date) {
                  const endMs = new Date(sp.end_date).getTime();
                  if (!isNaN(endMs) && endMs < nowMs) return false;
                }
                // Ignore old mock test IDs created before current session
                if (sp.id && (sp.id.startsWith('sp-mock') || sp.id.startsWith('sp-demo') || sp.id === 'sp-1' || sp.id === 'sp-2')) {
                  return false;
                }
                return true;
              });
              setSponsoredPosts(validActiveSp);
            } else {
              setSponsoredPosts([]);
            }

            if (parsed.posts) {
              const activePostIds = new Set(
                (parsed.sponsoredPosts || [])
                  .filter((sp: SponsoredPost) => {
                    if (!sp || sp.status !== 'active') return false;
                    if (sp.end_date) {
                      const endMs = new Date(sp.end_date).getTime();
                      if (!isNaN(endMs) && endMs < STATIC_BASE_TIME) return false;
                    }
                    if (sp.id && (sp.id.startsWith('sp-mock') || sp.id.startsWith('sp-demo') || sp.id === 'sp-1' || sp.id === 'sp-2')) {
                      return false;
                    }
                    return true;
                  })
                  .map((sp: SponsoredPost) => sp.post_id)
              );
              const sanitizedPosts = parsed.posts.map((p: Post) => ({
                ...p,
                is_sponsored: activePostIds.has(p.id),
              }));
              setPosts(sanitizedPosts);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse saved state:', e);
      } finally {
        setIsStorageReady(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save state to localStorage on changes (only after initial load has finished)
  useEffect(() => {
    if (!isStorageReady) return;
    try {
      const payload = {
        users,
        currentUser,
        chefProfiles,
        posts,
        orders,
        walletTransactions,
        gifts,
        comments,
        notifications,
        auditLogs,
        conversations,
        messages,
        disputes,
        sponsoredPosts,
        reports,
        payoutRequests,
        filterViolations,
        sellerRiskScores,
        commissionSettings,
        platformSettings,
        chefReviews,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }, [
    users,
    currentUser,
    chefProfiles,
    posts,
    orders,
    walletTransactions,
    gifts,
    comments,
    notifications,
    auditLogs,
    conversations,
    messages,
    disputes,
    sponsoredPosts,
    reports,
    payoutRequests,
    filterViolations,
    sellerRiskScores,
    commissionSettings,
    platformSettings,
    chefReviews,
    isStorageReady,
  ]);

  // Derived current user matching latest from users list
  const activeUser = users.find((u) => u.id === currentUser.id) || currentUser;

  const addAuditLog = (action: string, targetTable: string, targetId: string, details?: Record<string, unknown>) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const logoutUser = () => {
    setIsLoggedIn(false);
  };

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setUserCity(found.city);
      setIsLoggedIn(true);
    }
  };

  const switchRole = (role: UserRole) => {
    const found = users.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
      setUserCity(found.city);
      setIsLoggedIn(true);
    }
  };

  const registerUser = (userData: Partial<User>): User => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      full_name: userData.full_name || 'مستخدم جديد',
      username: userData.username || `user_${Date.now()}`,
      role: userData.role || 'customer',
      city: userData.city || 'طرابلس',
      district: userData.district || 'وسط المدينة',
      avatar_url: userData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      is_verified: userData.is_verified || false,
      wallet_balance: userData.wallet_balance ?? 0.0,
      gift_wallet_balance: 0.0,
      affiliate_balance: 0.0,
      phone: userData.phone || '',
      email: userData.email,
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setUserCity(newUser.city);
    setIsLoggedIn(true);

    if (newUser.role === 'chef') {
      setChefProfiles((prev) => ({
        ...prev,
        [newUser.id]: {
          user_id: newUser.id,
          kitchen_name: `مطبخ ${newUser.full_name}`,
          cover_image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
          rating_avg: 0.0,
          rating_count: 0,
          total_sales: 0,
          verification_status: 'pending',
        },
      }));
    }

    addAuditLog('REGISTER_USER', 'users', newUser.id, { full_name: newUser.full_name, role: newUser.role });
    return newUser;
  };

  const addPost = (postData: Partial<Post>) => {
    const isChef = currentUser.role === 'chef';
    const chefProfile = chefProfiles[currentUser.id];

    const newPost: Post = {
      id: generateUniqueId('post'),
      chef_id: currentUser.id,
      chef_name: currentUser.full_name,
      kitchen_name: chefProfile?.kitchen_name || currentUser.full_name,
      chef_avatar: currentUser.avatar_url,
      chef_verified: currentUser.is_verified,
      title: postData.title || 'طبق جديد من المطبخ',
      description: postData.description || '',
      ingredients: postData.ingredients || [],
      images: postData.images && postData.images.length > 0 ? postData.images : [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      ],
      price: postData.is_purchasable ? Number(postData.price || 20) : null,
      unit_name: postData.unit_name || 'قطعة',
      is_purchasable: postData.is_purchasable ?? true,
      category: postData.category || 'traditional',
      city: postData.city || currentUser.city,
      district: currentUser.district,
      stock_quantity: postData.stock_quantity || 10,
      likes_count: 0,
      comments_count: 0,
      gifts_total: 0,
      preparation_time_mins: postData.preparation_time_mins || 30,
      affiliate_commission_percent: postData.affiliate_commission_percent ? Number(postData.affiliate_commission_percent) : 0,
      created_at: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
    addAuditLog('CREATE_POST', 'posts', newPost.id, { title: newPost.title, price: newPost.price });
  };

  const updatePost = (postId: string, updatedData: Partial<Post>): boolean => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return false;

    if (targetPost.chef_id !== currentUser.id && currentUser.role !== 'admin') {
      alert('⚠️ ليس لديك صلاحية تعديل هذا المنشور.');
      return false;
    }

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            ...updatedData,
            price:
              updatedData.is_purchasable === false
                ? null
                : updatedData.price !== undefined
                ? updatedData.price !== null
                  ? Number(updatedData.price)
                  : null
                : p.price,
            stock_quantity:
              updatedData.stock_quantity !== undefined
                ? Number(updatedData.stock_quantity)
                : p.stock_quantity,
            preparation_time_mins:
              updatedData.preparation_time_mins !== undefined
                ? Number(updatedData.preparation_time_mins)
                : p.preparation_time_mins,
            affiliate_commission_percent:
              updatedData.affiliate_commission_percent !== undefined
                ? Number(updatedData.affiliate_commission_percent)
                : p.affiliate_commission_percent,
          };
        }
        return p;
      })
    );

    addAuditLog('UPDATE_POST', 'posts', postId, { updated_by: currentUser.full_name });
    return true;
  };

  const deletePost = (postId: string): boolean => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return false;

    // Allow deletion if post belongs to user, or user is admin
    const canDelete =
      targetPost.chef_id === currentUser.id ||
      currentUser.role === 'admin';

    if (!canDelete) {
      return false;
    }

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    addAuditLog('DELETE_POST', 'posts', postId, { deleted_by: currentUser.full_name });
    return true;
  };

  const toggleLike = (postId: string) => {
    const currentlyLiked = userLikes[postId];
    setUserLikes((prev) => ({ ...prev, [postId]: !currentlyLiked }));
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          if (p.is_sponsored) {
            setSponsoredPosts((spPrev) =>
              spPrev.map((sp) =>
                sp.post_id === postId && sp.status === 'active'
                  ? {
                      ...sp,
                      likes_count: Math.max(0, (sp.likes_count || 0) + (currentlyLiked ? -1 : 1)),
                      clicks: (sp.clicks || 0) + (currentlyLiked ? 0 : 1),
                    }
                  : sp
              )
            );
          }
          return {
            ...p,
            likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1,
          };
        }
        return p;
      })
    );
  };

  const toggleLikeStory = (storyId: string) => {
    const currentlyLiked = storyLikes[storyId];
    setStoryLikes((prev) => ({ ...prev, [storyId]: !currentlyLiked }));
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId) {
          const currentCount = s.likes_count ?? 15;
          return {
            ...s,
            likes_count: currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
          };
        }
        return s;
      })
    );
  };

  const markStorySeen = (storyId: string) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === storyId) {
          if (s.is_seen) return s;
          return {
            ...s,
            is_seen: true,
            views_count: (s.views_count ?? 40) + 1,
          };
        }
        return s;
      })
    );
  };

  const addStory = (storyData: Partial<Story>) => {
    if (currentUser.role !== 'chef' && currentUser.role !== 'admin') {
      alert('⚠️ عذراً، نشر القصص والكواليس اليومية متاح حصرياً لـ الشيفات والمطابخ الموثقة.');
      return;
    }
    const chefProfile = chefProfiles[currentUser.id];
    const newStory: Story = {
      id: `story-${Date.now()}`,
      chef_id: currentUser.id,
      chef_name: currentUser.full_name,
      kitchen_name: chefProfile?.kitchen_name || currentUser.full_name,
      chef_avatar: currentUser.avatar_url,
      media_url: storyData.media_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      media_type: 'image',
      title: storyData.title || 'قصة كواليس المطبخ 🔥',
      caption: storyData.caption || '',
      city: storyData.city || currentUser.city,
      created_at: new Date().toISOString(),
      is_seen: false,
      likes_count: 0,
      views_count: 1,
      dish_post_id: storyData.dish_post_id,
    };

    setStories((prev) => [newStory, ...prev]);
    addAuditLog('CREATE_STORY', 'stories', newStory.id, { title: newStory.title });
  };

  const toggleFollowChef = (chefId: string) => {
    const currentlyFollowed = followedChefs[chefId];
    setFollowedChefs((prev) => ({ ...prev, [chefId]: !currentlyFollowed }));
  };

  const toggleBookmark = (postId: string) => {
    setUserBookmarks((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const reportContent = (
    type: 'post' | 'user' | 'comment',
    targetId: string,
    reason: string,
    details?: string
  ) => {
    const targetPost = posts.find((p) => p.id === targetId);
    const newReport: ContentReport = {
      id: `rep-${Date.now()}`,
      reporter_id: currentUser.id,
      reporter_name: currentUser.full_name,
      target_type: type,
      target_id: targetId,
      target_title_or_name: targetPost?.title || targetId,
      reason,
      details,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    addAuditLog('REPORT_CONTENT', 'content_reports', newReport.id, { type, reason });
  };

  const resetUserPassword = (
    emailOrPhone: string,
    newPassword: string
  ): { success: boolean; message: string; user?: User } => {
    const target = emailOrPhone.trim().toLowerCase();
    const userToReset = users.find(
      (u) =>
        u.email?.toLowerCase() === target ||
        u.username.toLowerCase() === target ||
        u.phone?.trim() === target
    );

    if (!userToReset) {
      return {
        success: false,
        message: 'عذراً، لم نتمكن من العثور على حساب مرتبط بهذا البريد أو الهاتف.',
      };
    }

    const updatedUser: User = {
      ...userToReset,
      password: newPassword,
    };

    setUsers((prev) => prev.map((u) => (u.id === userToReset.id ? updatedUser : u)));
    if (currentUser.id === userToReset.id) {
      setCurrentUser(updatedUser);
    }

    addAuditLog('RESET_PASSWORD', 'users', userToReset.id, { email: userToReset.email });

    return {
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمتك الجديدة.',
      user: updatedUser,
    };
  };

  const changeCurrentPassword = (
    oldPassword: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    if (currentUser.password && currentUser.password !== oldPassword) {
      return {
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة.',
      };
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPassword,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    addAuditLog('CHANGE_PASSWORD', 'users', currentUser.id, {});

    return {
      success: true,
      message: 'تم تحديث كلمة المرور الخاصة بك بنجاح 🔐',
    };
  };

  const toggleTwoFactor = () => {
    const updatedUser: User = {
      ...currentUser,
      two_factor_enabled: !currentUser.two_factor_enabled,
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
  };

  const addComment = (postId: string, content: string) => {
    if (!content.trim()) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      post_id: postId,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      user_avatar: currentUser.avatar_url,
      content,
      created_at: new Date().toISOString(),
      likes_count: 0,
      is_chef: currentUser.role === 'chef',
    };

    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
    );
  };

  const toggleCommentLike = (postId: string, commentId: string) => {
    setComments((prev) => {
      const list = prev[postId] || [];
      const updated = list.map((c) => {
        if (c.id === commentId) {
          const currentCount = c.likes_count || 0;
          return { ...c, likes_count: currentCount + 1 };
        }
        return c;
      });
      return { ...prev, [postId]: updated };
    });
  };

  const sendGift = async (postId: string, giftItem: GiftItem, message?: string, targetChefId?: string): Promise<boolean> => {
    if (activeUser.wallet_balance < giftItem.amount) {
      alert(`رصيدك الحالي (${activeUser.wallet_balance.toFixed(1)} د.ل) لا يكفي لإرسال هذه الهدية بقيمة ${giftItem.amount} د.ل. يرجى شحن المحفظة أولاً.`);
      return false;
    }

    const post = posts.find((p) => p.id === postId);
    const recipientChefId = post ? post.chef_id : (targetChefId || postId.replace(/^post-(direct|chef)-/, ''));
    const chefObj = users.find((u) => u.id === recipientChefId);

    if (!recipientChefId) {
      alert('لم يتم العثور على الشيف المستلم للإكرامية');
      return false;
    }

    // Deduct sender main balance, and add to recipient chef's GIFT wallet balance
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === activeUser.id) {
          return { ...u, wallet_balance: u.wallet_balance - giftItem.amount };
        }
        if (u.id === recipientChefId) {
          const currentGiftBal = u.gift_wallet_balance || 0;
          return { ...u, gift_wallet_balance: currentGiftBal + giftItem.amount };
        }
        return u;
      })
    );

    // Record sender transaction
    const senderTx: WalletTransaction = {
      id: `tx-${Date.now()}-send`,
      user_id: activeUser.id,
      type: 'gift_sent',
      amount: -giftItem.amount,
      title: `إرسال هدية رقمية (${giftItem.name} ${giftItem.icon}) ${post ? `للطبق: ${post.title}` : `للشيف: ${chefObj?.full_name || 'الشيف'}`}`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    // Record chef recipient transaction
    const chefTx: WalletTransaction = {
      id: `tx-${Date.now()}-recv`,
      user_id: recipientChefId,
      type: 'gift_received',
      amount: giftItem.amount,
      title: `استلام هدية رقمية (${giftItem.name} ${giftItem.icon}) من ${activeUser.full_name} في محفظة الهدايا`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    setWalletTransactions((prev) => [senderTx, chefTx, ...prev]);

    // Record Gift
    const newGift: Gift = {
      id: `gift-${Date.now()}`,
      post_id: postId,
      post_title: post ? post.title : `إكرامية مباشرة للشيف ${chefObj?.full_name || ''}`,
      sender_id: activeUser.id,
      sender_name: activeUser.full_name,
      sender_avatar: activeUser.avatar_url,
      recipient_chef_id: recipientChefId,
      gift_name: giftItem.name,
      gift_icon: giftItem.icon,
      amount: giftItem.amount,
      message,
      created_at: new Date().toISOString(),
    };

    setGifts((prev) => [newGift, ...prev]);

    // Update post gifts total if post exists
    if (post) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, gifts_total: p.gifts_total + giftItem.amount } : p))
      );
    }

    // Add Notification for Chef
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: recipientChefId,
      type: 'gift',
      title: `وصلتك هدية جديدة في محفظة الهدايا! ${giftItem.icon}`,
      content: `قام ${activeUser.full_name} بتقديم (${giftItem.name}) بقيمة ${giftItem.amount} د.ل ${post ? `على طبقك "${post.title}"` : 'كإكرامية دعم مباشرة'}. أضيفت القيمة لمحفظة الهدايا الخاصة بك.`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    addAuditLog('SEND_DIGITAL_GIFT', 'gifts', newGift.id, { gift_name: giftItem.name, amount: giftItem.amount });
    return true;
  };

  const buyGiftPackage = async (pack: GiftPackage): Promise<{ success: boolean; error?: string }> => {
    if (activeUser.wallet_balance < pack.price) {
      return {
        success: false,
        error: `رصيد محفظتك الرئيسية (${activeUser.wallet_balance.toFixed(1)} د.ل) لا يكفي لشراء ${pack.name} بقيمة ${pack.price} د.ل. يرجى شحن المحفظة أولاً.`,
      };
    }

    // Deduct main wallet balance and add value to gift_wallet_balance
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === activeUser.id) {
          const currentGiftBal = u.gift_wallet_balance || 0;
          return {
            ...u,
            wallet_balance: u.wallet_balance - pack.price,
            gift_wallet_balance: currentGiftBal + pack.price,
          };
        }
        return u;
      })
    );

    const tx: WalletTransaction = {
      id: `tx-buy-pack-${Date.now()}`,
      user_id: activeUser.id,
      type: 'gift_package_buy',
      amount: -pack.price,
      title: `شراء ${pack.name} (${pack.giftCount} ${pack.itemName}) بقيمة ${pack.price} د.ل`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    setWalletTransactions((prev) => [tx, ...prev]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: activeUser.id,
      type: 'system',
      title: `تم شراء ${pack.name} بنجاح! ${pack.icon}`,
      content: `تمت إضافة ${pack.giftCount} ${pack.itemName} إلى رصيد هداياك. يمكنك الآن إهدائها للشيفات والمطابخ المفضلة.`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    addAuditLog('BUY_GIFT_PACKAGE', 'users', activeUser.id, { package_id: pack.id, price: pack.price });

    return { success: true };
  };

  const convertGiftWalletToMainWallet = async (amountToConvert: number): Promise<{ success: boolean; netCash?: number; error?: string }> => {
    const currentGiftBal = activeUser.gift_wallet_balance || 0;
    if (!amountToConvert || amountToConvert <= 0) {
      return { success: false, error: 'يرجى تحديد مبلغ تحويل صحيح أكبر من الصفر' };
    }
    if (currentGiftBal < amountToConvert) {
      return { success: false, error: `رصيد محفظة الهدايا الحالي (${currentGiftBal.toFixed(1)} د.ل) لا يكفي لتحويل ${amountToConvert} د.ل.` };
    }

    const commissionPercent = commissionSettings.gifts_commission_percent || 50; // 50%
    const commissionFee = (amountToConvert * commissionPercent) / 100;
    const netCash = amountToConvert - commissionFee;

    // Deduct from gift_wallet_balance and add netCash to wallet_balance
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === activeUser.id) {
          const currentG = u.gift_wallet_balance || 0;
          return {
            ...u,
            gift_wallet_balance: Math.max(0, currentG - amountToConvert),
            wallet_balance: u.wallet_balance + netCash,
          };
        }
        return u;
      })
    );

    // Record wallet transaction
    const tx: WalletTransaction = {
      id: `tx-gift-conv-${Date.now()}`,
      user_id: activeUser.id,
      type: 'gift_converted',
      amount: netCash,
      title: `تحويل ${amountToConvert} د.ل من محفظة الهدايا إلى كاش (خصم ${commissionPercent}% عمولة المنصة = -${commissionFee} د.ل)`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    setWalletTransactions((prev) => [tx, ...prev]);

    // Add Notification
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: activeUser.id,
      type: 'system',
      title: 'تم تحويل رصيد الهدايا إلى محفظتك الأساسية بنجاح 🎁💰',
      content: `تم تحويل ${amountToConvert} د.ل من محفظة الهدايا، وتم إيداع ${netCash} د.ل صافي كاش في محفظتك الرئيسية (بعد خصم ${commissionPercent}% عمولة المنصة).`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    addAuditLog('CONVERT_GIFT_WALLET', 'users', activeUser.id, {
      amountToConvert,
      commissionFee,
      netCash,
    });

    return { success: true, netCash };
  };

  const convertAffiliateBalanceToMainWallet = async (amountToConvert?: number): Promise<{ success: boolean; convertedAmount?: number; error?: string }> => {
    const currentAffiliate = activeUser.affiliate_balance || 0;
    const amount = amountToConvert && amountToConvert > 0 ? amountToConvert : currentAffiliate;

    if (amount <= 0) {
      return { success: false, error: 'لا يوجد رصيد أرباح مشاركة متاح للتحويل حالياً' };
    }
    if (currentAffiliate < amount) {
      return { success: false, error: `رصيد أرباح المشاركة المتاح (${currentAffiliate.toFixed(1)} د.ل) أقل من المبلغ المطلوب (${amount.toFixed(1)} د.ل)` };
    }

    // Deduct from affiliate_balance and add 100% directly to wallet_balance with 0% fee (100% to the user)
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === activeUser.id) {
          return {
            ...u,
            affiliate_balance: Math.max(0, (u.affiliate_balance || 0) - amount),
            wallet_balance: u.wallet_balance + amount,
          };
        }
        return u;
      })
    );

    const tx: WalletTransaction = {
      id: `tx-aff-conv-${Date.now()}`,
      user_id: activeUser.id,
      type: 'deposit',
      amount: amount,
      title: `تحويل ${amount.toFixed(1)} د.ل من أرباح مشاركة المبيعات إلى المحفظة الرئيسية 🤝💰`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    setWalletTransactions((prev) => [tx, ...prev]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: currentUser.id,
      type: 'system',
      title: 'تم تحويل أرباح المشاركة إلى محفظتك الرئيسية 🤝⚡',
      content: `تم تحويل ${amount.toFixed(1)} د.ل من رصيد التسويق والمشاركة، وتم إيداعها كسيولة جاهزة للاستخدام أو إرسال الهدايا للشيفات!`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    addAuditLog('CONVERT_AFFILIATE_BALANCE', 'users', currentUser.id, { amount });

    return { success: true, convertedAmount: amount };
  };

  const placeOrder = async (
    post: Post,
    quantity: number,
    address: string,
    deliveryProviderCode: 'talabk' | 'drubi' | 'express_ly' | 'direct_pickup',
    gatewayId: string,
    notes?: string,
    affiliateUserId?: string,
    customDeliveryFee?: number
  ) => {
    const itemsTotal = (post.price || 0) * quantity;
    const deliveryFee = customDeliveryFee !== undefined ? customDeliveryFee : getDeliveryFee(deliveryProviderCode);
    const totalAmount = itemsTotal + deliveryFee;

    // Minimum order amount validation (الحد الأدنى للطلب 50 دينار)
    if (itemsTotal < MIN_ORDER_AMOUNT) {
      return {
        success: false,
        error: `الحد الأدنى لقيمة الوجبات بالطلب هو ${MIN_ORDER_AMOUNT} د.ل (القيمة الحالية للأصناف: ${itemsTotal} د.ل). يرجى زيادة الكمية للوصول للحد الأدنى.`,
      };
    }

    if (activeUser.wallet_balance < totalAmount) {
      return {
        success: false,
        error: `رصيد محفظتك (${activeUser.wallet_balance.toFixed(0)} د.ل) غير كافٍ لإتمام الطلب بقيمة ${totalAmount} د.ل (تشمل ${itemsTotal} د.ل للوجبات + ${deliveryFee} د.ل رسوم التوصيل). يرجى شحن المحفظة عبر DPAY.`,
      };
    }

    // Call DPAY Session API or client
    const dpaySession = await dpayService.openPaymentSession({
      amount: totalAmount,
      pay_method: gatewayId,
      customer_mobile: activeUser.phone,
      callback_url: '/api/webhooks/dpay',
      metadata: { post_id: post.id, quantity, items_total: itemsTotal, delivery_fee: deliveryFee },
    });

    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    // Complete session via verify API
    const session = await dpayService.verifyPaymentSession({
      session_id: dpaySession.session_id,
      otp: '111111',
    });

    // Call Delivery Provider simulation API
    const deliveryProvider = getDeliveryProvider(deliveryProviderCode);
    const shipment = await deliveryProvider.createShipment({
      id: `ord-${nowMs}`,
      delivery_address: address,
      delivery_city: post.city,
    });

    // Calculate Affiliate Marketing Commission if applicable (based on food items total)
    let commissionAmount = 0;
    const isEligibleAffiliate =
      affiliateUserId &&
      affiliateUserId !== activeUser.id &&
      affiliateUserId !== post.chef_id &&
      post.affiliate_commission_percent &&
      post.affiliate_commission_percent > 0;

    if (isEligibleAffiliate) {
      commissionAmount = (itemsTotal * (post.affiliate_commission_percent || 0)) / 100;
    }

    const netChefEarnings = Math.max(0, itemsTotal - commissionAmount);

    // Update balances: Deduct Customer ONLY. Chef and Affiliate balances remain pending in Escrow until delivery confirmation.
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === activeUser.id) {
          return { ...u, wallet_balance: u.wallet_balance - totalAmount };
        }
        return u;
      })
    );

    const generatedOrderId = `ord-${nowMs.toString().slice(-5)}`;

    // Wallet transaction records (Chef & Affiliate start as 'pending' in Escrow)
    const userTx: WalletTransaction = {
      id: `tx-ord-${nowMs}`,
      user_id: activeUser.id,
      type: 'purchase',
      amount: -totalAmount,
      title: `شراء: ${post.title} (العدد: ${quantity}) + توصيل (${deliveryFee} د.ل)`,
      reference_order_id: generatedOrderId,
      dpay_session_id: session.session_id,
      status: 'completed',
      created_at: nowIso,
    };

    const chefTx: WalletTransaction = {
      id: `tx-chef-ord-${nowMs}`,
      user_id: post.chef_id,
      type: 'deposit',
      amount: netChefEarnings,
      title: `أرباح مبيعات معلقة (حجز ضمان Escrow): ${post.title} [تتحرر لمحفظتك فور التسليم] ${commissionAmount > 0 ? `(عمولة التسويق: -${commissionAmount.toFixed(1)} د.ل)` : ''}`,
      reference_order_id: generatedOrderId,
      dpay_session_id: session.session_id,
      status: 'pending',
      created_at: nowIso,
    };

    const newTxs: WalletTransaction[] = [userTx, chefTx];

    if (isEligibleAffiliate && commissionAmount > 0) {
      const affTx: WalletTransaction = {
        id: `tx-aff-${nowMs}`,
        user_id: affiliateUserId!,
        type: 'affiliate_commission',
        amount: commissionAmount,
        title: `عمولة تسويق معلقة (حجز ضمان Escrow) لطبق: (${post.title}) - نسبة ${post.affiliate_commission_percent}%`,
        reference_order_id: generatedOrderId,
        status: 'pending',
        created_at: nowIso,
      };
      newTxs.push(affTx);

      const affNotif: NotificationItem = {
        id: `notif-aff-${nowMs}`,
        user_id: affiliateUserId!,
        type: 'system',
        title: 'عمولة تسويق جديدة معلقة بالضمان ⏳💰',
        content: `قام ${activeUser.full_name} بشراء طبق "${post.title}" عبر رابطك! تم حجز عمولتك (${commissionAmount.toFixed(1)} د.ل) في الضمان وتتحرر لمحفظتك فور تسليم الطلب.`,
        is_read: false,
        created_at: nowIso,
      };
      setNotifications((prev) => [affNotif, ...prev]);
    }

    setWalletTransactions((prev) => [...newTxs, ...prev]);

    // Send Notification to Chef
    const chefNotif: NotificationItem = {
      id: `notif-chef-${nowMs}`,
      user_id: post.chef_id,
      type: 'order',
      title: 'طلب جديد وحجز أرباح في الضمان ⏳🍲',
      content: `قام ${activeUser.full_name} بطلب طبق "${post.title}" (العدد: ${quantity}). أرباحك الصافية (${netChefEarnings.toFixed(2)} د.ل) محفوظة في الضمان (Escrow) وستُضاف لمحفظتك فور تأكيد التسليم!`,
      is_read: false,
      created_at: nowIso,
    };
    setNotifications((prev) => [chefNotif, ...prev]);

    // Create Order object with geographical coordinates
    const pickupCoords = resolveLocationCoordinates(post.district || post.city, post.city, post.chef_id);
    const deliveryCoords = resolveLocationCoordinates(address, post.city, activeUser.id);

    const newOrder: Order = {
      id: generatedOrderId,
      customer_id: activeUser.id,
      customer_name: activeUser.full_name,
      customer_phone: activeUser.phone || '0910000000',
      chef_id: post.chef_id,
      chef_name: post.chef_name,
      post_id: post.id,
      post_title: post.title,
      post_image: post.images[0],
      quantity,
      unit_price: post.price || 0,
      delivery_fee: deliveryFee,
      total_price: totalAmount,
      status: 'accepted',
      delivery_provider: deliveryProviderCode,
      delivery_id: shipment.trackingId,
      payment_session_id: session.session_id,
      gateway_used: gatewayId,
      delivery_address: address,
      delivery_city: post.city,
      pickup_lat: pickupCoords.lat,
      pickup_lng: pickupCoords.lng,
      delivery_lat: deliveryCoords.lat,
      delivery_lng: deliveryCoords.lng,
      driver_lat: pickupCoords.lat,
      driver_lng: pickupCoords.lng,
      driver_name: shipment.driverName || 'علي الورفلي',
      driver_phone: shipment.driverPhone || '091-8884433',
      driver_speed_kmh: 0,
      delivery_progress_percent: 10,
      estimated_arrival_mins: shipment.estimatedDeliveryMins || 25,
      notes,
      affiliate_user_id: affiliateUserId,
      affiliate_commission_amount: commissionAmount,
      created_at: nowIso,
      updated_at: nowIso,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Track sponsored order if post is sponsored
    if (post.is_sponsored) {
      trackSponsoredOrder(post.id);
    }

    // Decrement stock quantity
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, stock_quantity: Math.max(0, p.stock_quantity - quantity) } : p))
    );

    addAuditLog('PLACE_ORDER', 'orders', newOrder.id, { total_price: totalAmount, gateway: gatewayId });

    return { success: true, orderId: newOrder.id };
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedDeliveredAt = status === 'delivered' ? (o.delivered_at || new Date().toISOString()) : o.delivered_at;
          return { ...o, status, delivered_at: updatedDeliveredAt, updated_at: new Date().toISOString() };
        }
        return o;
      })
    );

    // 1. When status becomes delivered: Do NOT release funds immediately! Record delivered_at and keep funds locked in Escrow.
    if (status === 'delivered' && targetOrder.status !== 'delivered') {
      const chefId = targetOrder.chef_id;
      const affComm = targetOrder.affiliate_commission_amount || 0;
      const netChefEarnings = Math.max(0, targetOrder.total_price - affComm);

      // Notify Chef that funds are safely held in 48h Escrow
      const chefEscrowNotif: NotificationItem = {
        id: `notif-delivered-hold-${Date.now()}`,
        user_id: chefId,
        type: 'order',
        title: 'تم تسجيل تسليم الطلب للزبون (حجز بالضمان 48س) ⏳🍲',
        content: `تم تسجيل تسليم الطلب (#${orderId}). أرباحك الصافية (${netChefEarnings.toFixed(2)} د.ل) محفوظة بأمان في حجز الضمان (Escrow) لمدة 48 ساعة لحماية الخصوصية، وستتحرر تلقائياً لمحفظتك القابلة للسحب إن لم يُفتح نزاع.`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((n) => [chefEscrowNotif, ...n]);

      // Notify Customer about 48-hour review window or direct release option
      const custReviewNotif: NotificationItem = {
        id: `notif-cust-delivered-${Date.now()}`,
        user_id: targetOrder.customer_id,
        type: 'order',
        title: 'تم تسليم وجبتك! تأكيد الاستلام أو التحرير الفوري 📦✅',
        content: `أشارت بيانات المطبخ/المندوب للوصول. اضغط على "تأكيد الاستلام ورضاك" لتحرير أرباح الشيف فوراً، أو يمكنك فتح نزاع خلال 48 ساعة إذا كان هناك استفسار.`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((n) => [custReviewNotif, ...n]);
    }

    // 2. Handle Order Cancellation / Rejection - Refund Customer & Cancel Escrow Hold
    if (
      (status === 'cancelled' || status === 'rejected') &&
      targetOrder.status !== 'cancelled' &&
      targetOrder.status !== 'rejected'
    ) {
      const customerId = targetOrder.customer_id;
      const refundAmount = targetOrder.total_price;

      // Refund Customer ONLY (Chef/Affiliate never received funds, so no deduction needed)
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === customerId) {
            return { ...u, wallet_balance: u.wallet_balance + refundAmount };
          }
          return u;
        })
      );

      // Mark Escrow pending transactions as failed
      setWalletTransactions((prev) =>
        prev.map((tx) => {
          if (tx.reference_order_id === orderId && tx.status === 'pending') {
            return { ...tx, status: 'failed' };
          }
          return tx;
        })
      );

      // Record Refund Wallet Transaction for Customer
      const refundTx: WalletTransaction = {
        id: `tx-refund-${Date.now()}`,
        user_id: customerId,
        type: 'refund',
        amount: refundAmount,
        title: `استرداد قيمة طلب ملغى (#${orderId}) - ${targetOrder.post_title}`,
        reference_order_id: orderId,
        status: 'completed',
        created_at: new Date().toISOString(),
      };
      setWalletTransactions((prev) => [refundTx, ...prev]);

      // Notify Customer
      const custRefundNotif: NotificationItem = {
        id: `notif-refund-${Date.now()}`,
        user_id: customerId,
        type: 'order',
        title: 'تم إرجاع المبلغ لحسابك 🔄',
        content: `تم إلغاء الطلب (#${orderId}) وإعادة مبلغ ${refundAmount} د.ل بالكامل لمحفظة DPAY الخاصة بك.`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((n) => [custRefundNotif, ...n]);
    }

    // Notify Customer about status change
    const statusTitles: Record<string, string> = {
      accepted: `تم قبول طلبك (#${orderId}) من مطبخ الشيف! 🍳`,
      preparing: `بدأ الشيف في طهي وجبتك الآن! 🔥`,
      out_for_delivery: `انتهى الشيف من التحضير والطلب في الطريق إليك! 🚗📦`,
      delivered: `تم تسليم طلبك (#${orderId}) بنجاح! 😋✨`,
      cancelled: `تم إلغاء الطلب (#${orderId}) ❌`,
      rejected: `تعذر قبول الطلب (#${orderId}) وتم إرجاع المبلغ ❌`,
    };

    const statusContents: Record<string, string> = {
      accepted: `وافق المطبخ على طلب وجبة "${targetOrder.post_title}". جار التجهيز للطهي.`,
      preparing: `قام الشيف ${targetOrder.chef_name} بالبدء في تحضير وطهي وجبة "${targetOrder.post_title}" طازجة الآن.`,
      out_for_delivery: `أكمل الشيف تحضير وجبة "${targetOrder.post_title}" وتم تسليمها لمندوب التوصيل وهو في طريقه إليك!`,
      delivered: `وصلت وجبتك "${targetOrder.post_title}". نرجو الضغط على "تأكيد الاستلام" لتحرير الرصيد للشيف.`,
      cancelled: `تم إلغاء الطلب واسترداد القيمة لمحفظتك.`,
      rejected: `تعذر قبول الطلب بسبب الظروف وتم إرجاع القيمة لمحفظتك.`,
    };

    const custNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: targetOrder.customer_id,
      type: 'order',
      title: statusTitles[status] || `تحديث حالة طلبك (#${orderId})`,
      content: statusContents[status] || `حالة الطلب الآن: ${status}`,
      is_read: false,
      created_at: new Date().toISOString(),
      order_id: targetOrder.id,
      order_status: status,
      post_image: targetOrder.post_image,
    };
    setNotifications((n) => [custNotif, ...n]);

    addAuditLog('UPDATE_ORDER_STATUS', 'orders', orderId, { new_status: status });
  };

  const depositWallet = async (amount: number, gateway: string): Promise<boolean> => {
    // DPAY Open session + Verification
    const session = await dpayService.openPaymentSession({
      amount,
      pay_method: gateway,
      customer_mobile: activeUser.phone,
      callback_url: '/api/webhooks/dpay',
    });

    await dpayService.verifyPaymentSession({
      session_id: session.session_id,
      otp: '111111',
    });

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === activeUser.id) {
          return { ...u, wallet_balance: u.wallet_balance + amount };
        }
        return u;
      })
    );

    const tx: WalletTransaction = {
      id: `tx-dep-${Date.now()}`,
      user_id: activeUser.id,
      type: 'deposit',
      amount,
      title: `شحن محفظة عبر بوابة DPAY (${gateway.toUpperCase()})`,
      dpay_session_id: session.session_id,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    setWalletTransactions((prev) => [tx, ...prev]);

    addAuditLog('DEPOSIT_WALLET', 'wallet_transactions', tx.id, { amount, gateway });
    return true;
  };

  const transferWalletFunds = async (
    recipientQuery: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (amount <= 0) return { success: false, error: 'المبلغ يجب أن يكون أكبر من 0 د.ل' };
    if (activeUser.wallet_balance < amount) return { success: false, error: 'رصيد المحفظة الحالي لا يكفي للتحويل.' };

    const recipientUser = users.find(
      (u) =>
        u.id !== activeUser.id &&
        (u.phone === recipientQuery ||
          u.username === recipientQuery ||
          u.full_name.includes(recipientQuery))
    );

    const recipientName = recipientUser ? recipientUser.full_name : 'مستلم عبر الشبكة الوطنية';

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === activeUser.id) return { ...u, wallet_balance: u.wallet_balance - amount };
        if (recipientUser && u.id === recipientUser.id) return { ...u, wallet_balance: u.wallet_balance + amount };
        return u;
      })
    );

    const senderTx: WalletTransaction = {
      id: `tx-p2p-${Date.now()}`,
      user_id: activeUser.id,
      type: 'withdrawal',
      amount: -amount,
      title: `تحويل فوري إلى: ${recipientName} (${note || 'تحويل مباشر'})`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    setWalletTransactions((prev) => [senderTx, ...prev]);

    if (recipientUser) {
      const recipientTx: WalletTransaction = {
        id: `tx-p2p-rec-${Date.now()}`,
        user_id: recipientUser.id,
        type: 'deposit',
        amount: amount,
        title: `استلام تحويل فوري من: ${activeUser.full_name}`,
        status: 'completed',
        created_at: new Date().toISOString(),
      };
      setWalletTransactions((prev) => [recipientTx, ...prev]);

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        user_id: recipientUser.id,
        type: 'system',
        title: 'استلام تحويل فوري! 💸',
        content: `قام ${activeUser.full_name} بتحويل ${amount} د.ل إلى محفظتك بنجاح.`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    addAuditLog('P2P_TRANSFER', 'wallet_transactions', senderTx.id, { amount, recipient: recipientName });
    return { success: true };
  };

  const requestChefPayout = async (
    payoutType: PayoutType,
    grossAmount: number,
    bankName: string,
    accountNumber: string,
    iban: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (grossAmount <= 0) {
      return { success: false, error: 'المبلغ المطلوب يجب أن يكون أكبر من 0 د.ل' };
    }

    if (grossAmount < platformSettings.min_payout_amount) {
      return {
        success: false,
        error: `أقل مبلغ مسموح به لطلب السحب للمصرف هو ${platformSettings.min_payout_amount} د.ل`,
      };
    }

    if (activeUser.wallet_balance < grossAmount) {
      return {
        success: false,
        error: `رصيد محفظتك المتاح (${activeUser.wallet_balance.toFixed(2)} د.ل) لا يكفي لإتمام طلب السحب (${grossAmount} د.ل)`,
      };
    }

    if (!bankName || !accountNumber.trim() || !iban.trim()) {
      return { success: false, error: 'يرجى اختيار المصرف وتعبئة رقم الحساب والأيبان (IBAN)' };
    }

    const rate =
      payoutType === 'sales'
        ? commissionSettings.sales_commission_percent
        : commissionSettings.gifts_commission_percent;

    const commissionAmount = (grossAmount * rate) / 100;
    const netAmount = grossAmount - commissionAmount;

    // Deduct grossAmount from user's active wallet balance (held pending payout processing)
    setUsers((prev) =>
      prev.map((u) => (u.id === activeUser.id ? { ...u, wallet_balance: u.wallet_balance - grossAmount } : u))
    );

    const chefProf = chefProfiles[activeUser.id];

    const newRequest: PayoutRequest = {
      id: `payout-${Date.now()}`,
      chef_id: activeUser.id,
      chef_name: activeUser.full_name,
      kitchen_name: chefProf?.kitchen_name || activeUser.full_name,
      chef_avatar: activeUser.avatar_url,
      payout_type: payoutType,
      gross_amount: grossAmount,
      commission_rate: rate,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      bank_name: bankName,
      account_number: accountNumber.trim(),
      iban: iban.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setPayoutRequests((prev) => [newRequest, ...prev]);

    // Record wallet transaction
    const tx: WalletTransaction = {
      id: `tx-payout-${Date.now()}`,
      user_id: activeUser.id,
      type: 'withdrawal',
      amount: -grossAmount,
      title: `طلب سحب أرباح ${payoutType === 'sales' ? 'المبيعات (خصم 15%)' : 'الهدايا (خصم 50%)'} إلى ${bankName}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setWalletTransactions((prev) => [tx, ...prev]);

    // Notification to chef
    const chefNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: activeUser.id,
      type: 'system',
      title: 'تم تقديم طلب السحب بنجاح 🏦',
      content: `تم تسجيل طلب سحب أرباح ${payoutType === 'sales' ? 'المبيعات' : 'الهدايا'} بقيمة ${grossAmount} د.ل (الصافي ${netAmount} د.ل بعد عمولة ${rate}%). الطلب قيد مراجعة وتأكيد المشرفين.`,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [chefNotif, ...prev]);

    addAuditLog('REQUEST_CHEF_PAYOUT', 'payout_requests', newRequest.id, {
      grossAmount,
      netAmount,
      payoutType,
      bankName,
    });

    return { success: true };
  };

  const processPayoutAdmin = (payoutId: string, action: 'completed' | 'rejected', adminNotes?: string) => {
    let targetReq: PayoutRequest | undefined;

    setPayoutRequests((prev) =>
      prev.map((req) => {
        if (req.id === payoutId) {
          targetReq = req;
          return {
            ...req,
            status: action,
            admin_notes: adminNotes || (action === 'completed' ? 'تم تأكيد وإكتمال عملية السحب والتحويل المصرفي بنجاح' : 'تم رفض طلب السحب وإعادة المبلغ للمحفظة'),
            processed_at: new Date().toISOString(),
          };
        }
        return req;
      })
    );

    if (!targetReq) return;

    if (action === 'rejected') {
      // Refund gross_amount back to chef's wallet
      setUsers((prev) =>
        prev.map((u) => (u.id === targetReq!.chef_id ? { ...u, wallet_balance: u.wallet_balance + targetReq!.gross_amount } : u))
      );
    }

    // Update wallet transaction status if present
    setWalletTransactions((prev) =>
      prev.map((tx) => {
        if (tx.user_id === targetReq?.chef_id && tx.type === 'withdrawal' && tx.status === 'pending') {
          return { ...tx, status: action === 'completed' ? 'completed' : 'refunded' };
        }
        return tx;
      })
    );

    // Send notification to chef
    const notif: NotificationItem = {
      id: `notif-payout-${Date.now()}`,
      user_id: targetReq.chef_id,
      type: 'system',
      title: action === 'completed' ? 'تم تأكيد وإكتمال عملية السحب المصرفي ⚡' : 'نتيجة طلب السحب المصرفي ⚠️',
      content:
        action === 'completed'
          ? `أكّد المشرفون إرسال مبلغ ${targetReq.net_amount} د.ل الصافي لحسابك المصرفي في ${targetReq.bank_name} (رقم الحساب: ${targetReq.account_number}).`
          : `تم رفض طلب السحب بقيمة ${targetReq.gross_amount} د.ل وإعادة المبلغ كاملاً لمحفظتك. سبب الرفض: ${adminNotes || 'بيانات الحساب غير مطابقة'}.`,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [notif, ...prev]);

    addAuditLog('PROCESS_PAYOUT_ADMIN', 'payout_requests', payoutId, { action, adminNotes });
  };

  const updateCommissionSettingsAdmin = (salesPercent: number, giftsPercent: number) => {
    setCommissionSettings({
      sales_commission_percent: Math.max(0, Math.min(100, salesPercent)),
      gifts_commission_percent: Math.max(0, Math.min(100, giftsPercent)),
    });
    addAuditLog('UPDATE_COMMISSION_SETTINGS', 'system', 'commissions', { salesPercent, giftsPercent });
  };

  const withdrawWalletFunds = async (
    amount: number,
    bankName: string,
    iban: string
  ): Promise<{ success: boolean; error?: string }> => {
    return requestChefPayout('sales', amount, bankName, '1234567', iban);
  };

  const trackSponsoredImpression = (postId: string) => {
    setSponsoredPosts((prev) =>
      prev.map((sp) => {
        if (sp.post_id === postId && sp.status === 'active') {
          return { ...sp, impressions: (sp.impressions || 0) + 1 };
        }
        return sp;
      })
    );
  };

  const trackSponsoredClick = (postId: string) => {
    setSponsoredPosts((prev) =>
      prev.map((sp) => {
        if (sp.post_id === postId && sp.status === 'active') {
          return { ...sp, clicks: (sp.clicks || 0) + 1 };
        }
        return sp;
      })
    );
  };

  const trackSponsoredCartAdd = (postId: string) => {
    setSponsoredPosts((prev) =>
      prev.map((sp) => {
        if (sp.post_id === postId && sp.status === 'active') {
          return {
            ...sp,
            cart_adds: (sp.cart_adds || 0) + 1,
            clicks: (sp.clicks || 0) + 1,
          };
        }
        return sp;
      })
    );
  };

  const trackSponsoredOrder = (postId: string) => {
    setSponsoredPosts((prev) =>
      prev.map((sp) => {
        if (sp.post_id === postId && sp.status === 'active') {
          return {
            ...sp,
            orders_count: (sp.orders_count || 0) + 1,
            cart_adds: (sp.cart_adds || 0) + 1,
            clicks: (sp.clicks || 0) + 1,
          };
        }
        return sp;
      })
    );
  };

  const isPostActiveSponsored = useCallback(
    (postId: string, city?: string): boolean => {
      if (!sponsoredPosts || sponsoredPosts.length === 0) return false;
      const targetCity = city || userCity;
      const nowMs = Date.now();
      return sponsoredPosts.some((sp) => {
        if (!sp || sp.post_id !== postId || sp.status !== 'active') return false;
        if (sp.end_date) {
          const endMs = new Date(sp.end_date).getTime();
          if (!isNaN(endMs) && endMs < nowMs) return false;
        }
        if (!sp.target_cities || sp.target_cities.length === 0) return true;
        if (sp.target_cities.includes('جميع المدن') || sp.target_cities.includes('كل المدن')) return true;
        if (sp.target_cities.includes(targetCity)) return true;
        return false;
      });
    },
    [sponsoredPosts, userCity]
  );

  const promotePost = async (
    postId: string,
    budget: number,
    targetCities: string[],
    startDate: string,
    endDate: string
  ): Promise<boolean> => {
    if (activeUser.wallet_balance < budget) {
      alert(`رصيد المحفظة غير كافٍ للإعلان الممول (${budget} د.ل)`);
      return false;
    }

    // Deduct user wallet
    setUsers((prev) =>
      prev.map((u) => (u.id === activeUser.id ? { ...u, wallet_balance: u.wallet_balance - budget } : u))
    );

    const promoNowMs = Date.now();
    const promoNowIso = new Date(promoNowMs).toISOString();

    const tx: WalletTransaction = {
      id: `tx-promo-${promoNowMs}`,
      user_id: activeUser.id,
      type: 'purchase',
      amount: -budget,
      title: `حملة إعلانية ممولة لمنشور برقم (#${postId})`,
      status: 'completed',
      created_at: promoNowIso,
    };

    setWalletTransactions((prev) => [tx, ...prev]);

    const newSponsored: SponsoredPost = {
      id: `sp-${promoNowMs}`,
      business_id: activeUser.id,
      business_name: activeUser.full_name,
      post_id: postId,
      budget,
      target_cities: targetCities,
      start_date: startDate,
      end_date: endDate,
      impressions: 0,
      clicks: 0,
      likes_count: 0,
      cart_adds: 0,
      orders_count: 0,
      status: 'active',
      created_at: promoNowIso,
    };

    setSponsoredPosts((prev) => [newSponsored, ...prev]);

    // Mark post as sponsored
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_sponsored: true } : p))
    );

    addAuditLog('PROMOTE_POST', 'sponsored_posts', newSponsored.id, { budget, targetCities });
    return true;
  };

  const applyChefVerification = (kitchenName: string, bio: string, healthCertUrl?: string) => {
    setChefProfiles((prev) => ({
      ...prev,
      [currentUser.id]: {
        user_id: currentUser.id,
        kitchen_name: kitchenName,
        cover_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
        rating_avg: 0.0,
        rating_count: 0,
        total_sales: 0,
        verification_status: 'pending',
        verification_docs: {
          health_cert_url: healthCertUrl || 'مستند_شهادة_صحية_ليبية.pdf',
        },
      },
    }));

    addAuditLog('APPLY_CHEF_VERIFICATION', 'chef_profiles', currentUser.id, { kitchenName });
    alert('تم تقديم طلب توثيق حساب الشيف بنجاح وهو الآن قيد مراجعة الأدمن!');
  };

  const verifyChefAccount = (chefUserId: string, approve: boolean, notes?: string) => {
    setChefProfiles((prev) => {
      const existing = prev[chefUserId];
      if (!existing) return prev;
      return {
        ...prev,
        [chefUserId]: {
          ...existing,
          verification_status: approve ? 'approved' : 'rejected',
        },
      };
    });

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === chefUserId) {
          return {
            ...u,
            role: approve ? 'chef' : u.role,
            is_verified: approve,
          };
        }
        return u;
      })
    );

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: chefUserId,
      type: 'verification',
      title: approve ? 'تهانينا! تم توثيق حساب الشيف الخاص بك 🎉' : 'نتيجة طلب توثيق الحساب',
      content: approve
        ? 'أصبح مطبخك موثقاً بـ شارة الأزرق على منصة سفرة، ويمكنك الآن نشر الأطباق واستلام الطلبيات الهدايا.'
        : `تم رفض الطلب لعدم اكتمال الشروط. ملاحظات الأدمن: ${notes || 'يرجى إعادة إرفاق الشهادة الصحية.'}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [notif, ...prev]);
    addAuditLog('VERIFY_CHEF_ACCOUNT', 'chef_profiles', chefUserId, { approve, notes });
  };

  const markNotificationsRead = () => {
    if (!activeUser || !activeUser.id) return;
    setNotifications((prev) =>
      prev.map((n) => {
        const isForUser =
          n.user_id === activeUser.id ||
          n.user_id === 'all' ||
          (activeUser.role === 'admin' && n.user_id === 'admin');
        if (isForUser) {
          return { ...n, is_read: true };
        }
        return n;
      })
    );
  };

  const markSingleNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    if (!activeUser || !activeUser.id) return;
    setNotifications((prev) =>
      prev.filter(
        (n) =>
          n.user_id !== activeUser.id &&
          n.user_id !== 'all' &&
          !(activeUser.role === 'admin' && n.user_id === 'admin')
      )
    );
  };

  const deletePostAdmin = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    addAuditLog('ADMIN_DELETE_POST', 'posts', postId, { deleted_by: currentUser.full_name });
  };

  const adjustUserWalletAdmin = (userId: string, amount: number, note: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newBalance = Math.max(0, u.wallet_balance + amount);
          return { ...u, wallet_balance: newBalance };
        }
        return u;
      })
    );

    const tx: WalletTransaction = {
      id: `tx-admin-adj-${Date.now()}`,
      user_id: userId,
      type: amount >= 0 ? 'deposit' : 'withdrawal',
      amount,
      title: `تعديل إداري للرصيد بواسطة الإدارة (${note || 'تسوية إدارية'})`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    setWalletTransactions((prev) => [tx, ...prev]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: userId,
      type: 'system',
      title: 'تعديل رصيد المحفظة من إدارة المنصة 💰',
      content: `تم ${amount >= 0 ? 'إضافة' : 'خصم'} ${Math.abs(amount)} د.ل إلى محفظتك. السبب: ${note || 'تسوية إدارية'}.`,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications((prev) => [notif, ...prev]);
    addAuditLog('ADMIN_WALLET_ADJUST', 'users', userId, { amount, note });
  };

  const updateUserRoleAdmin = (userId: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role, is_verified: role === 'chef' ? u.is_verified : false } : u))
    );
    addAuditLog('ADMIN_CHANGE_ROLE', 'users', userId, { new_role: role });
  };

  const toggleUserVerificationAdmin = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextState = !u.is_verified;
          return { ...u, is_verified: nextState };
        }
        return u;
      })
    );
    addAuditLog('ADMIN_TOGGLE_VERIFICATION', 'users', userId);
  };

  const updatePlatformSettingsAdmin = (settings: Partial<SystemPlatformSettings>) => {
    setPlatformSettings((prev) => {
      const updated = { ...prev, ...settings };
      addAuditLog('UPDATE_PLATFORM_SETTINGS', 'system', 'settings', updated);
      return updated;
    });
  };

  const deleteStoryAdmin = (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    addAuditLog('ADMIN_DELETE_STORY', 'stories', storyId);
  };

  const toggleSponsoredAdStatusAdmin = (adId: string) => {
    setSponsoredPosts((prev) =>
      prev.map((ad) => {
        if (ad.id === adId) {
          const newStatus = ad.status === 'active' ? 'paused' : 'active';
          return { ...ad, status: newStatus };
        }
        return ad;
      })
    );
    addAuditLog('ADMIN_TOGGLE_SPONSORED_AD', 'sponsored_posts', adId);
  };

  const clearAllSponsoredAds = () => {
    setSponsoredPosts([]);
    setPosts((prev) => prev.map((p) => ({ ...p, is_sponsored: false })));
    addAuditLog('CLEAR_ALL_SPONSORED_ADS', 'sponsored_posts', 'all');
  };

  const updateUserProfile = (data: {
    full_name?: string;
    phone?: string;
    city?: string;
    district?: string;
    bio?: string;
    avatar_url?: string;
    kitchen_name?: string;
    kitchen_bio?: string;
  }) => {
    const targetUserId = activeUser.id;
    const updatedUser: User = {
      ...activeUser,
      full_name: data.full_name ?? activeUser.full_name,
      phone: data.phone ?? activeUser.phone,
      city: data.city ?? activeUser.city,
      district: data.district ?? activeUser.district,
      bio: data.bio ?? activeUser.bio,
      avatar_url: data.avatar_url ?? activeUser.avatar_url,
    };

    setCurrentUser(updatedUser);

    setUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? updatedUser : u))
    );

    if (data.city) {
      setUserCity(data.city);
    }

    if (data.kitchen_name !== undefined || data.kitchen_bio !== undefined) {
      setChefProfiles((prev) => {
        const existing = prev[targetUserId] || {
          user_id: targetUserId,
          kitchen_name: data.kitchen_name || updatedUser.full_name,
          cover_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
          rating_avg: 0.0,
          rating_count: 0,
          total_sales: 0,
          verification_status: updatedUser.is_verified ? 'approved' : 'none',
        };

        return {
          ...prev,
          [targetUserId]: {
            ...existing,
            kitchen_name: data.kitchen_name ?? existing.kitchen_name,
            bio: data.kitchen_bio ?? existing.bio,
          },
        };
      });
    }

    addAuditLog('UPDATE_PROFILE', 'users', targetUserId, data);
  };

  // Messenger helper logic
  const unreadMessagesCount = messages.filter(
    (m) => m.sender_id !== activeUser.id && !m.is_read
  ).length;

  const getOrCreateConversation = (otherUserId: string, orderId?: string): Conversation => {
    const otherUser = users.find((u) => u.id === otherUserId);
    const existing = conversations.find(
      (c) =>
        (c.user_a_id === activeUser.id && c.user_b_id === otherUserId) ||
        (c.user_b_id === activeUser.id && c.user_a_id === otherUserId)
    );

    if (existing) {
      if (orderId && !existing.order_id) {
        existing.order_id = orderId;
      }
      return existing;
    }

    const uniqueId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const newConv: Conversation = {
      id: uniqueId,
      user_a_id: activeUser.id,
      user_b_id: otherUserId,
      user_a_name: activeUser.full_name,
      user_a_avatar: activeUser.avatar_url,
      user_b_name: otherUser?.full_name || 'مستخدم',
      user_b_avatar: otherUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      last_message_at: new Date().toISOString(),
      last_message_content: 'بدء محادثة جديدة',
      created_at: new Date().toISOString(),
      order_id: orderId,
    };

    setConversations((prev) => {
      const alreadyExists = prev.find(
        (c) =>
          (c.user_a_id === activeUser.id && c.user_b_id === otherUserId) ||
          (c.user_b_id === activeUser.id && c.user_a_id === otherUserId)
      );
      if (alreadyExists) return prev;

      // Filter out any ID collisions
      const cleanPrev = prev.filter((c) => c.id !== uniqueId);
      return [newConv, ...cleanPrev];
    });

    return newConv;
  };

  const recalculateRiskScores = () => {
    const chefUsers = users.filter((u) => u.role === 'chef' || chefProfiles[u.id]);

    setSellerRiskScores((prev) => {
      const nextScores: Record<string, SellerRiskScore> = { ...prev };

      chefUsers.forEach((chef) => {
        let score = 0;
        const flags: SellerRiskScore['flags'] = {};

        // Indicator A: Message-to-Purchase Ratio
        const chefConvs = conversations.filter(
          (c) => c.user_a_id === chef.id || c.user_b_id === chef.id
        );
        const chefOrders = orders.filter((o) => o.chef_id === chef.id);
        const convCount = chefConvs.length;
        const orderCount = chefOrders.length;

        if (convCount >= 4) {
          const ratio = convCount > 0 ? orderCount / convCount : 1;
          flags.message_to_purchase_ratio = Number(ratio.toFixed(2));
          if (ratio < 0.1) {
            score += 35; // High conversations, low purchases
          }
        }

        // Indicator B: Filter Violation Count (last 30 days)
        const userViolations = filterViolations.filter((v) => v.user_id === chef.id);
        flags.violation_count = userViolations.length;
        if (userViolations.length >= 3) {
          score += 45;
        } else if (userViolations.length > 0) {
          score += userViolations.length * 15;
        }

        // Indicator C: Long Conversation (>12 msgs) with Zero Orders
        const longChatsWithZeroOrder = chefConvs.some((c) => {
          const convMsgs = messages.filter((m) => m.conversation_id === c.id);
          const hasLinkedOrder = !!c.order_id || orders.some((o) => o.chef_id === chef.id);
          return convMsgs.length >= 10 && !hasLinkedOrder;
        });

        if (longChatsWithZeroOrder) {
          flags.long_chat_zero_order = true;
          score += 20;
        }

        const finalScore = Math.min(100, score);
        let status: SellerRiskScore['status'] = 'normal';
        if (finalScore >= 86) {
          status = 'suspended';
        } else if (finalScore >= 61) {
          status = 'warning';
        } else if (finalScore >= 31) {
          status = 'watchlist';
        }

        const kitchen = chefProfiles[chef.id]?.kitchen_name || chef.full_name;

        // Keep existing manual admin overrides if suspended manually
        const existingStatus = prev[chef.id]?.status;
        const effectiveStatus = existingStatus === 'suspended' && status !== 'suspended' ? 'suspended' : status;

        nextScores[chef.id] = {
          chef_id: chef.id,
          chef_name: chef.full_name,
          kitchen_name: kitchen,
          risk_score: finalScore,
          last_calculated_at: new Date().toISOString(),
          status: effectiveStatus,
          flags,
        };
      });

      return nextScores;
    });
  };

  const resolveRiskStatusAdmin = (
    chefId: string,
    status: 'normal' | 'watchlist' | 'warning' | 'suspended',
    notes?: string
  ) => {
    setSellerRiskScores((prev) => {
      const existing = prev[chefId] || {
        chef_id: chefId,
        chef_name: users.find((u) => u.id === chefId)?.full_name || 'الشيف',
        kitchen_name: chefProfiles[chefId]?.kitchen_name || 'المطبخ',
        risk_score: status === 'suspended' ? 90 : status === 'warning' ? 65 : 10,
        last_calculated_at: new Date().toISOString(),
        status,
        flags: {},
      };

      return {
        ...prev,
        [chefId]: {
          ...existing,
          status,
          flags: {
            ...existing.flags,
            reason_notes: notes || `تغيير حالة المخاطر يدوياً بواسطة الأدمن إلى (${status})`,
          },
        },
      };
    });

    const notif: NotificationItem = {
      id: `notif-risk-admin-${Date.now()}`,
      user_id: chefId,
      type: 'system',
      title: status === 'suspended' ? '⚠️ تنبيه: تم تعليق حسابك مؤقتاً' : 'تحديث حالة حساب الشيف 🛡️',
      content:
        status === 'suspended'
          ? `قامت الإدارة بتعليق حساب الشيف الخاص بك بسب ارتفاع مؤشر المخاطر وسجل المخالفات التجارية. ${notes || ''}`
          : `تم تعديل حالة المخاطر بحسابك إلى (${status}). نرجو الالتزام التام بسياسة البيع عبر المنصة.`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    addAuditLog('ADMIN_RESOLVE_SELLER_RISK', 'users', chefId, { status, notes });
  };

  const clearViolationsAdmin = (userId?: string) => {
    if (userId) {
      setFilterViolations((prev) => prev.filter((v) => v.user_id !== userId));
    } else {
      setFilterViolations([]);
    }
    addAuditLog('ADMIN_CLEAR_VIOLATIONS', 'filter_violations', userId || 'ALL');
  };

  const sendMessage = (
    conversationId: string,
    content: string,
    messageType: 'text' | 'emoji' | 'image' = 'text',
    orderId?: string
  ): Message => {
    // 1. Complete Ban on Chat Images (Layer 1c Requirement)
    if (messageType === 'image') {
      alert('⚠️ يُمنع إرسال أو رفع الصور داخل نظام المراسلة المباشرة بحسب سياسة المنصة لحماية البيانات ومنع تمرير أرقام الهواتف أو العناوين الخارجية.\n\nإن كان لديك استفسار أو مشكلة في الطلب، يرجى استخدام خيار "الإبلاغ عن الطلب" أو "فتح نزاع" لإرفاق صور الأدلة.');
      throw new Error('Image messages are prohibited in chat per security policy.');
    }

    // Check account suspension status (Layer 2 Enforcement)
    const userRisk = sellerRiskScores[activeUser.id];
    if (userRisk && userRisk.status === 'suspended') {
      alert('⛔ عذراً، حسابك معلق مؤقتاً من قبل الإدارة بسب الارتفاع الحاد في مؤشر مخاطر البيع الخارجي وسجل المخالفات. يرجى مراجعة إدارة المنصة.');
      throw new Error('Account suspended due to high disintermediation risk score.');
    }

    // 2. Disintermediation Filter Inspection (Layer 1a, 1b, 1d)
    const filterResult = checkDisintermediationFilter(content);
    if (filterResult.isBlocked) {
      // Record Violation in Store (Layer 1e)
      const newViolation: FilterViolation = {
        id: `viol-${Date.now()}`,
        user_id: activeUser.id,
        user_name: activeUser.full_name,
        conversation_id: conversationId,
        original_text: content,
        detected_pattern: filterResult.detectedPattern || 'محاولة تواصل تجاري خارجي',
        created_at: new Date().toISOString(),
      };

      setFilterViolations((prev) => [newViolation, ...prev]);

      // Show user warning modal/alert and DO NOT save message
      alert(`⛔ ${filterResult.userWarning || 'لا يُسمح بمشاركة أرقام الهاتف أو التواصل خارج المنصة. هذا يخالف سياسة البيع ويعرّض الحساب للحظر.'}`);

      addAuditLog('DISINTERMEDIATION_FILTER_INTERCEPTED', 'messages', activeUser.id, {
        conversationId,
        content,
        pattern: filterResult.detectedPattern,
      });

      // Recalculate Risk Scores after a violation
      setTimeout(() => recalculateRiskScores(), 100);

      throw new Error(filterResult.userWarning || 'Message blocked by security filter.');
    }

    const conv = conversations.find((c) => c.id === conversationId);
    const effectiveOrderId = orderId || conv?.order_id;
    const now = new Date();

    const expiresAt = effectiveOrderId
      ? null
      : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: activeUser.id,
      sender_name: activeUser.full_name,
      sender_avatar: activeUser.avatar_url,
      order_id: effectiveOrderId,
      content,
      message_type: messageType,
      is_read: false,
      created_at: now.toISOString(),
      expires_at: expiresAt,
    };

    setMessages((prev) => [...prev, newMsg]);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              last_message_at: now.toISOString(),
              last_message_content: content,
            }
          : c
      )
    );

    if (conv) {
      const recipientId = conv.user_a_id === activeUser.id ? conv.user_b_id : conv.user_a_id;
      const notif: NotificationItem = {
        id: `notif-msg-${Date.now()}`,
        user_id: recipientId,
        type: 'message',
        title: `رسالة جديدة من ${activeUser.full_name} 💬`,
        content: content.length > 50 ? content.slice(0, 50) + '...' : content,
        is_read: false,
        created_at: now.toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    return newMsg;
  };

  const markConversationRead = (conversationId: string) => {
    setMessages((prev) => {
      let hasUnread = false;
      const updated = prev.map((m) => {
        if (m.conversation_id === conversationId && m.sender_id !== activeUser.id && !m.is_read) {
          hasUnread = true;
          return { ...m, is_read: true };
        }
        return m;
      });
      return hasUnread ? updated : prev;
    });
  };

  const deleteExpiredMessages = () => {
    const now = new Date();
    setMessages((prev) =>
      prev.filter((m) => {
        if (!m.expires_at) return true;
        return new Date(m.expires_at) > now;
      })
    );
  };

  // Disputes & Escrow Logic
  const raiseDispute = (
    orderId: string,
    reason: DisputeReason,
    reasonText?: string,
    evidenceUrls?: string[]
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'الطلب غير موجود' };

    if (order.status === 'disputed') {
      return { success: false, error: 'الطلب قيد النزاع بالفعل' };
    }

    const newDispute: Dispute = {
      id: `disp-${Date.now()}`,
      order_id: orderId,
      raised_by: activeUser.id,
      raised_by_name: activeUser.full_name,
      reason,
      reason_text: reasonText,
      evidence_urls: evidenceUrls || [],
      status: 'open',
      created_at: new Date().toISOString(),
    };

    setDisputes((prev) => [newDispute, ...prev]);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'disputed', updated_at: new Date().toISOString() } : o))
    );

    const chefNotif: NotificationItem = {
      id: `notif-disp-${Date.now()}`,
      user_id: order.chef_id,
      type: 'dispute',
      title: `تم فتح نزاع على الطلب (#${order.id}) ⚠️`,
      content: `قام الزبون ${activeUser.full_name} بفتح بلاغ نزاع. تم حظر تحرير الأموال حتى مراجعة الإدارة.`,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const adminUser = users.find((u) => u.role === 'admin');
    if (adminUser) {
      const adminNotif: NotificationItem = {
        id: `notif-disp-admin-${Date.now()}`,
        user_id: adminUser.id,
        type: 'dispute',
        title: `بلاغ نزاع جديد يتطلب المراجعة (#${order.id}) 🚨`,
        content: `سبب البلاغ: ${reasonText || reason}. يرجى اتخاذ القرار في قسم النزاعات.`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [chefNotif, adminNotif, ...prev]);
    } else {
      setNotifications((prev) => [chefNotif, ...prev]);
    }

    addAuditLog('RAISE_DISPUTE', 'disputes', newDispute.id, { order_id: orderId, reason, reasonText });

    return { success: true, disputeId: newDispute.id };
  };

  const resolveDisputeAdmin = (
    disputeId: string,
    action: 'refund_full' | 'refund_partial' | 'reject_release' | 'store_credit',
    refundAmount?: number,
    adminNotes?: string
  ) => {
    const disp = disputes.find((d) => d.id === disputeId);
    if (!disp) return;
    const order = orders.find((o) => o.id === disp.order_id);
    if (!order) return;

    const now = new Date().toISOString();

    if (action === 'refund_full') {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === order.customer_id) {
            return { ...u, wallet_balance: u.wallet_balance + order.total_price };
          }
          return u;
        })
      );

      const custRefundTx: WalletTransaction = {
        id: `tx-ref-${Date.now()}`,
        user_id: order.customer_id,
        type: 'refund',
        amount: order.total_price,
        title: `استرداد كامل للطلب (#${order.id}) بناءً على قرار النزاع 🛡️`,
        reference_order_id: order.id,
        status: 'completed',
        created_at: now,
      };

      setWalletTransactions((prev) => [
        custRefundTx,
        ...prev.map((tx) => {
          if (tx.reference_order_id === order.id && tx.user_id === order.chef_id) {
            return { ...tx, status: 'refunded' as TransactionStatus, title: `تم إلغاء واسترداد المبلغ للزبون (#${order.id})` };
          }
          return tx;
        }),
      ]);

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled', updated_at: now } : o))
      );

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? { ...d, status: 'resolved_refund', resolved_by: activeUser.id, admin_notes: adminNotes, resolved_at: now }
            : d
        )
      );

      const custNotif: NotificationItem = {
        id: `notif-sol-${Date.now()}`,
        user_id: order.customer_id,
        type: 'dispute',
        title: 'تم قبول النزاع واسترداد المبلغ 💳',
        content: `تمت إعادة المبلغ الكامل (${order.total_price} د.ل) إلى محفظتك بنجاح.`,
        is_read: false,
        created_at: now,
      };
      const chefNotif: NotificationItem = {
        id: `notif-sol-chef-${Date.now()}`,
        user_id: order.chef_id,
        type: 'dispute',
        title: `قرار الإدارة في النزاع (#${order.id})`,
        content: `تقرر استرداد المبلغ للزبون بناءً على الأدلة والمراجعة.`,
        is_read: false,
        created_at: now,
      };
      setNotifications((prev) => [custNotif, chefNotif, ...prev]);
    } else if (action === 'refund_partial') {
      const actualRefund = refundAmount || order.total_price / 2;
      const chefAmount = Math.max(0, order.total_price - actualRefund);

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === order.customer_id) {
            return { ...u, wallet_balance: u.wallet_balance + actualRefund };
          }
          if (u.id === order.chef_id) {
            return { ...u, wallet_balance: u.wallet_balance + chefAmount };
          }
          return u;
        })
      );

      const custRefundTx: WalletTransaction = {
        id: `tx-ref-p-${Date.now()}`,
        user_id: order.customer_id,
        type: 'refund',
        amount: actualRefund,
        title: `استرداد جزئي للطلب (#${order.id}) بقيمة ${actualRefund} د.ل 🛡️`,
        reference_order_id: order.id,
        status: 'completed',
        created_at: now,
      };

      setWalletTransactions((prev) => [
        custRefundTx,
        ...prev.map((tx) => {
          if (tx.reference_order_id === order.id && tx.user_id === order.chef_id) {
            return { ...tx, status: 'completed' as TransactionStatus, amount: chefAmount, title: `تحرير جزئي لمستحقات الطلب (#${order.id})` };
          }
          return tx;
        }),
      ]);

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled', updated_at: now } : o))
      );

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? { ...d, status: 'resolved_refund', resolved_by: activeUser.id, amount: actualRefund, admin_notes: adminNotes, resolved_at: now }
            : d
        )
      );
    } else if (action === 'reject_release') {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === order.chef_id) {
            return { ...u, wallet_balance: u.wallet_balance + order.total_price };
          }
          return u;
        })
      );

      setWalletTransactions((prev) =>
        prev.map((tx) => {
          if (tx.reference_order_id === order.id && tx.user_id === order.chef_id) {
            return { ...tx, status: 'completed' as TransactionStatus, title: `تحرير مستحقات الطلب (#${order.id}) بعد مراجعة النزاع` };
          }
          return tx;
        })
      );

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'delivered', updated_at: now } : o))
      );

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? { ...d, status: 'resolved_rejected', resolved_by: activeUser.id, admin_notes: adminNotes, resolved_at: now }
            : d
        )
      );

      const custNotif: NotificationItem = {
        id: `notif-sol-rej-${Date.now()}`,
        user_id: order.customer_id,
        type: 'dispute',
        title: 'تم إغلاق النزاع وتأكيد تسليم الطلب ℹ️',
        content: `بعد مراجعة الأدلة وبيانات التوصيل، تقرر صحة التسليم وتحرير المستحقات للشيف.`,
        is_read: false,
        created_at: now,
      };
      const chefNotif: NotificationItem = {
        id: `notif-sol-chef-rel-${Date.now()}`,
        user_id: order.chef_id,
        type: 'dispute',
        title: 'تم إغلاق النزاع وتحرير أرباحك 🎉',
        content: `تمت إضافة مبلغ الطلب (${order.total_price} د.ل) لمجموع رصيد محفظتك.`,
        is_read: false,
        created_at: now,
      };
      setNotifications((prev) => [custNotif, chefNotif, ...prev]);
    } else if (action === 'store_credit') {
      const promoCredit = refundAmount || 30;
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === order.customer_id) {
            return { ...u, wallet_balance: u.wallet_balance + promoCredit };
          }
          if (u.id === order.chef_id) {
            return { ...u, wallet_balance: u.wallet_balance + order.total_price };
          }
          return u;
        })
      );

      const creditTx: WalletTransaction = {
        id: `tx-cred-${Date.now()}`,
        user_id: order.customer_id,
        type: 'deposit',
        amount: promoCredit,
        title: `رصيد تعويضي مجاني من منصة سفرة 🎁`,
        status: 'completed',
        created_at: now,
      };

      setWalletTransactions((prev) => [creditTx, ...prev]);

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId
            ? { ...d, status: 'closed', resolved_by: activeUser.id, admin_notes: adminNotes, resolved_at: now }
            : d
        )
      );
    }

    addAuditLog('RESOLVE_DISPUTE_ADMIN', 'disputes', disputeId, { action, refundAmount, adminNotes });
  };

  const releaseEscrowForOrder = (orderId: string, releaseReason?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === 'disputed' || order.dispute_status === 'opened' || order.escrow_released_at) return;

    const affComm = order.affiliate_commission_amount || 0;
    const netChefEarnings = Math.max(0, order.total_price - affComm);
    const nowIso = new Date().toISOString();

    // 1. Credit Chef & Affiliate wallets
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === order.chef_id) {
          return { ...u, wallet_balance: u.wallet_balance + netChefEarnings };
        }
        if (order.affiliate_user_id && u.id === order.affiliate_user_id && affComm > 0) {
          return { ...u, wallet_balance: u.wallet_balance + affComm };
        }
        return u;
      })
    );

    // 2. Mark pending wallet transactions as 'completed'
    setWalletTransactions((prev) =>
      prev.map((tx) => {
        if (tx.reference_order_id === orderId && tx.status === 'pending') {
          if (tx.user_id === order.chef_id) {
            return {
              ...tx,
              status: 'completed' as TransactionStatus,
              title: `أرباح مبيعات مفرجة ومحررة من الضمان (Escrow) [${releaseReason || 'فترة السماح 48س'}]: ${order.post_title}`,
            };
          }
          if (order.affiliate_user_id && tx.user_id === order.affiliate_user_id) {
            return {
              ...tx,
              status: 'completed' as TransactionStatus,
              title: `عمولة تسويق محررة من الضمان (Escrow): ${order.post_title}`,
            };
          }
        }
        return tx;
      })
    );

    // 3. Mark order escrow_released_at and total_sales
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, escrow_released_at: nowIso, updated_at: nowIso } : o))
    );

    setChefProfiles((prev) => {
      const chefId = order.chef_id;
      const existing = prev[chefId];
      if (!existing) return prev;
      return {
        ...prev,
        [chefId]: {
          ...existing,
          total_sales: (existing.total_sales || 0) + 1,
        },
      };
    });

    // 4. Send Notifications
    const chefNotif: NotificationItem = {
      id: `notif-escrow-rel-${Date.now()}`,
      user_id: order.chef_id,
      type: 'order',
      title: 'تم تحرير أموال المبيعات من الضمان (Escrow) 💰🎉',
      content: `تم تحرير أرباحك الصافية (${netChefEarnings.toFixed(2)} د.ل) للطلب (#${orderId}) وإيداعها في محفظتك المتاحة للسحب! [السبب: ${releaseReason || 'انقضاء فترة السماح 48 ساعة دون نزاع'}].`,
      is_read: false,
      created_at: nowIso,
    };
    setNotifications((prev) => [chefNotif, ...prev]);

    if (order.affiliate_user_id && affComm > 0) {
      const affNotif: NotificationItem = {
        id: `notif-aff-rel-${Date.now()}`,
        user_id: order.affiliate_user_id,
        type: 'system',
        title: 'تم تحرير عمولة التسويق 🤝💰',
        content: `تم تحرير عمولتك (${affComm.toFixed(2)} د.ل) للطلب (#${orderId}) إلى محفظتك المتاحة للسحب بنجاح!`,
        is_read: false,
        created_at: nowIso,
      };
      setNotifications((prev) => [affNotif, ...prev]);
    }

    addAuditLog('RELEASE_ESCROW', 'orders', orderId, { netChefEarnings, affComm, releaseReason });
  };

  const confirmOrderDeliveryAndReleaseEscrow = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'الطلب غير موجود' };
    if (order.status === 'disputed' || order.dispute_status === 'opened') return { success: false, error: 'لا يمكن تحرير الضمان أثناء وجود نزاع مفتوح' };

    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered', delivered_at: o.delivered_at || nowIso, updated_at: nowIso } : o))
    );

    releaseEscrowForOrder(orderId, 'تأكيد مباشر واستلام مبكر من الزبون');
    return { success: true };
  };

  const fastForwardEscrowReleaseAdmin = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered', delivered_at: o.delivered_at || nowIso } : o))
    );
    releaseEscrowForOrder(orderId, 'تجاوز فترة الـ 48 ساعة بواسطة الإدارة / التجربة');
  };

  const resolveReportAdmin = (
    reportId: string,
    action: 'dismiss' | 'delete_target' | 'warn_user' | 'reviewed',
    adminNotes?: string
  ) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    if (action === 'delete_target') {
      if (report.target_type === 'post') {
        deletePostAdmin(report.target_id);
      }
    } else if (action === 'warn_user') {
      const warnUserId = report.target_type === 'user' ? report.target_id : undefined;
      if (warnUserId) {
        const warnNotif: NotificationItem = {
          id: `notif-warn-${Date.now()}`,
          user_id: warnUserId,
          type: 'warning',
          title: '⚠️ تنبيه إداري رسمي بخصوص محتوى حسابك',
          content: adminNotes || 'تم استلام بلاغ بخصوص مخالفتك لإرشادات مجتمع سفرة. يُرجى الالتزام بمعايير النشر والجودة.',
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [warnNotif, ...prev]);
      }
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: action === 'dismiss' ? 'dismissed' : 'reviewed',
              details: adminNotes ? `${r.details || ''} [ملاحظة الإدارة: ${adminNotes}]` : r.details,
            }
          : r
      )
    );

    addAuditLog('RESOLVE_REPORT', 'content_reports', reportId, { action, adminNotes });
  };

  const simulateFullOrderCycle = () => {
    const now = new Date();
    const newOrderId = `ord-sim-${Date.now().toString().slice(-4)}`;
    const newOrder: Order = {
      id: newOrderId,
      customer_id: 'usr-1',
      customer_name: 'سالم بن علي',
      customer_phone: '0912345678',
      post_id: 'post-1',
      post_title: 'كسكسي ليبي بالبصلة ولحم الخروف الوطني (اختبار محاكاة)',
      post_image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80',
      chef_id: 'usr-chef-1',
      chef_name: 'شيف فاطمة الزهراء',
      quantity: 2,
      unit_price: 45,
      total_price: 100,
      delivery_provider: 'talabk',
      delivery_id: `dlv-sim-${Date.now().toString().slice(-4)}`,
      delivery_address: 'بن عاشور، طرابلس',
      delivery_city: 'طرابلس',
      status: 'delivered',
      payment_status: 'paid',
      dispute_status: 'none',
      escrow_amount: 85,
      commission_amount: 15,
      delivered_at: now.toISOString(),
      created_at: new Date(now.getTime() - 3600000 * 2).toISOString(),
      updated_at: now.toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);

    const tx: WalletTransaction = {
      id: `tx-sim-${Date.now()}`,
      user_id: 'usr-1',
      type: 'purchase',
      amount: -100,
      title: `دفع للطلب التجريبي (#${newOrderId}) عبر DPAY 💳`,
      reference_order_id: newOrderId,
      status: 'completed',
      created_at: now.toISOString(),
    };
    setWalletTransactions((prev) => [tx, ...prev]);

    addAuditLog('SIMULATE_ORDER_CYCLE', 'orders', newOrderId, { total: 100, escrow: 85, commission: 15 });
    return newOrderId;
  };

  const simulateDisputeCycle = () => {
    const now = new Date();
    const orderId = `ord-disp-${Date.now().toString().slice(-4)}`;
    const newOrder: Order = {
      id: orderId,
      customer_id: 'usr-2',
      customer_name: 'مروان الطرابلسي',
      customer_phone: '0925551234',
      post_id: 'post-2',
      post_title: 'طاجين جبن ومحشي بوريك ليبي مشكل (طلب نزاع تجريبي)',
      post_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      chef_id: 'usr-chef-2',
      chef_name: 'شيف عائشة المصراتي',
      quantity: 1,
      unit_price: 60,
      total_price: 60,
      delivery_provider: 'drubi',
      delivery_id: `dlv-sim-${Date.now().toString().slice(-4)}`,
      delivery_address: 'سوق الجمعة، طرابلس',
      delivery_city: 'طرابلس',
      status: 'disputed',
      payment_status: 'paid',
      dispute_status: 'opened',
      escrow_amount: 51,
      commission_amount: 9,
      delivered_at: now.toISOString(),
      created_at: new Date(now.getTime() - 3600000 * 3).toISOString(),
      updated_at: now.toISOString(),
    };

    const newDispute: Dispute = {
      id: `disp-sim-${Date.now().toString().slice(-4)}`,
      order_id: orderId,
      raised_by: 'usr-2',
      raised_by_name: 'مروان الطرابلسي',
      reason: 'damaged',
      reason_text: 'وصل الطلب متأخراً وتالفاً جزئياً (طلب محاكاة نزاع لاختبار لوحة الإدارة)',
      evidence_urls: ['https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'],
      status: 'open',
      amount: 60,
      created_at: now.toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setDisputes((prev) => [newDispute, ...prev]);
    addAuditLog('SIMULATE_DISPUTE_CYCLE', 'disputes', newDispute.id, { order_id: orderId });
    return newDispute.id;
  };

  const simulatePhoneLeakViolation = () => {
    const now = new Date();
    const newViol: FilterViolation = {
      id: `viol-sim-${Date.now().toString().slice(-4)}`,
      user_id: 'usr-chef-1',
      user_name: 'شيف فاطمة الزهراء',
      conversation_id: 'conv-sim-101',
      original_text: 'رقمي الخاص 0928889900 تواصل معاي برة البرنامج',
      detected_pattern: 'libyan_phone_number (رقم ليبي)',
      created_at: now.toISOString(),
    };

    setFilterViolations((prev) => [newViol, ...prev]);
    recalculateRiskScores();
    addAuditLog('SIMULATE_VIOLATION', 'filter_violations', newViol.id, { pattern: newViol.detected_pattern });
    return newViol.id;
  };

  const simulatePayoutRequest = () => {
    const now = new Date();
    const gross = 300;
    const commRate = commissionSettings.sales_commission_percent || 15;
    const commAmt = (gross * commRate) / 100;
    const net = gross - commAmt;

    const newPayout: PayoutRequest = {
      id: `pay-sim-${Date.now().toString().slice(-4)}`,
      chef_id: 'usr-chef-1',
      chef_name: 'شيف فاطمة الزهراء',
      kitchen_name: 'مطبخ ست الحبايب',
      chef_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      payout_type: 'sales',
      gross_amount: gross,
      commission_rate: commRate,
      commission_amount: commAmt,
      net_amount: net,
      bank_name: 'المصرف التجاري الوطني (NCB)',
      account_number: '015-778899-001',
      iban: 'LY89NCB0001015778899001',
      status: 'pending',
      created_at: now.toISOString(),
    };

    setPayoutRequests((prev) => [newPayout, ...prev]);
    addAuditLog('SIMULATE_PAYOUT_REQ', 'payout_requests', newPayout.id, { gross, net, bank: newPayout.bank_name });
    return newPayout.id;
  };

  const simulateSponsoredAdCampaign = () => {
    const now = new Date();
    const newAd: SponsoredPost = {
      id: `sp-sim-${Date.now().toString().slice(-4)}`,
      post_id: 'post-1',
      business_id: 'usr-chef-1',
      business_name: 'شيف فاطمة الزهراء',
      budget: 80,
      status: 'active',
      target_cities: ['طرابلس', 'بنغازي', 'مصراتة'],
      start_date: now.toISOString(),
      end_date: new Date(now.getTime() + 7 * 86400000).toISOString(),
      impressions: 342,
      clicks: 58,
      cart_adds: 19,
      orders_count: 6,
      created_at: now.toISOString(),
    };

    setSponsoredPosts((prev) => [newAd, ...prev]);
    addAuditLog('SIMULATE_SPONSORED_AD', 'sponsored_posts', newAd.id, { budget: 80 });
    return newAd.id;
  };

  const resetAndReseedSystemData = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
    setUsers(INITIAL_USERS);
    setPosts(INITIAL_POSTS);
    setStories(INITIAL_STORIES);
    setChefProfiles(INITIAL_CHEF_PROFILES);
    setOrders(INITIAL_ORDERS);
    setDisputes(INITIAL_DISPUTES);
    setReports(INITIAL_REPORTS);
    setPayoutRequests(INITIAL_PAYOUT_REQUESTS);
    setFilterViolations(INITIAL_FILTER_VIOLATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCommissionSettings({ sales_commission_percent: 15, gifts_commission_percent: 50 });
    setChefReviews(INITIAL_REVIEWS);
    setPlatformSettings({
      announcement_banner_text: '',
      announcement_active: false,
      maintenance_mode: false,
      min_payout_amount: 100,
      platform_name: 'سفرة (Sofra)',
      default_city: 'طرابلس',
    });
    addAuditLog('RESET_SYSTEM_DATA', 'system', 'all', { timestamp: new Date().toISOString() });
  };

  const addChefReview = (reviewData: {
    chef_id: string;
    order_id?: string;
    rating: number;
    food_quality_rating: number;
    service_rating: number;
    cleanliness_rating?: number;
    value_rating?: number;
    comment: string;
    dish_name?: string;
    post_id?: string;
  }): { success: boolean; review?: ChefReview; error?: string } => {
    const { chef_id, order_id, rating, food_quality_rating, service_rating, cleanliness_rating, value_rating, comment, dish_name, post_id } = reviewData;
    if (!comment || !comment.trim()) {
      return { success: false, error: 'يرجى كتابة تعليق لمراجعتك' };
    }

    const hasDeliveredOrder = orders.some(
      (o) => o.chef_id === chef_id && (o.customer_id === currentUser.id || o.id === order_id) && o.status === 'delivered'
    );
    const isVerified = Boolean(order_id || hasDeliveredOrder);

    const newRev: ChefReview = {
      id: `rev-${Date.now()}`,
      chef_id,
      order_id,
      user_id: currentUser.id,
      user_name: currentUser.full_name || 'زبون سُفرة',
      user_avatar: currentUser.avatar_url,
      rating: Math.max(1, Math.min(5, rating)),
      food_quality_rating: Math.max(1, Math.min(5, food_quality_rating)),
      service_rating: Math.max(1, Math.min(5, service_rating)),
      cleanliness_rating: cleanliness_rating ? Math.max(1, Math.min(5, cleanliness_rating)) : 5,
      value_rating: value_rating ? Math.max(1, Math.min(5, value_rating)) : 5,
      comment: comment.trim(),
      dish_name,
      post_id,
      is_verified_purchase: isVerified,
      helpful_count: 0,
      helpful_voters: [],
      created_at: new Date().toISOString(),
    };

    setChefReviews((prev) => {
      const currentList = prev[chef_id] || [];
      const updatedList = [newRev, ...currentList];
      const totalRatings = updatedList.reduce((acc, r) => acc + r.rating, 0);
      const newAvg = Number((totalRatings / updatedList.length).toFixed(2));

      setChefProfiles((profPrev) => {
        const existingProf = profPrev[chef_id] || {
          user_id: chef_id,
          kitchen_name: `مطبخ ${chef_id}`,
          cover_image_url: '',
          rating_avg: 5.0,
          rating_count: 0,
          total_sales: 0,
          verification_status: 'approved',
        };
        return {
          ...profPrev,
          [chef_id]: {
            ...existingProf,
            rating_avg: newAvg,
            rating_count: updatedList.length,
          },
        };
      });

      return {
        ...prev,
        [chef_id]: updatedList,
      };
    });

    const chefUser = users.find((u) => u.id === chef_id);
    if (chefUser) {
      const notif: NotificationItem = {
        id: `notif-rev-${Date.now()}`,
        user_id: chef_id,
        type: 'system',
        title: 'تقييم جديد لمطبخك ⭐',
        content: `قام الزبون ${currentUser.full_name} بتقييم مطبخك (${rating}/5 نجوم): "${comment.slice(0, 45)}..."`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((n) => [notif, ...n]);
    }

    addAuditLog('ADD_CHEF_REVIEW', 'chef_reviews', newRev.id, { chef_id, rating, isVerified });
    return { success: true, review: newRev };
  };

  const voteReviewHelpful = (chefId: string, reviewId: string) => {
    setChefReviews((prev) => {
      const list = prev[chefId] || [];
      const updated = list.map((rev) => {
        if (rev.id !== reviewId) return rev;
        const voters = rev.helpful_voters || [];
        const alreadyVoted = voters.includes(currentUser.id);
        const newVoters = alreadyVoted ? voters.filter((id) => id !== currentUser.id) : [...voters, currentUser.id];
        return {
          ...rev,
          helpful_voters: newVoters,
          helpful_count: newVoters.length,
        };
      });
      return {
        ...prev,
        [chefId]: updated,
      };
    });
  };

  const replyToChefReview = (chefId: string, reviewId: string, replyText: string): { success: boolean } => {
    if (!replyText || !replyText.trim()) return { success: false };
    setChefReviews((prev) => {
      const list = prev[chefId] || [];
      const updated = list.map((rev) => {
        if (rev.id !== reviewId) return rev;
        return {
          ...rev,
          chef_reply: {
            text: replyText.trim(),
            replied_at: 'الآن',
          },
        };
      });
      return {
        ...prev,
        [chefId]: updated,
      };
    });
    return { success: true };
  };

  // Automated 48-hour Escrow release checker effect
  useEffect(() => {
    const checkEscrowReleases = () => {
      const nowMs = Date.now();
      const H48_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

      orders.forEach((o) => {
        if (
          o.status === 'delivered' &&
          o.delivered_at &&
          !o.escrow_released_at &&
          o.dispute_status !== 'opened'
        ) {
          const deliveredMs = new Date(o.delivered_at).getTime();
          if (!isNaN(deliveredMs) && nowMs - deliveredMs >= H48_MS) {
            releaseEscrowForOrder(o.id, 'تحرير تلقائي بعد انقضاء فترة السماح (48 ساعة)');
          }
        }
      });
    };

    checkEscrowReleases();
    const interval = setInterval(checkEscrowReleases, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Site Visits & PWA Analytics tracking
  const trackVisit = useCallback(
    (deviceType?: 'android' | 'ios' | 'desktop', entryPage: string = '/', city?: string) => {
      let dev: 'android' | 'ios' | 'desktop' = deviceType || 'desktop';
      if (!deviceType && typeof window !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('android')) dev = 'android';
        else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) dev = 'ios';
      }

      let sessId = 'sess-guest';
      if (typeof window !== 'undefined') {
        let existingSess = sessionStorage.getItem('sofra_session_id');
        if (!existingSess) {
          existingSess = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          sessionStorage.setItem('sofra_session_id', existingSess);
        }
        sessId = existingSess;
      }

      const newVisit: SiteVisit = {
        id: `vst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        session_id: sessId,
        user_id: activeUser.id !== 'guest' ? activeUser.id : null,
        device_type: dev,
        is_pwa_install: false,
        entry_page: entryPage,
        city: city || userCity || 'طرابلس',
        created_at: new Date().toISOString(),
      };

      setSiteVisits((prev) => [newVisit, ...prev.slice(0, 999)]);
    },
    [activeUser, userCity]
  );

  const trackPWAInstall = useCallback(
    (deviceType?: 'android' | 'ios' | 'desktop') => {
      let dev: 'android' | 'ios' | 'desktop' = deviceType || 'android';
      if (!deviceType && typeof window !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('android')) dev = 'android';
        else if (ua.includes('iphone') || ua.includes('ipad')) dev = 'ios';
      }

      const newInstallVisit: SiteVisit = {
        id: `pwa-inst-${Date.now()}`,
        session_id: `sess-pwa-${Date.now()}`,
        user_id: activeUser.id !== 'guest' ? activeUser.id : null,
        device_type: dev,
        is_pwa_install: true,
        entry_page: '/pwa-installed',
        city: userCity || 'طرابلس',
        created_at: new Date().toISOString(),
      };

      setSiteVisits((prev) => [newInstallVisit, ...prev]);

      const nowIso = new Date().toISOString();
      const logItem: AuditLog = {
        id: `log-pwa-${Date.now()}`,
        actor_id: activeUser.id,
        actor_name: activeUser.full_name,
        action: 'PWA_APP_INSTALLED',
        target_table: 'site_visits',
        target_id: newInstallVisit.id,
        details: { device_type: dev, city: userCity },
        created_at: nowIso,
      };
      setAuditLogs((prev) => [logItem, ...prev]);
    },
    [activeUser, userCity]
  );

  const getPWAAnalyticsSummary = useCallback((nowMs: number = STATIC_BASE_TIME): PWAAnalyticsSummary => {
    const totalVisits = siteVisits.length;
    const pwaInstalls = siteVisits.filter((v) => v.is_pwa_install);
    const totalPwaInstallsCount = pwaInstalls.length;

    const deviceBreakdown = { android: 0, ios: 0, desktop: 0 };
    siteVisits.forEach((v) => {
      if (deviceBreakdown[v.device_type] !== undefined) {
        deviceBreakdown[v.device_type]++;
      }
    });

    const pwaDeviceBreakdown = { android: 0, ios: 0, desktop: 0 };
    pwaInstalls.forEach((v) => {
      if (pwaDeviceBreakdown[v.device_type] !== undefined) {
        pwaDeviceBreakdown[v.device_type]++;
      }
    });

    const currentNow = typeof window !== 'undefined' ? Date.now() : nowMs;
    const fifteenMinsAgo = new Date(currentNow - 15 * 60 * 1000).toISOString();
    const recentVisits = siteVisits.filter((v) => v.created_at >= fifteenMinsAgo);
    const uniqueSessions = new Set(recentVisits.map((v) => v.session_id));
    const activeNowCount = Math.max(14, uniqueSessions.size);

    const installRate = totalVisits > 0 ? (totalPwaInstallsCount / totalVisits) * 100 : 0;

    return {
      total_visits: totalVisits,
      total_pwa_installs: totalPwaInstallsCount,
      install_rate_percent: Math.round(installRate * 10) / 10,
      active_now_count: activeNowCount,
      device_breakdown: deviceBreakdown,
      pwa_device_breakdown: pwaDeviceBreakdown,
    };
  }, [siteVisits]);

  // User-specific notifications filter
  const userNotifications = React.useMemo(() => {
    if (!activeUser || !activeUser.id) return [];
    return notifications.filter((n) => {
      if (n.user_id === activeUser.id) return true;
      if (n.user_id === 'all') return true;
      if (activeUser.role === 'admin' && n.user_id === 'admin') return true;
      return false;
    });
  }, [notifications, activeUser]);

  return (
    <StoreContext.Provider
      value={{
        siteVisits,
        trackVisit,
        trackPWAInstall,
        getPWAAnalyticsSummary,
        currentUser: activeUser,
        users,
        isLoggedIn,
        setIsLoggedIn,
        logoutUser,

        chefProfiles,
        userCity,
        setUserCity,
        switchUser,
        switchRole,
        registerUser,
        updateUserProfile,
        posts,
        stories,
        orders,
        walletTransactions,
        gifts,
        notifications: userNotifications,
        auditLogs,
        sponsoredPosts,
        comments,
        userLikes,
        storyLikes,
        followedChefs,
        userBookmarks,
        reports,
        resolveReportAdmin,
        simulateFullOrderCycle,
        simulateDisputeCycle,
        simulatePhoneLeakViolation,
        simulatePayoutRequest,
        simulateSponsoredAdCampaign,
        resetAndReseedSystemData,

        toggleBookmark,
        reportContent,
        resetUserPassword,
        changeCurrentPassword,
        toggleTwoFactor,

        toggleLikeStory,
        markStorySeen,
        addStory,

        payoutRequests,
        commissionSettings,
        requestChefPayout,
        processPayoutAdmin,
        updateCommissionSettingsAdmin,

        conversations,
        messages,
        unreadMessagesCount,
        getOrCreateConversation,
        sendMessage,
        markConversationRead,
        deleteExpiredMessages,

        filterViolations,
        sellerRiskScores,
        recalculateRiskScores,
        resolveRiskStatusAdmin,
        clearViolationsAdmin,

        disputes,
        raiseDispute,
        resolveDisputeAdmin,
        releaseEscrowForOrder,
        confirmOrderDeliveryAndReleaseEscrow,
        fastForwardEscrowReleaseAdmin,

        addPost,
        updatePost,
        deletePost,
        toggleLike,
        toggleFollowChef,
        addComment,
        toggleCommentLike,
        sendGift,
        buyGiftPackage,
        convertGiftWalletToMainWallet,
        convertAffiliateBalanceToMainWallet,
        placeOrder,
        updateOrderStatus,
        depositWallet,
        transferWalletFunds,
        withdrawWalletFunds,
        promotePost,
        isPostActiveSponsored,
        trackSponsoredImpression,
        trackSponsoredClick,
        trackSponsoredCartAdd,
        trackSponsoredOrder,
        applyChefVerification,
        verifyChefAccount,
        markNotificationsRead,
        markSingleNotificationRead,
        deleteNotification,
        clearAllNotifications,
        addAuditLog,
        deletePostAdmin,
        adjustUserWalletAdmin,
        updateUserRoleAdmin,
        toggleUserVerificationAdmin,
        platformSettings,
        updatePlatformSettingsAdmin,
        deleteStoryAdmin,
        toggleSponsoredAdStatusAdmin,
        clearAllSponsoredAds,

        // Chef Reviews & Ratings
        chefReviews,
        addChefReview,
        voteReviewHelpful,
        replyToChefReview,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
};
