export type UserRole = 'customer' | 'chef' | 'admin' | 'business'; // business mapped to chef for backward compatibility

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type OrderStatus = 
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected'
  | 'disputed';

export type TransactionType = 
  | 'deposit'
  | 'purchase'
  | 'gift_sent'
  | 'gift_received'
  | 'gift_converted'
  | 'gift_package_buy'
  | 'affiliate_commission'
  | 'refund'
  | 'withdrawal';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type SubscriptionPlan = 'chef_pro' | 'business_pro';

export interface User {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  city: string;
  district?: string;
  avatar_url: string;
  bio?: string;
  is_verified: boolean;
  wallet_balance: number;
  gift_wallet_balance?: number;
  affiliate_balance?: number;
  phone?: string;
  email?: string;
  password?: string;
  two_factor_enabled?: boolean;
  created_at: string;
}

export interface ChefProfile {
  user_id: string;
  kitchen_name: string;
  bio?: string;
  cover_image_url: string;
  rating_avg: number;
  rating_count: number;
  total_sales: number;
  verification_status: VerificationStatus;
  policy_accepted?: boolean;
  policy_accepted_at?: string;
  policy_version?: string;
  verification_docs?: {
    health_cert_url?: string;
    commercial_reg?: string;
    notes?: string;
  };
}

export interface ChefReview {
  id: string;
  chef_id: string;
  order_id?: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  rating: number; // 1-5 overall
  food_quality_rating: number; // 1-5 جودة الطعام والنكهة
  service_rating: number; // 1-5 الخدمة وسرعة التحضير
  cleanliness_rating?: number; // 1-5 النظافة والتغليف
  value_rating?: number; // 1-5 مطابقة الوصف والقيمة مقابل السعر
  comment: string;
  dish_name?: string;
  post_id?: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  helpful_voters?: string[];
  chef_reply?: {
    text: string;
    replied_at: string;
  };
  created_at: string;
}

export interface Post {
  id: string;
  chef_id: string;
  chef_name: string;
  kitchen_name?: string;
  chef_avatar: string;
  chef_verified: boolean;
  title: string;
  description: string;
  ingredients?: string[];
  images: string[];
  video_url?: string;
  is_reel?: boolean;
  video_duration_secs?: number;
  price: number | null; // null if gifts-only (non-purchasable)
  unit_name?: string; // e.g. 'قطعة', 'بوكس', 'تورتة', 'وجبة', 'كيلو'
  is_purchasable: boolean;
  category: string;
  city: string;
  district?: string;
  stock_quantity: number;
  likes_count: number;
  comments_count: number;
  gifts_total: number;
  is_sponsored?: boolean;
  affiliate_commission_percent?: number; // percentage specified by chef (e.g. 5 = 5%)
  preparation_time_mins?: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: string;
  likes_count?: number;
  is_chef?: boolean;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  chef_id: string;
  chef_name: string;
  post_id: string;
  post_title: string;
  post_image: string;
  quantity: number;
  unit_price?: number;
  delivery_fee?: number;
  total_price: number;
  status: OrderStatus;
  delivery_provider: 'talabk' | 'drubi' | 'express_ly' | 'direct_pickup';
  delivery_id?: string;
  payment_session_id?: string;
  payment_status?: string;
  gateway_used?: string;
  delivery_address: string;
  delivery_city: string;
  notes?: string;
  affiliate_user_id?: string;
  affiliate_commission_amount?: number;
  escrow_amount?: number;
  commission_amount?: number;
  delivered_at?: string;
  escrow_released_at?: string;
  dispute_status?: 'none' | 'opened' | 'resolved_customer' | 'resolved_chef';
  dispute_reason?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  driver_lat?: number;
  driver_lng?: number;
  driver_name?: string;
  driver_phone?: string;
  driver_speed_kmh?: number;
  delivery_progress_percent?: number;
  estimated_arrival_mins?: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  title: string;
  reference_order_id?: string;
  dpay_session_id?: string;
  status: TransactionStatus;
  created_at: string;
}

export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  amount: number; // in LYD
  description: string;
}

export interface Gift {
  id: string;
  post_id: string;
  post_title: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  recipient_chef_id: string;
  gift_name: string;
  gift_icon: string;
  amount: number;
  message?: string;
  created_at: string;
}

