'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/lib/store';
import { PostCard } from './PostCard';
import { Post, User, ChefReview } from '@/lib/types';
import { LIBYAN_CITIES, CATEGORIES } from '@/lib/constants';
import {
  ChefHat,
  CheckCircle2,
  Star,
  ShoppingBag,
  MapPin,
  Search,
  Gift,
  UserPlus,
  UserCheck,
  Share2,
  Phone,
  MessageSquare,
  Filter,
  Sparkles,
  Clock,
  Truck,
  CreditCard,
  ArrowRight,
  ThumbsUp,
  Flame,
  Award,
  ShieldCheck,
  Utensils,
  X,
  Send,
  Heart,
  SlidersHorizontal,
  Grid,
  User as UserIcon,
  BadgeCheck,
  Check,
  MessageCircle,
  AlertCircle,
  ChevronDown,
  CheckCheck,
  Smile,
  HelpCircle,
} from 'lucide-react';

interface ChefProfileViewProps {
  onOpenDetail: (post: Post) => void;
  onOpenOrder: (post: Post) => void;
  onOpenGift: (post: Post) => void;
  onOpenPromote?: (post: Post) => void;
  onOpenShareEarn?: (post: Post) => void;
  onEditPost?: (post: Post) => void;
  openMessengerModal?: (targetUserId: string) => void;
}

