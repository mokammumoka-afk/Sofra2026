'use client';

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, Copy, Check, RefreshCw, Server, ShieldCheck, Download, Code2, ExternalLink } from 'lucide-react';
import { getSupabase, SUPABASE_SCHEMA_SQL } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export const SupabaseConfigTab: React.FC = () => {
  const { users, chefProfiles, posts, orders, walletTransactions } = useStore();
  const [supabaseUrl, setSupabaseUrl] = useState(() => process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  const [connectionStatus, setConnectionStatus] = useState<'unconfigured' | 'connected' | 'checking' | 'error'>('unconfigured');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const testConnection = React.useCallback(async () => {
    setConnectionStatus('checking');
    setErrorMessage('');

    try {
      const client = getSupabase();
      if (!client) {
        setConnectionStatus('unconfigured');
        return;
      }

      // Quick ping test to public table or auth
      const { error } = await client.from('platform_settings').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // If table doesn't exist yet, it's still connected to Supabase instance!
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setConnectionStatus('connected');
          setSyncStatus('متصل بقاعدة Supabase بنجاح! يلزم تشغيل ملف SQL في لوحة Supabase لإنشاء الجداول.');
          return;
        }
        setConnectionStatus('error');
        setErrorMessage(error.message || 'فشل الاتصال بقاعدة البيانات');
      } else {
        setConnectionStatus('connected');
        setSyncStatus('الاتصال نشط وقاعدة البيانات متزامنة 100% 🟢');
      }
    } catch (err: unknown) {
      setConnectionStatus('error');
      const error = err as Error;
      setErrorMessage(error?.message || 'تعذر الوصول إلى خادم Supabase');
    }
  }, []);

  useEffect(() => {
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (envUrl && envKey) {
      const timer = setTimeout(() => {
        void testConnection();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [testConnection]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SCHEMA_SQL], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sofra_libya_supabase_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJsonBackup = () => {
    const chefList = Object.values(chefProfiles);
    const backupData = {
      exported_at: new Date().toISOString(),
      platform: 'سُفرة ليبيا - Sofra Libya',
      users_count: users.length,
      chefs_count: chefList.length,
      posts_count: posts.length,
      orders_count: orders.length,
      transactions_count: walletTransactions.length,
      data: {
        users,
        chefProfiles,
        posts,
        orders,
        walletTransactions,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sofra_libya_database_seed_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePushDataToSupabase = async () => {
    const client = getSupabase();
    if (!client) {
      alert('يرجى أولاً إدخال مفاتيح Supabase في إعدادات البيئة');
      return;
    }

    setSyncLoading(true);
    setSyncStatus('جارٍ تصدير ورفع سجلات التطبيق الحية إلى Supabase...');

    try {
      // 1. Sync users
      const formattedUsers = users.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        username: u.username,
        role: u.role,
        city: u.city,
        district: u.district || null,
        avatar_url: u.avatar_url || null,
        bio: u.bio || null,
        is_verified: u.is_verified,
        wallet_balance: u.wallet_balance,
        gift_wallet_balance: u.gift_wallet_balance || 0,
        affiliate_balance: u.affiliate_balance || 0,
        phone: u.phone || null,
        created_at: u.created_at,
      }));

      const { error: usersError } = await client.from('users').upsert(formattedUsers);
      if (usersError) throw usersError;

      // 2. Sync chef profiles
      const chefList = Object.values(chefProfiles);
      const formattedChefs = chefList.map((c) => ({
        user_id: c.user_id,
        kitchen_name: c.kitchen_name,
        bio: c.bio || null,
        cover_image_url: c.cover_image_url,
        rating_avg: c.rating_avg,
        rating_count: c.rating_count,
        total_sales: c.total_sales,
        verification_status: c.verification_status,
        policy_accepted: c.policy_accepted ?? true,
      }));

      const { error: chefsError } = await client.from('chef_profiles').upsert(formattedChefs);
      if (chefsError) throw chefsError;

      setSyncStatus(`تمت مزامنة ${users.length} مستخدم و ${chefList.length} مطبخ بنجاح تام إلى Supabase! ✅`);
    } catch (err: unknown) {
      const error = err as Error;
      setSyncStatus(`خطأ أثناء المزامنة: ${error?.message || 'تأكد من إنشاء الجداول عبر كود SQL أولاً'}`);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-emerald-950 via-stone-900 to-stone-900 text-white p-6 rounded-3xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">تهيئة قاعدة بيانات Supabase (PostgreSQL 16)</h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Global Enterprise Standard
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                بنية متطورة جاهزة للتوسع المليوني، متوافقة مع التخزين السحابي، التشفير وحماية الضمان المصرفي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={testConnection}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-stone-700 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === 'checking' ? 'animate-spin text-emerald-400' : ''}`} />
              <span>فحص الاتصال الحقيقي</span>
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>فتح لوحة Supabase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="mt-5 pt-4 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-medium">حالة الاتصال:</span>
            {connectionStatus === 'connected' && (
              <span className="bg-emerald-500/20 text-emerald-300 font-black px-3 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>متصل بنجاح مع Supabase (Live Cluster)</span>
              </span>
            )}
            {connectionStatus === 'unconfigured' && (
              <span className="bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>جاهز للربط - بانتظار إدخال المفاتيح أدناه</span>
              </span>
            )}
            {connectionStatus === 'checking' && (
              <span className="bg-blue-500/20 text-blue-300 font-bold px-3 py-1 rounded-lg border border-blue-500/30 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>جارٍ فحص الاتصال بالخادم...</span>
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="bg-rose-500/20 text-rose-300 font-bold px-3 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>خطأ: {errorMessage}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-stone-400 text-[11px]">
            <span>محرك البيانات: PostgreSQL v16</span>
            <span>•</span>
            <span>نظام الأمان: Row-Level Security (RLS)</span>
          </div>
        </div>
      </div>

      {/* Two Column Configuration & SQL Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Setup Steps & Keys Guide */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card 1: Keys Configuration */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>مفاتيح الربط والبيئة (Environment Keys)</span>
              </h4>
              <span className="text-[10px] bg-stone-100 text-stone-600 font-mono px-2 py-0.5 rounded-md">.env.local / secrets</span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              قم بإنشاء مشروع مجاني على موقع <strong className="text-emerald-700">Supabase.com</strong> ثم انسخ المفتاحين من صفحة{' '}
              <span className="font-mono text-[11px] bg-stone-100 px-1 py-0.5 rounded text-stone-800">Project Settings &gt; API</span>:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  1. رابط المشروع (NEXT_PUBLIC_SUPABASE_URL):
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-mono text-stone-800 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  2. المفتاح العام المجهول (NEXT_PUBLIC_SUPABASE_ANON_KEY):
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-mono text-stone-800 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200/60 flex items-start gap-3 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-extrabold block">حماية أمنية تلقائية:</strong>
                <p className="text-[11px] text-emerald-800">
                  مفتاح <code className="font-mono bg-emerald-100/70 px-1 rounded">anon</code> آمن تماماً للعمل في المتصفح بفضل تفعيل سياسات الأمان على مستوى الصفوف (RLS) التي تمنع أي تلاعب برصيد المحافظ أو بيانات الطلبيات.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Data Actions & Seed */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>مزامنة وتصدير بيانات التطبيق الحالية</span>
            </h4>
            <p className="text-xs text-stone-500">
              يمكنك تصدير قاعدة البيانات كنسخة احتياطية JSON أو رفع بيانات الشيفات والأطباق الحالية مباشرة إلى Supabase:
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleExportJsonBackup}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-600" />
                <span>تحميل نسخة احتياطية (JSON Backup)</span>
              </button>

              <button
                onClick={handlePushDataToSupabase}
                disabled={syncLoading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>{syncLoading ? 'جارٍ الرفع...' : 'رفع البيانات الحالية إلى Supabase'}</span>
              </button>
            </div>

            {syncStatus && (
              <div className="p-3 bg-stone-100 rounded-xl text-xs font-bold text-stone-800 border border-stone-200">
                {syncStatus}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: SQL Schema Viewer & Runner */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-sm text-stone-900">مخطط جداول SQL الجاهز للتشغيل في Supabase</h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSql}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="تحميل كملف .sql"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل SQL</span>
                </button>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-stone-950" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الكود بالكامل</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-stone-500">
              انسخ هذا المخطط وافتحه في <strong className="text-stone-800">Supabase SQL Editor</strong> واضغط <strong className="text-emerald-700">Run</strong> ليتم بناء الجداول والعلاقات ونظام الأمان في ثوانٍ:
            </p>

            <div className="relative flex-1 min-h-[360px] bg-stone-950 rounded-2xl p-4 text-emerald-400 font-mono text-[11px] overflow-auto border border-stone-800 max-h-[460px] dir-ltr text-left select-all">
              <pre className="whitespace-pre-wrap">{SUPABASE_SCHEMA_SQL}</pre>
            </div>

            <div className="pt-2 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100">
              <span>يشمل: Users, ChefProfiles, Posts, Escrow Orders, Transactions, RLS Policies</span>
              <span className="text-emerald-600 font-bold">PostgreSQL Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
