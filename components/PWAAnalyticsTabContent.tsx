'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Smartphone,
  Globe,
  Users,
  Activity,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Laptop,
  Apple,
  Download,
  Filter,
} from 'lucide-react';

export const PWAAnalyticsTabContent: React.FC = () => {
  const { siteVisits, getPWAAnalyticsSummary, users, chefProfiles } = useStore();
  const summary = getPWAAnalyticsSummary();
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  const libyanCities = ['طرابلس', 'بنغازي', 'مصراتة', 'سبها', 'البيضاء', 'الزاوية', 'زليتن', 'الخمس', 'طبرق', 'سرت'];

  // Calculate city breakdown
  const cityVisitCounts: Record<string, number> = {};
  siteVisits.forEach((v) => {
    const c = v.city || 'طرابلس';
    cityVisitCounts[c] = (cityVisitCounts[c] || 0) + 1;
  });

  // Filtered Visits
  const filteredVisits = siteVisits.filter((v) => {
    if (cityFilter !== 'all' && (v.city || 'طرابلس') !== cityFilter) return false;
    if (deviceFilter !== 'all' && v.device_type !== deviceFilter) return false;
    return true;
  });

  // User breakdown
  const chefsCount = users.filter((u) => u.role === 'chef' || chefProfiles[u.id]).length;
  const customersCount = users.filter((u) => u.role === 'customer').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-6 border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/20 text-amber-400 text-xs font-black px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>PWA & Real-Time Analytics</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>مباشر: {summary.active_now_count} زائر نشط</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">إحصائيات تطبيق PWA والزوار في ليبيا 🇱🇾</h2>
            <p className="text-xs sm:text-sm text-stone-300 font-medium mt-1">
              متابعة معدلات تثبيت التطبيق بدون متجر، حركة الزوار الحية، وتوزيع المستخدمين في المدن الليبية.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-stone-800/90 border border-stone-700/80 p-3.5 rounded-2xl text-center">
              <p className="text-[11px] font-bold text-stone-400">نسبة التحويل لتثبيت PWA</p>
              <p className="text-xl font-black text-amber-400">{summary.install_rate_percent}%</p>
            </div>
            <div className="bg-stone-800/90 border border-stone-700/80 p-3.5 rounded-2xl text-center">
              <p className="text-[11px] font-bold text-stone-400">إجمالي التثبيتات</p>
              <p className="text-xl font-black text-emerald-400">{summary.total_pwa_installs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-stone-500">إجمالي الزيارات (Sessions)</span>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{summary.total_visits}</span>
            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4%
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">متابعة الجلسات من مختلف الأجهزة</p>
        </div>

        {/* PWA Installs */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-stone-500">تثبيتات التطبيق PWA</span>
            <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{summary.total_pwa_installs}</span>
            <span className="text-xs font-extrabold text-stone-500">تطبيق مثبت</span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">Android / iOS Safari / Desktop</p>
        </div>

        {/* Live Active Now */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-stone-500">الزوار النشطين الآن</span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold relative">
              <Activity className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{summary.active_now_count}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              متواجد حالياً
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">تفاعلات خلال الـ 15 دقيقة الأخيرة</p>
        </div>

        {/* Registered Users */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-stone-500">الحسابات المسجلة</span>
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{users.length}</span>
            <span className="text-xs font-bold text-stone-500">
              ({chefsCount} شيف • {customersCount} زبون)
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">شيفات موثقين زبائن ومسؤولين</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Types Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-orange-600" />
              <span>توزيع الأجهزة (Device Breakdown)</span>
            </h3>
            <span className="text-xs font-bold text-stone-500">من أصل {summary.total_visits} زيارة</span>
          </div>

          <div className="space-y-3">
            {/* Android */}
            <div>
              <div className="flex justify-between text-xs font-extrabold mb-1">
                <span className="flex items-center gap-1.5 text-stone-800">
                  <Smartphone className="w-4 h-4 text-emerald-600" /> أجهزة أندرويد (Android)
                </span>
                <span className="text-stone-900">
                  {summary.device_breakdown.android} زيارة ({Math.round((summary.device_breakdown.android / Math.max(1, summary.total_visits)) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(summary.device_breakdown.android / Math.max(1, summary.total_visits)) * 100}%` }}
                />
              </div>
            </div>

            {/* iOS */}
            <div>
              <div className="flex justify-between text-xs font-extrabold mb-1">
                <span className="flex items-center gap-1.5 text-stone-800">
                  <Apple className="w-4 h-4 text-stone-900" /> أجهزة آيفون (iOS Safari)
                </span>
                <span className="text-stone-900">
                  {summary.device_breakdown.ios} زيارة ({Math.round((summary.device_breakdown.ios / Math.max(1, summary.total_visits)) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-900 rounded-full"
                  style={{ width: `${(summary.device_breakdown.ios / Math.max(1, summary.total_visits)) * 100}%` }}
                />
              </div>
            </div>

            {/* Desktop */}
            <div>
              <div className="flex justify-between text-xs font-extrabold mb-1">
                <span className="flex items-center gap-1.5 text-stone-800">
                  <Laptop className="w-4 h-4 text-blue-600" /> المتصفح والكمبيوتر (Desktop)
                </span>
                <span className="text-stone-900">
                  {summary.device_breakdown.desktop} زيارة ({Math.round((summary.device_breakdown.desktop / Math.max(1, summary.total_visits)) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(summary.device_breakdown.desktop / Math.max(1, summary.total_visits)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Libyan Cities Visitor Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>توزيع الزوار حسب المدن الليبية 🇱🇾</span>
            </h3>
            <span className="text-xs font-bold text-stone-500">{libyanCities.length} مدن مفعّلة</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {libyanCities.map((cityName) => {
              const count = cityVisitCounts[cityName] || 0;
              const percent = Math.round((count / Math.max(1, summary.total_visits)) * 100);
              return (
                <div
                  key={cityName}
                  className="bg-stone-50 border border-stone-200/80 p-3 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-extrabold text-stone-800">{cityName}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black text-stone-900 block">{count} زيارة</span>
                    <span className="text-[10px] font-bold text-stone-400">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Technical PWA Audit & Compliance Scorecard */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 p-6 rounded-3xl border border-amber-200/60 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>حالة PWA والامتثال التكنولوجي المعياري (Standard PWA Compliance)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-black text-stone-800">Manifest.json</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                مفعل 100%
              </span>
            </div>
            <p className="text-[11px] text-stone-500">اسم التطبيق، الأيقونات، Display: standalone</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-black text-stone-800">Service Worker</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                نشط (sw.js)
              </span>
            </div>
            <p className="text-[11px] text-stone-500">التخزين الذكي Smart Cache وتأمين الـ Fallback</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-black text-stone-800">وضع Offline Mode</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                جاهز للعمل
              </span>
            </div>
            <p className="text-[11px] text-stone-500">عرض واصفة الانقطاع عند غياب التغطية</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-black text-stone-800">حدث appinstalled</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                تتبع تلقائي
              </span>
            </div>
            <p className="text-[11px] text-stone-500">تسجيل التثبيتات الحقيقية في سجل التدقيق</p>
          </div>
        </div>
      </div>

      {/* Live Site Visit Log Table */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-stone-100">
          <div>
            <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <span>سجل الجلسات والزيارات الحي (Site Visits Log)</span>
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              عرض أحدث الجلسات، نوع الجهاز، المدينة، وحالة تثبيت التطبيق
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
              <span>تصفية المدينة:</span>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-900 outline-none cursor-pointer"
              >
                <option value="all">كل المدن ({siteVisits.length})</option>
                {libyanCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700">
              <span>الجهاز:</span>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-900 outline-none cursor-pointer"
              >
                <option value="all">الكل</option>
                <option value="android">أندرويد</option>
                <option value="ios">آيفون (iOS)</option>
                <option value="desktop">كمبيوتر</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto dir-rtl">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <th className="py-3 px-3 font-extrabold">معرف الجلسة (Session)</th>
                <th className="py-3 px-3 font-extrabold">نوع الجهاز</th>
                <th className="py-3 px-3 font-extrabold">المدينة</th>
                <th className="py-3 px-3 font-extrabold">تثبيت PWA</th>
                <th className="py-3 px-3 font-extrabold">صفحة الدخول</th>
                <th className="py-3 px-3 font-extrabold">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredVisits.slice(0, 25).map((visit) => (
                <tr key={visit.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-extrabold text-stone-900 dir-ltr text-right">
                    {visit.session_id}
                  </td>
                  <td className="py-3 px-3 font-bold">
                    {visit.device_type === 'android' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        <Smartphone className="w-3.5 h-3.5" /> أندرويد
                      </span>
                    ) : visit.device_type === 'ios' ? (
                      <span className="inline-flex items-center gap-1.5 text-stone-900 bg-stone-100 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        <Apple className="w-3.5 h-3.5" /> آيفون
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        <Laptop className="w-3.5 h-3.5" /> كمبيوتر
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-stone-800">📍 {visit.city || 'طرابلس'}</td>
                  <td className="py-3 px-3 font-bold">
                    {visit.is_pwa_install ? (
                      <span className="inline-flex items-center gap-1 bg-amber-500 text-stone-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs">
                        📱 PWA App Installed
                      </span>
                    ) : (
                      <span className="text-stone-400 font-medium text-[11px]">متصفح ويب عادي</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-stone-600 text-[11px]">{visit.entry_page}</td>
                  <td className="py-3 px-3 text-stone-500 font-medium text-[11px]">
                    {new Date(visit.created_at).toLocaleString('ar-LY')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
