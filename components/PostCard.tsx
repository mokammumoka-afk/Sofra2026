'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post } from '@/lib/types';
import { useStore } from '@/lib/store';
import {
  Heart,
  MessageCircle,
  Gift,
  ShoppingBag,
  Sparkles,
  MapPin,
  Clock,
  Share2,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Trash2,
  Bookmark,
  Flag,
  Film,
  X,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onOpenDetail: (post: Post) => void;
  onOpenOrder: (post: Post) => void;
  onOpenGift: (post: Post) => void;
  onOpenPromote?: (post: Post) => void;
  onOpenShareEarn?: (post: Post) => void;
  onEditPost?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenDetail,
  onOpenOrder,
  onOpenGift,
  onOpenPromote,
  onOpenShareEarn,
  onEditPost,
}) => {
  const {
    toggleLike,
    userLikes,
    currentUser,
    followedChefs,
    toggleFollowChef,
    deletePost,
    userBookmarks,
    toggleBookmark,
    reportContent,
    trackSponsoredImpression,
    trackSponsoredClick,
    trackSponsoredCartAdd,
    isPostActiveSponsored,
    userCity,
  } = useStore();

  const isSponsored = isPostActiveSponsored ? isPostActiveSponsored(post.id, userCity) : false;

  const isLiked = !!userLikes[post.id];
  const isBookmarked = !!userBookmarks[post.id];
  const isFollowed = !!followedChefs[post.chef_id];
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [burstParticles, setBurstParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('صورة غير حقيقية أو مضللة');
  const [reportDetails, setReportDetails] = useState('');

  const trackedRef = React.useRef(false);
  useEffect(() => {
    if (isSponsored && trackSponsoredImpression && !trackedRef.current) {
      trackedRef.current = true;
      trackSponsoredImpression(post.id);
    }
  }, [post.id, isSponsored, trackSponsoredImpression]);

  const handleOpenDetail = () => {
    if (isSponsored && trackSponsoredClick) {
      trackSponsoredClick(post.id);
    }
    onOpenDetail(post);
  };

  const handleOpenOrder = () => {
    if (isSponsored && trackSponsoredCartAdd) {
      trackSponsoredCartAdd(post.id);
    }
    onOpenOrder(post);
  };

  const isOwner = currentUser.id === post.chef_id;
  const canManage = isOwner || currentUser.role === 'admin';
  const [confirmDelete, setConfirmDelete] = useState(false);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleDeletePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3500);
      return;
    }
    const ok = deletePost(post.id);
    if (ok) {
      triggerToast('تم حذف الطبق بنجاح 🗑️');
    } else {
      triggerToast('عذراً، تعذر حذف المنشور');
    }
  };

  const handleLikeClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleLike(post.id);

    if (!isLiked) {
      // Spawn heart particles
      const newParticles = Array.from({ length: 5 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 40,
        y: -Math.random() * 40 - 10,
      }));
      setBurstParticles(newParticles);
      setTimeout(() => setBurstParticles([]), 1000);
      triggerToast('أعجبك هذا الطبق ❤️');
    } else {
      triggerToast('تم إلغاء الإعجاب');
    }
  };

  const handleImageDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) {
      toggleLike(post.id);
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: post.title,
          text: `شاهد طبق (${post.title}) من الشيف ${post.chef_name} على منصة سفرة ليبيا!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('تم نسخ رابط الطبق بنجاح! 📋');
    }
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-orange-100/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-stone-900/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-stone-700 pointer-events-none"
          >
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Chef Info Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-stone-100/60 bg-gradient-to-r from-stone-50/50 to-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={post.chef_avatar}
              alt={post.chef_name}
              className="w-10 h-10 rounded-2xl object-cover border border-stone-200"
            />
            {post.chef_verified && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-100 absolute -bottom-1 -right-1" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-stone-900 truncate">
                {post.kitchen_name || post.chef_name}
              </span>

              {/* Follow Button */}
              {!isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollowChef(post.chef_id);
                    triggerToast(isFollowed ? 'تم إلغاء المتابعة' : 'أصبحت تتابع هذا المطبخ! ⭐');
                  }}
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-all flex items-center gap-0.5 ${
                    isFollowed
                      ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                      : 'bg-orange-600 text-white shadow-2xs hover:bg-orange-700'
                  }`}
                >
                  {isFollowed ? (
                    <>
                      <UserCheck className="w-2.5 h-2.5" />
                      <span>مُتابع</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-2.5 h-2.5" />
                      <span>متابعة</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium mt-0.5">
              <span className="flex items-center gap-0.5 text-orange-700">
                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                {post.city}
              </span>
              <span>•</span>
              {post.preparation_time_mins && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                  {post.preparation_time_mins} دقيقة
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Owner / Admin Management buttons & Sponsored Tag */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isSponsored && (
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 shadow-md flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3 text-stone-950 fill-stone-950" />
              <span>ممول ⚡ إعلان</span>
            </span>
          )}

          {canManage && (
            <div className="flex items-center gap-1">
              {onEditPost && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPost(post);
                  }}
                  className="text-stone-600 hover:text-orange-600 bg-stone-100 hover:bg-orange-50 p-1.5 rounded-xl transition-colors border border-stone-200/80"
                  title="تعديل المنشور"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleDeletePost}
                className={
                  confirmDelete
                    ? "text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded-xl transition-all border border-rose-700 flex items-center gap-1 text-[10px] font-bold shadow-sm animate-pulse"
                    : "text-stone-400 hover:text-rose-600 bg-stone-100 hover:bg-rose-50 p-1.5 rounded-xl transition-colors border border-stone-200/80"
                }
                title={confirmDelete ? "انقر مجدداً لتأكيد الحذف" : "حذف المنشور"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmDelete && <span>تأكيد الحذف؟</span>}
              </button>

              {!isSponsored && onOpenPromote && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPromote(post);
                  }}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-xl border border-orange-200 transition-colors hidden sm:block"
                  title="تمويل هذا الطبق"
                >
                  تمويل ⚡
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Image or Video View with Double Tap Heart Overlay */}
      <div
        onClick={handleOpenDetail}
        onDoubleClick={handleImageDoubleClick}
        className="relative h-60 w-full overflow-hidden bg-stone-900 cursor-pointer group/img select-none"
      >
        {post.video_url || post.is_reel ? (
          <video
            src={post.video_url}
            poster={post.images[0]}
            muted
            loop
            autoPlay
            playsInline
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
          />
        ) : (
          <img
            src={post.images[activeImageIdx] || post.images[0]}
            alt={post.title}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
          />
        )}

        {/* Reel badge indicator */}
        {(post.is_reel || post.video_url) && (
          <div className="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md">
            <Film className="w-3 h-3 text-amber-300" />
            <span>ريلز {post.video_duration_secs ? `${post.video_duration_secs}ث` : '60ث'} 🎬</span>
          </div>
        )}

        {/* Big Heart Animation on Double Tap */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1.3 }}
              exit={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Pill Tag & Affiliate Badge */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          <span className="bg-stone-900/80 text-white backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-md">
            {post.category}
          </span>

          {post.affiliate_commission_percent && post.affiliate_commission_percent > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenShareEarn) onOpenShareEarn(post);
                else handleShare(e);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md border border-amber-300/80 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <span>شارك واكسب {post.affiliate_commission_percent}% 🔗</span>
            </button>
          ) : null}

          {post.is_purchasable && post.stock_quantity > 0 && post.stock_quantity <= 5 && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-400 shadow-md flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>متبقي {post.stock_quantity} فقط!</span>
            </span>
          )}
        </div>

        {/* Price Pill */}
        <div className="absolute top-3 right-3 z-10">
          {post.is_purchasable && post.price !== null ? (
            <span className="bg-orange-600 text-white backdrop-blur-md text-xs font-black px-3 py-1.5 rounded-2xl shadow-lg border border-orange-400/30">
              {post.price} د.ل {post.unit_name ? `/ ${post.unit_name}` : ''}
            </span>
          ) : (
            <span className="bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-2xl shadow-lg flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" />
              <span>قبول هدايا فقط</span>
            </span>
          )}
        </div>

        {/* Image Arrows if multiple */}
        {post.images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : post.images.length - 1));
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIdx((prev) => (prev < post.images.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Image Dots if multiple */}
        {post.images.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 z-10">
            {post.images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeImageIdx === idx ? 'bg-white w-4' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div onClick={handleOpenDetail} className="cursor-pointer space-y-1">
          <h3 className="font-extrabold text-sm text-stone-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-normal">
            {post.description}
          </p>
        </div>

        {/* Interactions Row & Gifts */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-stone-600 text-xs font-bold">
            {/* Animated Like Button */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 1.3, rotate: -10 }}
                onClick={handleLikeClick}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl transition-all ${
                  isLiked
                    ? 'text-rose-600 bg-rose-50 border border-rose-200'
                    : 'hover:text-stone-900 hover:bg-stone-50 border border-transparent'
                }`}
              >
                <motion.div animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}>
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isLiked ? 'fill-rose-600 text-rose-600' : ''
                    }`}
                  />
                </motion.div>
                <span>{post.likes_count}</span>
              </motion.button>

              {/* Burst Heart Particles */}
              {burstParticles.map((pt) => (
                <motion.div
                  key={pt.id}
                  initial={{ opacity: 1, y: 0, x: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: pt.y, x: pt.x, scale: 1.2 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute top-0 left-3 pointer-events-none z-20 text-rose-500"
                >
                  <Heart className="w-3 h-3 fill-rose-500" />
                </motion.div>
              ))}
            </div>

            {/* Comments Button */}
            <button
              onClick={() => onOpenDetail(post)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-stone-500" />
              <span>{post.comments_count}</span>
            </button>

            {post.gifts_total > 0 && (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 text-[10px]">
                <Gift className="w-3 h-3 text-amber-600" />
                <span>{post.gifts_total} د.ل</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Bookmark button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(post.id);
                triggerToast(isBookmarked ? 'تم إزالة الطبق من المحفوظات' : 'تم حفظ الطبق في المحفوظات 🔖');
              }}
              className={`p-1.5 rounded-xl transition-all ${
                isBookmarked
                  ? 'text-amber-600 bg-amber-50 border border-amber-200'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
              }`}
              title={isBookmarked ? 'محفوظ في المحفوظات' : 'حفظ الطبق'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-600' : ''}`} />
            </button>

            {/* Share button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenShareEarn) onOpenShareEarn(post);
                else {
                  handleShare(e);
                  triggerToast('تم نسخ رابط الطبق بنجاح 🔗');
                }
              }}
              className="text-stone-500 hover:text-amber-600 transition-colors p-1.5 rounded-lg hover:bg-amber-50 flex items-center gap-1 text-[11px] font-extrabold"
              title="مشاركة المنشور"
            >
              <Share2 className="w-4 h-4 text-amber-600" />
              {post.affiliate_commission_percent && post.affiliate_commission_percent > 0 && (
                <span className="text-amber-700 hidden sm:inline">اكسب {post.affiliate_commission_percent}%</span>
              )}
            </button>

            {/* Report button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReportModal(true);
              }}
              className="text-stone-400 hover:text-rose-600 p-1.5 rounded-xl transition-colors hover:bg-rose-50"
              title="الإبلاغ عن المنشور"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-3 flex items-center gap-2">
          {post.is_purchasable && post.price !== null ? (
            <button
              onClick={handleOpenOrder}
              disabled={post.stock_quantity <= 0}
              className={`flex-1 text-xs font-extrabold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 ${
                post.stock_quantity > 0
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{post.stock_quantity > 0 ? 'طلب الطبق الآن 🛍️' : 'نفذت الكمية'}</span>
            </button>
          ) : null}

          <button
            onClick={() => onOpenGift(post)}
            className={`text-xs font-extrabold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all border ${
              post.is_purchasable
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/80'
                : 'flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-transparent shadow-xs'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>إهداء 🎁</span>
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">الإبلاغ عن منشور</h3>
                  <p className="text-[10px] text-stone-500">منشور: {post.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">سبب البلاغ</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 font-bold outline-none"
                >
                  <option value="صورة غير حقيقية أو مضللة">صورة غير حقيقية أو مضللة</option>
                  <option value="أسعار غير مطابقة أو مبالغ فيها">أسعار غير مطابقة أو مبالغ فيها</option>
                  <option value="محتوى غير لائق أو مخالف">محتوى غير لائق أو مخالف للمبادئ</option>
                  <option value="احتيال أو حساب وهمي">احتيال أو حساب وهمي</option>
                  <option value="سبب آخر">سبب آخر</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">تفاصيل إضافية (اختياري)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="اكتب توضيحاً بسيباً لمساعدة إدارة المنصة..."
                  rows={3}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-200"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reportContent('post', post.id, reportReason, reportDetails);
                    setShowReportModal(false);
                    setReportDetails('');
                    triggerToast('تم تقديم البلاغ بنجاح وسيتلقاه المشرفون 🛡️');
                  }}
                  className="flex-1 py-2.5 bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-rose-700"
                >
                  إرسال البلاغ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
