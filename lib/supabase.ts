import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }

  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  try {
    supabaseClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseClient;
  } catch (err) {
    console.warn('Supabase initialization failed:', err);
    return null;
  }
}

export const SUPABASE_SCHEMA_SQL = `-- Sofra Libya (سُفرة ليبيا) - Production Database Schema for Supabase PostgreSQL
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'chef', 'admin', 'business')),
  city TEXT NOT NULL DEFAULT 'طرابلس',
  district TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  wallet_balance NUMERIC(12, 2) DEFAULT 0.00,
  gift_wallet_balance NUMERIC(12, 2) DEFAULT 0.00,
  affiliate_balance NUMERIC(12, 2) DEFAULT 0.00,
  phone TEXT,
  email TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chef Profiles Table
CREATE TABLE IF NOT EXISTS public.chef_profiles (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  kitchen_name TEXT NOT NULL,
  bio TEXT,
  cover_image_url TEXT,
  rating_avg NUMERIC(3, 2) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  policy_accepted BOOLEAN DEFAULT TRUE,
  policy_accepted_at TIMESTAMPTZ DEFAULT NOW(),
  policy_version TEXT DEFAULT '2026.1'
);

-- 3. Posts & Dishes Table
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  chef_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chef_name TEXT NOT NULL,
  kitchen_name TEXT,
  chef_avatar TEXT,
  chef_verified BOOLEAN DEFAULT FALSE,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  is_reel BOOLEAN DEFAULT FALSE,
  video_duration_secs INTEGER,
  price NUMERIC(10, 2),
  unit_name TEXT DEFAULT 'وجبة',
  is_purchasable BOOLEAN DEFAULT TRUE,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  stock_quantity INTEGER DEFAULT 10,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  gifts_total INTEGER DEFAULT 0,
  is_sponsored BOOLEAN DEFAULT FALSE,
  affiliate_commission_percent NUMERIC(5, 2) DEFAULT 0.00,
  preparation_time_mins INTEGER DEFAULT 45,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table (With Escrow Guarantee)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES public.users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  chef_id TEXT NOT NULL REFERENCES public.users(id),
  chef_name TEXT NOT NULL,
  kitchen_name TEXT,
  post_id TEXT REFERENCES public.posts(id),
  dish_title TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  items_total NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'rejected', 'disputed')),
  payment_method TEXT NOT NULL DEFAULT 'wallet',
  payment_status TEXT NOT NULL DEFAULT 'escrow_held' CHECK (payment_status IN ('pending', 'escrow_held', 'released_to_chef', 'refunded_to_customer')),
  notes TEXT,
  delivery_provider TEXT DEFAULT 'alssaree3',
  tracking_id TEXT,
  escrow_released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Wallet & Financial Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'purchase', 'gift_sent', 'gift_received', 'gift_converted', 'gift_package_buy', 'affiliate_commission', 'refund', 'withdrawal')),
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  description TEXT NOT NULL,
  reference_order_id TEXT,
  reference_chef_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Direct In-App Conversations & Messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  user_a_id TEXT NOT NULL REFERENCES public.users(id),
  user_a_name TEXT NOT NULL,
  user_a_avatar TEXT,
  user_b_id TEXT NOT NULL REFERENCES public.users(id),
  user_b_name TEXT NOT NULL,
  user_b_avatar TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_content TEXT
);

CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.users(id),
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  recipient_id TEXT NOT NULL REFERENCES public.users(id),
  content TEXT NOT NULL,
  order_id TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'order_status_update', 'system_alert')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payout Requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id TEXT PRIMARY KEY,
  chef_id TEXT NOT NULL REFERENCES public.users(id),
  chef_name TEXT NOT NULL,
  kitchen_name TEXT,
  payout_type TEXT NOT NULL CHECK (payout_type IN ('bank_transfer', 'digital_wallet', 'cash_collection')),
  gross_amount NUMERIC(12, 2) NOT NULL,
  commission_fee NUMERIC(12, 2) DEFAULT 0.00,
  net_amount NUMERIC(12, 2) NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 8. Platform System Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  platform_name TEXT DEFAULT 'سُفرة ليبيا',
  min_payout_amount NUMERIC(10, 2) DEFAULT 100.00,
  sales_commission_percent NUMERIC(5, 2) DEFAULT 10.00,
  gifts_commission_percent NUMERIC(5, 2) DEFAULT 15.00,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  default_city TEXT DEFAULT 'طرابلس',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow Public Reads for Marketplace Discovery
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Chef profiles are viewable by everyone" ON public.chef_profiles FOR SELECT USING (true);
CREATE POLICY "Posts and menus are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Platform settings are viewable by everyone" ON public.platform_settings FOR SELECT USING (true);
`;
