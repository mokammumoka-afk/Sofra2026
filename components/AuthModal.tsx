'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { LIBYAN_CITIES, CITY_SUBURBS_MAP } from '@/lib/constants';
import { UserRole } from '@/lib/types';
import { BrandLogo } from './BrandLogo';
import {
  X,
  Phone,
  Lock,
  User as UserIcon,
  MapPin,
  ChefHat,
  ShoppingBag,
  Building,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  LogOut,
  Mail,
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode = 'login' }) => {
  const { currentUser, users, registerUser, switchUser, resetUserPassword } = useStore();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');

  // Forgot password states
  const [forgotStep, setForgotStep] = useState<'request' | 'verify_reset'>('request');
  const [resetQuery, setResetQuery] = useState('ahmed@sofra.ly');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Form states
  const [email, setEmail] = useState('ahmed@sofra.ly');
  const [phone, setPhone] = useState('0912345678');
  const [password, setPassword] = useState('123456');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('طرابلس');
  const [district, setDistrict] = useState('بن عاشور');
  const [role, setRole] = useState<UserRole>('customer');

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    const suburbs = CITY_SUBURBS_MAP[newCity] || ['وسط المدينة', 'الضواحي القريبة'];
    if (suburbs.length > 0) {
      setDistrict(suburbs[0]);
    }
  };
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [otpCode, setOtpCode] = useState(['1', '2', '3', '4']);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('يرجى إدخال عنوان بريد إلكتروني صحيح (مثال: user@example.com)');
      return;
    }
    // Check if email matches any existing user or find user
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find((u) => u.email?.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanEmail) || users[0];
    if (found) {
      switchUser(found.id);
      setStep('success');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  const handleForgotRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetQuery.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني أو رقم الهاتف المسجل لدينا');
      return;
    }
    const target = resetQuery.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.email?.toLowerCase() === target ||
        u.username.toLowerCase() === target ||
        u.phone?.trim() === target
    );
    if (!found) {
      setErrorMsg('عذراً، لم نجد حساباً مرتبكاً بهذه البيانات. يمكنك تجربة أحد البريد الإلكترونية المسجلة.');
      return;
    }
    setErrorMsg('');
    setForgotStep('verify_reset');
  };

  const handleForgotResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('كلمة المرور الجديدة يجب أن تحتوي على 4 خانات على الأقل');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة المحاولة');
      return;
    }

    const res = resetUserPassword(resetQuery, newPassword);
    if (res.success && res.user) {
      setErrorMsg('');
      switchUser(res.user.id);
      setSuccessNotice(res.message);
      setStep('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('يرجى إدخال الاسم الثلاثي أو اسم المطبخ بشكل صحيح');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح للتسجيل وحماية الحساب');
      return;
    }
    // Check duplicate email
    if (users.some((u) => u.email?.toLowerCase() === email.trim().toLowerCase())) {
      setErrorMsg('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.');
      return;
    }
    setErrorMsg('');
    setStep('otp');
  };

  const handleOtpVerify = () => {
    const newUser = registerUser({
      full_name: fullName.trim(),
      username: username.trim() || (email ? email.split('@')[0] : '') || `user_${Date.now().toString().slice(-4)}`,
      role: role,
      city: city,
      district: district,
      avatar_url: avatarUrl,
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '0910000000',
      wallet_balance: 0,
    });

    switchUser(newUser.id);
    setStep('success');
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-orange-100 my-auto">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 p-6 text-white text-center relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto mb-3 flex justify-center group hover:scale-105 transition-transform duration-300">
            <BrandLogo size="2xl" withGlow={true} />
          </div>
          <h2 className="text-2xl font-black tracking-tight">منصة سُفرة الليبية</h2>
          <p className="text-amber-100 text-xs mt-1 font-medium">
            اكتشف أفضل الطهاة والمطاعم في ليبيا
          </p>

          {/* Mode Switcher Tabs */}
          {step === 'form' && (
            <div className="mt-5 bg-black/20 p-1 rounded-2xl flex gap-1">
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'login' ? 'bg-white text-orange-700 shadow-md' : 'text-white/80 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'register' ? 'bg-white text-orange-700 shadow-md' : 'text-white/80 hover:text-white'
                }`}
              >
                إنشاء حساب جديد
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6">
          {step === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">تم تسجيل الدخول بنجاح!</h3>
              <p className="text-xs text-stone-500 mt-2">
                مرحباً بك {currentUser.full_name} في منصتك سُفرة. جارٍ التوجيه...
              </p>
            </div>
          ) : step === 'otp' ? (
            /* Email OTP Verification Screen */
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">تأكيد البريد الإلكتروني</h3>
                <p className="text-xs text-stone-500 mt-1">
                  تم إرسال رمز التفعيل المكون من 4 أرقام إلى بريدك الإلكتروني <span className="font-bold dir-ltr text-orange-600">{email}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3 dir-ltr my-4">
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...otpCode];
                      newOtp[idx] = e.target.value;
                      setOtpCode(newOtp);
                    }}
                    className="w-12 h-12 text-center font-black text-xl bg-stone-50 border-2 border-stone-200 focus:border-orange-500 rounded-xl outline-none"
                  />
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>رمز التفعيل التجريبي للبريد الإلكتروني هو <strong>1234</strong>. انقر للتأكيد المباشر!</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-200"
                >
                  تعديل البيانات
                </button>
                <button
                  type="button"
                  onClick={handleOtpVerify}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95"
                >
                  تأكيد وتفعيل الحساب
                </button>
              </div>
            </div>
          ) : mode === 'login' ? (
            /* LOGIN FORM - EMAIL ONLY */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="مثال: ahmed@sofra.ly"
                    className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl pr-10 pl-4 py-2.5 text-xs text-stone-900 outline-none dir-ltr"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-stone-700">كلمة المرور / الرمز السرّي</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setForgotStep('request');
                      setErrorMsg('');
                    }}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    نسيت كلمة السر؟ 🔑
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl pr-10 pl-4 py-2.5 text-xs text-stone-900 outline-none"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition-all"
              >
                دخول عبر البريد الإلكتروني
              </button>

              {/* Demo Fast Account Selectors (Only 2 Accounts: Customer and Chef) */}
              <div className="pt-4 border-t border-stone-100">
                <p className="text-[11px] font-extrabold text-stone-500 mb-2.5 text-center flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>دخول تجريبي سريع بضغطة زر:</span>
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Customer Account Button */}
                  {(() => {
                    const customerAcc = users.find((u) => u.id === 'user-customer-1') || users.find((u) => u.role === 'customer');
                    if (!customerAcc) return null;
                    return (
                      <button
                        key={customerAcc.id}
                        type="button"
                        onClick={() => {
                          if (customerAcc.email) setEmail(customerAcc.email);
                          switchUser(customerAcc.id);
                          setStep('success');
                          setTimeout(() => onClose(), 1000);
                        }}
                        className="flex items-center gap-2 p-2.5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/40 hover:from-amber-100 hover:to-orange-100 border border-amber-200/90 text-right transition-all group shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
                      >
                        <img src={customerAcc.avatar_url} alt={customerAcc.full_name} className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-amber-400 shadow-xs" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded-full">مستخدم 🌟</span>
                          </div>
                          <p className="text-[11px] font-black text-stone-900 truncate mt-0.5">{customerAcc.full_name}</p>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Chef Account Button */}
                  {(() => {
                    const chefAcc = users.find((u) => u.id === 'user-chef-nizar') || users.find((u) => u.role === 'chef');
                    if (!chefAcc) return null;
                    return (
                      <button
                        key={chefAcc.id}
                        type="button"
                        onClick={() => {
                          if (chefAcc.email) setEmail(chefAcc.email);
                          switchUser(chefAcc.id);
                          setStep('success');
                          setTimeout(() => onClose(), 1000);
                        }}
                        className="flex items-center gap-2 p-2.5 rounded-2xl bg-gradient-to-br from-orange-50/80 to-amber-50/40 hover:from-orange-100 hover:to-amber-100 border border-orange-200/90 text-right transition-all group shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
                      >
                        <img src={chefAcc.avatar_url} alt={chefAcc.full_name} className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-orange-500 shadow-xs" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black bg-orange-200/80 text-orange-950 px-1.5 py-0.2 rounded-full">شيف 👨‍🍳</span>
                          </div>
                          <p className="text-[11px] font-black text-stone-900 truncate mt-0.5">{chefAcc.full_name}</p>
                        </div>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </form>
          ) : mode === 'forgot_password' ? (
            /* FORGOT PASSWORD FORM */
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900">استعادة كلمة المرور</h3>
                <p className="text-xs text-stone-500 mt-1">
                  أدخل بريدك الإلكتروني أو رقم هاتفك لتلقي رمز إعادة الضبط
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {errorMsg}
                </div>
              )}

              {forgotStep === 'request' ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">البريد الإلكتروني أو رقم الهاتف</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={resetQuery}
                        onChange={(e) => setResetQuery(e.target.value)}
                        placeholder="مثال: ahmed@sofra.ly أو 0912345678"
                        className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 rounded-xl pr-10 pl-4 py-2.5 text-xs text-stone-900 outline-none dir-ltr"
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>إرسال رمز إعادة الضبط</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                      }}
                      className="text-xs font-bold text-stone-500 hover:text-stone-800"
                    >
                      العودة لشاشة تسجيل الدخول
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotResetSubmit} className="space-y-3.5">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>رمز التحقق التجريبي هو <strong>1234</strong></span>
                    </p>
                    <p className="text-stone-600">سيتم تفعيل كلمة المرور الجديدة تلقائياً على حسابك.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">رمز التحقق المرسل (OTP)</label>
                    <div className="flex justify-center gap-2 dir-ltr">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const newOtp = [...otpCode];
                            newOtp[idx] = e.target.value;
                            setOtpCode(newOtp);
                          }}
                          className="w-10 h-10 text-center font-black text-lg bg-stone-50 border-2 border-stone-200 focus:border-orange-500 rounded-xl outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="أدخل كلمة مرور جديدة (4+ عناصر)"
                      className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 rounded-xl px-3 py-2.5 text-xs text-stone-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 rounded-xl px-3 py-2.5 text-xs text-stone-900 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-200"
                    >
                      تغيير البيانات
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-95"
                    >
                      حفظ وتسجيل الدخول
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Account Role Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">نوع الحساب في سُفرة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      role === 'customer'
                        ? 'bg-orange-50 border-orange-500 text-orange-800 font-bold shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <span className="text-xs block font-bold">مستخدم / عشاق الطعام 🍲</span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">تصفح الستوريات، التفاعل، وطلب المأكولات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('chef')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      role === 'chef'
                        ? 'bg-orange-50 border-orange-500 text-orange-800 font-bold shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <ChefHat className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                    <span className="text-xs block font-bold">شيف / مطبخ تجاري</span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">يشمل جميع المزايا التجارية والمبيعات</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@sofra.ly"
                    className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 rounded-xl pr-9 pl-3 py-2 text-xs text-stone-900 outline-none dir-ltr"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">الاسم الثلاثي أو اسم المطبخ</label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثلاً: مريم القرقني أو مطبخ الياسمين"
                    className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 rounded-xl pr-9 pl-3 py-2 text-xs text-stone-900 outline-none"
                  />
                  <UserIcon className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المدينة / الإقليم</label>
                  <select
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 rounded-xl px-2 py-2 text-xs text-stone-900 outline-none font-bold"
                  >
                    {LIBYAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المنطقة / الضاحية 🏡</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 rounded-xl px-2 py-2 text-xs text-stone-900 outline-none font-bold"
                  >
                    {(CITY_SUBURBS_MAP[city] || ['وسط المدينة', 'الضواحي القريبة']).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">رقم الهاتف (اختياري)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="091xxxxxxx"
                  className="w-full bg-stone-50 border border-stone-200 focus:bg-white focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-stone-900 outline-none"
                />
              </div>

              {/* Choose Preset Avatar */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">اختر الصورة الشخصية / الشعار</label>
                <div className="flex gap-2 items-center overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                        avatarUrl === url ? 'border-orange-600 scale-105 shadow-md' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={url} alt="avatar option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all mt-2 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>إرسال رمز التفعيل إلى البريد الإلكتروني</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
