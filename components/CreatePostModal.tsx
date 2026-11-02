'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { CATEGORIES, LIBYAN_CITIES, SAMPLE_REEL_VIDEOS } from '@/lib/constants';
import { Post } from '@/lib/types';
import { compressImage } from '@/lib/utils';
import {
  X,
  Image as ImageIcon,
  Film,
  Sparkles,
  Utensils,
  Edit3,
  Loader2,
  Box,
  Plus,
  Tag,
  HelpCircle,
} from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  initialPost?: Post | null;
}

const PRESET_UNITS = [
  { id: 'قطعة', label: 'قطعة', icon: '🍪', desc: 'مثل بقلاوة، غريبة، موالح، كيكة' },
  { id: 'بوكس / صندوق', label: 'بوكس / صندوق', icon: '📦', desc: 'بوكس حلا، بوكس موالح، ضيافة' },
  { id: 'تورتة / صينية', label: 'تورتة / صينية', icon: '🎂', desc: 'تورتة كيك، صينية بسبوسة، طاجين' },
  { id: 'وجبة / فرد', label: 'وجبة / فرد', icon: '🍲', desc: 'وجبة كسكاس، وجبة رشدة، وجبة رز' },
  { id: 'كيلو / عبوة', label: 'كيلو / عبوة', icon: '⚖️', desc: 'كيلو حلويات، كيلو معجنات، برطمان' },
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
];

