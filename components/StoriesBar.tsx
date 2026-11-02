'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Story, Post } from '@/lib/types';
import {
  X,
  Heart,
  ShoppingBag,
  MapPin,
  PlusCircle,
  Eye,
  Send,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UtensilsCrossed,
  CheckCircle2,
  Volume2,
  VolumeX,
  Film,
  Play,
  Plus,
} from 'lucide-react';

interface StoriesBarProps {
  onOpenOrder?: (post: Post) => void;
  onNavigateToReels?: () => void;
  onOpenDetail?: (post: Post) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ onOpenOrder, onNavigateToReels, onOpenDetail }) => {
  const {
    stories,
    userCity,
    posts,
    currentUser,
    storyLikes,
    toggleLikeStory,
    markStorySeen,
    addStory,
    sendMessage,
    getOrCreateConversation,
  } = useStore();

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState<boolean>(false);
  const [isNewStoryModalOpen, setIsNewStoryModalOpen] = useState<boolean>(false);

  // New Story Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCaption, setNewCaption] = useState<string>('');
  const [newMediaUrl, setNewMediaUrl] = useState<string>(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  );
  const [newCity, setNewCity] = useState<string>(userCity || 'طرابلس');
  const [selectedDishId, setSelectedDishId] = useState<string>('');

  // Floating Heart Particle Position
  const [heartParticles, setHeartParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Smart Algorithmic Ranking of Stories:
  // 1. Unseen stories in current userCity
  // 2. Unseen stories in other cities
  // 3. Seen stories in current userCity
  // 4. Seen stories in other cities
  // Secondary sort: Recency & Engagement Score
  const sortedStories = [...(stories || [])].sort((a, b) => {
    const aCityMatch = a.city === userCity;
    const bCityMatch = b.city === userCity;
    const aUnseen = !a.is_seen;
    const bUnseen = !b.is_seen;

    if (aUnseen && !bUnseen) return -1;
    if (!aUnseen && bUnseen) return 1;

    if (aCityMatch && !bCityMatch) return -1;
    if (!aCityMatch && bCityMatch) return 1;

    // Recency fallback
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const activeStory = activeStoryIndex !== null ? sortedStories[activeStoryIndex] : null;

  const openStory = (idx: number) => {
    setActiveStoryIndex(idx);
    setProgress(0);
    setReplyText('');
  };

  // Auto progress timer for stories (5 seconds per story)
  useEffect(() => {
    if (activeStoryIndex === null || isPaused || !activeStory) return;

    // Mark active story as seen
    markStorySeen(activeStory.id);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < sortedStories.length - 1) {
            setActiveStoryIndex((curr) => (curr !== null ? curr + 1 : null));
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, isPaused, activeStory, markStorySeen, sortedStories.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleNextStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex < sortedStories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      setProgress(0);
    }
  };

  const handleLikeClick = (e?: React.MouseEvent) => {
    if (!activeStory) return;

    toggleLikeStory(activeStory.id);
    const isLiked = storyLikes[activeStory.id];

    // Trigger floating heart particles
    if (!isLiked) {
      const clickX = e ? e.clientX : window.innerWidth / 2;
      const clickY = e ? e.clientY : window.innerHeight / 2;
      const newParticle = { id: Date.now(), x: clickX, y: clickY };
      setHeartParticles((prev) => [...prev, newParticle]);

      setTimeout(() => {
        setHeartParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 1000);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    if (!activeStory) return;

    if (!storyLikes[activeStory.id]) {
      toggleLikeStory(activeStory.id);
    }

    setShowDoubleTapHeart(true);
    setTimeout(() => {
      setShowDoubleTapHeart(false);
    }, 800);

    // Floating heart particle at tap location
    const newParticle = { id: Date.now(), x: e.clientX, y: e.clientY };
    setHeartParticles((prev) => [...prev, newParticle]);
    setTimeout(() => {
      setHeartParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 1000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory) return;

    try {
      const conv = getOrCreateConversation(activeStory.chef_id);
      sendMessage(
        conv.id,
        `رد على قصتك (${activeStory.title}): ${replyText}`
      );
      showToast(`تم إرسال ردك إلى الشيف ${activeStory.chef_name} بنجاح! 📨`);
      setReplyText('');
    } catch {
      showToast('تم إرسال تعليقك للشيف بنجاح! ❤️');
      setReplyText('');
    }
  };

  const handleShareStory = () => {
    if (!activeStory) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('تم نسخ رابط القصة للحافظة! 🔗');
    } else {
      showToast('تمت مشاركة القصة بنجاح! ✨');
    }
  };

  const handleOpenNewStoryModal = () => {
    if (currentUser?.role !== 'chef' && currentUser?.role !== 'admin') {
      showToast('⚠️ نشر القصص اليومية متاح حصرياً للشيفات والمطابخ الموثقة! يرجى توثيق حسابك كشيف.');
      return;
    }
    setIsNewStoryModalOpen(true);
  };

  const handleCreateNewStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (currentUser?.role !== 'chef' && currentUser?.role !== 'admin') {
      showToast('⚠️ نشر القصص متاح فقط للشيفات والمطابخ الموثقة.');
      setIsNewStoryModalOpen(false);
      return;
    }

    addStory({
      title: newTitle,
      caption: newCaption,
      media_url: newMediaUrl,
      city: newCity,
      dish_post_id: selectedDishId || undefined,
    });

    setIsNewStoryModalOpen(false);
    setNewTitle('');
    setNewCaption('');
    setSelectedDishId('');
    showToast('تم نشر قصتك اليومية بنجاح! 🔥');
  };

  // Find linked post for order action if available
  const linkedPost = activeStory
    ? posts.find(
        (p) =>
          p.id === activeStory.dish_post_id ||
          p.title.includes(activeStory.title) ||
          p.chef_id === activeStory.chef_id
      )
    : null;

  if (!stories || stories.length === 0) return null;

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
          <div className="bg-stone-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-orange-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
            <Sparkles className="w-4 h-4 text-orange-400 animate-spin" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Floating Particles for Likes */}
      {heartParticles.map((particle) => (
        <div
          key={particle.id}
          className="fixed z-50 pointer-events-none text-rose-500 animate-bounce"
          style={{
            left: `${particle.x - 12}px`,
            top: `${particle.y - 12}px`,
            transition: 'all 0.8s ease-out',
          }}
        >
          <Heart className="w-8 h-8 fill-rose-500 text-rose-500 drop-shadow-md" />
        </div>
      ))}

      {/* Circular Stories Bar (دوائر القصص) */}
      <div className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-sm text-stone-900 my-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
            <h3 className="font-extrabold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>قصص الشيفات والمطابخ (Stories) 📸</span>
              <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-orange-200">
                📍 {userCity}
              </span>
            </h3>
          </div>

          <button
            onClick={handleOpenNewStoryModal}
            className="flex items-center gap-1 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>إضافة قصة +</span>
          </button>
        </div>

        {/* Horizontal Scroll Row of Circular Avatars (دوائر) */}
        <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-1">
          {/* 1. Add Story Avatar Circle */}
          <button
            onClick={handleOpenNewStoryModal}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full p-[2px] bg-stone-200 group-hover:bg-orange-400 transition-colors">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <span className="text-[11px] font-black text-stone-800 max-w-[72px] truncate text-center">
              قصتي
            </span>
          </button>

          {/* 2. Chef Stories Circular Avatars */}
          {sortedStories.map((story, idx) => {
            const isCityMatch = story.city === userCity;
            const isLiked = !!storyLikes[story.id];
            const isSeen = story.is_seen;

            return (
              <button
                key={story.id}
                onClick={() => openStory(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                {/* Gradient Outline Ring */}
                <div
                  className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full ${
                    !isSeen
                      ? 'p-[2.5px] bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-md group-hover:scale-105'
                      : 'p-[2px] bg-stone-300 opacity-80 group-hover:scale-105'
                  } transition-all`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-stone-100 relative">
                    <img
                      src={story.chef_avatar || story.media_url}
                      alt={story.chef_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Liked Heart Badge */}
                  {isLiked && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white p-0.5 rounded-full shadow-sm border border-white">
                      <Heart className="w-2.5 h-2.5 fill-white" />
                    </span>
                  )}

                  {/* City Indicator Badge */}
                  {isCityMatch && !isSeen && (
                    <span
                      className="absolute bottom-0 left-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
                      title={`قصة من مدينتك (${story.city})`}
                    />
                  )}
                </div>

                {/* Truncated Name Label below Circle */}
                <span className="text-[11px] font-black text-stone-900 max-w-[76px] truncate text-center group-hover:text-orange-600 transition-colors">
                  {(story.chef_name || '').split(' ')[0] || story.chef_name || 'الشيف'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStory && activeStoryIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm h-full sm:h-[620px] bg-stone-950 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Top Progress Bars Segmented */}
            <div className="absolute top-2 inset-x-0 px-3 z-30 flex items-center gap-1">
              {sortedStories.map((s, i) => (
                <div
                  key={s.id}
                  className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-orange-500 transition-all duration-100"
                    style={{
                      width:
                        i < activeStoryIndex
                          ? '100%'
                          : i === activeStoryIndex
                          ? `${progress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header Overlay */}
            <div className="absolute top-5 inset-x-0 px-3 py-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={activeStory.chef_avatar}
                  alt={activeStory.chef_name}
                  className="w-9 h-9 rounded-full object-cover border border-white/50 shadow-md shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-black text-xs text-white truncate flex items-center gap-1">
                    <span>{activeStory.kitchen_name}</span>
                    <CheckCircle2 className="w-3 h-3 text-orange-400 shrink-0" />
                  </div>
                  <div className="text-[10px] text-stone-300 flex items-center gap-2 font-bold">
                    <span className="flex items-center gap-0.5 text-orange-300">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{activeStory.city}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5 text-stone-400" />
                      <span>{activeStory.views_count || 32}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleShareStory}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                  title="مشاركة القصة"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveStoryIndex(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tap Navigation Touch Zones */}
            <div className="absolute inset-y-16 inset-x-0 z-10 flex">
              {/* Right Zone: Previous Story (RTL) */}
              <div
                className="w-1/3 h-full cursor-pointer"
                onClick={handlePrevStory}
              />
              {/* Center Zone: Double tap target */}
              <div
                className="w-1/3 h-full cursor-pointer"
                onDoubleClick={handleDoubleTap}
              />
              {/* Left Zone: Next Story (RTL) */}
              <div
                className="w-1/3 h-full cursor-pointer"
                onClick={handleNextStory}
              />
            </div>

            {/* Main Media Image / Canvas */}
            <div
              className="relative flex-1 bg-stone-950 flex items-center justify-center overflow-hidden"
              onDoubleClick={handleDoubleTap}
            >
              <img
                src={activeStory.media_url}
                alt={activeStory.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none"></div>

              {/* Big Heart Double Tap Pop Animation */}
              {showDoubleTapHeart && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-50 duration-200">
                  <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl animate-pulse" />
                </div>
              )}
            </div>

            {/* Story Content & Action Overlay */}
            <div className="relative z-20 bg-gradient-to-t from-black via-stone-950/90 to-transparent p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-orange-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block shadow-md">
                    {activeStory.title}
                  </span>
                  {activeStory.likes_count ? (
                    <span className="text-[10px] font-bold text-rose-300 flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      <span>{activeStory.likes_count} إعجاب</span>
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-stone-100 leading-relaxed font-bold">
                  {activeStory.caption}
                </p>
              </div>

              {/* Order Dish Action Button (If Dish attached or available) */}
              {linkedPost && onOpenOrder && (
                <button
                  onClick={() => {
                    setActiveStoryIndex(null);
                    onOpenOrder(linkedPost);
                  }}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black py-2.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-white animate-bounce" />
                  <span>اطلب طبق ({linkedPost.title}) الآن 🛒</span>
                </button>
              )}

              {/* Like Button & Quick Reply Bar */}
              <div className="flex items-center gap-2 pt-1">
                {/* LIKE HEART BUTTON - FULLY FUNCTIONAL */}
                <button
                  onClick={(e) => handleLikeClick(e)}
                  className={`p-2.5 rounded-2xl backdrop-blur-md transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
                    storyLikes[activeStory.id]
                      ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                      : 'bg-white/15 text-stone-200 border border-white/20 hover:bg-white/25'
                  }`}
                  title={storyLikes[activeStory.id] ? 'إلغاء الإعجاب' : 'إعجاب بالقصة'}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform ${
                      storyLikes[activeStory.id]
                        ? 'text-rose-500 fill-rose-500 scale-110'
                        : 'text-stone-200'
                    }`}
                  />
                </button>

                {/* Reply Input Form */}
                <form onSubmit={handleSendReply} className="flex-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`رد على الشيف ${(activeStory.chef_name || '').split(' ')[0] || 'الشيف'}... 💬`}
                    className="w-full bg-white/15 border border-white/25 text-white placeholder-stone-400 text-xs font-bold px-3 py-2 rounded-2xl outline-none focus:border-orange-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-2xl transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Story Upload Modal */}
      {isNewStoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-right space-y-4 relative">
            <button
              onClick={() => setIsNewStoryModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900">نشر قصة يومية جديدة 📸</h3>
                <p className="text-xs text-stone-500 font-bold">شارك كواليس تحضير مأكولاتك مع زبائنك بـ {userCity}</p>
              </div>
            </div>

            <form onSubmit={handleCreateNewStory} className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-stone-700 mb-1">
                  عنوان القصة (مثل: كواليس الشربة بالقديد 🔥)
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="أدخل عنواناً جذاباً لقصتك..."
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold p-3 rounded-2xl outline-none focus:border-orange-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-700 mb-1">
                  تفاصيل ووصف القصة
                </label>
                <textarea
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="اكتب تفاصيل القصة أو وقت جاهزية التوصيل..."
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold p-3 rounded-2xl outline-none focus:border-orange-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-700 mb-1">
                  صورة القصة (رابط أو اختر نموذج)
                </label>
                <input
                  type="url"
                  required
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold p-2.5 rounded-2xl outline-none focus:border-orange-600 mb-2"
                />

                {/* Preset Image Options */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {[
                    { label: 'مبكبكة', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281288?auto=format&fit=crop&w=400&q=80' },
                    { label: 'بازين', url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14e8?auto=format&fit=crop&w=400&q=80' },
                    { label: 'سمك طاجين', url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
                    { label: 'حلويات مقروض', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setNewMediaUrl(preset.url)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border shrink-0 ${
                        newMediaUrl === preset.url
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-700 mb-1">
                  المدينة
                </label>
                <select
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold p-2.5 rounded-2xl outline-none"
                >
                  {['طرابلس', 'بنغازي', 'مصراتة', 'الزاوية', 'سبها', 'البيضاء', 'زليتن'].map((c) => (
                    <option key={c} value={c}>
                      📍 {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-700 mb-1">
                  ربط مع طبق للطلب المباشر (اختياري)
                </label>
                <select
                  value={selectedDishId}
                  onChange={(e) => setSelectedDishId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold p-2.5 rounded-2xl outline-none"
                >
                  <option value="">-- بدون ربط طبق --</option>
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.price} د.ل)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStoryModalOpen(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-extrabold py-3 rounded-2xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black py-3 rounded-2xl shadow-lg transition-transform active:scale-95"
                >
                  نشر القصة الآن 🔥
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

/* Standalone Reels Bar Component */
export interface ReelsBarProps {
  onNavigateToReels?: () => void;
  onOpenDetail?: (post: Post) => void;
}

export const ReelsBar: React.FC<ReelsBarProps> = ({ onNavigateToReels, onOpenDetail }) => {
  const { posts } = useStore();
  const reelPosts = (posts || []).filter((p) => p && (p.is_reel || p.video_url));

  if (reelPosts.length === 0) return null;

  return (
    <div suppressHydrationWarning className="bg-gradient-to-r from-stone-950 via-stone-900 to-orange-950 text-white rounded-3xl p-4 border border-orange-500/30 shadow-xl mb-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
          <h3 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <span>ريلز الطهاة والمأكولات المباشرة 🎬</span>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              مقاطع قصيرة
            </span>
          </h3>
        </div>

        {onNavigateToReels && (
          <button
            onClick={onNavigateToReels}
            className="text-[11px] font-extrabold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>شاهد كل الريلز</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Reel Preview Cards */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
        {reelPosts.map((reel) => (
          <button
            key={reel.id}
            onClick={() => {
              if (onNavigateToReels) {
                onNavigateToReels();
              } else if (onOpenDetail) {
                onOpenDetail(reel);
              }
            }}
            className="w-28 xs:w-32 sm:w-36 h-44 sm:h-52 rounded-2xl overflow-hidden relative border-2 border-amber-500/70 shadow-xl shrink-0 cursor-pointer group hover:scale-[1.02] transition-transform duration-300 bg-stone-900"
          >
            {/* Background Thumbnail */}
            <img
              src={reel.images[0]}
              alt={reel.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />

            {/* Play Icon Badge Centered */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-110 group-hover:bg-amber-500 transition-all">
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              </div>
            </div>

            {/* Top Right Chef Badge */}
            <div className="absolute top-2 right-2 z-20">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 bg-white p-[1px] shadow-lg overflow-hidden">
                <img
                  src={reel.chef_avatar}
                  alt={reel.chef_name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Top Left Reel Tag */}
            <div className="absolute top-2 left-2 z-20 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[9px] font-black text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <Film className="w-2.5 h-2.5" />
              <span>ريلز</span>
            </div>

            {/* Bottom Gradient Title Overlay */}
            <div className="absolute inset-x-0 bottom-0 pt-10 pb-2.5 px-2 bg-gradient-to-t from-black via-black/70 to-transparent z-10 text-right flex flex-col justify-end">
              <span className="text-white font-extrabold text-[11px] truncate block drop-shadow-md">
                {reel.chef_name}
              </span>
              <span className="text-stone-300 font-bold text-[9px] truncate block opacity-90">
                {reel.title.replace('🎬 ريلز: ', '')}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

