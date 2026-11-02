'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Flag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Bell,
  ShieldCheck,
  Search,
  Eye,
  MessageSquare,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { ContentReport } from '@/lib/types';

interface AdminReportsTabProps {
  onShowToast: (msg: string) => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({ onShowToast }) => {
  const { reports, resolveReportAdmin, posts, users } = useStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected report for action
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [actionType, setActionType] = useState<'dismiss' | 'delete_target' | 'warn_user' | 'reviewed'>('dismiss');
  const [adminNotes, setAdminNotes] = useState<string>('تمت المراجعة والتأكد من توافق المحتوى مع سياسة المنصة.');

  const filteredReports = reports.filter((rep) => {
    if (filterStatus !== 'all' && rep.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchReason = rep.reason?.toLowerCase().includes(q);
      const matchDetails = rep.details?.toLowerCase().includes(q);
      const matchTarget = rep.target_title_or_name?.toLowerCase().includes(q);
      const matchReporter = rep.reporter_name?.toLowerCase().includes(q);
      if (!matchReason && !matchDetails && !matchTarget && !matchReporter) return false;
    }
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    resolveReportAdmin(selectedReport.id, actionType, adminNotes);

    let feedback = '';
    if (actionType === 'delete_target') feedback = 'تم حذف المنشور / العنصر المبلغ عنه وتحديث البلاغ بنجاح 🗑️';
    else if (actionType === 'warn_user') feedback = 'تم إرسال إنذار وتنبيه رسمي للمستخدم بنجاح ⚠️';
    else if (actionType === 'dismiss') feedback = 'تم حفظ وتجاهل البلاغ بنجاح ✅';
    else feedback = 'تم تأكيد مراجعة البلاغ بنجاح ✅';

    onShowToast(feedback);
    setSelectedReport(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950/40 to-stone-900 text-white rounded-3xl p-6 border border-stone-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold shadow-md">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white">مركز الرقابة والبلاغات عن المحتوى (Reports & Moderation) 🚨</h2>
              {pendingCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                  {pendingCount} بلاغ جديد
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-1">
              مراجعة بلاغات المجتمع عن الأطباق غير اللائقة، سرقة الصور، أو محاولات التحايل خارج التطبيق
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
            حماية معايير المجتمع 🇱🇾
          </span>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'all' ? 'bg-stone-900 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              الكل ({reports.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterStatus === 'pending'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span>بلاغات معلقة</span>
              <span className="bg-rose-900/30 px-1.5 py-0.2 rounded-full text-[10px]">{pendingCount}</span>
            </button>
            <button
              onClick={() => setFilterStatus('reviewed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'reviewed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              تمت المعالجة ({reports.filter((r) => r.status === 'reviewed').length})
            </button>
            <button
              onClick={() => setFilterStatus('dismissed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'dismissed'
                  ? 'bg-stone-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              المتجاهلة ({reports.filter((r) => r.status === 'dismissed').length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالسبب، اسم المبلغ، أو المحتوى..."
              className="w-full bg-stone-100 text-xs pr-8 pl-3 py-2 rounded-xl outline-none border border-stone-200"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-stone-600">لا توجد بلاغات معلقة مطابقة للفلاتر 🎉</p>
            <p className="text-[11px] text-stone-400 mt-1">المحتوى المعروض نظيف ومطابق لمعايير سفرة.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((rep) => {
              const targetPost = rep.target_type === 'post' ? posts.find((p) => p.id === rep.target_id) : null;
              const targetUser = rep.target_type === 'user' ? users.find((u) => u.id === rep.target_id) : null;

              return (
                <div
                  key={rep.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    rep.status === 'pending'
                      ? 'bg-rose-50/50 border-rose-200 shadow-2xs'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          rep.target_type === 'post'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {rep.target_type === 'post' ? <UtensilsCrossed className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-stone-900">
                            بلاغ عن {rep.target_type === 'post' ? 'طبق / منشور' : 'حساب مستخدم'}:
                          </span>
                          <span className="font-extrabold text-xs text-stone-900 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                            {rep.target_title_or_name || targetPost?.title || targetUser?.full_name || rep.target_id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              rep.status === 'pending'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : rep.status === 'reviewed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {rep.status === 'pending' ? 'قيد المراجعة' : rep.status === 'reviewed' ? 'تمت المعالجة' : 'تم التجاهل'}
                          </span>
                        </div>

                        <div className="text-xs text-stone-600">
                          المبلغ: <span className="font-bold text-stone-800">{rep.reporter_name || 'مستخدم مسجل'}</span> •
                          التاريخ: <span className="dir-ltr">{new Date(rep.created_at).toLocaleString('ar-LY')}</span>
                        </div>

                        <div className="text-xs text-stone-800 bg-white p-2.5 rounded-xl border border-stone-200 mt-1.5">
                          <span className="font-bold text-rose-700 block mb-0.5">السبب المبلغ عنه: {rep.reason}</span>
                          {rep.details && <p className="text-stone-600 text-[11px]">{rep.details}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {rep.status === 'pending' ? (
                        <button
                          onClick={() => {
                            setSelectedReport(rep);
                            if (rep.target_type === 'post') setActionType('delete_target');
                            else setActionType('warn_user');
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs py-2 px-3.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          معالجة البلاغ ⚡
                        </button>
                      ) : (
                        <span className="text-[11px] text-stone-500 font-bold bg-stone-100 px-3 py-1.5 rounded-xl">
                          مكتمل
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-sm text-stone-900">إجراءات الرقابة على البلاغ #{selectedReport.id}</h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-stone-400 hover:text-stone-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-3.5">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs">
                <span className="text-stone-500 block">العنصر المعني:</span>
                <span className="font-bold text-stone-900">{selectedReport.target_title_or_name}</span>
                <span className="text-[11px] text-rose-700 font-bold block mt-1">السبب: {selectedReport.reason}</span>
              </div>

              <div>
                <label className="text-xs font-black text-stone-900 block mb-2">اختر الإجراء الإداري:</label>
                <div className="space-y-2 text-xs">
                  {selectedReport.target_type === 'post' && (
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer">
                      <input
                        type="radio"
                        name="report_action"
                        checked={actionType === 'delete_target'}
                        onChange={() => setActionType('delete_target')}
                        className="accent-rose-600"
                      />
                      <span className="font-bold text-rose-700">حذف المنشور فوراً من المنصة 🗑️</span>
                    </label>
                  )}

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer">
                    <input
                      type="radio"
                      name="report_action"
                      checked={actionType === 'warn_user'}
                      onChange={() => setActionType('warn_user')}
                      className="accent-amber-500"
                    />
                    <span className="font-bold text-amber-800">توجيه إنذار رسمي للمستخدم عبر الإشعارات ⚠️</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer">
                    <input
                      type="radio"
                      name="report_action"
                      checked={actionType === 'dismiss'}
                      onChange={() => setActionType('dismiss')}
                      className="accent-stone-600"
                    />
                    <span className="font-bold text-stone-700">حفظ البلاغ وتجاهله (بلاغ غير صحيح) ❌</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer">
                    <input
                      type="radio"
                      name="report_action"
                      checked={actionType === 'reviewed'}
                      onChange={() => setActionType('reviewed')}
                      className="accent-emerald-600"
                    />
                    <span className="font-bold text-emerald-800">تأكيد المراجعة دون عقوبة ✅</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">ملاحظة الإدارة:</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-bold outline-none resize-none"
                  placeholder="ملاحظات..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-stone-900 hover:bg-stone-850 text-white font-black text-xs py-3 rounded-2xl shadow-xs transition-colors cursor-pointer"
                >
                  تنفيذ الإجراء 🛡️
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-3 rounded-2xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
