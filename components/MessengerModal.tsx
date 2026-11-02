'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Message, Conversation } from '@/lib/types';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Smile,
  CheckCheck,
  Check,
  Package,
  ShieldAlert,
  Clock,
  X,
  Search,
  User as UserIcon,
  ExternalLink,
  Info,
  ChefHat,
} from 'lucide-react';

interface MessengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetOrderId?: string;
}

const EMOJI_LIST = ['🍲', '🚗', '👍', '🙏', '❤️', '👨‍🍳', '📦', '⏱️', '😋', '🔥', '✨', '👏'];

export const MessengerModal: React.FC<MessengerModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetOrderId,
}) => {
  const {
    currentUser,
    conversations,
    messages,
    getOrCreateConversation,
    sendMessage,
    markConversationRead,
    orders,
  } = useStore();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = activeConvId
    ? messages.filter((m) => m.conversation_id === activeConvId)
    : [];

  const [prevTargetUserId, setPrevTargetUserId] = useState(targetUserId);
  const [prevTargetOrderId, setPrevTargetOrderId] = useState(targetOrderId);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen && (!prevIsOpen || targetUserId !== prevTargetUserId || targetOrderId !== prevTargetOrderId)) {
    setPrevIsOpen(isOpen);
    setPrevTargetUserId(targetUserId);
    setPrevTargetOrderId(targetOrderId);
    if (targetUserId) {
      const conv = getOrCreateConversation(targetUserId, targetOrderId);
      if (conv && conv.id !== activeConvId) {
        setActiveConvId(conv.id);
      }
    } else if (conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  // Mark conversation read when activeConvId changes or new message arrives
  useEffect(() => {
    if (isOpen && activeConvId) {
      markConversationRead(activeConvId);
    }
  }, [isOpen, activeConvId, messages.length]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen && activeConvId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeConvId, activeMessages.length]);

  const filteredConvs = React.useMemo(() => {
    const seenPartnerKeys = new Set<string>();
    const list: typeof conversations = [];

    const sorted = [...conversations].sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    for (const c of sorted) {
      const partnerId = c.user_a_id === currentUser.id ? c.user_b_id : c.user_a_id;
      if (partnerId === currentUser.id) continue;

      const key = `${partnerId}-${c.order_id || 'general'}`;
      if (!seenPartnerKeys.has(key)) {
        seenPartnerKeys.add(key);
        list.push(c);
      }
    }

    return list.filter((c) => {
      const name = (c.user_a_id === currentUser.id ? c.user_b_name : c.user_a_name) || '';
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.last_message_content || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [conversations, currentUser.id, searchQuery]);

  if (!isOpen) return null;

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherUserId = activeConv
    ? activeConv.user_a_id === currentUser.id
      ? activeConv.user_b_id
      : activeConv.user_a_id
    : null;

  const otherUserName = activeConv
    ? activeConv.user_a_id === currentUser.id
      ? activeConv.user_b_name
      : activeConv.user_a_name
    : '';

  const otherUserAvatar = activeConv
    ? activeConv.user_a_id === currentUser.id
      ? activeConv.user_b_avatar
      : activeConv.user_a_avatar
    : '';

  const relatedOrder = activeConv?.order_id
    ? orders.find((o) => o.id === activeConv.order_id)
    : null;

  const handleSend = () => {
    if ((!inputText.trim() && !imagePreviewUrl) || !activeConvId) return;

    let textToSend = inputText.trim();
    let type: 'text' | 'image' = 'text';

    if (imagePreviewUrl) {
      type = 'image';
      textToSend = imagePreviewUrl;
    }

    try {
      sendMessage(activeConvId, textToSend, type, activeConv?.order_id);
      setInputText('');
      setImagePreviewUrl(null);
      setShowEmojiPicker(false);
    } catch (err) {
      console.warn('Message send prevented by security policy:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 transition-all animate-fadeIn">
      <div className="bg-white w-full max-w-4xl h-[92vh] sm:h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-stone-200">
        
        {/* Sidebar: Conversations List */}
        <div className={`w-full md:w-80 lg:w-90 border-b md:border-b-0 md:border-l border-stone-200 flex flex-col h-full min-h-0 bg-stone-50 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-3.5 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="font-extrabold text-stone-900 text-sm sm:text-base">الرسائل والمحادثات</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-2.5 bg-stone-100/80 border-b border-stone-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في المحادثات..."
                className="w-full text-xs pr-9 pl-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>

          {/* Notice Banner */}
          <div className="px-3 py-2 bg-amber-50/80 border-b border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              <strong>حفظ المحادثات:</strong> تُحفظ الرسائل لـ 24 ساعة، وللطعونات المرتبطة بطلب لـ 7 أيام لحفظ حقوقك.
            </p>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                لا توجد محادثات سابقة.
              </div>
            ) : (
              filteredConvs.map((c) => {
                const partnerName = c.user_a_id === currentUser.id ? c.user_b_name : c.user_a_name;
                const partnerAvatar = c.user_a_id === currentUser.id ? c.user_b_avatar : c.user_a_avatar;
                const isSelected = c.id === activeConvId;

                const unreadInConv = messages.filter(
                  (m) => m.conversation_id === c.id && m.sender_id !== currentUser.id && !m.is_read
                ).length;

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConvId(c.id);
                      markConversationRead(c.id);
                    }}
                    className={`w-full p-3 text-right flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-orange-50/90 border-r-4 border-orange-500' : 'hover:bg-white'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={partnerAvatar}
                        alt={partnerName}
                        className="w-11 h-11 rounded-full object-cover border border-stone-200"
                      />
                      <span className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 left-0" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-stone-900 truncate">
                          {partnerName}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(c.last_message_at).toLocaleTimeString('ar-LY', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 truncate font-normal">
                        {c.last_message_content || 'بدء المحادثة'}
                      </p>
                      {c.order_id && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-stone-100 text-[10px] text-stone-600 font-medium mt-1">
                          <Package className="w-3 h-3 text-orange-500" />
                          طلب #{c.order_id}
                        </span>
                      )}
                    </div>

                    {unreadInConv > 0 && (
                      <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {unreadInConv}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Window: Active Chat */}
        <div className={`flex-1 flex flex-col h-full min-h-0 bg-white ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Chat Top Header */}
              <div className="p-3.5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg md:hidden"
                  >
                    ←
                  </button>
                  <img
                    src={otherUserAvatar}
                    alt={otherUserName}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">{otherUserName}</h3>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      متصل الآن عبر مراسلة سفرة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeConv.order_id && (
                    <div className="bg-orange-50 border border-orange-200/80 rounded-xl px-2.5 py-1 text-xs text-orange-800 font-semibold flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-orange-600" />
                      <span>مرتبطة بالطلب #{activeConv.order_id}</span>
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Order Info Drawer Banner if linked */}
              {relatedOrder && (
                <div className="bg-stone-900 text-stone-100 px-4 py-2.5 text-xs flex items-center justify-between border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <img
                      src={relatedOrder.post_image}
                      alt={relatedOrder.post_title}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="truncate max-w-xs sm:max-w-md">
                      <span className="font-bold text-orange-400">{relatedOrder.post_title}</span>
                      <span className="text-stone-400 mx-1.5">•</span>
                      <span>{relatedOrder.total_price} د.ل</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold text-[10px] shrink-0">
                    {relatedOrder.status === 'delivered' ? 'تم التسليم' : 'قيد التنفيذ'}
                  </span>
                </div>
              )}

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/60 min-h-0">
                {activeMessages.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs">
                    <p className="mb-1">مرحباً! يمكنك كتابة استفساراتك للشيف مباشرة هنا 🍲</p>
                    <span className="text-[10px] text-stone-400">
                      الرسائل محمية ومسجلة كدليل لضمان جودة الخدمة وحقوق الطرفين.
                    </span>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {!isMe && (
                          <img
                            src={msg.sender_avatar}
                            alt={msg.sender_name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                          />
                        )}

                        <div
                          className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-3.5 py-2.5 shadow-2xs text-xs sm:text-sm ${
                            isMe
                              ? 'bg-orange-600 text-white rounded-br-xs'
                              : 'bg-white text-stone-900 border border-stone-200/90 rounded-bl-xs'
                          }`}
                        >
                          {msg.message_type === 'image' ? (
                            <img
                              src={msg.content}
                              alt="صورة مرفقة"
                              className="rounded-lg max-h-48 object-cover mb-1 border border-black/10"
                            />
                          ) : (
                            <p className="leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          )}

                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                              isMe ? 'text-orange-200' : 'text-stone-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('ar-LY', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && (
                              msg.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-orange-200" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-orange-300/80" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Quick Picker */}
              {showEmojiPicker && (
                <div className="p-2 bg-stone-100 border-t border-stone-200 flex flex-wrap gap-1.5">
                  {EMOJI_LIST.map((emo) => (
                    <button
                      key={emo}
                      onClick={() => addEmoji(emo)}
                      className="text-lg p-1.5 hover:bg-white rounded-lg transition-transform hover:scale-125"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              )}

              {/* Image Preview if selected */}
              {imagePreviewUrl && (
                <div className="p-2 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={imagePreviewUrl} alt="معاينة" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-xs text-stone-600 font-medium">صورة جاهزة للإرسال</span>
                  </div>
                  <button
                    onClick={() => setImagePreviewUrl(null)}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    إلغاء
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 border-t border-stone-200 bg-white flex items-center gap-2 shrink-0 z-20"
              >
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-stone-500 hover:text-orange-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="إضافة إيموجي"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sampleImages = [
                      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
                    ];
                    setImagePreviewUrl(sampleImages[Math.floor(Math.random() * sampleImages.length)]);
                  }}
                  className="p-2 text-stone-500 hover:text-orange-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="إرفاق صورة"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="اكتب رسالتك للشيف أو المستخدم..."
                  className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 text-stone-900 font-medium"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() && !imagePreviewUrl}
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition-all shrink-0 cursor-pointer min-w-[72px] sm:min-w-[90px]"
                >
                  <span>إرسال</span>
                  <Send className="w-4 h-4 rtl:-scale-x-100 shrink-0" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-orange-500" />
              <p className="text-sm font-semibold text-stone-600">اختر محادثة من القائمة لبدء التراسل</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
