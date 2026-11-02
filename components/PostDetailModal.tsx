'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post } from '@/lib/types';
import { useStore } from '@/lib/store';
import {
  X,
  Heart,
  MessageCircle,
  Gift,
  ShoppingBag,
  MapPin,
  Clock,
  CheckCircle2,
  Send,
  Smile,
  Reply,
  Sparkles,
  ChefHat,
  ThumbsUp,
  Edit3,
  Trash2,
  Share2,
  Bookmark,
  Flag,
  Film,
} from 'lucide-react';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onOpenOrder: (post: Post) => void;
  onOpenGift: (post: Post) => void;
  onOpenShareEarn?: (post: Post) => void;
  onEditPost?: (post: Post) => void;
}

const QUICK_EMOJIS = ['😍', '😋', '🔥', '👏', '❤️', '🇱🇾', '👨‍🍳', '👌'];

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onOpenOrder,
  onOpenGift,
  onOpenShareEarn,
  onEditPost,
}) => {
  const { comments, addComment, toggleCommentLike, toggleLike, userLikes, currentUser, deletePost, userBookmarks, toggleBookmark, reportContent } = useStore();
  const [commentInput, setCommentInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('صورة غير حقيقية أو مضللة');
  const [reportDetails, setReportDetails] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [burstParticles, setBurstParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  if (!post) return null;

  const isOwner = currentUser.id === post.chef_id;
  const isOwnerOrAdmin = isOwner || currentUser.role === 'admin';

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3500);
      return;
    }
    const ok = deletePost(post.id);
    if (ok) {
      onClose();
    }
  };

  const postComments = comments[post.id] || [];
  const isLiked = !!userLikes[post.id];

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  const handleQuickEmojiClick = (emoji: string) => {
    setCommentInput((prev) => prev + (prev ? ' ' : '') + emoji);
  };

  const handleLikeClick = () => {
    toggleLike(post.id);
    if (!isLiked) {
      const newParticles = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 50,
        y: -Math.random() * 50 - 15,
      }));
      setBurstParticles(newParticles);
      setTimeout(() => setBurstParticles([]), 1000);
    }
  };

  const handleImageDoubleClick = () => {
    if (!isLiked) {
      toggleLike(post.id);
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
  };

  const handleReplyToUser = (userName: string) => {
    setCommentInput(`@${userName} `);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden border border-orange-100 shadow-2xl flex flex-col md:flex-row max-h-[90vh] my-auto">
        {/* Left Side (Image Gallery & Double Tap Heart) */}
        <div className="md:w-1/2 bg-stone-950 relative flex flex-col justify-between p-4 min-h-[300px] md:min-h-[500px]">
          <button
            onClick={onClose}
            className="md:hidden absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            onDoubleClick={handleImageDoubleClick}
            className="relative flex-1 flex items-center justify-center overflow-hidden rounded-2xl cursor-pointer select-none group"
          >
            {post.video_url || post.is_reel ? (
              <video
                src={post.video_url}
                poster={post.images[0]}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover max-h-[450px]"
              />
            ) : (
              <img
                src={post.images[activeImgIdx] || post.images[0]}
                alt={post.title}
                className="w-full h-full object-cover max-h-[450px]"
              />
            )}

            {/* Reel indicator overlay */}
            {(post.is_reel || post.video_url) && (
              <div className="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>فيديو ريلز قصير (60ث)</span>
              </div>
            )}

            {/* Heart Burst on Double Tap */}
            <AnimatePresence>
              {showHeartBurst && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1.4 }}
                  exit={{ opacity: 0, scale: 1.9 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                >
                  <Heart className="w-28 h-28 text-rose-500 fill-rose-500 drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Price Badge Overlay */}
            <div className="absolute top-3 right-3 bg-stone-900/90 text-white text-sm font-black px-3.5 py-1.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
              {post.is_purchasable && post.price !== null
                ? `${post.price} د.ل ${post.unit_name ? `/ ${post.unit_name}` : ''}`
                : 'هدايا فقط 🎁'}
            </div>
          </div>

          {/* Thumbnail Dots/Gallery */}
          {post.images.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {post.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImgIdx === idx ? 'border-orange-500 scale-105' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side (Content & Interactive Comments) */}
        <div className="md:w-1/2 p-5 flex flex-col justify-between overflow-y-auto max-h-[580px]">
          {/* Header */}
          <div>
            <div className="hidden md:flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>تفاصيل الطبق والتعليقات</span>
              </span>
              
              <div className="flex items-center gap-1.5">
                {isOwnerOrAdmin && (
                  <>
                    {onEditPost && (
                      <button
                        onClick={() => {
                          onClose();
                          onEditPost(post);
                        }}
                        className="p-1.5 rounded-xl bg-stone-100 hover:bg-orange-50 text-stone-600 hover:text-orange-600 transition-colors border border-stone-200/80 flex items-center gap-1 text-[11px] font-bold"
                        title="تعديل الطبق"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">تعديل</span>
                      </button>
                    )}

                    <button
                      onClick={handleDelete}
                      className={
                        confirmDelete
                          ? "p-1.5 rounded-xl bg-rose-600 text-white transition-all border border-rose-700 flex items-center gap-1 text-[11px] font-bold animate-pulse"
                          : "p-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 transition-colors border border-stone-200/80 flex items-center gap-1 text-[11px] font-bold"
                      }
                      title={confirmDelete ? "انقر مجدداً لتأكيد الحذف" : "حذف الطبق"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{confirmDelete ? "تأكيد؟" : "حذف"}</span>
                    </button>
                  </>
                )}

                {/* Bookmark button */}
                <button
                  onClick={() => {
                    toggleBookmark(post.id);
                    triggerToast(userBookmarks[post.id] ? 'تم إزالة الطبق من المحفوظات' : 'تم حفظ الطبق في المحفوظات 🔖');
                  }}
                  className={`p-1.5 rounded-xl transition-colors border flex items-center gap-1 text-[11px] font-bold ${
                    userBookmarks[post.id]
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600 border-stone-200/80'
                  }`}
                  title={userBookmarks[post.id] ? 'محفوظ في المحفوظات' : 'حفظ الطبق'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${userBookmarks[post.id] ? 'fill-amber-700' : ''}`} />
                  <span className="hidden sm:inline">{userBookmarks[post.id] ? 'محفوظ' : 'حفظ'}</span>
                </button>

                <button
                  onClick={() => {
                    if (onOpenShareEarn) {
                      onClose();
                      onOpenShareEarn(post);
                    } else {
                      triggerToast('تم نسخ رابط الطبق بنجاح 🔗');
                    }
                  }}
                  className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors border border-amber-200/80 flex items-center gap-1 text-[11px] font-bold"
                  title="مشاركة الطبق"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>مشاركة</span>
                </button>

                {/* Report button */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 transition-colors border border-stone-200/80 flex items-center gap-1 text-[11px] font-bold"
                  title="الإبلاغ عن المنشور"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chef info card */}
            <div className="flex items-center gap-3 my-4 p-3 bg-orange-50/60 rounded-2xl border border-orange-100">
              <img
                src={post.chef_avatar}
                alt={post.chef_name}
                className="w-11 h-11 rounded-2xl object-cover border border-stone-200"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-stone-900 truncate">
                    {post.kitchen_name || post.chef_name}
                  </span>
                  {post.chef_verified && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </div>
                <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5 text-orange-700 font-bold">
                    <MapPin className="w-3 h-3 text-orange-500" />
                    {post.city}
                  </span>
                  <span>•</span>
                  <span>متوفر للتوصيل المباشر</span>
                </div>
              </div>
            </div>

            <h2 className="font-black text-lg text-stone-900 leading-snug">{post.title}</h2>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed font-normal">{post.description}</p>

            {/* Ingredients Tags */}
            {post.ingredients && post.ingredients.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[11px] font-bold text-stone-400 mb-2">المكونات الأساسية:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {post.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="bg-stone-100 text-stone-700 text-[11px] font-medium px-2.5 py-1 rounded-xl"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Stats & Animated Like Row */}
            <div className="flex items-center justify-between my-4 py-2.5 border-y border-stone-100 text-xs font-bold text-stone-600">
              <div className="flex items-center gap-3">
                {/* Like Button */}
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 1.35 }}
                    onClick={handleLikeClick}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                      isLiked
                        ? 'text-rose-600 bg-rose-50 border border-rose-200'
                        : 'hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <motion.div animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}>
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                    </motion.div>
                    <span>{post.likes_count} إعجاب</span>
                  </motion.button>

                  {/* Burst Particles */}
                  {burstParticles.map((pt) => (
                    <motion.div
                      key={pt.id}
                      initial={{ opacity: 1, y: 0, x: 0, scale: 0.8 }}
                      animate={{ opacity: 0, y: pt.y, x: pt.x, scale: 1.3 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute top-0 left-4 pointer-events-none z-20 text-rose-500"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    </motion.div>
                  ))}
                </div>

                <span className="flex items-center gap-1 text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                  <MessageCircle className="w-4 h-4 text-orange-500" />
                  <span>{postComments.length} تعليق</span>
                </span>
              </div>

              {post.gifts_total > 0 && (
                <span className="text-amber-800 font-extrabold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 text-[11px] flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-amber-600" />
                  <span>{post.gifts_total} د.ل هدايا</span>
                </span>
              )}
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {postComments.length === 0 ? (
                <div className="text-center py-6 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <Smile className="w-8 h-8 text-stone-300 mx-auto mb-1.5 animate-bounce" />
                  <p className="text-xs font-bold text-stone-600">
                    لا توجد تعليقات بعد!
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    كن أول من يشجع الشيف ويبدي رأيه في هذا الطبق الشهي! 🍲
                  </p>
                </div>
              ) : (
                postComments.map((c) => {
                  const isPostChef = c.user_id === post.chef_id;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-stone-50/80 hover:bg-stone-50 p-3 rounded-2xl border border-stone-100 flex gap-2.5 items-start transition-all group"
                    >
                      <img
                        src={c.user_avatar}
                        alt={c.user_name}
                        className="w-8 h-8 rounded-full object-cover mt-0.5 ring-2 ring-stone-200"
                      />
                      <div className="flex-1 text-xs min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-stone-900">{c.user_name}</span>
                            {isPostChef && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5">
                                <ChefHat className="w-2.5 h-2.5 text-amber-700" />
                                <span>صاحب الطبق</span>
                              </span>
                            )}
                            {c.is_chef && !isPostChef && (
                              <span className="bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                شيف
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleReplyToUser(c.user_name)}
                            className="text-[10px] text-stone-400 hover:text-orange-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                          >
                            <Reply className="w-3 h-3" />
                            <span>رد</span>
                          </button>
                        </div>

                        <p className="text-stone-800 mt-1 leading-relaxed font-normal">{c.content}</p>

                        {/* Comment Actions: Like Comment & Timestamp */}
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-200/50 text-[10px] text-stone-400 font-medium">
                          <span>الآن</span>

                          <button
                            onClick={() => toggleCommentLike(post.id, c.id)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors ${
                              (c.likes_count || 0) > 0
                                ? 'text-rose-600 font-bold bg-rose-50'
                                : 'hover:text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{c.likes_count || 0}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Actions & Enhanced Comment Form */}
          <div className="pt-3 border-t border-stone-100 mt-3 space-y-2.5">
            {/* Quick Emoji Reaction Toolbar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] font-bold text-stone-400 shrink-0 pl-1">تفاعل سريع:</span>
              {QUICK_EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickEmojiClick(emoji)}
                  className="text-sm p-1.5 hover:bg-stone-100 rounded-xl transition-all active:scale-125 shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendComment} className="flex items-center gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="اكتب تعليقك المشجع للشيف..."
                className="flex-1 bg-stone-100 text-xs px-4 py-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all font-medium text-stone-900"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className={`p-2.5 rounded-2xl transition-all shrink-0 flex items-center justify-center ${
                  commentInput.trim()
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md active:scale-95'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Share & Earn Affiliate Banner */}
            {post.affiliate_commission_percent && post.affiliate_commission_percent > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (onOpenShareEarn) {
                    onClose();
                    onOpenShareEarn(post);
                  }
                }}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-extrabold text-xs py-2.5 px-3 rounded-2xl shadow-md border border-amber-300 flex items-center justify-between transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-stone-950 text-amber-400 rounded-lg text-xs">🔗</span>
                  <span>شارك هذا الطبق واكسب {post.affiliate_commission_percent}% عمولة!</span>
                </div>
                <span className="bg-stone-950 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                  انشر واكسب 💰
                </span>
              </button>
            ) : null}

            <div className="flex items-center gap-2 pt-1">
              {post.is_purchasable && post.price !== null && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenOrder(post);
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-3 px-4 rounded-2xl shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>طلب الآن ({post.price} د.ل)</span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onOpenGift(post);
                }}
                className={`font-bold text-xs py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all border active:scale-95 ${
                  post.is_purchasable
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                    : 'flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>أرسل هدية رقمية 🎁</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

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