export const ChefProfileView: React.FC<ChefProfileViewProps> = ({
  onOpenDetail,
  onOpenOrder,
  onOpenGift,
  onOpenPromote,
  onOpenShareEarn,
  onEditPost,
  openMessengerModal,
}) => {
  const {
    users,
    chefProfiles,
    posts,
    orders,
    followedChefs,
    toggleFollowChef,
    currentUser,
    userCity,
    setUserCity,
    chefReviews: storeChefReviews,
    addChefReview: storeAddChefReview,
    voteReviewHelpful: storeVoteReviewHelpful,
    replyToChefReview: storeReplyToChefReview,
  } = useStore();

  const getChefDeliveredSales = (chefId: string) => {
    const profileSales = chefProfiles[chefId]?.total_sales || 0;
    const orderSales = (orders || []).filter((o) => o.chef_id === chefId && o.status === 'delivered').length;
    return Math.max(profileSales, orderSales);
  };

  // Navigation & View state
  const [viewMode, setViewMode] = useState<'directory' | 'profile'>('directory');
  const [selectedChefId, setSelectedChefId] = useState<string | null>(null);

  // Filters state for Directory View
  const [searchQuery, setSearchQuery] = useState('');
  const [prevUserCity, setPrevUserCity] = useState(userCity);
  const [selectedCity, setSelectedCity] = useState<string>(userCity || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Synchronize selectedCity with global userCity
  if (prevUserCity !== userCity) {
    setPrevUserCity(userCity);
    if (userCity) {
      setSelectedCity(userCity);
    }
  }
  const [sortBy, setSortBy] = useState<'rating' | 'sales' | 'followers' | 'verified'>('rating');
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Active Chef Tabs inside Profile View
  const [activeTab, setActiveTab] = useState<'menu' | 'popular' | 'reviews' | 'info'>('menu');

  // Review System Modal & Form State
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [reviewDish, setReviewDish] = useState<string>('');
  const [overallRating, setOverallRating] = useState<number>(5);
  const [foodQualityRating, setFoodQualityRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [valueRating, setValueRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Review List Filter & Sort State
  const [reviewFilter, setReviewFilter] = useState<'all' | 'verified' | '5star' | '4star'>('all');
  const [reviewSort, setReviewSort] = useState<'newest' | 'rating' | 'helpful'>('newest');

  // Chef Replying State
  const [replyingToReviewId, setReplyingToReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  const [showToast, setShowToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  // Filter list of chefs/businesses
  const allChefs = useMemo(() => {
    return users.filter((u) => u.role === 'chef' || u.role === 'business');
  }, [users]);

  // Filtered & Sorted Chefs for Directory
  const filteredChefs = useMemo(() => {
    return allChefs
      .filter((chef) => {
        const profile = chefProfiles[chef.id];
        const chefPosts = posts.filter((p) => p.chef_id === chef.id);

        // Search match
        const matchesSearch =
          !searchQuery ||
          chef.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (profile?.kitchen_name &&
            profile.kitchen_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          chef.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (chef.bio && chef.bio.toLowerCase().includes(searchQuery.toLowerCase()));

        // City match
        const matchesCity = selectedCity === 'all' || chef.city === selectedCity;

        // Category match
        const matchesCategory =
          selectedCategory === 'all' ||
          chefPosts.some((p) => p.category === selectedCategory);

        // Verified filter
        const matchesVerified = !onlyVerified || chef.is_verified;

        return matchesSearch && matchesCity && matchesCategory && matchesVerified;
      })
      .sort((a, b) => {
        const profA = chefProfiles[a.id];
        const profB = chefProfiles[b.id];

        if (sortBy === 'rating') {
          return (profB?.rating_avg || 0) - (profA?.rating_avg || 0);
        }
        if (sortBy === 'sales') {
          return (profB?.total_sales || 0) - (profA?.total_sales || 0);
        }
        if (sortBy === 'verified') {
          return (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0);
        }
        return 0;
      });
  }, [allChefs, chefProfiles, posts, searchQuery, selectedCity, selectedCategory, onlyVerified, sortBy]);

  // Active Chef selection
  const activeChef = useMemo(() => {
    if (selectedChefId) {
      return allChefs.find((c) => c.id === selectedChefId) || allChefs[0];
    }
    return allChefs[0];
  }, [selectedChefId, allChefs]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [viewMode, activeChef?.id]);

  const activeProfile = activeChef ? chefProfiles[activeChef.id] : null;

  const chefPosts = useMemo(() => {
    return activeChef ? posts.filter((p) => p.chef_id === activeChef.id) : [];
  }, [activeChef, posts]);

  const popularPosts = useMemo(() => {
    return [...chefPosts].sort((a, b) => b.likes_count - a.likes_count);
  }, [chefPosts]);

  // Retrieve reviews for active chef from central store
  const currentChefReviews = useMemo(() => {
    return (activeChef && storeChefReviews) ? storeChefReviews[activeChef.id] || [] : [];
  }, [activeChef, storeChefReviews]);

  // User's completed / delivered orders from this chef
  const userDeliveredOrdersFromChef = useMemo(() => {
    if (!activeChef || !currentUser) return [];
    return (orders || []).filter(
      (o) => o.chef_id === activeChef.id && o.customer_id === currentUser.id && o.status === 'delivered'
    );
  }, [orders, activeChef, currentUser]);

  // Orders that haven't been reviewed yet by the current user
  const pendingReviewOrders = useMemo(() => {
    const reviewedOrderIds = new Set(
      currentChefReviews
        .filter((r) => r.user_id === currentUser.id && r.order_id)
        .map((r) => r.order_id)
    );
    return userDeliveredOrdersFromChef.filter((o) => !reviewedOrderIds.has(o.id));
  }, [userDeliveredOrdersFromChef, currentChefReviews, currentUser.id]);

  // Calculate detailed metric averages
  const reviewMetrics = useMemo(() => {
    const total = currentChefReviews.length;
    if (total === 0) {
      return {
        avgRating: activeProfile?.rating_avg || 5.0,
        foodQualityAvg: 5.0,
        serviceAvg: 5.0,
        cleanlinessAvg: 5.0,
        valueAvg: 5.0,
        recommendPercent: 99,
        starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        starPercentages: { 5: 100, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const sumRating = currentChefReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const sumFood = currentChefReviews.reduce((acc, r) => acc + (r.food_quality_rating || r.rating || 5), 0);
    const sumService = currentChefReviews.reduce((acc, r) => acc + (r.service_rating || r.rating || 5), 0);
    const sumClean = currentChefReviews.reduce((acc, r) => acc + (r.cleanliness_rating || 5), 0);
    const sumValue = currentChefReviews.reduce((acc, r) => acc + (r.value_rating || 5), 0);

    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    currentChefReviews.forEach((r) => {
      const rounded = Math.round(r.rating);
      const star = Math.max(1, Math.min(5, rounded));
      starCounts[star] = (starCounts[star] || 0) + 1;
    });

    const starPercentages: Record<number, number> = {
      5: Math.round(((starCounts[5] || 0) / total) * 100),
      4: Math.round(((starCounts[4] || 0) / total) * 100),
      3: Math.round(((starCounts[3] || 0) / total) * 100),
      2: Math.round(((starCounts[2] || 0) / total) * 100),
      1: Math.round(((starCounts[1] || 0) / total) * 100),
    };

    const highRatings = currentChefReviews.filter((r) => r.rating >= 4).length;
    const recommendPercent = Math.max(85, Math.round((highRatings / total) * 100));

    return {
      avgRating: Number((sumRating / total).toFixed(1)),
      foodQualityAvg: Number((sumFood / total).toFixed(1)),
      serviceAvg: Number((sumService / total).toFixed(1)),
      cleanlinessAvg: Number((sumClean / total).toFixed(1)),
      valueAvg: Number((sumValue / total).toFixed(1)),
      recommendPercent,
      starCounts,
      starPercentages,
    };
  }, [currentChefReviews, activeProfile]);

  // Filter & sort reviews for display
  const filteredReviews = useMemo(() => {
    return currentChefReviews
      .filter((rev) => {
        if (reviewFilter === 'verified') return rev.is_verified_purchase;
        if (reviewFilter === '5star') return rev.rating >= 4.9;
        if (reviewFilter === '4star') return rev.rating >= 4.0;
        return true;
      })
      .sort((a, b) => {
        if (reviewSort === 'rating') return b.rating - a.rating;
        if (reviewSort === 'helpful') return b.helpful_count - a.helpful_count;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [currentChefReviews, reviewFilter, reviewSort]);

  // Open Add Review Modal with optional order preselection
  const handleOpenAddReview = (orderToReview?: (typeof userDeliveredOrdersFromChef)[0]) => {
    if (orderToReview) {
      setSelectedOrderId(orderToReview.id);
      setSelectedPostId(orderToReview.post_id || '');
      setReviewDish(orderToReview.post_title || '');
    } else {
      setSelectedOrderId('');
      setSelectedPostId('');
      setReviewDish(chefPosts[0]?.title || '');
    }
    setOverallRating(5);
    setFoodQualityRating(5);
    setServiceRating(5);
    setCleanlinessRating(5);
    setValueRating(5);
    setReviewComment('');
    setSelectedTags([]);
    setShowAddReviewModal(true);
  };

  // Toggle quick review tag
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Submit Review
  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChef) return;
    if (!reviewComment.trim()) {
      triggerToast('يرجى كتابة رأيك وملاحظاتك عن جودة الطعام والخدمة ✍️');
      return;
    }

    let finalComment = reviewComment.trim();
    if (selectedTags.length > 0) {
      finalComment += `\n\n[أبرز المزايا: ${selectedTags.join(' • ')}]`;
    }

    const targetDish = reviewDish || (selectedOrderId ? userDeliveredOrdersFromChef.find(o => o.id === selectedOrderId)?.post_title : chefPosts[0]?.title) || 'أطباق المطبخ المتنوعة';

    const res = storeAddChefReview({
      chef_id: activeChef.id,
      order_id: selectedOrderId || undefined,
      post_id: selectedPostId || undefined,
      dish_name: targetDish,
      rating: overallRating,
      food_quality_rating: foodQualityRating,
      service_rating: serviceRating,
      cleanliness_rating: cleanlinessRating,
      value_rating: valueRating,
      comment: finalComment,
    });

    if (res.success) {
      setShowAddReviewModal(false);
      setReviewComment('');
      setReviewDish('');
      setSelectedOrderId('');
      setSelectedPostId('');
      setSelectedTags([]);
      triggerToast('تم نشر تقييمك بنجاح! شكرًا لدعمك الشيف ومساعدة الزبائن 🌟');
    } else {
      triggerToast(res.error || 'حدث خطأ أثناء حفظ التقييم');
    }
  };

  // Chef reply submit
  const handleChefReplySubmit = (reviewId: string) => {
    if (!activeChef || !replyText.trim()) return;
    const res = storeReplyToChefReview(activeChef.id, reviewId, replyText);
    if (res.success) {
      setReplyingToReviewId(null);
      setReplyText('');
      triggerToast('تم نشر رد الشيف على المراجعة بنجاح 👨‍🍳');
    }
  };

  const handleOpenChefProfile = (chefId: string) => {
    setSelectedChefId(chefId);
    setViewMode('profile');
    setActiveTab('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-stone-700 backdrop-blur-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Directory vs Profile View Switch Header */}
      <div className="bg-gradient-to-r from-stone-900 via-orange-950 to-stone-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-orange-900/40 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                <ChefHat className="w-3.5 h-3.5" />
                <span>دليل الشيفات المعتمد 🇱🇾</span>
              </span>
              <span className="text-xs text-stone-300 font-bold hidden sm:inline">
                +{allChefs.length} مطابخ منزلية موثقة
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {viewMode === 'directory'
                ? 'استكشف أسرار المطبخ الليبي وأشهر الشيفات في مدينتك'
                : `مطبخ (${activeProfile?.kitchen_name || activeChef?.full_name})`}
            </h1>
            <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
              تصفح الأطباق المنزلية المصنوعة بكل شغف، تابع شيفك المفضل، وادعم الأسر المنتجة الليبية بالطلب المباشر أو الإهداء عبر محفظة DPAY.
            </p>
          </div>

          {/* Navigation View Mode Buttons */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setViewMode('directory')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                viewMode === 'directory'
                  ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>دليل الشيفات ({allChefs.length})</span>
            </button>

            {activeChef && (
              <button
                onClick={() => setViewMode('profile')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  viewMode === 'profile'
                    ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                    : 'text-stone-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>ملف الشيف المختار</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: CHEFS DIRECTORY GRID */}
      {viewMode === 'directory' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-orange-100 shadow-xs space-y-4">
            {/* Row 1: Search input + Sorting */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الشيف، المطبخ، المنطقة، أو التخصص..."
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs pr-10 pl-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                {/* Sort dropdown */}
                <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 text-xs font-bold text-stone-700 w-full sm:w-auto">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="text-stone-400 text-[10px]">ترتيب:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer font-extrabold text-stone-900 text-xs"
                  >
                    <option value="rating">الأعلى تقييماً ⭐</option>
                    <option value="sales">الأكثر مبيعاً 🛒</option>
                    <option value="verified">الموثقون أولاً ✅</option>
                  </select>
                </div>

                {/* Verified Filter Toggle */}
                <button
                  onClick={() => setOnlyVerified(!onlyVerified)}
                  className={`px-3 py-2.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 ${
                    onlyVerified
                      ? 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${onlyVerified ? 'text-blue-600' : 'text-stone-400'}`}
                  />
                  <span>موثق فقط</span>
                </button>
              </div>
            </div>

            {/* Row 2: Libyan Cities Horizontal Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold text-stone-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" />
                <span>تصفح حسب المدينة الليبية:</span>
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setSelectedCity('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    selectedCity === 'all'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  جميع المدن
                </button>
                {LIBYAN_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setUserCity(city);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      selectedCity === city
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Specialties / Categories Filter */}
            <div className="space-y-1.5 pt-1 border-t border-stone-100">
              <span className="text-[11px] font-extrabold text-stone-500 flex items-center gap-1">
                <Utensils className="w-3 h-3 text-amber-500" />
                <span>نوع المأكولات والتخصص:</span>
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-stone-900 text-amber-400 shadow-sm'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name_ar}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Directory Grid Results Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-orange-600" />
              <span>المطابخ والشيفات المتاحة ({filteredChefs.length})</span>
            </h2>

            {filteredChefs.length > 0 && (
              <span className="text-xs text-stone-500 font-medium">
                اضغط على أي شيف لتصفح مطبخه الكامل والطلب مباشرة 🛒
              </span>
            )}
          </div>

          {/* Chefs Directory Cards Grid */}
          {filteredChefs.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-stone-200 space-y-3">
              <ChefHat className="w-12 h-12 text-stone-300 mx-auto animate-bounce" />
              <h3 className="font-extrabold text-sm text-stone-800">
                لم نجد أي شيف يطابق خيارات البحث الحالية
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                جرب تغيير المدينة، أو مسح كلمة البحث لرؤية كافة الشيفات والمطابخ المتاحة.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('all');
                  setSelectedCategory('all');
                  setOnlyVerified(false);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-md transition-all active:scale-95"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChefs.map((chef) => {
                const profile = chefProfiles[chef.id];
                const chefDishes = posts.filter((p) => p.chef_id === chef.id);
                const isFollowed = !!followedChefs[chef.id];
                const topDishes = chefDishes.slice(0, 3);

                return (
                  <motion.div
                    key={chef.id}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl overflow-hidden border border-orange-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Cover Photo Header */}
                      <div className="relative h-36 bg-stone-900 overflow-hidden">
                        <img
                          src={
                            profile?.cover_image_url ||
                            topDishes[0]?.images[0] ||
                            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
                          }
                          alt={chef.full_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>

                        {/* Top Right Badges */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-orange-400" />
                            <span>{chef.city}</span>
                          </span>

                          {chef.district && (
                            <span className="bg-black/60 backdrop-blur-md text-stone-200 text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10 hidden sm:inline">
                              {chef.district}
                            </span>
                          )}
                        </div>

                        {/* Rating Badge */}
                        <div className="absolute top-3 left-3 bg-amber-500 text-stone-950 font-black text-xs px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-stone-950" />
                          <span>{profile?.rating_count ? profile.rating_avg.toFixed(1) : 'جديد'}</span>
                        </div>
                      </div>

                      {/* Profile Main Details Body */}
                      <div className="p-5 relative -mt-8 space-y-3">
                        <div className="flex items-end justify-between gap-2">
                          <div className="relative">
                            <img
                              src={chef.avatar_url}
                              alt={chef.full_name}
                              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-lg bg-stone-100"
                            />
                            {chef.is_verified && (
                              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-md">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>

                          {/* Follow Button */}
                          {currentUser.id !== chef.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFollowChef(chef.id);
                                triggerToast(
                                  isFollowed
                                    ? `تم إلغاء متابعة ${chef.full_name}`
                                    : `أصبحت تتابع ${chef.full_name} الآن 🔔`
                                );
                              }}
                              className={`text-xs font-extrabold px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 active:scale-95 ${
                                isFollowed
                                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                                  : 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-sm'
                              }`}
                            >
                              {isFollowed ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>مُتابع</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>متابعة</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Kitchen Titles */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-base text-stone-900 group-hover:text-orange-600 transition-colors">
                              {profile?.kitchen_name || chef.full_name}
                            </h3>
                          </div>
                          <p className="text-xs text-stone-500 font-medium">
                            إدارة الشيف: {chef.full_name}
                          </p>
                        </div>

                        {/* Bio snippet */}
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {chef.bio || 'مطبخ ليبي بيتي متخصص في تقديم أشهى الأطباق الشعبية والشرقية طازجة يومياً.'}
                        </p>

                        {/* Sales & Ratings Bar */}
                        <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 pt-2 border-t border-stone-100">
                          <span className="flex items-center gap-1 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-xl">
                            <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                            <span>+{getChefDeliveredSales(chef.id)} طلب مُسلّم</span>
                          </span>

                          <span className="flex items-center gap-1 text-stone-500">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>{chefDishes.length} أطباق منشورة</span>
                          </span>
                        </div>

                        {/* Top Dish Thumbnails Bar */}
                        {topDishes.length > 0 && (
                          <div className="pt-2 space-y-1">
                            <span className="text-[10px] font-extrabold text-stone-400 block">
                              عينات من أطباق المطبخ:
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {topDishes.map((dish) => (
                                <div
                                  key={dish.id}
                                  onClick={() => onOpenDetail(dish)}
                                  className="relative h-14 rounded-xl overflow-hidden cursor-pointer group/dish border border-stone-100"
                                >
                                  <img
                                    src={dish.images[0]}
                                    alt={dish.title}
                                    className="w-full h-full object-cover group-hover/dish:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/30 group-hover/dish:bg-black/10 transition-colors"></div>
                                  {dish.price && (
                                    <span className="absolute bottom-1 right-1 bg-stone-900/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                      {dish.price}د.ل
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => handleOpenChefProfile(chef.id)}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs py-3 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group-hover:bg-orange-600 active:scale-98"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>زيارة المطبخ والطلب المباشر</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: DETAILED CHEF SHOWCASE PROFILE */}
      {viewMode === 'profile' && activeChef && (
        <div className="space-y-6">
          {/* Back Button to Directory */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode('directory')}
              className="bg-white hover:bg-stone-100 text-stone-800 text-xs font-black px-4 py-2.5 rounded-2xl border border-stone-200 shadow-xs transition-all flex items-center gap-2 active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لدليل جميع الشيفات والمطابخ</span>
            </button>

            <span className="text-xs text-stone-500 font-bold hidden sm:inline">
              رمز المطبخ المعتمد: #{activeChef.id.slice(-6).toUpperCase()}
            </span>
          </div>

          {/* Hero Profile Banner & Header */}
          <div className="bg-white rounded-3xl overflow-hidden border border-orange-100 shadow-lg">
            {/* Cover Photo */}
            <div className="relative h-52 sm:h-64 bg-stone-900 overflow-hidden">
              <img
                src={
                  activeProfile?.cover_image_url ||
                  chefPosts[0]?.images[0] ||
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
                }
                alt={activeChef.full_name}
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4 bg-emerald-500/90 text-white backdrop-blur-md text-xs font-black px-3.5 py-1.5 rounded-full border border-emerald-400/50 shadow-lg flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                <span>المطبخ مفتوح ويستقبل الطلبات الآن 🟢</span>
              </div>

              {/* City Badge */}
              <div className="absolute top-4 left-4 bg-black/60 text-stone-200 backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>{activeChef.city} {activeChef.district ? `• ${activeChef.district}` : ''}</span>
              </div>
            </div>

            {/* Profile Body Info */}
            <div className="p-6 sm:p-8 relative -mt-16 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={activeChef.avatar_url}
                      alt={activeChef.full_name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-2xl bg-stone-100"
                    />
                    {activeChef.is_verified && (
                      <div
                        className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-lg"
                        title="مطبخ موثق ورسمي"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-black text-2xl sm:text-3xl text-stone-900">
                        {activeProfile?.kitchen_name || activeChef.full_name}
                      </h1>

                      {activeChef.is_verified && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>شيف معتمد</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-amber-700 font-extrabold flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-orange-600" />
                      <span>الشيف المسئول: {activeChef.full_name}</span>
                    </p>

                    <p className="text-xs text-stone-600 max-w-xl leading-relaxed font-medium">
                      {activeChef.bio || 'مطبخ ليبي عريق يقدم أفضل المأكولات المنزلية، العصائر، والحلويات الشرقية المحضرة بطازجية عالية وفق أعلى معايير النظافة.'}
                    </p>
                  </div>
                </div>

                {/* Primary Profile Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {currentUser.id !== activeChef.id && (
                    <>
                      <button
                        onClick={() => openMessengerModal?.(activeChef.id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 active:scale-95"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>مراسلة الشيف 💬</span>
                      </button>

                      <button
                        onClick={() => {
                          toggleFollowChef(activeChef.id);
                          triggerToast(
                            followedChefs[activeChef.id]
                              ? `تم إلغاء المتابعة`
                              : `أصبحت تتابع ${activeChef.full_name} 🔔`
                          );
                        }}
                        className={`text-xs font-black px-5 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 active:scale-95 ${
                          followedChefs[activeChef.id]
                            ? 'bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200'
                            : 'bg-stone-900 text-white hover:bg-stone-800'
                        }`}
                      >
                        {followedChefs[activeChef.id] ? (
                          <>
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                            <span>تتابعه الآن</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>متابعة المطبخ</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {/* Send Gift to Chef */}
                  <button
                    onClick={() => {
                      const targetPost = chefPosts[0] || {
                        id: `post-chef-${activeChef.id}`,
                        chef_id: activeChef.id,
                        chef_name: activeChef.full_name,
                        chef_avatar: activeChef.avatar_url,
                        title: `مطبخ الشيف ${activeChef.full_name}`,
                        content: activeChef.bio || 'تقديم أجود المأكولات والمشروبات المباشرة',
                        images: [activeChef.avatar_url],
                        category: 'المأكولات الشعبية',
                        city: activeChef.city,
                        likes_count: 0,
                        comments_count: 0,
                        gifts_total: 0,
                        created_at: new Date().toISOString(),
                        delivery_available: true,
                      };
                      onOpenGift(targetPost);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs px-4 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>إهداء الشيف 🎁</span>
                  </button>

                  {/* Share Chef Link */}
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        triggerToast('تم نسخ رابط المطبخ لمشاركته مع أصدقائك 🔗');
                      }
                    }}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-3 rounded-2xl transition-colors border border-stone-200"
                    title="مشاركة المطبخ"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Key Stats Bar Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-100">
                <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl text-center space-y-0.5">
                  <span className="text-[10px] text-stone-400 font-bold block">التقييم العام</span>
                  <span className="font-black text-lg text-amber-600 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {activeProfile?.rating_count ? activeProfile.rating_avg.toFixed(1) : 'جديد'}
                  </span>
                  <span className="text-[9px] text-stone-500 font-medium">
                    ({activeProfile?.rating_count || 0} تقييم موثق)
                  </span>
                </div>

                <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl text-center space-y-0.5">
                  <span className="text-[10px] text-stone-400 font-bold block">إجمالي المبيعات</span>
                  <span className="font-black text-lg text-stone-900 flex items-center justify-center gap-1">
                    <ShoppingBag className="w-4 h-4 text-orange-600" />
                    +{activeChef ? getChefDeliveredSales(activeChef.id) : 0}
                  </span>
                  <span className="text-[9px] text-stone-500 font-medium">طلب مُسلّم للزبائن</span>
                </div>

                <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl text-center space-y-0.5">
                  <span className="text-[10px] text-stone-400 font-bold block">هدايا المشجعين</span>
                  <span className="font-black text-lg text-amber-600 flex items-center justify-center gap-1">
                    <Gift className="w-4 h-4 text-amber-500" />
                    {chefPosts.reduce((acc, p) => acc + (p.gifts_total || 0), 0)} د.ل
                  </span>
                  <span className="text-[9px] text-stone-500 font-medium">دعم وتكريم الشيف</span>
                </div>

                <div className="bg-stone-50 border border-stone-200/80 p-3.5 rounded-2xl text-center space-y-0.5">
                  <span className="text-[10px] text-stone-400 font-bold block">سرعة التوصيل</span>
                  <span className="font-black text-lg text-emerald-600 flex items-center justify-center gap-1">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    30-45 دقيقة
                  </span>
                  <span className="text-[9px] text-stone-500 font-medium">عبر (طلبك / دروبي)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                activeTab === 'menu'
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>قائمة الأطباق ({chefPosts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('popular')}
              className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                activeTab === 'popular'
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>الأكثر طلباً واشتهاراً ⭐</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                activeTab === 'reviews'
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>تقييمات وآراء الزبائن ({currentChefReviews.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center gap-2 shrink-0 ${
                activeTab === 'info'
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50 rounded-t-xl'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>طرق التوصيل والدفع 💳</span>
            </button>
          </div>

          {/* TAB 1: ALL CHEF DISHES */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-stone-900">
                  جميع أطباق المطبخ ({chefPosts.length}):
                </h3>
              </div>

              {chefPosts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-stone-200 space-y-2">
                  <Utensils className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-xs font-bold text-stone-700">لا توجد أطباق منشورة حالياً لهذا المطبخ</p>
                  <p className="text-[11px] text-stone-400">يمكنك العودة لاحقاً أو إرسال تحية للشيف 🌹</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {chefPosts.map((post) => (
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

          {/* TAB 2: POPULAR DISHES */}
          {activeTab === 'popular' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>الأطباق الأكثر طلباً وإعجاباً لدى هذا المطبخ</span>
                </h3>
              </div>

              {popularPosts.length === 0 ? (
                <p className="text-xs text-stone-500">لا توجد أطباق حالية.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularPosts.map((post) => (
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

          {/* TAB 3: CUSTOMER REVIEWS & ADD REVIEW */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Callout Banner: Completed Delivered Orders Prompt */}
              {pendingReviewOrders.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/70 border border-orange-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>طلب مكتمل ومُسلّم 🛒</span>
                        </span>
                        <span className="text-xs font-bold text-orange-950">
                          لديك {pendingReviewOrders.length} طلب جاهز للتقييم من هذا المطبخ!
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 max-w-xl leading-relaxed">
                        رأيك الصريح في <strong className="text-orange-900">جودة الطعام والنكهة</strong> و<strong className="text-orange-900">مستوى الخدمة والتغليف</strong> يساعد الشيف على الاستمرار، ويمنح زبائن سُفرة الآخرين تجربة موثوقة.
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenAddReview(pendingReviewOrders[0])}
                      className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      <Star className="w-4 h-4 fill-white" />
                      <span>تقييم طلبك الأخير الآن ✍️</span>
                    </button>
                  </div>

                  {/* List of pending orders for quick selection */}
                  <div className="pt-2 border-t border-orange-200/60 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold text-stone-600">الطلبات المتاحة للتقييم:</span>
                    {pendingReviewOrders.map((ord) => (
                      <button
                        key={ord.id}
                        onClick={() => handleOpenAddReview(ord)}
                        className="bg-white hover:bg-orange-50 text-stone-800 hover:text-orange-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-orange-200/80 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Utensils className="w-3 h-3 text-orange-500" />
                        <span>{ord.post_title}</span>
                        <span className="text-[10px] text-stone-400">({ord.id})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comprehensive Reviews Scorecard & Detailed Breakdown */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left Column: Overall Score & Recommendation */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-amber-50/60 rounded-2xl border border-amber-200/70 text-center space-y-2">
                    <span className="text-4xl sm:text-5xl font-black text-amber-600 tracking-tight">
                      {reviewMetrics.avgRating.toFixed(1)}
                    </span>
                    <div className="flex items-center text-amber-400 gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            s <= Math.round(reviewMetrics.avgRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-stone-700">
                      بناءً على {currentChefReviews.length} تقييم موثق
                    </span>
                    <div className="pt-2 border-t border-amber-200/60 w-full text-center">
                      <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>{reviewMetrics.recommendPercent}% من الزبائن يوصون بهذا المطبخ</span>
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: 4 Detailed Quality Criteria Bars */}
                  <div className="lg:col-span-4 space-y-3.5 px-2">
                    <h5 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      <span>متوسط تقييم معايير الجودة والخدمة:</span>
                    </h5>

                    {/* Food Quality */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-stone-700 flex items-center gap-1">
                          <span>🍲</span>
                          <span>جودة الطعام والنكهة</span>
                        </span>
                        <span className="text-amber-700 font-black">{reviewMetrics.foodQualityAvg.toFixed(1)} / 5</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${(reviewMetrics.foodQualityAvg / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Service & Packaging */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-stone-700 flex items-center gap-1">
                          <span>📦</span>
                          <span>مستوى الخدمة والتغليف</span>
                        </span>
                        <span className="text-amber-700 font-black">{reviewMetrics.serviceAvg.toFixed(1)} / 5</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${(reviewMetrics.serviceAvg / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Cleanliness */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-stone-700 flex items-center gap-1">
                          <span>🧼</span>
                          <span>النظافة والتقديم</span>
                        </span>
                        <span className="text-amber-700 font-black">{reviewMetrics.cleanlinessAvg.toFixed(1)} / 5</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${(reviewMetrics.cleanlinessAvg / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Value */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-stone-700 flex items-center gap-1">
                          <span>💰</span>
                          <span>القيمة مقابل السعر</span>
                        </span>
                        <span className="text-amber-700 font-black">{reviewMetrics.valueAvg.toFixed(1)} / 5</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${(reviewMetrics.valueAvg / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Star Count Breakdown + CTA */}
                  <div className="lg:col-span-4 space-y-3 px-2">
                    <h5 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>توزيع درجات النجوم:</span>
                    </h5>

                    <div className="space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-2 text-xs font-medium">
                          <span className="w-12 text-stone-600 font-bold shrink-0 flex items-center gap-0.5">
                            <span>{star}</span>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </span>
                          <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${reviewMetrics.starPercentages[star] || 0}%` }}
                            />
                          </div>
                          <span className="w-10 text-[11px] text-stone-400 text-left font-mono">
                            {reviewMetrics.starPercentages[star] || 0}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleOpenAddReview()}
                        className="w-full bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Star className="w-4 h-4 fill-white" />
                        <span>كتابة مراجعة وتقييم الشيف ✍️</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews Controls Toolbar: Filters & Sorting */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
                {/* Segmented Filter Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                      reviewFilter === 'all'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    الكل ({currentChefReviews.length})
                  </button>
                  <button
                    onClick={() => setReviewFilter('verified')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                      reviewFilter === 'verified'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مشتري موثق ({currentChefReviews.filter((r) => r.is_verified_purchase).length})</span>
                  </button>
                  <button
                    onClick={() => setReviewFilter('5star')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                      reviewFilter === '5star'
                        ? 'bg-amber-500 text-stone-950 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>5 نجوم ({currentChefReviews.filter((r) => r.rating >= 4.9).length})</span>
                  </button>
                  <button
                    onClick={() => setReviewFilter('4star')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                      reviewFilter === '4star'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    4 نجوم فأكثر ({currentChefReviews.filter((r) => r.rating >= 4.0).length})
                  </button>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-extrabold text-stone-400">ترتيب:</span>
                  <select
                    value={reviewSort}
                    onChange={(e: any) => setReviewSort(e.target.value)}
                    className="bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="newest">الأحدث أولاً 🕒</option>
                    <option value="rating">الأعلى تقييماً ⭐</option>
                    <option value="helpful">الأكثر فائدة 👍</option>
                  </select>
                </div>
              </div>

              {/* Reviews Cards List */}
              <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-stone-200 space-y-3">
                    <Star className="w-12 h-12 text-stone-300 mx-auto" />
                    <h4 className="font-extrabold text-sm text-stone-800">
                      لا توجد تقييمات تطابق الفلتر المختار
                    </h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      جرب اختيار (الكل) أو كن أول من يضيف تجربة جديدة لهذا المطبخ.
                    </p>
                    <button
                      onClick={() => setReviewFilter('all')}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs px-4 py-2 rounded-xl transition-all"
                    >
                      عرض جميع التقييمات
                    </button>
                  </div>
                ) : (
                  filteredReviews.map((rev) => {
                    const isHelpfulActive = Boolean(
                      rev.helpful_voters && rev.helpful_voters.includes(currentUser.id)
                    );
                    const isChefOwner = currentUser.id === activeChef.id;
                    const canChefReply = isChefOwner && !rev.chef_reply;

                    return (
                      <div
                        key={rev.id}
                        className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-3.5 transition-all hover:border-orange-200"
                      >
                        {/* Header: User Info + Badges + Rating */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={rev.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                              alt=""
                              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-stone-100 bg-stone-100 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs text-stone-900">
                                  {rev.user_name}
                                </span>

                                {rev.is_verified_purchase && (
                                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <BadgeCheck className="w-3 h-3 text-emerald-600" />
                                    <span>مشتري موثق (طلب مكتمل)</span>
                                  </span>
                                )}
                              </div>
                              <span suppressHydrationWarning className="text-[10px] text-stone-400 font-medium">
                                {rev.created_at ? new Date(rev.created_at).toLocaleDateString('ar-LY', { year: 'numeric', month: 'short', day: 'numeric' }) : 'مؤخراً'}
                              </span>
                            </div>
                          </div>

                          {/* Star Rating Chip */}
                          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                            <div className="flex items-center text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= Math.round(rev.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-black text-xs text-amber-700">{rev.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Dish Tag & Detailed Metrics Tag Bar */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          {rev.dish_name && (
                            <span className="bg-orange-50 text-orange-900 border border-orange-200/80 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Utensils className="w-3 h-3 text-orange-600" />
                              <span>الطلب: {rev.dish_name}</span>
                            </span>
                          )}

                          {rev.food_quality_rating && (
                            <span className="bg-stone-50 text-stone-700 border border-stone-200 px-2.5 py-0.5 rounded-lg">
                              جودة الطعام: {rev.food_quality_rating}/5 ⭐
                            </span>
                          )}

                          {rev.service_rating && (
                            <span className="bg-stone-50 text-stone-700 border border-stone-200 px-2.5 py-0.5 rounded-lg">
                              الخدمة والتسليم: {rev.service_rating}/5 ⭐
                            </span>
                          )}

                          {rev.cleanliness_rating && (
                            <span className="bg-stone-50 text-stone-700 border border-stone-200 px-2.5 py-0.5 rounded-lg hidden sm:inline">
                              النظافة: {rev.cleanliness_rating}/5 ⭐
                            </span>
                          )}
                        </div>

                        {/* Review Body */}
                        <p className="text-xs text-stone-800 leading-relaxed font-normal whitespace-pre-line">
                          {rev.comment}
                        </p>

                        {/* Chef's Official Reply Box (if present) */}
                        {rev.chef_reply && (
                          <div className="bg-amber-50/70 border-r-4 border-r-amber-500 border border-amber-200 rounded-2xl p-3.5 space-y-1 mt-2">
                            <div className="flex items-center justify-between text-[11px] font-black text-amber-950">
                              <span className="flex items-center gap-1.5">
                                <ChefHat className="w-3.5 h-3.5 text-orange-600" />
                                <span>رد شيف المطبخ ({activeProfile?.kitchen_name || activeChef.full_name}):</span>
                              </span>
                              <span className="text-[10px] text-stone-400 font-normal">
                                {rev.chef_reply.replied_at}
                              </span>
                            </div>
                            <p className="text-xs text-stone-800 leading-relaxed font-medium">
                              {rev.chef_reply.text}
                            </p>
                          </div>
                        )}

                        {/* Inline Chef Reply Form (if chef logged in and replying) */}
                        {replyingToReviewId === rev.id && (
                          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in">
                            <label className="text-xs font-bold text-stone-800 block">
                              اكتب ردك اللطيف على تقييم الزبون:
                            </label>
                            <textarea
                              rows={2}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="مثال: صحة وهنا على قلبك! شرفتنا دائماً ونسعد بخدمتكم..."
                              className="w-full bg-white border border-stone-200 text-xs p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setReplyingToReviewId(null);
                                  setReplyText('');
                                }}
                                className="text-xs font-bold text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-lg"
                              >
                                إلغاء
                              </button>
                              <button
                                onClick={() => handleChefReplySubmit(rev.id)}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-4 py-1.5 rounded-lg shadow-sm"
                              >
                                نشر الرد 👨‍🍳
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Review Card Footer Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500">
                          <button
                            onClick={() => storeVoteReviewHelpful(activeChef.id, rev.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                              isHelpfulActive
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-stone-50 text-stone-600 border-stone-200/80 hover:bg-stone-100'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${isHelpfulActive ? 'fill-orange-600 text-orange-600' : ''}`} />
                            <span>مفيد ({rev.helpful_count || 0})</span>
                          </button>

                          {canChefReply && replyingToReviewId !== rev.id && (
                            <button
                              onClick={() => {
                                setReplyingToReviewId(rev.id);
                                setReplyText('');
                              }}
                              className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>الرد كـ شيف 👨‍🍳</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Review Modal Dialog */}
              <AnimatePresence>
                {showAddReviewModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden my-6"
                    >
                      {/* Modal Header */}
                      <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-5 text-white flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h3 className="font-black text-base flex items-center gap-2">
                            <Star className="w-5 h-5 fill-white" />
                            <span>تقييم تجربة مطبخ ({activeProfile?.kitchen_name || activeChef.full_name})</span>
                          </h3>
                          <p className="text-xs text-orange-100 font-medium">
                            شارك رأيك الحقيقي حول جودة المأكولات والخدمة
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAddReviewModal(false)}
                          className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-xl transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Form Content */}
                      <form onSubmit={handleAddReviewSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        {/* 1. Completed Order Link (if available) */}
                        {userDeliveredOrdersFromChef.length > 0 && (
                          <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-3.5 space-y-2">
                            <label className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                              <BadgeCheck className="w-4 h-4 text-emerald-600" />
                              <span>ربط التقييم بطلبك المكتمل (للحصول على شارة مشتري موثق 🛒):</span>
                            </label>
                            <select
                              value={selectedOrderId}
                              onChange={(e) => {
                                const ordId = e.target.value;
                                setSelectedOrderId(ordId);
                                const found = userDeliveredOrdersFromChef.find((o) => o.id === ordId);
                                if (found) {
                                  setReviewDish(found.post_title);
                                  setSelectedPostId(found.post_id || '');
                                }
                              }}
                              className="w-full bg-white border border-orange-200 text-xs font-bold text-stone-800 rounded-xl p-2.5 outline-none cursor-pointer"
                            >
                              <option value="">-- تقييم عام للمطبخ --</option>
                              {userDeliveredOrdersFromChef.map((o) => (
                                <option key={o.id} value={o.id}>
                                  ✅ {o.post_title} (طلب رقم #{o.id} - {o.total_price} د.ل)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* 2. Overall Star Rating with Arabic Description */}
                        <div className="space-y-2 text-center p-4 bg-stone-50 rounded-2xl border border-stone-200">
                          <label className="text-xs font-black text-stone-900 block">
                            التقييم الإجمالي العام:
                          </label>
                          <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setOverallRating(star)}
                                className="p-1 text-amber-400 transition-transform active:scale-125 cursor-pointer"
                              >
                                <Star
                                  className={`w-7 h-7 sm:w-8 sm:h-8 ${
                                    star <= overallRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-extrabold text-orange-700 block">
                            {overallRating === 5 && 'ممتاز وطعم لا يُعلى عليه! ⭐⭐⭐⭐⭐'}
                            {overallRating === 4 && 'جيد جداً ولذيذ ⭐⭐⭐⭐'}
                            {overallRating === 3 && 'جيد وبحاجة لبعض التحسين ⭐⭐⭐'}
                            {overallRating === 2 && 'أقل من المتوقع ⭐⭐'}
                            {overallRating === 1 && 'تجربة غير مرضية ⭐'}
                          </span>
                        </div>

                        {/* 3. Detailed Criteria 5-Star Pickers */}
                        <div className="space-y-3 bg-stone-50/60 p-4 rounded-2xl border border-stone-200">
                          <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                            <span>تقييم المعايير بالتفصيل (من 1 إلى 5):</span>
                          </h4>

                          {/* Food Quality */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                              <span>🍲</span>
                              <span>جودة الطعام والنكهة:</span>
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setFoodQualityRating(s)}
                                  className="p-1 cursor-pointer"
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      s <= foodQualityRating ? 'fill-orange-500 text-orange-500' : 'text-stone-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Service & Preparation */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                              <span>📦</span>
                              <span>الخدمة وسرعة التحضير:</span>
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setServiceRating(s)}
                                  className="p-1 cursor-pointer"
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      s <= serviceRating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cleanliness */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                              <span>🧼</span>
                              <span>النظافة والتغليف المحكم:</span>
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setCleanlinessRating(s)}
                                  className="p-1 cursor-pointer"
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      s <= cleanlinessRating ? 'fill-emerald-500 text-emerald-500' : 'text-stone-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Value */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                              <span>💰</span>
                              <span>القيمة مقابل السعر:</span>
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setValueRating(s)}
                                  className="p-1 cursor-pointer"
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      s <= valueRating ? 'fill-blue-500 text-blue-500' : 'text-stone-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 4. Quick Positive Attributes Tag Chips */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-stone-600 block">
                            وسوم سريعة تميزت بها تجربتك (اضغط للإضافة):
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'طعام ساخن وطازج 🔥',
                              'تغليف محكم ونظيف 📦',
                              'لحم وطني بلدي 🥩',
                              'بهارات متوازنة 🌿',
                              'كمية مشبعة ووافية 🍲',
                              'التزام بوقت التسليم ⏱️',
                              'شيف ذوق وتواصل راقي 👨‍🍳',
                            ].map((tag) => {
                              const active = selectedTags.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => handleToggleTag(tag)}
                                  className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                                    active
                                      ? 'bg-orange-600 text-white border-orange-600'
                                      : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 5. Dish Name */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700 block">
                            اسم الطبق أو الوجبة:
                          </label>
                          <input
                            type="text"
                            value={reviewDish}
                            onChange={(e) => setReviewDish(e.target.value)}
                            placeholder="مثال: كسكسي بالبصلة، طاجين جبن، رشدة كسكاس..."
                            className="w-full bg-white border border-stone-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
                          />

                          {/* Quick dish suggestions from chef's menu */}
                          {chefPosts.length > 0 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                              <span className="text-[10px] text-stone-400 font-bold shrink-0">أو اختر:</span>
                              {chefPosts.slice(0, 4).map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setReviewDish(p.title);
                                    setSelectedPostId(p.id);
                                  }}
                                  className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md shrink-0 cursor-pointer"
                                >
                                  {p.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 6. Review Feedback Comment */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-stone-700 block">
                            تعليقك وانطباعك عن الأكل والخدمة: <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={3}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="اكتب تجربتك الصريحة عن الطعم، التتبيلة، النظافة، وسرعة الاستجابة..."
                            className="w-full bg-white border border-stone-200 text-xs p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-medium"
                            required
                          />
                        </div>

                        {/* Notice for Verified Purchase */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-[10px] text-stone-500 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            التقييمات المرتبطة بطلبات مكتملة تظهر فوراً مع شارة (مشتري موثق 🛒) لتعزيز موثوقية المطبخ.
                          </span>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAddReviewModal(false)}
                            className="text-stone-600 hover:bg-stone-100 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Star className="w-4 h-4 fill-white" />
                            <span>نشر التقييم 🌟</span>
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* TAB 4: DELIVERY & KITCHEN INFO */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Providers */}
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs space-y-4">
                <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600" />
                  <span>شركاء التوصيل المعتمدين لدى المطبخ</span>
                </h4>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                        طلبك
                      </div>
                      <div>
                        <div className="font-bold text-xs text-stone-900">شركة طلبك للتوصيل (TALABK)</div>
                        <div className="text-[10px] text-stone-500">توصيل فورى ومباشر للبيت والمقر</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      متاح 🟢
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center">
                        دروبي
                      </div>
                      <div>
                        <div className="font-bold text-xs text-stone-900">خدمة دروبي Express</div>
                        <div className="text-[10px] text-stone-500">تغطية لكافة الأحياء والمناطق المجاورة</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      متاح 🟢
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Gateways */}
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-xs space-y-4">
                <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span>طرق الدفع المباشر المقبولة (DPAY)</span>
                </h4>

                <div className="grid grid-cols-2 gap-2.5 text-xs font-bold text-stone-800">
                  <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center gap-2">
                    <span>🏦</span>
                    <span>ادفع لي (TDB)</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center gap-2">
                    <span>📲</span>
                    <span>سداد (المدار)</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center gap-2">
                    <span>🏢</span>
                    <span>مصرفي باي</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center gap-2">
                    <span>💳</span>
                    <span>تداول / كاش</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
