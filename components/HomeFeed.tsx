'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { INITIAL_USERS } from '@/lib/constants';
import { PostCard } from './PostCard';
import { StoriesBar, ReelsBar } from './StoriesBar';
import { rankFeedPosts } from '@/lib/feedRanking';
import { Post } from '@/lib/types';
import { TopChefLeaderboard } from './TopChefLeaderboard';
import {
  Home,
  Users,
  Sparkles,
  ChefHat,
  Flame,
  PlusCircle,
  ShoppingBag,
  Heart,
  MessageSquare,
  TrendingUp,
  UserPlus,
  Check,
  MapPin,
  Trophy,
} from 'lucide-react';

interface HomeFeedProps {
  onOpenDetail: (post: Post) => void;
  onOpenOrder: (post: Post) => void;
  onOpenGift: (post: Post) => void;
  onOpenPromote: (post: Post) => void;
  onOpenShareEarn: (post: Post) => void;
  onEditPost?: (post: Post) => void;
  onNavigateToChefs: () => void;
  onNavigateToExplore: () => void;
  onNavigateToReels?: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  onOpenDetail,
  onOpenOrder,
  onOpenGift,
  onOpenPromote,
  onOpenShareEarn,
  onEditPost,
  onNavigateToChefs,
  onNavigateToExplore,
  onNavigateToReels,
}) => {
  const { posts, currentUser, users, followedChefs, toggleFollowChef, userCity, isPostActiveSponsored } = useStore();
  const [subTab, setSubTab] = useState<'following' | 'all'>('following');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Filter posts based on subTab (include active targeted sponsored posts so ads appear in feed)
  const followingPosts = useMemo(() => {
    return posts.filter(
      (post) => (isMounted ? followedChefs[post.chef_id] : false) || isPostActiveSponsored(post.id, userCity)
    );
  }, [posts, followedChefs, isPostActiveSponsored, userCity, isMounted]);

  const displayPosts = subTab === 'following' ? followingPosts : posts;

  // Apply algorithmic ranking score (recency, engagement velocity, proximity, chef score, diversity interleaving)
  const sortedPosts = rankFeedPosts({
    posts: displayPosts,
    userCity,
    currentUser,
    followedChefs,
    isPostActiveSponsored,
    feedMode: 'home',
    sortBy: 'ranking',
  });

  // Get list of suggested chefs if user is not following many (guarantee deterministic SSR & hydration output)
  const chefUsers = useMemo(() => {
    const defaultChefs = INITIAL_USERS.filter((u) => u.role === 'chef');
    if (!isMounted) {
      return defaultChefs.slice(0, 3);
    }
    const list = (users || []).filter((u) => u && (u.role === 'chef' || u.role === 'business'));
    if (list.length >= 3) return list.slice(0, 3);
    return defaultChefs.slice(0, 3);
  }, [users, isMounted]);

  return (
    <div className="space-y-5">
      {/* Clean Feed Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-2xl border border-stone-200/80">
          <button
            onClick={() => setSubTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            جميع الأطباق
          </button>
          <button
            onClick={() => setSubTab('following')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              subTab === 'following'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            المتابَعون ({followingPosts.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const el = document.getElementById('top-chef-leaderboard-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
            title="الانتقال إلى لوحة صدارة أفضل 5 شيفات"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>لوحة الصدارة (Top 5) 🏆</span>
          </button>

          <div className="text-stone-500 text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200/70">
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            <span>{userCity}</span>
          </div>
        </div>
      </div>

      {/* Standalone Reels Bar right below header & tabs */}
      <ReelsBar
        onNavigateToReels={onNavigateToReels}
        onOpenDetail={onOpenDetail}
      />

      {/* Suggested Chefs section if in 'following' mode and user follows few chefs */}
      {subTab === 'following' && followingPosts.length < 3 && (
        <div suppressHydrationWarning className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <h3 className="font-extrabold text-xs sm:text-sm text-stone-900">
                  شيفات مقترحون لمتابعتهم في {userCity} 👨‍🍳
                </h3>
                <p className="text-[11px] text-stone-600">تابع أمهر طهاة ليبيا لتعرض منشوراتهم الطازجة أولاً بأول</p>
              </div>
            </div>
            <button
              onClick={onNavigateToChefs}
              className="text-xs font-black text-orange-700 hover:underline shrink-0"
            >
              عرض الكل ←
            </button>
          </div>

          <div suppressHydrationWarning className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {chefUsers.slice(0, 3).map((chef) => {
              const isFollowing = isMounted ? !!followedChefs[chef.id] : false;
              return (
                <div
                  key={chef.id}
                  suppressHydrationWarning
                  className="bg-white p-3 rounded-xl border border-stone-200/80 flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={chef.avatar_url}
                      alt={chef.full_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-orange-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-stone-900 truncate">{chef.full_name}</div>
                      <div className="text-[10px] text-stone-500 truncate">{chef.district || chef.city}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFollowChef(chef.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      isFollowing
                        ? 'bg-stone-100 text-stone-700 border border-stone-300'
                        : 'bg-orange-600 text-white hover:bg-orange-700 shadow-2xs'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>تتابعه</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>متابعة</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Stream Posts */}
      <div className="space-y-6">
        {sortedPosts.length === 0 ? (
          <div className="space-y-6">
            <StoriesBar
              onOpenOrder={onOpenOrder}
              onNavigateToReels={onNavigateToReels}
              onOpenDetail={onOpenDetail}
            />

            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200/90 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-black text-base text-stone-900">لا توجد منشورات حصرية حالياً في هذه القائمة</h3>
                <p className="text-stone-500 text-xs mt-1 max-w-md mx-auto">
                  قم بمتابعة المزيد من الشيفات، أو قم بالانتقال إلى قسم الإكسبلور لاكتشاف الأطباق الأكثر تفاعلاً في طرابلس وباقي المدن.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onNavigateToExplore}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  تصفّح الإكسبلور 🔥
                </button>
                <button
                  onClick={onNavigateToChefs}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-5 py-2.5 rounded-xl border border-stone-300 transition-all cursor-pointer"
                >
                  دليل الشيفات 👨‍🍳
                </button>
              </div>
            </div>

            {/* Top 5 Chefs Leaderboard */}
            <div id="top-chef-leaderboard-section">
              <TopChefLeaderboard
                onOpenOrder={onOpenOrder}
                onOpenDetail={onOpenDetail}
                onNavigateToChefs={onNavigateToChefs}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* First batch of posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedPosts.slice(0, 2).map((post) => (
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

            {/* Circular Stories Bar (دوائر) Placed between feed posts */}
            <StoriesBar
              onOpenOrder={onOpenOrder}
              onNavigateToReels={onNavigateToReels}
              onOpenDetail={onOpenDetail}
            />

            {/* Top 5 Chefs Leaderboard (لوحة صدارة أمهر الشيفات في ليبيا) */}
            <div id="top-chef-leaderboard-section">
              <TopChefLeaderboard
                onOpenOrder={onOpenOrder}
                onOpenDetail={onOpenDetail}
                onNavigateToChefs={onNavigateToChefs}
              />
            </div>

            {/* Remaining posts */}
            {sortedPosts.length > 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedPosts.slice(2).map((post) => (
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
        )}
      </div>
    </div>
  );
};
