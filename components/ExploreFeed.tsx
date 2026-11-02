'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { CATEGORIES, LIBYAN_CITIES, generateCityFallbackPosts } from '@/lib/constants';
import { PostCard } from './PostCard';
import { StoriesBar } from './StoriesBar';
import { FeaturedChefsSlider } from './FeaturedChefsSlider';
import { rankFeedPosts } from '@/lib/feedRanking';
import { Post } from '@/lib/types';
import {
  MapPin,
  Filter,
  Sparkles,
  Utensils,
  Gift,
  ShoppingBag,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  TrendingUp,
  RefreshCw,
  Flame,
  Award,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface ExploreFeedProps {
  onOpenDetail: (post: Post) => void;
  onOpenOrder: (post: Post) => void;
  onOpenGift: (post: Post) => void;
  onOpenPromote: (post: Post) => void;
  onOpenShareEarn: (post: Post) => void;
  onEditPost?: (post: Post) => void;
  searchQuery: string;
}

export const ExploreFeed: React.FC<ExploreFeedProps> = ({
  onOpenDetail,
  onOpenOrder,
  onOpenGift,
  onOpenPromote,
  onOpenShareEarn,
  onEditPost,
  searchQuery,
}) => {
  const { posts, currentUser, chefProfiles, userCity, setUserCity, followedChefs, isPostActiveSponsored } = useStore();
  const [feedMode, setFeedMode] = useState<'city' | 'all' | 'following'>('city');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'purchasable' | 'gifts_only' | 'sponsored'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price_low' | 'prep_time' | 'affiliate_commission'>('newest');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(200);

  // Determine baseline posts pool (including fallback generator if needed for minor cities)
  const cityPostsExist = posts.some((p) => p.city === userCity);
  const effectivePosts =
    feedMode === 'city' && !cityPostsExist
      ? [...posts, ...generateCityFallbackPosts(userCity)]
      : posts;

  // Filter posts logic
  const filteredPosts = effectivePosts.filter((post) => {
    const isSponsored = isPostActiveSponsored ? isPostActiveSponsored(post.id, userCity) : false;

    // City tab filter (sponsored ads targeted to user city always show up)
    if (feedMode === 'city' && post.city !== userCity && !isSponsored) {
      return false;
    }

    // Following tab filter (sponsored ads targeted to user city always show up)
    if (feedMode === 'following' && !followedChefs[post.chef_id] && !isSponsored) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && post.category !== selectedCategory) {
      return false;
    }

    // Filter type
    if (filterType === 'purchasable' && !post.is_purchasable) {
      return false;
    }
    if (filterType === 'gifts_only' && post.is_purchasable) {
      return false;
    }
    if (filterType === 'sponsored' && !isSponsored) {
      return false;
    }

    // Max Price filter
    if (post.price !== null && post.price > maxPriceFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchChef =
        post.chef_name.toLowerCase().includes(q) ||
        (post.kitchen_name && post.kitchen_name.toLowerCase().includes(q));
      const matchCity = post.city.toLowerCase().includes(q);
      const matchCategory = post.category.toLowerCase().includes(q);
      if (!matchTitle && !matchChef && !matchCity && !matchCategory) {
        return false;
      }
    }

    return true;
  });

  // Sort posts using production ranking algorithm (or user explicit sort)
  const rankingSortMode = sortBy === 'newest' ? 'ranking' : sortBy;
  const sortedPosts = rankFeedPosts({
    posts: filteredPosts,
    userCity,
    currentUser,
    followedChefs,
    chefProfiles,
    isPostActiveSponsored,
    feedMode: 'explore',
    sortBy: rankingSortMode as any,
  });

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    filterType !== 'all' ||
    feedMode !== 'city' ||
    maxPriceFilter < 200 ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSelectedCategory('all');
    setFilterType('all');
    setFeedMode('city');
    setSortBy('newest');
    setMaxPriceFilter(200);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Featured Chefs & Announcement Hero Slider */}
      <FeaturedChefsSlider
        onOpenDetail={onOpenDetail}
        onOpenOrder={onOpenOrder}
        onOpenGift={onOpenGift}
      />

      {/* Stories Carousel */}
      <StoriesBar onOpenOrder={onOpenOrder} />

      {/* Main Filter & Navigation Controls */}
      <div className="bg-white rounded-3xl p-4 border border-orange-100 shadow-xs space-y-4">
        {/* Top Row: Feed Mode & City Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFeedMode('city')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                feedMode === 'city'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>في مدينتي ({userCity})</span>
            </button>

            <button
              onClick={() => setFeedMode('all')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                feedMode === 'all'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>كل المدن الليبية 🇱🇾</span>
            </button>

            <button
              onClick={() => setFeedMode('following')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shrink-0 ${
                feedMode === 'following'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>المُتابَعون ({Object.values(followedChefs).filter(Boolean).length})</span>
            </button>
          </div>

          {/* Quick City Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-bold hidden sm:inline">المدينة:</span>
            <select
              value={userCity}
              onChange={(e) => setUserCity(e.target.value)}
              className="bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold px-3 py-2 rounded-xl outline-none"
            >
              {LIBYAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  📍 {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Quick Filter Toggles & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Type Toggles */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors ${
                filterType === 'all' ? 'bg-white text-stone-900 shadow-2xs font-extrabold' : 'text-stone-500'
              }`}
            >
              كل الأطباق
            </button>

            <button
              onClick={() => setFilterType('purchasable')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 ${
                filterType === 'purchasable' ? 'bg-white text-stone-900 shadow-2xs font-extrabold' : 'text-stone-500'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
              <span>للشراء</span>
            </button>

            <button
              onClick={() => setFilterType('gifts_only')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 ${
                filterType === 'gifts_only' ? 'bg-white text-stone-900 shadow-2xs font-extrabold' : 'text-stone-500'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-rose-600" />
              <span>هدايا وتذوق</span>
            </button>

            <button
              onClick={() => setFilterType('sponsored')}
              className={`px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 ${
                filterType === 'sponsored' ? 'bg-white text-amber-900 shadow-2xs font-extrabold' : 'text-stone-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>ممول ⚡</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-xl outline-none"
            >
              <option value="newest">🔥 الأحدث نشرًا</option>
              <option value="affiliate_commission">🎁 الأعلى عمولة تسويق للمشاركين</option>
              <option value="popular">❤️ الأكثر إعجاباً وشعبية</option>
              <option value="price_low">💵 الأقل سعراً</option>
              <option value="prep_time">⏱️ الأسرع تحضيراً</option>
            </select>
          </div>
        </div>

        {/* Budget Max Price Slider */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700">تصفية حسب ميزانيتك:</span>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-32 accent-orange-600 cursor-pointer"
            />
            <span className="font-extrabold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              حتى {maxPriceFilter} د.ل
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-stone-500 hover:text-stone-800 font-bold flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories Scroll Pills with Item Counts */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const count = posts.filter(
            (p) => (cat.id === 'all' || p.category === cat.id) && (feedMode !== 'city' || p.city === userCity)
          ).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200/80 hover:bg-stone-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name_ar}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Results Summary Banner */}
      <div className="flex items-center justify-between text-xs font-bold text-stone-500 px-1">
        <span>عرض {sortedPosts.length} طبقاً مطابقاً في {feedMode === 'city' ? userCity : 'جميع المدن'}</span>
        {searchQuery && (
          <span className="text-orange-700 font-bold">نتيجة البحث عن: &quot;{searchQuery}&quot;</span>
        )}
      </div>

      {/* Posts Grid */}
      {sortedPosts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-200 shadow-xs my-6">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-stone-800">
            {feedMode === 'following'
              ? 'لم تقم بمتابعة مطابخ تحتوي أطباقاً حالياً'
              : `لا توجد أطباق مطابقة للفلاتر في ${userCity} حالياً`}
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
            يمكنك توسيع الفلتر لعرض أطباق من مدن أخرى أو إعادة ضبط الفلاتر لاستعراض جميع المأكولات!
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black px-5 py-2.5 rounded-2xl shadow-md transition-colors"
          >
            إعادة ضبط الفلاتر واستعراض الكل 🇱🇾
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenDetail={onOpenDetail}
              onOpenOrder={onOpenOrder}
              onOpenGift={onOpenGift}
              onOpenPromote={onOpenPromote}
              onOpenShareEarn={onOpenShareEarn}
              onEditPost={onEditPost}
            />
          ))}
        </div>
      )}
    </div>
  );
};