export interface SponsoredPost {
  id: string;
  business_id: string;
  business_name: string;
  post_id: string;
  budget: number;
  target_cities: string[];
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
  likes_count?: number;
  cart_adds?: number;
  orders_count?: number;
  status: 'active' | 'paused' | 'ended';
  dpay_session_id?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  price: number;
  starts_at: string;
  ends_at: string;
  auto_renew: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'order' | 'gift' | 'like' | 'comment' | 'system' | 'verification' | 'message' | 'dispute' | 'warning';
  title: string;
  content: string;
  is_read: boolean;
  link?: string;
  created_at: string;
  order_id?: string;
  order_status?: OrderStatus;
  post_image?: string;
}

export interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  user_a_name?: string;
  user_a_avatar?: string;
  user_b_name?: string;
  user_b_avatar?: string;
  last_message_at: string;
  last_message_content?: string;
  created_at: string;
  order_id?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  order_id?: string;
  content: string;
  message_type: 'text' | 'emoji' | 'image';
  is_read: boolean;
  created_at: string;
  expires_at?: string | null;
}

export type DisputeReason = 'not_delivered' | 'wrong_item' | 'damaged' | 'unacceptable_delay' | 'other';
export type DisputeStatus = 'open' | 'under_review' | 'resolved_refund' | 'resolved_rejected' | 'closed';

export interface Dispute {
  id: string;
  order_id: string;
  raised_by: string; // user_id
  raised_by_name?: string;
  reason: DisputeReason;
  reason_text?: string;
  evidence_urls?: string[];
  status: DisputeStatus;
  admin_notes?: string;
  resolved_by?: string;
  amount?: number;
  created_at: string;
  resolved_at?: string;
}

export interface ContentReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  target_type: 'post' | 'user' | 'comment';
  target_id: string;
  target_title_or_name?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_table: string;
  target_id: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface Story {
  id: string;
  chef_id: string;
  chef_name: string;
  kitchen_name: string;
  chef_avatar: string;
  media_url: string;
  media_type?: 'image' | 'video';
  title: string;
  caption: string;
  city: string;
  created_at: string;
  is_seen?: boolean;
  likes_count?: number;
  views_count?: number;
  dish_post_id?: string;
}

export interface DPAYGatewayOption {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  processing_fee: string;
}

export type PayoutType = 'sales' | 'gifts';
export type PayoutStatus = 'pending' | 'completed' | 'rejected';

export interface PayoutRequest {
  id: string;
  chef_id: string;
  chef_name: string;
  kitchen_name?: string;
  chef_avatar?: string;
  payout_type: PayoutType;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  bank_name: string;
  account_number: string;
  iban: string;
  status: PayoutStatus;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
}

export interface AppCommissionSettings {
  sales_commission_percent: number;
  gifts_commission_percent: number;
}

export interface SystemPlatformSettings {
  announcement_banner_text: string;
  announcement_active: boolean;
  maintenance_mode: boolean;
  min_payout_amount: number;
  platform_name: string;
  default_city: string;
}

export interface FilterViolation {
  id: string;
  user_id: string;
  user_name: string;
  conversation_id: string;
  original_text: string;
  detected_pattern: string;
  created_at: string;
}

export interface SellerRiskScore {
  chef_id: string;
  chef_name: string;
  kitchen_name?: string;
  risk_score: number; // 0 to 100
  last_calculated_at: string;
  status: 'normal' | 'watchlist' | 'warning' | 'suspended';
  flags: {
    message_to_purchase_ratio?: number;
    violation_count?: number;
    long_chat_zero_order?: boolean;
    reason_notes?: string;
  };
}

export interface SiteVisit {
  id: string;
  session_id: string;
  user_id?: string | null;
  device_type: 'android' | 'ios' | 'desktop';
  is_pwa_install: boolean;
  entry_page: string;
  city?: string;
  created_at: string;
}

export interface PWAAnalyticsSummary {
  total_visits: number;
  total_pwa_installs: number;
  install_rate_percent: number;
  active_now_count: number;
  device_breakdown: {
    android: number;
    ios: number;
    desktop: number;
  };
  pwa_device_breakdown: {
    android: number;
    ios: number;
    desktop: number;
  };
}

