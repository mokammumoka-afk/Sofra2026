'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Post, User, ChefProfile } from '@/lib/types';
import {
  Star,
  ShoppingBag,
  Gift,
  ChevronRight,
  ChevronLeft,
  Flame,
  CheckCircle2,
  MapPin,
  UserPlus,
  UserCheck,
  Truck,
} from 'lucide-react';

interface ChefSlide {
  type: 'chef';
  id: string;
  chef: User;
  profile?: ChefProfile;
  topDish?: Post;
  giftsTotal: number;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  bgGradient: string;
  coverImage: string;
}

type Slide = ChefSlide;

interface FeaturedChefsSliderProps {
  onOpenDetail: (post: Post) => void;
  onOpenOrder: (post: Post) => void;
  onOpenGift: (post: Post) => void;
  onFilterByChef?: (chefId: string) => void;
}

export const FeaturedChefsSlider: React.FC<FeaturedChefsSliderProps> = ({
  onOpenDetail,
  onOpenOrder,
  onOpenGift,
}) => {
  const { users, chefProfiles, posts, userCity, followedChefs, toggleFollowChef, currentUser, isPostActiveSponsored } =
    useStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Interval duration in milliseconds (60000ms = 1 minute)
  const SLIDE_INTERVAL = 60000;

  // Powerful Recommendation & Ranking Algorithm for Featured Slider
  const calculateChefRecommendationScore = (chef: User): number => {
    const profile = chefProfiles[chef.id];
    const chefPosts = posts.filter((p) => p.chef_id === chef.id);
    const totalLikes = chefPosts.reduce((acc, p) => acc + (p.likes_count || 0), 0);
    const totalGifts = chefPosts.reduce((acc, p) => acc + (p.gifts_total || 0), 0);
    const isFollowed = followedChefs[chef.id];

    let score = 0;

    // A. City & Proximity Match (Weighted +50)
    if (chef.city === userCity) {
      score += 50;
    }

    // B. User Affinity & Follow Status (+35)
    if (isFollowed) {
      score += 35;
    }

    // C. Official Verification Badge (+30)
    if (chef.is_verified) {
      score += 30;
    }

    // D. Rating Score & Order Fulfillment Volume
    if (profile) {
      score += (profile.rating_avg || 0) * 8;
      score += Math.min((profile.total_sales || 0) * 2, 40);
    }

    // E. Organic Popularity & Community Appreciation (Gifts)
    score += Math.min(totalLikes * 0.4, 30);
    score += Math.min(totalGifts * 0.25, 25);

    // F. Sponsored Posts Priority Bonus
    if (chefPosts.some((p) => (isPostActiveSponsored ? isPostActiveSponsored(p.id, userCity) : false))) {
      score += 20;
    }

    return score;
  };

  // Find and rank all distinguished chefs dynamically using the scoring algorithm
  const qualifiedChefs = users
    .filter((u) => {
      if (u.role !== 'chef' && u.role !== 'business') return false;
      const profile = chefProfiles[u.id];
      const chefPosts = posts.filter((p) => p.chef_id === u.id);
      const hasHighLikes = chefPosts.some((p) => p.likes_count > 30);

      // Criteria: verified OR rating >= 4.0 OR sales >= 5 OR has popular posts
      return (
        u.is_verified ||
        (profile && profile.rating_avg >= 4.0) ||
        (profile && profile.total_sales >= 5) ||
        hasHighLikes
      );
    })
    .sort((a, b) => calculateChefRecommendationScore(b) - calculateChefRecommendationScore(a));

  // Build slides array from real top chefs
  const slides: Slide[] = qualifiedChefs.map((chef): ChefSlide => {
    const profile = chefProfiles[chef.id];
    const chefPosts = posts.filter((p) => p.chef_id === chef.id);
    const topDish = [...chefPosts].sort((a, b) => b.likes_count - a.likes_count)[0];
    const giftsTotal = chefPosts.reduce((acc, p) => acc + (p.gifts_total || 0), 0);

    return {
      type: 'chef',
      id: chef.id,
      chef,
      profile,
      topDish,
      giftsTotal,
      title: chef.full_name,
      subtitle: profile?.kitchen_name || `مطبخ ${chef.full_name}`,
      badge: 'شيف موثق ⭐',
      badgeColor: 'bg-amber-500 text-stone-950',
      bgGradient: 'from-stone-950 via-stone-900 to-orange-950',
      coverImage:
        profile?.cover_image_url ||
        topDish?.images[0] ||
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    };
  });

  const totalSlides = slides.length;

  // Auto-slide effect
  useEffect(() => {
    if (!isPlaying || totalSlides <= 1) return;

    const tickInterval = 100;
    const step = (tickInterval / SLIDE_INTERVAL) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((slide) => (slide + 1) % totalSlides);
          return 0;
        }
        return prev + step;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isPlaying, totalSlides, currentSlide]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
  };

  const current = slides[currentSlide] || slides[0];

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xl border border-orange-900/30 text-white group">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={current.coverImage}
          alt={current.title}
          className="w-full h-full object-cover transition-all duration-700 scale-105 group-hover:scale-100"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-r ${current.bgGradient} opacity-90 backdrop-blur-xs`}
        ></div>
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Main Slide Content */}
      <div className="relative z-10 p-6 sm:p-8 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between">
        {/* Top Header Row in Slide */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md ${current.badgeColor}`}
            >
              <Flame className="w-3 h-3 animate-pulse" />
              <span>{current.badge}</span>
            </span>

            {current.type === 'chef' && current.chef.city && (
              <span className="bg-black/40 backdrop-blur-md text-stone-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400" />
                <span>{current.chef.city}</span>
              </span>
            )}
          </div>
        </div>

        {/* Middle Body Content */}
        <div className="my-4 space-y-3">
          {/* Chef Slide layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={current.chef.avatar_url}
                    alt={current.chef.full_name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-amber-400 shadow-lg"
                  />
                  {current.chef.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 p-0.5 rounded-full shadow-md">
                      <CheckCircle2 className="w-4 h-4 fill-amber-500 text-stone-950" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg sm:text-xl text-white">
                      {current.chef.full_name}
                    </h3>
                    {currentUser.id !== current.chef.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollowChef(current.chef.id);
                        }}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                          followedChefs[current.chef.id]
                            ? 'bg-white/20 text-stone-200 border border-white/20'
                            : 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                        }`}
                      >
                        {followedChefs[current.chef.id] ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>مُتابع</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>متابعة الشيف</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-amber-300 font-bold">{current.subtitle}</p>

                  {/* Chef Stats Bar */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-stone-300 pt-1">
                    {current.profile && (
                      <span className="flex items-center gap-1 bg-black/40 px-2.5 py-0.5 rounded-lg border border-white/10 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{current.profile.rating_avg.toFixed(1)}</span>
                        <span className="text-stone-400 text-[10px]">
                          ({current.profile.rating_count} تقييم)
                        </span>
                      </span>
                    )}

                    {current.profile && (
                      <span className="flex items-center gap-1 bg-black/40 px-2.5 py-0.5 rounded-lg border border-white/10 text-stone-200">
                        <ShoppingBag className="w-3 h-3 text-orange-400" />
                        <span>+{current.profile.total_sales} طلب مُسلّم</span>
                      </span>
                    )}

                    {current.giftsTotal > 0 && (
                      <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                        <Gift className="w-3 h-3" />
                        <span>+{current.giftsTotal} د.ل هدايا</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Dish Preview box if available */}
              {current.topDish && (
                <div
                  onClick={() => onOpenDetail(current.topDish!)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 cursor-pointer transition-all flex items-center gap-3 shrink-0 max-w-xs"
                >
                  <img
                    src={current.topDish.images[0]}
                    alt={current.topDish.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 text-right">
                    <span className="text-[9px] text-amber-300 font-bold block">الأكثر طلباً ⭐</span>
                    <h4 className="font-extrabold text-xs text-white truncate">
                      {current.topDish.title}
                    </h4>
                    {current.topDish.price !== null && (
                      <span className="text-xs font-black text-orange-300">
                        {current.topDish.price} د.ل
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* Bottom Actions Row & Carousel Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            {current.topDish && (
              <>
                <button
                  onClick={() => onOpenOrder(current.topDish!)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>طلب ({current.topDish.price || 0} د.ل)</span>
                </button>

                <button
                  onClick={() => onOpenGift(current.topDish!)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs px-3.5 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span>إهداء 🎁</span>
                </button>
              </>
            )}
          </div>

          {/* Navigation Arrows & Pagination Indicators */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-xs active:scale-95"
              title="السلايد السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            <div className="flex items-center gap-1 px-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentSlide(idx);
                    setProgress(0);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    currentSlide === idx ? 'w-5 bg-amber-400' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-xs active:scale-95"
              title="السلايد التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Slide Progress Bar */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 z-20">
          <div
            className="h-full bg-amber-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
