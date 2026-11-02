'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
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
  ArrowRight,
  Phone,
  Utensils,
  ShoppingBag,
  Paperclip,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';

interface MessagesViewProps {
  targetUserId?: string;
  targetOrderId?: string;
  onSelectOrder?: (orderId: string) => void;
}

const EMOJI_LIST = ['🍲', '🚗', '👍', '🙏', '❤️', '👨‍🍳', '📦', '⏱️', '😋', '🔥', '✨', '👏', '📍', '💳', '🎉'];

const PRESET_QUICK_REPLIES = [
  'هل الوجبة جاهزة للتسليم؟ 🍲',
  'أين موقع الاستلام بالتحديد؟ 📍',
  'تم تحويل الدفع عبر محفظة DPAY 💳',
  'شكراً جزيلاً تسلم الأيادي! 😋',
  'متى يصل سائق التوصيل؟ 🚗',
  'ممكن زيادة شطة حرارات؟ 🌶️',
];

export const MessagesView: React.FC<MessagesViewProps> = ({
  targetUserId,
  targetOrderId,
  onSelectOrder,
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

  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    if (targetUserId) {
      const conv = getOrCreateConversation(targetUserId, targetOrderId);
      if (conv) return conv.id;
    }
    return conversations.length > 0 ? conversations[0].id : null;
  });
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevTarget, setPrevTarget] = useState({ targetUserId, targetOrderId });
  if (
    targetUserId !== prevTarget.targetUserId ||
    targetOrderId !== prevTarget.targetOrderId
  ) {
    setPrevTarget({ targetUserId, targetOrderId });
    if (targetUserId) {
      const conv = getOrCreateConversation(targetUserId, targetOrderId);
      if (conv) {
        setActiveConvId(conv.id);
      }
    }
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const activeMessages = activeConvId
    ? messages.filter((m) => m.conversation_id === activeConvId)
    : [];

  // Mark conversation read when activeConvId changes or new message arrives
  useEffect(() => {
    if (activeConvId) {
      markConversationRead(activeConvId);
    }
  }, [activeConvId, messages.length]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeConvId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConvId, activeMessages.length]);

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

  const filteredConvs = React.useMemo(() => {
    const seenPartnerKeys = new Set<string>();
    const list: typeof conversations = [];

    // Sort by latest message time
    const sorted = [...conversations].sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    for (const c of sorted) {
      const partnerId = c.user_a_id === currentUser.id ? c.user_b_id : c.user_a_id;
      if (partnerId === currentUser.id) continue; // skip self

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

  const handleSend = (textOverride?: string) => {
    const textToSendVal = textOverride !== undefined ? textOverride : inputText;
    if ((!textToSendVal.trim() && !imagePreviewUrl) || !activeConvId) return;

    let textToSend = textToSendVal.trim();
    let messageType: 'text' | 'image' = 'text';

    if (imagePreviewUrl) {
      messageType = 'image';
      textToSend = imagePreviewUrl;
    }

    try {
      sendMessage(activeConvId, textToSend, messageType, activeConv?.order_id);
      setInputText('');
      setImagePreviewUrl(null);
      setShowEmojiPicker(false);
    } catch (err) {
      console.warn('Message send prevented by security policy:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreviewUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="w-full space-y-4 pb-28 md:pb-12 animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Main Messages Workspace */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-lg h-[calc(100vh-140px)] min-h-[480px] max-h-[820px] flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-l border-stone-200 flex flex-col h-full min-h-0 bg-stone-50/70 ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-stone-900 text-base">المحادثات</h2>
                <p className="text-[10px] text-stone-500 font-bold">تواصل مباشر مع الشيفات والسائقين</p>
              </div>
            </div>
            <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
              {conversations.length} محادثة
            </span>
          </div>

          {/* Search Header */}
          <div className="p-3 border-b border-stone-200/80 bg-stone-100/50">
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث باسم الشيف أو الرسالة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white focus:bg-white border border-stone-200 focus:border-orange-500 text-xs pr-9 pl-3 py-2.5 rounded-2xl outline-none transition-colors font-medium shadow-2xs"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
            </div>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2">
            {filteredConvs.length === 0 ? (
              <div className="text-center py-16 space-y-3 px-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-stone-700">لا توجد محادثات حالياً</div>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                  يمكنك مراسلة أي شيف مباشرة من صفحة أطباقه أو من قائمة طلباتك.
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const partnerName = conv.user_a_id === currentUser.id ? conv.user_b_name : conv.user_a_name;
                const partnerAvatar = conv.user_a_id === currentUser.id ? conv.user_b_avatar : conv.user_a_avatar;
                const isSelected = conv.id === activeConvId;

                const unreadForConv = messages.filter(
                  (m) => m.conversation_id === conv.id && !m.is_read && m.sender_id !== currentUser.id
                ).length;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full p-3 rounded-2xl text-right transition-all cursor-pointer flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                        : 'hover:bg-white text-stone-800'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={partnerAvatar || 'https://picsum.photos/seed/chef/200/200'}
                        alt={partnerName}
                        className="w-12 h-12 rounded-2xl object-cover border border-stone-200/80 shadow-2xs"
                      />
                      <span className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 left-0" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-black text-xs truncate ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                          {partnerName}
                        </span>
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-orange-100' : 'text-stone-400'}`}>
                          {new Date(conv.last_message_at).toLocaleTimeString('ar-LY', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[11px] truncate max-w-[160px] font-medium ${isSelected ? 'text-orange-100' : 'text-stone-500'}`}>
                          {conv.last_message_content || 'محادثة جديدة'}
                        </p>
                        {unreadForConv > 0 && (
                          <span className="w-5 h-5 bg-orange-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shrink-0 shadow-xs border border-white">
                            {unreadForConv}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Room */}
        <div className={`flex-1 flex flex-col h-full min-h-0 bg-stone-50/40 ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Chat Top Header */}
              <div className="p-3.5 sm:p-4 bg-white border-b border-stone-200 flex items-center justify-between shadow-2xs z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button to list */}
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors shrink-0"
                    title="الرجوع إلى القائمة"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    <img
                      src={otherUserAvatar || 'https://picsum.photos/seed/chef/200/200'}
                      alt={otherUserName}
                      className="w-11 h-11 rounded-2xl object-cover border border-stone-200"
                    />
                    <span className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 left-0" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-black text-stone-900 text-sm sm:text-base truncate">{otherUserName}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>متصل الآن • رد سريع ⚡</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {relatedOrder && (
                    <button
                      onClick={() => onSelectOrder?.(relatedOrder.id)}
                      className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-2xl transition-colors flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                      <span className="hidden sm:inline">طلب #{relatedOrder.id.slice(0, 8)}</span>
                      <span className="sm:hidden">الطلب</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 min-h-0">
                {activeMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-3xl text-xs space-y-1 shadow-xs ${
                          isMe
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-br-none'
                            : 'bg-white text-stone-900 border border-stone-200/90 rounded-bl-none'
                        }`}
                      >
                        {msg.message_type === 'image' ? (
                          <img
                            src={msg.content}
                            alt="صورة مرسلة"
                            className="rounded-2xl max-w-full max-h-60 object-cover shadow-xs border border-white/20"
                          />
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap font-medium text-xs sm:text-sm">
                            {msg.content}
                          </p>
                        )}

                        <div
                          className={`flex items-center justify-end gap-1 text-[9px] font-bold ${
                            isMe ? 'text-orange-100' : 'text-stone-400'
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
                              <CheckCheck className="w-3.5 h-3.5 text-amber-200" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-orange-200" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips Bar */}
              <div className="px-3 py-2 bg-stone-100/90 border-t border-stone-200/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
                {PRESET_QUICK_REPLIES.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(reply)}
                    className="bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-stone-700 hover:text-orange-800 text-[11px] font-extrabold px-3 py-1.5 rounded-full shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Image Preview Box if attached */}
              {imagePreviewUrl && (
                <div className="p-2.5 bg-orange-50 border-t border-orange-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={imagePreviewUrl} alt="معاينة" className="w-12 h-12 rounded-xl object-cover border border-orange-300 shadow-2xs" />
                    <span className="text-xs font-extrabold text-orange-900">صورة مرفقة جاهزة للإرسال 🖼️</span>
                  </div>
                  <button
                    onClick={() => setImagePreviewUrl(null)}
                    className="p-1.5 text-stone-500 hover:text-rose-600 bg-white rounded-full border border-stone-200 shadow-2xs cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 overflow-x-auto">
                  {EMOJI_LIST.map((emo) => (
                    <button
                      key={emo}
                      onClick={() => addEmoji(emo)}
                      className="text-xl hover:scale-125 transition-transform p-1.5 cursor-pointer rounded-xl hover:bg-stone-100"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input Bar Form - Fixed Send Button Layout */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0 z-20"
              >
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-colors cursor-pointer shrink-0"
                  title="إضافة إيموجي"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-colors cursor-pointer shrink-0"
                  title="رفع صورة من الجهاز"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const foodImages = [
                      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
                    ];
                    setImagePreviewUrl(foodImages[Math.floor(Math.random() * foodImages.length)]);
                  }}
                  className="p-2.5 text-stone-400 hover:text-orange-600 hover:bg-stone-100 rounded-2xl transition-colors cursor-pointer shrink-0 hidden sm:block"
                  title="صورة طبق عشوائية"
                >
                  <Utensils className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder="اكتب رسالتك للشيف هنا..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-stone-100/90 focus:bg-white border border-stone-200 focus:border-orange-500 text-xs sm:text-sm py-2.5 px-3.5 rounded-2xl outline-none font-medium text-stone-900 transition-all shadow-2xs"
                />

                {/* Prominent High-Contrast Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() && !imagePreviewUrl}
                  className="px-4 py-2.5 sm:py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition-all shrink-0 cursor-pointer min-w-[72px] sm:min-w-[90px]"
                >
                  <span>إرسال</span>
                  <Send className="w-4 h-4 rtl:-scale-x-100 shrink-0" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center shadow-inner">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h3 className="font-extrabold text-stone-900 text-base">اختر محادثة لبدء التواصل</h3>
              <p className="text-xs text-stone-500 max-w-sm">
                تواصل مباشرة مع الشيفات المحليين، استفسر عن مكونات الأطباق، أو اتفق على تفاصيل التوصيل بكل سهولة.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

