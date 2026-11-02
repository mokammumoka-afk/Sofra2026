'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Post } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { HomeFeed } from '@/components/HomeFeed';
import { ExploreFeed } from '@/components/ExploreFeed';
import { ReelsView } from '@/components/ReelsView';
import { ChefProfileView } from '@/components/ChefProfileView';
import { MyOrdersView } from '@/components/MyOrdersView';
import { SettingsView } from '@/components/SettingsView';
import { AdminDashboard } from '@/components/AdminDashboard';
import { PostDetailModal } from '@/components/PostDetailModal';
import { OrderModal } from '@/components/OrderModal';
import { GiftModal } from '@/components/GiftModal';
import { WalletModal } from '@/components/WalletModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { BecomeChefModal } from '@/components/BecomeChefModal';
import { AuthModal } from '@/components/AuthModal';
import { MessengerModal } from '@/components/MessengerModal';
import { MessagesView } from '@/components/MessagesView';
import { WalletView } from '@/components/WalletView';
import { CreatePostView } from '@/components/CreatePostView';
import { PromoteCampaignView } from '@/components/PromoteCampaignView';
import { DisputeModal } from '@/components/DisputeModal';
import { AdminDisputesModal } from '@/components/AdminDisputesModal';
import { GiftsStoreView } from '@/components/GiftsStoreView';
import { ShareEarnModal } from '@/components/ShareEarnModal';
import { NotificationCenterModal } from '@/components/NotificationCenterModal';
import { RealtimeOrderNotificationBanner } from '@/components/RealtimeOrderNotificationBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Modals state
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [orderPost, setOrderPost] = useState<Post | null>(null);
  const [giftPost, setGiftPost] = useState<Post | null>(null);
  const [promotePost, setPromotePost] = useState<Post | null>(null);
  const [shareEarnPost, setShareEarnPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showBecomeChefModal, setShowBecomeChefModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Messenger & Dispute state
  const [showMessengerModal, setShowMessengerModal] = useState(false);
  const [messengerTargetUserId, setMessengerTargetUserId] = useState<string | undefined>(undefined);
  const [messengerTargetOrderId, setMessengerTargetOrderId] = useState<string | undefined>(undefined);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);

  const [showAdminDisputesModal, setShowAdminDisputesModal] = useState(false);

  const handleOpenMessenger = (targetUserId?: string, targetOrderId?: string) => {
    setMessengerTargetUserId(targetUserId);
    setMessengerTargetOrderId(targetOrderId);
    setActiveTab('messages');
  };

  const handleOpenDispute = (orderId: string) => {
    setDisputeOrderId(orderId);
    setShowDisputeModal(true);
  };

  const handleOpenPromote = (post: Post | null) => {
    setPromotePost(post);
    setActiveTab('promote');
  };

  return (
    <div className="min-h-screen bg-[#f4f0e8] font-cairo flex flex-col items-center w-full overflow-x-hidden">
      {/* Main App Canvas */}
      <div className="w-full max-w-5xl mx-auto bg-[#faf7f2] min-h-screen shadow-md flex flex-col relative">
        {/* Navigation Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openWalletModal={() => setActiveTab('wallet')}
          openCreatePostModal={() => setActiveTab('create-post')}
          openBecomeChefModal={() => setShowBecomeChefModal(true)}
          openAuthModal={() => setShowAuthModal(true)}
          openMessengerModal={() => setActiveTab('messages')}
          openAdminDisputesModal={() => setShowAdminDisputesModal(true)}
          openNotificationCenterModal={() => setShowNotificationCenter(true)}
          onOpenGiftsStore={() => setActiveTab('gifts-store')}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Main Content Area */}
        <ErrorBoundary>
          <main suppressHydrationWarning className="flex-1 w-full mx-auto px-3 sm:px-6 py-4 pb-8">
            {activeTab === 'home' && (
              <HomeFeed
                onOpenDetail={(post) => setDetailPost(post)}
                onOpenOrder={(post) => setOrderPost(post)}
                onOpenGift={(post) => setGiftPost(post)}
                onOpenPromote={(post) => handleOpenPromote(post)}
                onOpenShareEarn={(post) => setShareEarnPost(post)}
                onEditPost={(post) => setEditingPost(post)}
                onNavigateToChefs={() => setActiveTab('chefs')}
                onNavigateToExplore={() => setActiveTab('explore')}
                onNavigateToReels={() => setActiveTab('reels')}
              />
            )}

            {activeTab === 'reels' && (
              <ReelsView
                onOpenOrder={(post) => setOrderPost(post)}
                onOpenGift={(post) => setGiftPost(post)}
                onOpenDetail={(post) => setDetailPost(post)}
                onOpenShareEarn={(post) => setShareEarnPost(post)}
                onOpenCreateReel={() => setShowCreatePostModal(true)}
              />
            )}

            {activeTab === 'explore' && (
              <ExploreFeed
                onOpenDetail={(post) => setDetailPost(post)}
                onOpenOrder={(post) => setOrderPost(post)}
                onOpenGift={(post) => setGiftPost(post)}
                onOpenPromote={(post) => handleOpenPromote(post)}
                onOpenShareEarn={(post) => setShareEarnPost(post)}
                onEditPost={(post) => setEditingPost(post)}
                searchQuery={searchQuery}
              />
            )}

            {activeTab === 'chefs' && (
              <ChefProfileView
                onOpenDetail={(post) => setDetailPost(post)}
                onOpenOrder={(post) => setOrderPost(post)}
                onOpenGift={(post) => setGiftPost(post)}
                onOpenPromote={(post) => handleOpenPromote(post)}
                onOpenShareEarn={(post) => setShareEarnPost(post)}
                onEditPost={(post) => setEditingPost(post)}
                openMessengerModal={(userId) => handleOpenMessenger(userId)}
              />
            )}

            {activeTab === 'orders' && (
              <MyOrdersView
                openMessengerForOrder={(userId, orderId) => handleOpenMessenger(userId, orderId)}
                openDisputeModalForOrder={(orderId) => handleOpenDispute(orderId)}
              />
            )}

            {activeTab === 'messages' && (
              <MessagesView
                targetUserId={messengerTargetUserId}
                targetOrderId={messengerTargetOrderId}
                onSelectOrder={(orderId) => setActiveTab('orders')}
              />
            )}

            {activeTab === 'wallet' && (
              <WalletView
                onBackToExplore={() => setActiveTab('explore')}
                onOpenGiftsStore={() => setActiveTab('gifts-store')}
              />
            )}

            {activeTab === 'gifts-store' && (
              <GiftsStoreView
                onBack={() => setActiveTab('explore')}
                onOpenWallet={() => setActiveTab('wallet')}
              />
            )}

            {activeTab === 'create-post' && (
              <CreatePostView
                onPublished={() => setActiveTab('explore')}
                onCancel={() => setActiveTab('explore')}
              />
            )}

            {activeTab === 'promote' && (
              <PromoteCampaignView
                initialPost={promotePost}
                onBack={() => {
                  setPromotePost(null);
                  setActiveTab('explore');
                }}
                onSuccess={() => {
                  setPromotePost(null);
                  setActiveTab('explore');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                onOpenDetail={(post) => setDetailPost(post)}
                onOpenOrder={(post) => setOrderPost(post)}
                onOpenGift={(post) => setGiftPost(post)}
                onOpenPromote={(post) => handleOpenPromote(post)}
                onOpenCreatePost={() => setActiveTab('create-post')}
                onEditPost={(post) => setEditingPost(post)}
                openWalletModal={() => setActiveTab('wallet')}
                setActiveTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'admin' && <AdminDashboard />}
          </main>
        </ErrorBoundary>
      </div>

      {/* Active Modals */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
        />
      )}

      {detailPost && (
        <PostDetailModal
          post={detailPost}
          onClose={() => setDetailPost(null)}
          onOpenOrder={(p) => setOrderPost(p)}
          onOpenGift={(p) => setGiftPost(p)}
          onOpenShareEarn={(p) => setShareEarnPost(p)}
          onEditPost={(p) => setEditingPost(p)}
        />
      )}

      {orderPost && (
        <OrderModal
          key={orderPost.id}
          post={orderPost}
          onClose={() => setOrderPost(null)}
          onSuccessOrder={() => setActiveTab('orders')}
          openWalletModal={() => setActiveTab('wallet')}
        />
      )}

      {giftPost && (
        <GiftModal
          post={giftPost}
          onClose={() => setGiftPost(null)}
          onOpenStore={() => setActiveTab('gifts-store')}
        />
      )}

      {shareEarnPost && (
        <ShareEarnModal
          post={shareEarnPost}
          onClose={() => setShareEarnPost(null)}
          onOpenWallet={() => setActiveTab('wallet')}
        />
      )}

      {showWalletModal && (
        <WalletModal onClose={() => setShowWalletModal(false)} />
      )}

      {showCreatePostModal && (
        <CreatePostModal onClose={() => setShowCreatePostModal(false)} />
      )}

      {editingPost && (
        <CreatePostModal initialPost={editingPost} onClose={() => setEditingPost(null)} />
      )}

      {showBecomeChefModal && (
        <BecomeChefModal onClose={() => setShowBecomeChefModal(false)} />
      )}

      {/* In-App Messenger Modal */}
      <MessengerModal
        isOpen={showMessengerModal}
        onClose={() => setShowMessengerModal(false)}
        targetUserId={messengerTargetUserId}
        targetOrderId={messengerTargetOrderId}
      />

      {/* Dispute Modal */}
      {showDisputeModal && disputeOrderId && (
        <DisputeModal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            setDisputeOrderId(null);
          }}
          orderId={disputeOrderId}
        />
      )}

      {/* Admin Disputes Escrow Modal */}
      <AdminDisputesModal
        isOpen={showAdminDisputesModal}
        onClose={() => setShowAdminDisputesModal(false)}
        openMessengerForOrder={(userId, orderId) => {
          setShowAdminDisputesModal(false);
          handleOpenMessenger(userId, orderId);
        }}
      />

      {/* Real-time Order Status Notification Banner & Notification Center (rendered client-side after hydration) */}
      {isMounted && (
        <>
          <RealtimeOrderNotificationBanner
            onNavigateToOrders={() => setActiveTab('orders')}
            onNavigateToLiveMap={() => setActiveTab('admin')}
          />

          <NotificationCenterModal
            isOpen={showNotificationCenter}
            onClose={() => setShowNotificationCenter(false)}
            onNavigateToOrders={() => setActiveTab('orders')}
            onNavigateToLiveMap={() => setActiveTab('admin')}
            onNavigateToWallet={() => setActiveTab('wallet')}
          />
        </>
      )}

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}
