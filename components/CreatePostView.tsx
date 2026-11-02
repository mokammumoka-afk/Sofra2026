'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { CATEGORIES, LIBYAN_CITIES } from '@/lib/constants';
import {
  Utensils,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  Clock,
  DollarSign,
  Package,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Upload,
  Plus,
  Trash2,
  X,
  HelpCircle,
  Box,
  Cake,
  Layers,
  PieChart,
} from 'lucide-react';

interface CreatePostViewProps {
  onPublished?: () => void;
  onCancel?: () => void;
}

const PRESET_UNITS = [
  { id: 'قطعة', label: 'قطعة', icon: '🍪', desc: 'مثل بقلاوة، غريبة، موالح، كب كيك، كيكة صغيرة' },
  { id: 'بوكس / صندوق', label: 'بوكس / صندوق', icon: '📦', desc: 'مثل بوكس حلا، بوكس موالح مشكلة، بوكس ضيافة' },
  { id: 'تورتة / صينية', label: 'تورتة / صينية', icon: '🎂', desc: 'مثل تورتة مناظرات، صينية بسبوسة، طاجين بيتزا' },
  { id: 'وجبة / فرد', label: 'وجبة / فرد', icon: '🍲', desc: 'مثل وجبة كسكاس، وجبة رشدة، وجبة رز بالخلطة' },
  { id: 'كيلو / عبوة', label: 'كيلو / عبوة', icon: '⚖️', desc: 'مثل كيلو بقلاوة، كيلو معجنات، برطمان مخلل' },
];

const PRESET_INGREDIENTS = [
  'فستق حلبي',
  'لوز محمص',
  'عسل طبيعي',
  'سمن بلدي',
  'شوكولاتة فاخرة',
  'عجينة المورقة',
  'قشطة بيتي',
  'بهارات طازجة',
  'زبدة فاخرة',
  'تمر مدلوك',
  'كراميل',
  'لحم ضأن طازج',
  'سميد ناعم',
  'ماء زهر الصافي',
];

const SAMPLE_FOOD_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    label: 'بوكس حلويات وبقلاوة فاخرة',
  },
  {
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    label: 'تورتة وكيك مناسبات',
  },
  {
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    label: 'بوكس معجنات وموالح',
  },
  {
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    label: 'وجبات عائلية ورز بالخلطة',
  },
  {
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    label: 'مشويات وطواجين طازجة',
  },
  {
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    label: 'سلاطات ومقبلات خاصة',
  },
];