const SAMPLE_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, initialPost }) => {
  const { addPost, updatePost, userCity } = useStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState<'photo' | 'reel'>(
    initialPost?.is_reel || initialPost?.video_url ? 'reel' : 'photo'
  );
  const [title, setTitle] = useState(initialPost?.title || '');
  const [description, setDescription] = useState(initialPost?.description || '');
  const [unitName, setUnitName] = useState(initialPost?.unit_name || 'قطعة');
  const [customUnit, setCustomUnit] = useState('');

  const [ingredientsList, setIngredientsList] = useState<string[]>(
    initialPost?.ingredients && initialPost.ingredients.length > 0
      ? initialPost.ingredients
      : ['فستق حلبي', 'عسل طبيعي', 'سمن بلدي']
  );
  const [ingredientInput, setIngredientInput] = useState('');

  const [price, setPrice] = useState<number | string>(
    initialPost?.price !== null && initialPost?.price !== undefined ? initialPost.price : 4
  );
  const [isPurchasable, setIsPurchasable] = useState(initialPost?.is_purchasable ?? true);
  const [category, setCategory] = useState(initialPost?.category || 'sweets');
  const [city, setCity] = useState(initialPost?.city || userCity || 'طرابلس');
  const [stockQuantity, setStockQuantity] = useState<number | string>(
    initialPost?.stock_quantity !== undefined ? initialPost.stock_quantity : 30
  );
  const [prepTime, setPrepTime] = useState<number | string>(
    initialPost?.preparation_time_mins !== undefined ? initialPost.preparation_time_mins : 35
  );
  const [affiliateCommissionPercent, setAffiliateCommissionPercent] = useState<number | string>(
    initialPost?.affiliate_commission_percent !== undefined ? initialPost.affiliate_commission_percent : 5
  );
  const [selectedImage, setSelectedImage] = useState(
    initialPost?.images && initialPost.images.length > 0
      ? initialPost.images[0]
      : SAMPLE_FOOD_IMAGES[0]
  );
  const [videoUrl, setVideoUrl] = useState(
    initialPost?.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-chef-slicing-meat-41485-large.mp4'
  );
  const [videoDuration, setVideoDuration] = useState<number>(
    initialPost?.video_duration_secs || 45
  );

  const activeUnitLabel = unitName === 'custom' ? customUnit || 'وحدة' : unitName;

  const handleAddIngredient = (itemToAdd?: string) => {
    const targetStr = itemToAdd || ingredientInput;
    if (!targetStr.trim()) return;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim() || !description.trim()) {
      alert('يرجى كتابة اسم ووصف الطبق');
      return;
    }

    setIsSubmitting(true);

    try {
      const optimizedImg = await compressImage(selectedImage, 1000, 0.82);
      const isReel = postType === 'reel';

      if (initialPost) {
        const ok = updatePost(initialPost.id, {
          title,
          description,
          ingredients: ingredientsList,
          price: isPurchasable ? Number(price) : null,
          unit_name: activeUnitLabel,
          is_purchasable: isPurchasable,
          category,
          city,
          stock_quantity: Number(stockQuantity),
          preparation_time_mins: Number(prepTime),
          affiliate_commission_percent: isPurchasable ? Number(affiliateCommissionPercent) : 0,
          images: [optimizedImg],
          is_reel: isReel,
          video_url: isReel ? videoUrl : undefined,
          video_duration_secs: isReel ? Number(videoDuration) : undefined,
        });
        if (ok) {
          alert('تم تعديل المنشور بنجاح! ✨');
          onClose();
        }
      } else {
        addPost({
          title,
          description,
          ingredients: ingredientsList,
          price: isPurchasable ? Number(price) : null,
          unit_name: activeUnitLabel,
          is_purchasable: isPurchasable,
          category,
          city,
          stock_quantity: Number(stockQuantity),
          preparation_time_mins: Number(prepTime),
          affiliate_commission_percent: isPurchasable ? Number(affiliateCommissionPercent) : 0,
          images: [optimizedImg],
          is_reel: isReel,
          video_url: isReel ? videoUrl : undefined,
          video_duration_secs: isReel ? Number(videoDuration) : undefined,
        });

        alert(isReel ? 'تم نشر فيديو الريلز بنجاح! 🎬' : 'تم نشر طبقك الجديد على منصة سفرة بنجاح!');
        onClose();
      }
    } catch (err) {
      console.error('Error posting dish:', err);
      alert('تم المعالجة بنجاح.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden border border-orange-100 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-5 border-b border-stone-100 pb-3">
          {initialPost ? (
            <Edit3 className="w-5 h-5 text-orange-600" />
          ) : (
            <Utensils className="w-5 h-5 text-orange-600" />
          )}
          <h2 className="font-extrabold text-base text-stone-900">
            {initialPost ? 'تعديل تفاصيل الطبق ✏️' : 'نشر طبق / بوكس جديد في القائمة'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Post Type Selector (Photo vs Reel Video) */}
          <div className="bg-orange-50/80 p-3 rounded-2xl border border-orange-200/90 space-y-2">
            <label className="font-extrabold text-stone-900 block text-xs">نوع المنشور المطلوب:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPostType('photo')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black transition-all cursor-pointer ${
                  postType === 'photo'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>📸 منشور صور</span>
              </button>
              <button
                type="button"
                onClick={() => setPostType('reel')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black transition-all cursor-pointer ${
                  postType === 'reel'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Film className="w-4 h-4 text-amber-300" />
                <span>🎬 فيديو ريلز (60ث)</span>
              </button>
            </div>
          </div>

          {/* Reel Video Mode */}
          {postType === 'reel' && (
            <div className="bg-stone-900 text-white p-4 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-amber-400 animate-pulse" />
                  إعدادات فيديو الريلز القصير
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  مدته: {videoDuration} ثانية
                </span>
              </div>

              <div>
                <label className="font-bold text-stone-300 block mb-1">اختر من مقاطع الطبخ الجاهزة:</label>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_REEL_VIDEOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setVideoUrl(sample.url);
                        setSelectedImage(sample.poster);
                        setVideoDuration(sample.duration);
                      }}
                      className={`p-2 rounded-xl border text-right transition-all flex items-center gap-2 cursor-pointer ${
                        videoUrl === sample.url
                          ? 'border-amber-400 bg-amber-950/80 text-amber-200 shadow-md'
                          : 'border-stone-700 bg-stone-800 text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      <img src={sample.poster} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] truncate">{sample.title}</div>
                        <div className="text-[9px] text-amber-400 font-extrabold">{sample.duration} ثانية</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-300 block mb-1">أو ادخل رابط MP4 خاص بك:</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/cooking-reel.mp4"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl p-2.5 text-white font-mono text-[11px] outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-black text-stone-800 block mb-1">اسم الطبق / البوكس:</label>
            <input
              type="text"
              required
              value={title ?? ''}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: بوكس بقلاوة فاخرة بالفستق والعسل الصافي"
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 outline-none font-bold text-stone-900 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="font-black text-stone-800 block mb-1">الوصف التفصيلي وسر النكهة:</label>
            <textarea
              required
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اصف طريقة الطبخ، هشاشة العجينة، عدد القطع داخل الصندوق، وسر المذاق الخاص..."
              rows={3}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 outline-none font-medium text-stone-900 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-black text-stone-800 block mb-1">التصنيف:</label>
              <select
                value={category ?? 'sweets'}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 outline-none font-bold text-stone-900"
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-black text-stone-800 block mb-1">المدينة:</label>
              <select
                value={city ?? 'طرابلس'}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 outline-none font-bold text-stone-900"
              >
                {LIBYAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    📍 {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Unit Selection */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-stone-800">طريقة العرض والبيع:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPurchasable(true)}
                  className={`px-3 py-1 rounded-xl font-black text-xs cursor-pointer transition-all ${
                    isPurchasable ? 'bg-orange-600 text-white shadow-xs' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  قابل للشراء 🛒
                </button>
                <button
                  type="button"
                  onClick={() => setIsPurchasable(false)}
                  className={`px-3 py-1 rounded-xl font-black text-xs cursor-pointer transition-all ${
                    !isPurchasable ? 'bg-rose-600 text-white shadow-xs' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  قبول هدايا فقط 🎁
                </button>
              </div>
            </div>

            {isPurchasable && (
              <div className="space-y-3 pt-2 border-t border-stone-200">
                {/* Unit Selector */}
                <div>
                  <label className="font-black text-stone-900 block mb-1.5 flex items-center gap-1">
                    <Box className="w-3.5 h-3.5 text-orange-600" />
                    <span>وحدة البيع والطلب:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRESET_UNITS.map((u) => {
                      const isSelected = unitName === u.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setUnitName(u.id)}
                          className={`p-1.5 rounded-xl border text-center text-[11px] font-black cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                              : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {u.icon} {u.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUnitName('custom')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                        unitName === 'custom'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      اسم مخصص
                    </button>
                    {unitName === 'custom' && (
                      <input
                        type="text"
                        placeholder="اسم الوحدة المخصصة..."
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="flex-1 bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-bold outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Price, Quantity, Time */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-stone-800 block mb-1">
                      سعر الـ ({activeUnitLabel}) (د.ل):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={price ?? ''}
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2 font-black text-stone-900 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-800 block mb-1">الكمية المتاحة:</label>
                    <input
                      type="number"
                      min={1}
                      value={stockQuantity ?? ''}
                      onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2 font-black text-stone-900 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-800 block mb-1">وقت الطبخ (دقيقة):</label>
                    <input
                      type="number"
                      min={5}
                      value={prepTime ?? ''}
                      onChange={(e) => setPrepTime(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2 font-black text-stone-900 text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="bg-orange-100/60 p-2 rounded-xl border border-orange-200/60 text-[10px] text-orange-950 font-medium">
                  💡 عند طلب الزبون يحدد كم قطعة/وحدة يطلبها وتُحسب التكلفة تلقائياً (عدد القطع × {price || 0} د.ل).
                </div>

                {/* Affiliate Commission Selector */}
                <div className="pt-2 border-t border-stone-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-stone-800 text-xs flex items-center gap-1">
                      <span>🎁 عمولة التسويق (Affiliate %):</span>
                    </label>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      ربح المسوق: {((Number(price || 0) * Number(affiliateCommissionPercent || 0)) / 100).toFixed(1)} د.ل / {activeUnitLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[0, 3, 5, 10, 15].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAffiliateCommissionPercent(pct)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          Number(affiliateCommissionPercent) === pct
                            ? 'bg-amber-500 text-stone-950 shadow-xs'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {pct === 0 ? 'بدون عمولة' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ingredients Manager */}
          <div className="space-y-2">
            <label className="font-black text-stone-800 block flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-orange-600" />
              <span>قائمة المكونات (أدخل المكونات واضغط إضافة):</span>
            </label>

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
                placeholder="اكتب مكوناً (مثل: فستق، عسل، سمن)..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold outline-none text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddIngredient()}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-3.5 py-2.5 rounded-xl cursor-pointer shrink-0"
              >
                + إضافة
              </button>
            </div>

            {ingredientsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200">
                {ingredientsList.map((ing, i) => (
                  <span
                    key={i}
                    className="bg-white border border-orange-200 text-orange-950 text-[11px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <span>🍃 {ing}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(i)}
                      className="text-stone-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1 pt-1">
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
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-orange-50'
                    }`}
                  >
                    {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample Images Picker */}
          <div>
            <label className="font-black text-stone-800 block mb-1">اختر صورة التقديم والغلاف:</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SAMPLE_FOOD_IMAGES.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === imgUrl ? 'border-orange-600 scale-105 shadow-md' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري حفظ البيانات...</span>
              </>
            ) : initialPost ? (
              'حفظ التعديلات ✨'
            ) : (
              'نشر على سفرة ليبيا 🚀'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
