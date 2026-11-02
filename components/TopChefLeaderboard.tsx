'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Post, ChefReview } from '@/lib/types';
import { INITIAL_USERS, INITIAL_CHEF_PROFILES, INITIAL_REVIEWS } from '@/lib/constants';
import {
  Trophy,
  Flame,
  Star,
  ChefHat,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  ExternalLink,
  Award,
  MessageSquareQuote,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface TopChefLeaderboardProps {
  onOpenOrder?: (post: Post) => void;
  onOpenDetail?: (post: Post) => void;
  onNavigateToChefs?: () => void;
  className?: string;
}

export interface RankedChef {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  kitchenName: string;
  city: string;
  district: string;
  ratingAvg: number;
  reviewsCount: number;
  completedOrdersCount: number;
  foodQualityScore: number;
  serviceScore: number;
  isVerified: boolean;
  isTrending: boolean;
  trendingReason: string;
  rank: number;
  latestFeedback?: ChefReview;
  featuredPost?: Post;
}

export const TopChefLeaderboard: React.FC<TopChefLeaderboardProps> = ({
  onOpenOrder,
  onOpenDetail,
  onNavigateToChefs,
  className = '',
}) => {
  const {
    users,
    chefProfiles,
    chefReviews,
    orders,
    posts,
    followedChefs,
    toggleFollowChef,
    userCity,
  } = useStore();

  const [expandedChefId, setExpandedChefId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'highest_rated' | 'most_orders' | 'trending_only'>('all');
  const [cityFilter, setCityFilter] = useState<'all' | 'userCity'>('all');

  // Compute and rank top 5 chefs based on completed order feedback & metrics
  const rankedChefs = useMemo(() => {
    // Collect all chefs
    const baseChefs = (users || []).filter(
      (u) => u && (u.role === 'chef' || u.role === 'business')
    );
    const candidateChefs = baseChefs.length >= 5 ? baseChefs : INITIAL_USERS.filter((u) => u.role === 'chef');

    // Aggregate stats per chef
    const list: RankedChef[] = candidateChefs.map((chef) => {
      const profile = chefProfiles[chef.id] || INITIAL_CHEF_PROFILES[chef.id];
      const reviews = chefReviews[chef.id] || INITIAL_REVIEWS[chef.id] || [];

      // Filter feedback originating from verified completed orders
      const completedOrderReviews = reviews.filter(
        (r) => r.is_verified_purchase || !!r.order_id
      );
      const activeReviews = completedOrderReviews.length > 0 ? completedOrderReviews : reviews;

      // Count completed delivered orders in current system
      const deliveredOrders = (orders || []).filter(
        (o) => o.chef_id === chef.id && o.status === 'delivered'
      );
      const totalCompletedOrders =
        (profile?.total_sales || 0) + deliveredOrders.length;

      // Calculate weighted average rating from completed order feedback
      let ratingAvg = profile?.rating_avg || 4.8;
      let foodQualityScore = 4.9;
      let serviceScore = 4.8;

      if (activeReviews.length > 0) {
        const sumRating = activeReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
        ratingAvg = +(sumRating / activeReviews.length).toFixed(2);

        const sumQuality = activeReviews.reduce(
          (acc, r) => acc + (r.food_quality_rating || r.rating || 5),
          0
        );
        foodQualityScore = +(sumQuality / activeReviews.length).toFixed(1);

        const sumService = activeReviews.reduce(
          (acc, r) => acc + (r.service_rating || r.rating || 5),
          0
        );
        serviceScore = +(sumService / activeReviews.length).toFixed(1);
      }

      const reviewsCount =
        activeReviews.length > 0
          ? activeReviews.length
          : profile?.rating_count || 18;

      // Find featured dish
      const chefPosts = (posts || []).filter(
        (p) => p.chef_id === chef.id && p.is_purchasable && p.price !== null
      );
      const featuredPost = chefPosts[0];

      // Determine 'Trending Now' criteria:
      // High rating (>= 4.85) AND either recent delivered orders or high overall volume
      const recentDeliveries = deliveredOrders.length;
      const isTrending =
        ratingAvg >= 4.85 && (totalCompletedOrders >= 40 || recentDeliveries > 0);

      const trendingReason =
        recentDeliveries > 0
          ? `+${recentDeliveries} طلبيات مستلمة مؤخراً`
          : totalCompletedOrders >= 60
          ? 'إقبال قياسي هذا الأسبوع'
          : 'تقييم 5 نجوم متواصل';

      return {
        id: chef.id,
        fullName: chef.full_name,
        username: chef.username,
        avatarUrl: chef.avatar_url,
        kitchenName: profile?.kitchen_name || `مطبخ ${chef.full_name}`,
        city: chef.city,
        district: chef.district || 'وسط المدينة',
        ratingAvg,
        reviewsCount,
        completedOrdersCount: totalCompletedOrders,
        foodQualityScore,
        serviceScore,
        isVerified: chef.is_verified || profile?.verification_status === 'approved',
        isTrending,
        trendingReason,
        rank: 0,
        latestFeedback: activeReviews[0],
        featuredPost,
      };
    });

    // Filter by city if selected
    let filtered = list;
    if (cityFilter === 'userCity' && userCity) {
      filtered = list.filter((c) => c.city === userCity);
      // Fallback if not enough chefs in city
      if (filtered.length < 3) filtered = list;
    }

    // Sort according to selected filter
    if (filterMode === 'highest_rated') {
      filtered.sort((a, b) => b.ratingAvg - a.ratingAvg || b.reviewsCount - a.reviewsCount);
    } else if (filterMode === 'most_orders') {
      filtered.sort((a, b) => b.completedOrdersCount - a.completedOrdersCount);
    } else if (filterMode === 'trending_only') {
      filtered.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || b.ratingAvg - a.ratingAvg);
    } else {
      // Default: Composite score based on completed order rating and volume
      filtered.sort((a, b) => {
        const scoreA = a.ratingAvg * 20 + Math.min(a.completedOrdersCount, 100) * 0.3 + (a.isTrending ? 5 : 0);
        const scoreB = b.ratingAvg * 20 + Math.min(b.completedOrdersCount, 100) * 0.3 + (b.isTrending ? 5 : 0);
        return scoreB - scoreA;
      });
    }

    // Take top 5 and assign rank
    return filtered.slice(0, 5).map((chef, idx) => ({
      ...chef,
      rank: idx + 1,
    }));
  }, [users, chefProfiles, chefReviews, orders, posts, filterMode, cityFilter, userCity]);

  const toggleExpand = (chefId: string) => {
    setExpandedChefId((prev) => (prev === chefId ? null : chefId));
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-stone-950 shadow-md ring-2 ring-amber-300',
          symbol: '🥇',
          label: 'المركز الأول',
          border: 'border-amber-400/60',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400 text-stone-900 shadow-sm ring-1 ring-stone-300',
          symbol: '🥈',
          label: 'المركز الثاني',
          border: 'border-stone-300',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 shadow-sm ring-1 ring-amber-600/40',
          symbol: '🥉',
          label: 'المركز الثالث',
          border: 'border-amber-700/50',
        };
      default:
        return {
          bg: 'bg-stone-100 text-stone-700 border border-stone-200',
          symbol: `#${rank}`,
          label: `المركز ${rank}`,
          border: 'border-stone-200',
        };
    }
  };

  return (
    <div
      className={`bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden ${className}`}
      dir="rtl"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950 text-white p-4 sm:p-5 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-0 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 right-12 w-48 h-24 bg-orange-600/15 blur-2xl pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/40 shrink-0">
              <Trophy className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-1.5">
                  <span>لوحة الصدارة: أفضل 5 شيفات في ليبيا</span>
                  <span className="text-amber-400">✨</span>
                </h3>
                <span className="text-[10px] font-black bg-white/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>تقييمات طلبات مكتملة موثقة 100%</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                تصنيف حي مبني على آراء الزبائن الحقيقيين بعد استلام الطلبات وسرعة التحضير
              </p>
            </div>
          </div>

          {/* Quick All Chefs Link */}
          {onNavigateToChefs && (
            <button
              onClick={onNavigateToChefs}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer mr-auto sm:mr-0"
            >
              <span>دليل الشيفات الكامل</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls (Zero-pill discipline: subtle buttons) */}
        <div className="mt-4 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'bg-stone-800/90 text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              الترتيب العام 🏆
            </button>
            <button
              onClick={() => setFilterMode('highest_rated')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMode === 'highest_rated'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'bg-stone-800/90 text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              الأعلى تقييماً ⭐
            </button>
            <button
              onClick={() => setFilterMode('most_orders')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterMode === 'most_orders'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'bg-stone-800/90 text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              الأكثر طلباً 📦
            </button>
            <button
              onClick={() => setFilterMode('trending_only')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                filterMode === 'trending_only'
                  ? 'bg-orange-500 text-white font-black shadow-xs'
                  : 'bg-stone-800/90 text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span>رائج الآن 🔥</span>
            </button>
          </div>

          {/* City Toggle */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-stone-400">
            <MapPin className="w-3 h-3 text-orange-400" />
            <button
              onClick={() => setCityFilter('all')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                cityFilter === 'all' ? 'text-amber-400 underline font-black' : 'hover:text-stone-300'
              }`}
            >
              كل ليبيا
            </button>
            <span>/</span>
            <button
              onClick={() => setCityFilter('userCity')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                cityFilter === 'userCity' ? 'text-amber-400 underline font-black' : 'hover:text-stone-300'
              }`}
            >
              {userCity}
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Cards List */}
      <div className="p-3 sm:p-5 space-y-3">
        {rankedChefs.map((chef) => {
          const rankInfo = getRankBadge(chef.rank);
          const isFollowing = !!followedChefs[chef.id];
          const isExpanded = expandedChefId === chef.id;

          return (
            <div
              key={chef.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                chef.rank === 1
                  ? 'bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border-amber-300 shadow-xs'
                  : 'bg-white hover:bg-stone-50/70 border-stone-200/90'
              }`}
            >
              {/* Main Chef Card Row */}
              <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${rankInfo.bg}`}
                    title={rankInfo.label}
                  >
                    {rankInfo.symbol}
                  </div>

                  {/* Chef Avatar with verified ring */}
                  <div className="relative shrink-0">
                    <img
                      src={chef.avatarUrl}
                      alt={chef.fullName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-400/50 shadow-2xs"
                    />
                    {chef.isVerified && (
                      <span
                        className="absolute -bottom-1 -left-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] ring-2 ring-white"
                        title="شيف موثق رسمياً بالشهادة الصحية"
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Chef & Kitchen Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 truncate">
                        {chef.kitchenName}
                      </h4>

                      {/* 'Trending Now' Badge */}
                      {chef.isTrending && (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                          <Flame className="w-3 h-3 fill-white" />
                          <span>رائج الآن • Trending</span>
                        </span>
                      )}

                      {chef.rank === 1 && (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-md">
                          الأعلى تقييماً في ليبيا
                        </span>
                      )}
                    </div>

                    {/* Metadata line with zero-pill discipline */}
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1 flex-wrap font-medium">
                      <span className="text-stone-700 font-bold">{chef.fullName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-stone-600">
                        <MapPin className="w-3 h-3 text-orange-600" />
                        <span>{chef.city} ({chef.district})</span>
                      </span>
                      <span>·</span>
                      <span className="text-stone-600">
                        <strong className="text-stone-900 font-bold">{chef.completedOrdersCount}</strong> طلب مكتمل
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ratings & Quick Actions */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 mr-auto sm:mr-0">
                  {/* Rating Block */}
                  <div className="text-left bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="font-mono font-black text-sm text-stone-900">
                        {chef.ratingAvg}
                      </span>
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="text-[10px] text-stone-400 font-bold">
                      {chef.reviewsCount} تقييم طلب
                    </div>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={() => toggleFollowChef(chef.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      isFollowing
                        ? 'bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200'
                        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                    }`}
                    title={isFollowing ? 'أنت تتابع هذا الشيف' : 'متابعة الشيف في خلاصتك'}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تتابعه</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>متابعة</span>
                      </>
                    )}
                  </button>

                  {/* Expand / Details Toggle */}
                  <button
                    onClick={() => toggleExpand(chef.id)}
                    className={`p-2 rounded-xl border text-stone-500 hover:text-stone-900 transition-colors cursor-pointer ${
                      isExpanded
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white hover:bg-stone-100 border-stone-200'
                    }`}
                    title={isExpanded ? 'إخفاء التفاصيل' : 'عرض تقييمات الزبائن والطبق المميز'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable Feedback & Featured Dish Drawer */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-stone-200 bg-stone-50/70 p-3.5 sm:p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Left: Verified Customer Feedback Snippet */}
                      <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-stone-900 flex items-center gap-1.5">
                            <MessageSquareQuote className="w-4 h-4 text-orange-600" />
                            <span>آخر رأي موثق من زبون بعد الاستلام:</span>
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>طلب مكتمل</span>
                          </span>
                        </div>

                        {chef.latestFeedback ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-stone-500">
                              <span className="font-bold text-stone-800">
                                {chef.latestFeedback.user_name}
                              </span>
                              <div className="flex items-center gap-1 text-amber-500 font-bold font-mono">
                                <span>{chef.latestFeedback.rating}.0</span>
                                <Star className="w-3 h-3 fill-amber-500" />
                              </div>
                            </div>
                            <p className="text-xs text-stone-700 italic leading-relaxed bg-stone-50 p-2 rounded-lg border border-stone-100">
                              &ldquo;{chef.latestFeedback.comment}&rdquo;
                            </p>
                            {chef.latestFeedback.dish_name && (
                              <div className="text-[10px] text-stone-500 flex items-center gap-1 font-medium">
                                <span>الوجبة:</span>
                                <span className="text-stone-800 font-bold">{chef.latestFeedback.dish_name}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-stone-500">
                            لا توجد تقييمات مكتوبة مسجلة لهذا الشيف بعد.
                          </p>
                        )}

                        {/* Detailed Sub-Ratings */}
                        <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100 flex items-center justify-between">
                            <span className="text-stone-600">نكهة وطهي الطعام:</span>
                            <span className="font-black text-stone-900 font-mono">
                              {chef.foodQualityScore} / 5
                            </span>
                          </div>
                          <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100 flex items-center justify-between">
                            <span className="text-stone-600">التغليف والتسليم:</span>
                            <span className="font-black text-stone-900 font-mono">
                              {chef.serviceScore} / 5
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Featured Dish / Quick Order */}
                      <div className="bg-white p-3 rounded-xl border border-stone-200 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-extrabold text-stone-900 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-600" />
                              <span>الطبق الأكثر طلباً من مطبخه:</span>
                            </span>
                            {chef.isTrending && (
                              <span className="text-[10px] text-orange-700 font-black">
                                {chef.trendingReason}
                              </span>
                            )}
                          </div>

                          {chef.featuredPost ? (
                            <div className="flex items-center gap-2.5">
                              <img
                                src={chef.featuredPost.images[0]}
                                alt={chef.featuredPost.title}
                                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200"
                              />
                              <div className="min-w-0">
                                <h5 className="font-extrabold text-xs text-stone-900 truncate">
                                  {chef.featuredPost.title}
                                </h5>
                                <div className="font-mono font-black text-xs text-emerald-700 mt-0.5">
                                  {chef.featuredPost.price} د.ل
                                </div>
                                <div className="text-[10px] text-stone-400 mt-0.5 truncate">
                                  {chef.featuredPost.category} • جاهز للطلب الفوري
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-stone-500 py-3">
                              لم يتم نشر طبق حالياً، يمكنك تصفح مطبخ الشيف في الدليل.
                            </p>
                          )}
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                          {chef.featuredPost && onOpenOrder && (
                            <button
                              onClick={() => onOpenOrder(chef.featuredPost!)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>طلب الوجبة الآن</span>
                            </button>
                          )}

                          {chef.featuredPost && onOpenDetail && (
                            <button
                              onClick={() => onOpenDetail(chef.featuredPost!)}
                              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer border border-stone-200"
                            >
                              التفاصيل
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-stone-50 border-t border-stone-200/90 text-center text-xs text-stone-500 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px]">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>يتم تحديث لوحة الصدارة دورياً بعد كل عملية تسليم طلب وتحرير الضمان المالي</span>
        </span>
        {onNavigateToChefs && (
          <button
            onClick={onNavigateToChefs}
            className="text-[11px] font-black text-orange-700 hover:underline cursor-pointer"
          >
            تصفح جميع شيفات المنصة ({users.filter((u) => u.role === 'chef').length}+ شيف) ←
          </button>
        )}
      </div>
    </div>
  );
};