export const CreatePostView: React.FC<CreatePostViewProps> = ({ onPublished, onCancel }) => {
  const { addPost, currentUser, userCity } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unitName, setUnitName] = useState('قطعة');
  const [customUnit, setCustomUnit] = useState('');
  const [ingredientsList, setIngredientsList] = useState<string[]>([
    'فستق حلبي',
    'عسل طبيعي',
    'سمن بلدي',
  ]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [price, setPrice] = useState<number | string>(4);
  const [isPurchasable, setIsPurchasable] = useState(true);
  const [category, setCategory] = useState('sweets');
  const [city, setCity] = useState(userCity || 'طرابلس');
  const [stockQuantity, setStockQuantity] = useState<number | string>(30);
  const [prepTime, setPrepTime] = useState<number | string>(40);
  const [affiliateCommissionPercent, setAffiliateCommissionPercent] = useState<number | string>(5);
  const [selectedImage, setSelectedImage] = useState(SAMPLE_FOOD_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUnitLabel = unitName === 'custom' ? customUnit || 'وحدة' : unitName;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomUrl = () => {
    if (customImageUrl.trim().startsWith('http')) {
      setSelectedImage(customImageUrl.trim());
      setCustomImageUrl('');
      setFormError(null);
    } else {
      setFormError('يرجى إدخال رابط صورة صحيح يبدأ بـ https://');
    }
  };

  const handleAddIngredient = (itemToAdd?: string) => {
    const targetStr = itemToAdd || ingredientInput;
    if (!targetStr.trim()) return;

    // Support comma separated pasting
    const items = targetStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIngredientsList((prev) => {
      const updated = [...prev];
      items.forEach((it) => {
        if (!updated.includes(it)) {
          updated.push(it);
        }
      });
      return updated;
    });

    if (!itemToAdd) {
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (indexToRemove: number) => {
    setIngredientsList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('يرجى إدخال اسم الطبق / الوجبة أولاً');
      return;
    }
    if (!description.trim()) {
      setFormError('يرجى إدخال وصف تفصيلي للطبق ومكوناته');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      addPost({
        title,
        description,
        ingredients: ingredientsList.length > 0 ? ingredientsList : ['مكونات فاخرة منزلياً'],
        price: isPurchasable ? Number(price) || 0 : null,
        unit_name: activeUnitLabel,
        is_purchasable: isPurchasable,
        category,
        city,
        stock_quantity: Number(stockQuantity) || 10,
        preparation_time_mins: Number(prepTime) || 30,
        affiliate_commission_percent: isPurchasable ? Number(affiliateCommissionPercent) || 0 : 0,
        images: [selectedImage],
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        if (onPublished) {
          onPublished();
        }
      }, 1200);
    }, 600);
  };

  return (
    <div className="w-full space-y-6 pb-28 animate-in fade-in duration-300">
      {/* Hidden File Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Page Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-orange-950 to-stone-900 text-white rounded-3xl p-6 shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-600/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/10"
              title="العودة"
            >
              <ArrowRight className="w-5 h-5 rtl:-scale-x-100" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-orange-500/30 text-orange-300 border border-orange-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  <span>استوديو الشيفات والمطابخ</span>
                </span>
                <span className="text-stone-400 text-xs">• نشر فوري لجميع الزبائن</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">إضافة طبق أو بوكس جديد للقائمة</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner Overlay */}
      {isSuccess && (
        <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base">تم نشر منتجك/طبقك بنجاح! 🎉</h3>
              <p className="text-emerald-100 text-xs font-medium">
                معروض الآن مباشرة للزبائن في {city}. جاري توجيهك للقائمة...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Section */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/90 shadow-md p-5 sm:p-7 space-y-6">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Dish Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Utensils className="w-5 h-5 text-orange-600" />
                <h2 className="font-black text-stone-900 text-base">1. معلومات الطبق / المنتج الأساسية</h2>
              </div>

              <div>
                <label className="font-extrabold text-stone-800 text-xs block mb-1.5">
                  اسم الطبق / البوكس / التورتة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: بوكس بقلاوة فاخرة بالفستق والعسل الصافي"
                  className="w-full bg-stone-50/80 focus:bg-white border border-stone-200 focus:border-orange-500 text-xs sm:text-sm py-3 px-4 rounded-2xl outline-none font-bold text-stone-900 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="font-extrabold text-stone-800 text-xs block mb-1.5">
                  الوصف التفصيلي وسر النكهة والتقديم <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اصف سر التحضير، جودة المكونات، عدد القطع أو التغليف في البوكس/الصينية، والمواصفات التي تجعل الطلب مميزاً للمناسبات والعائلات..."
                  className="w-full bg-stone-50/80 focus:bg-white border border-stone-200 focus:border-orange-500 text-xs sm:text-sm p-4 rounded-2xl outline-none font-medium text-stone-900 transition-all shadow-2xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-stone-800 text-xs block mb-1.5">التصنيف الغذائي:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-stone-50 focus:bg-white border border-stone-200 focus:border-orange-500 text-xs py-3 px-3.5 rounded-2xl outline-none font-bold text-stone-800"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-stone-800 text-xs block mb-1.5">المدينة والتوصيل:</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-stone-50 focus:bg-white border border-stone-200 focus:border-orange-500 text-xs py-3 px-3.5 rounded-2xl outline-none font-bold text-stone-800"
                  >
                    {LIBYAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        📍 {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Photos Gallery */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-orange-600" />
                  <h2 className="font-black text-stone-900 text-base">2. صور التقديم والتغليف</h2>
                </div>
                <span className="text-[11px] text-stone-500 font-bold">صورة جذابة تبرز جودة طبخك</span>
              </div>

              {/* Selected Image Cover */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-orange-200 bg-stone-100 h-48 sm:h-56 group shadow-inner">
                <img src={selectedImage} alt="المعاينة" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-4 text-white">
                  <span className="text-xs font-black bg-orange-600 px-3 py-1 rounded-full shadow-md">
                    الصورة المختارة للغلاف
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/90 hover:bg-white text-stone-900 font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-orange-600" />
                    <span>رفع من جهازك</span>
                  </button>
                </div>
              </div>

              {/* Preset Image Options */}
              <div>
                <label className="font-extrabold text-stone-700 text-xs block mb-2">
                  أو اختر صورة جاهزة متناسقة مع طلبك:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SAMPLE_FOOD_IMAGES.map((img, idx) => {
                    const isSelected = selectedImage === img.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(img.url)}
                        className={`relative rounded-2xl overflow-hidden h-20 border-2 transition-all cursor-pointer text-right group ${
                          isSelected
                            ? 'border-orange-600 ring-2 ring-orange-500/30 scale-102 shadow-md'
                            : 'border-stone-200 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                          <span className="text-[10px] font-bold text-white truncate drop-shadow-md">
                            {img.label}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-md font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL Option */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="أو ضع رابط صورة مباشر (URL)..."
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-200 text-xs p-2.5 rounded-xl outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddCustomUrl}
                  className="bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs px-3 py-2.5 rounded-xl shrink-0 cursor-pointer"
                >
                  استخدام الرابط
                </button>
              </div>
            </div>

            {/* Section 3: Unit Pricing & Order Settings */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <DollarSign className="w-5 h-5 text-orange-600" />
                <h2 className="font-black text-stone-900 text-base">3. تحديد وحدة البيع، السعر والكمية</h2>
              </div>

              {/* Order Mode Toggle */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-stone-800">طريقة العرض والطلب:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPurchasable(true)}
                      className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        isPurchasable
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      طلب للبيع 🛒
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPurchasable(false)}
                      className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        !isPurchasable
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      عَرَض / هدايا فقط 🎁
                    </button>
                  </div>
                </div>

                {isPurchasable && (
                  <div className="space-y-4 pt-2 border-t border-stone-200/80">
                    {/* Unit Type Selection */}
                    <div>
                      <label className="font-black text-stone-900 text-xs block mb-2 flex items-center gap-1.5">
                        <Box className="w-4 h-4 text-orange-600" />
                        <span>حدد وحدة البيع (كيف يتم تحديد السعر والطلب؟):</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PRESET_UNITS.map((u) => {
                          const isSelected = unitName === u.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => setUnitName(u.id)}
                              className={`p-2.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-500/20'
                                  : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="text-base">{u.icon}</span>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {u.label}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] leading-tight font-medium ${
                                  isSelected ? 'text-orange-100' : 'text-stone-500'
                                }`}
                              >
                                {u.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Unit Option */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setUnitName('custom')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            unitName === 'custom'
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-700 border-stone-200'
                          }`}
                        >
                          ✏️ وحدة مخصصة أخرى
                        </button>

                        {unitName === 'custom' && (
                          <input
                            type="text"
                            placeholder="اكتب اسم الوحدة (مثال: طاجين، برطمان، كب كيك)..."
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value)}
                            className="flex-1 bg-white border border-stone-300 rounded-xl p-2 text-xs font-bold outline-none focus:border-orange-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* Price & Stock Inputs with Dynamic Labels */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
                      <div>
                        <label className="font-black text-stone-900 text-xs block mb-1">
                          سعر ({activeUnitLabel}) الواحدة: <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            required
                            value={price}
                            onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-black text-stone-900 text-sm pl-9 outline-none focus:border-orange-500 focus:bg-white"
                          />
                          <span className="absolute left-2.5 top-3 text-xs font-black text-stone-400">د.ل</span>
                        </div>
                      </div>

                      <div>
                        <label className="font-black text-stone-900 text-xs block mb-1">
                          الكمية المتاحة ({activeUnitLabel}):
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-black text-stone-900 text-sm pr-3 outline-none focus:border-orange-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-black text-stone-900 text-xs block mb-1">
                          وقت التحضير (دقيقة):
                        </label>
                        <input
                          type="number"
                          min={5}
                          value={prepTime}
                          onChange={(e) => setPrepTime(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-black text-stone-900 text-sm pr-3 outline-none focus:border-orange-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* How ordering works indicator */}
                    <div className="bg-orange-50/80 p-3 rounded-2xl border border-orange-200/80 text-xs text-orange-950 font-medium flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>طريقة الحساب للزبائن:</strong> عند الشراء يختار الزبون عدد ({activeUnitLabel}) المطلوبة (مثلاً: 10 {activeUnitLabel})، ويحسب النظام التكلفة تلقائياً: <strong>10 × {Number(price || 0)} د.ل = {10 * Number(price || 0)} د.ل</strong>.
                      </span>
                    </div>

                    {/* Affiliate Commission Control Card */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 rounded-2xl border border-amber-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-extrabold text-xs text-stone-900 block flex items-center gap-1.5">
                            <span>🎁 عمولة التسويق بالعمولة للمشاركين (Affiliate Rewards)</span>
                          </span>
                          <span className="text-[11px] text-stone-500">
                            العمولة المقتطعة من سعر الطلب وتُمنح لأي مستخدم يشارك رابط هذا الطبق ويجلب زبائن
                          </span>
                        </div>

                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                          ربح المسوق: {((Number(price || 0) * Number(affiliateCommissionPercent || 0)) / 100).toFixed(1)} د.ل / {activeUnitLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {[0, 3, 5, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setAffiliateCommissionPercent(pct)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              Number(affiliateCommissionPercent) === pct
                                ? 'bg-amber-500 text-stone-950 shadow-md scale-102'
                                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {pct === 0 ? '🚫 بدون عمولة' : `${pct}% ${pct === 5 ? '(موصى به)' : ''}`}
                          </button>
                        ))}

                        <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2.5 py-1">
                          <span className="text-[11px] font-bold text-stone-500">نسبة مخصصة:</span>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={affiliateCommissionPercent}
                            onChange={(e) => setAffiliateCommissionPercent(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-12 text-center font-black text-xs outline-none"
                          />
                          <span className="text-xs font-bold text-stone-600">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Interactive Ingredient Manager */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-orange-600" />
                  <h2 className="font-black text-stone-900 text-base">4. قائمة المكونات وسر النكهة</h2>
                </div>
                <span className="text-[11px] text-stone-500 font-bold">أضف المكونات المتميزة</span>
              </div>

              {/* Tag Input Box */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddIngredient();
                    }
                  }}
                  placeholder="اكتب اسم المكون (مثال: فستق حلبي، عسل، سمن)... وادعم الفاصلة"
                  className="flex-1 bg-stone-50 border border-stone-200 focus:border-orange-500 text-xs p-3 rounded-2xl outline-none font-bold text-stone-900"
                />
                <button
                  type="button"
                  onClick={() => handleAddIngredient()}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-4 py-3 rounded-2xl cursor-pointer flex items-center gap-1 shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>

              {/* Active Ingredient Badges */}
              {ingredientsList.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  {ingredientsList.map((ing, i) => (
                    <span
                      key={i}
                      className="bg-white border border-orange-200 text-orange-950 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5 animate-in zoom-in-95 duration-150"
                    >
                      <span>✨ {ing}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(i)}
                        className="w-4 h-4 rounded-full bg-stone-200 hover:bg-rose-500 hover:text-white text-stone-600 flex items-center justify-center transition-all cursor-pointer"
                        title="حذف المكون"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center p-3 text-xs text-stone-400 font-bold bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  لم تقم بفيض أي مكونات بعد. يمكنك الاختيار من المقترحات أدناه 👇
                </div>
              )}

              {/* Quick Preset Ingredient Chips */}
              <div>
                <label className="text-[11px] font-extrabold text-stone-600 block mb-1.5">
                  أو اضغط لإضافة خيارات سريعة:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_INGREDIENTS.map((preset) => {
                    const isAdded = ingredientsList.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            setIngredientsList((prev) => prev.filter((it) => it !== preset));
                          } else {
                            handleAddIngredient(preset);
                          }
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer border ${
                          isAdded
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-orange-50 hover:border-orange-200'
                        }`}
                      >
                        {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-stone-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-700 hover:to-amber-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-orange-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 text-amber-200 animate-spin-slow" />
                <span>نشر القائمة فوراً 🍲</span>
              </button>
              <p className="text-center text-[11px] text-stone-400 font-semibold">
                بمجرد الضغط على «نشر القائمة فوراً»، سيعرض منتجك مباشرة لجميع زبائن المنصة في {city}.
              </p>
            </div>
          </form>
        </div>

        {/* Right Preview Section */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="bg-stone-900 text-white rounded-3xl p-5 border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <span className="font-extrabold text-xs text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                معاينة حيّة للبطاقة في المتجر
              </span>
              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-mono">
                Live Preview
              </span>
            </div>

            {/* Preview Card */}
            <div className="bg-white text-stone-900 rounded-3xl overflow-hidden border border-stone-200 shadow-xl space-y-3 pb-4">
              <div className="relative h-48 bg-stone-100">
                <img src={selectedImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-orange-600 text-white font-black text-xs px-3 py-1.5 rounded-2xl shadow-lg">
                  {isPurchasable ? `${price || 0} د.ل / ${activeUnitLabel}` : 'هدايا فقط 🎁'}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-xl">
                  📍 {city}
                </div>
              </div>

              <div className="px-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-black text-[10px] flex items-center justify-center">
                    {currentUser.full_name?.charAt(0) || 'ش'}
                  </div>
                  <span className="text-xs font-bold text-stone-600">الشيف {currentUser.full_name}</span>
                </div>

                <h3 className="font-black text-sm text-stone-900 line-clamp-1">
                  {title || 'اسم الطبق أو البوكس يدخل هنا...'}
                </h3>

                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {description || 'الوصف التفصيلي سيظهر هنا للزبائن ليتعرفوا على جودة وسر تحضيرك...'}
                </p>

                {ingredientsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {ingredientsList.slice(0, 4).map((ing, idx) => (
                      <span key={idx} className="bg-orange-50 text-orange-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        🍃 {ing}
                      </span>
                    ))}
                    {ingredientsList.length > 4 && (
                      <span className="text-[10px] text-stone-400 font-bold self-center">
                        +{ingredientsList.length - 4} آخرين
                      </span>
                    )}
                  </div>
                )}

                {isPurchasable && (
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-stone-500">الكمية المتاحة: {stockQuantity} {activeUnitLabel}</span>
                    <button type="button" className="bg-orange-600 text-white font-black px-3.5 py-1.5 rounded-xl shadow-md text-xs">
                      طلب الآن
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
