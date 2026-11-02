'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Post } from '@/lib/types';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageSquare,
  Gift,
  ShoppingBag,
  Share2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ChefHat,
  Check,
  UserPlus,
  Flame,
  Film,
  PlusCircle,
  MapPin,
  Clock,
} from 'lucide-react';

interface ReelsViewProps {
  onOpenOrder: (post: Post) => void;
  onOpenGift: (post: Post) => void;
  onOpenDetail: (post: Post) => void;
  onOpenShareEarn: (post: Post) => void;
  onOpenCreateReel: () => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({
  onOpenOrder,
  onOpenGift,
  onOpenDetail,
  onOpenShareEarn,
  onOpenCreateReel,
}) => {
  const { posts, userLikes, toggleLike, followedChefs, toggleFollowChef, userCity, currentUser } = useStore();

  // Filter posts that are marked as reels or have video_url
  const reelPosts = posts.filter((p) => p.is_reel || !!p.video_url);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentReel = reelPosts[currentIndex];

  useEffect(() => {
    let isMounted = true;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        if (isMounted) setIsPlaying(true);
      }).catch(() => {
        if (isMounted) setIsPlaying(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [currentIndex]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleNext = () => {
    if (currentIndex < reelPosts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  if (reelPosts.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-sm max-w-xl mx-auto my-8 space-y-4">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
          <Film className="w-8 h-8" />
        </div>
        <h2 className="font-extrabold text-lg text-stone-900">لا توجد فيديوهات ريلز مضافة حالياً</h2>
        <p className="text-stone-600 text-xs leading-relaxed max-w-md mx-auto">
          كن أول شيف ينشر ريلز طبخ قصير مدته حتى 60 ثانية ليعرض مهاراته وطريقة إعداد وجباته أمام آلاف المتابعين!
        </p>
        {(currentUser.role === 'chef' || currentUser.role === 'admin' || currentUser.role === 'business') && (
          <button
            onClick={onOpenCreateReel}
            className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>نشر ريلز جديد الآن 🎬</span>
          </button>
        )}
      </div>
    );
  }

  const isLiked = userLikes[currentReel.id];
  const isFollowing = followedChefs[currentReel.chef_id];

  return (
    <div className="max-w-md mx-auto relative h-[calc(100vh-140px)] min-h-[580px] max-h-[820px] bg-stone-950 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col justify-between select-none">
      {/* Top Bar Overlay */}
      <div className="absolute top-0 inset-x-0 z-30 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-orange-600/90 text-white font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            ريلز سفرة 🎬
          </span>
          <span className="text-stone-300 text-[11px] font-bold flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
            <MapPin className="w-3 h-3 text-orange-400" />
            {currentReel.city}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {(currentUser.role === 'chef' || currentUser.role === 'admin' || currentUser.role === 'business') && (
            <button
              onClick={onOpenCreateReel}
              className="bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md cursor-pointer transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>فيديو جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video Area */}
      <div
        className="relative w-full h-full flex items-center justify-center bg-black cursor-pointer overflow-hidden"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={currentReel.video_url}
          poster={currentReel.images[0]}
          loop
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-cover"
        />

        {/* Play/Pause Overlay Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-20">
            <div className="w-16 h-16 rounded-full bg-orange-600/90 text-white flex items-center justify-center shadow-2xl border-2 border-white/30 animate-in zoom-in-75">
              <Play className="w-8 h-8 fill-white translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Up/Down Reel Navigators (Desktop & Mobile) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            disabled={currentIndex === 0}
            className={`w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all ${
              currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-orange-600 cursor-pointer'
            }`}
            title="الفيديو السابق"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            disabled={currentIndex === reelPosts.length - 1}
            className={`w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all ${
              currentIndex === reelPosts.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-orange-600 cursor-pointer'
            }`}
            title="الفيديو التالي"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side Action Icons */}
        <div
          className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-4 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Like */}
          <button
            onClick={() => toggleLike(currentReel.id)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                isLiked
                  ? 'bg-rose-600 border-rose-400 text-white scale-110 shadow-lg shadow-rose-600/50'
                  : 'bg-black/50 border-white/20 hover:bg-black/80'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[11px] font-black text-white shadow-xs">
              {currentReel.likes_count + (isLiked ? 1 : 0)}
            </span>
          </button>

          {/* Comments */}
          <button
            onClick={() => onOpenDetail(currentReel)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 border border-white/20 hover:bg-black/80 flex items-center justify-center backdrop-blur-md transition-all">
              <MessageSquare className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-[11px] font-black text-white shadow-xs">{currentReel.comments_count}</span>
          </button>

          {/* Gift */}
          <button
            onClick={() => onOpenGift(currentReel)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 to-rose-500 border border-amber-300/50 hover:scale-105 flex items-center justify-center backdrop-blur-md transition-all shadow-md">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-200">إهداء 🎁</span>
          </button>

          {/* Share */}
          <button
            onClick={() => onOpenShareEarn(currentReel)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 border border-white/20 hover:bg-black/80 flex items-center justify-center backdrop-blur-md transition-all">
              <Share2 className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-emerald-300">مشاركة</span>
          </button>
        </div>

        {/* Bottom Chef & Dish Details Overlay */}
        <div
          className="absolute bottom-0 inset-x-0 z-30 p-4 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent space-y-2 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Bar */}
          <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-2">
            <div className="bg-orange-500 h-full transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>

          {/* Chef Info Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentReel.chef_avatar}
                alt={currentReel.chef_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-orange-500 shrink-0 shadow-md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs text-white truncate">{currentReel.chef_name}</span>
                  {currentReel.chef_verified && <Check className="w-3.5 h-3.5 text-blue-400 bg-blue-950 rounded-full shrink-0" />}
                </div>
                <span className="text-[10px] text-stone-300 block truncate">
                  {currentReel.kitchen_name || 'مطبخ منزلي مرخص'}
                </span>
              </div>
            </div>

            <button
              onClick={() => toggleFollowChef(currentReel.chef_id)}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                isFollowing
                  ? 'bg-stone-800 text-stone-300 border border-stone-700'
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>تتابعه</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>متابعة</span>
                </>
              )}
            </button>
          </div>

          {/* Reel Title & Description */}
          <div>
            <h3 className="font-black text-sm text-amber-200 line-clamp-1">{currentReel.title}</h3>
            <p className="text-stone-300 text-xs line-clamp-2 mt-0.5 leading-snug">{currentReel.description}</p>
          </div>

          {/* Price & Order Action Bar */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
            {currentReel.is_purchasable && currentReel.price !== null ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-400">السعر:</span>
                <span className="font-black text-base text-amber-400">{currentReel.price} د.ل</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-amber-300 bg-amber-900/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                قبول هدايا ودعم الشيف 🎁
              </span>
            )}

            {currentReel.is_purchasable ? (
              <button
                onClick={() => onOpenOrder(currentReel)}
                className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer transform active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>طلب الطبق الآن 🛍️</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenGift(currentReel)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                <span>إرسال هدية للشيف</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
