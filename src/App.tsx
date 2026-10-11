/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { WelcomeView } from './components/views/WelcomeView.tsx';
import { FeedView } from './components/views/FeedView.tsx';
import { PeopleView } from './components/views/PeopleView.tsx';
import { CommunitiesView } from './components/views/CommunitiesView.tsx';
import { ChatView } from './components/views/ChatView.tsx';
import { NotificationsView } from './components/views/NotificationsView.tsx';
import { ProfileView } from './components/views/ProfileView.tsx';
import { AdminView } from './components/views/AdminView.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { OfflineIndicator } from './components/pwa/OfflineIndicator.tsx';
import { Mail, ShieldCheck } from 'lucide-react';

type ActiveView = 'feed' | 'people' | 'communities' | 'chat' | 'notifications' | 'profile' | 'admin';

const MainContent: React.FC = () => {
  const { user, loading, openVerify, lastVerificationCode } = useAuth();
  const [currentView, setCurrentView] = useState<ActiveView>('feed');
  const [chatTargetUserId, setChatTargetUserId] = useState<string | null>(null);

  // If user opens URL directly with /admin
  React.useEffect(() => {
    if (window.location.pathname === '/admin' && user?.role === 'admin') {
      setCurrentView('admin');
    }
  }, [user]);

  const handleStartChat = (userId: string) => {
    setChatTargetUserId(userId);
    setCurrentView('chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#008751] text-white text-2xl font-bold flex items-center justify-center shadow-md animate-pulse">
            🇳🇬
          </div>
          <span className="text-xs font-semibold text-slate-500">Loading NaijaMatch 🇳🇬...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Unverified Email Warning Banner */}
      {user && !user.verified && (
        <div className="bg-emerald-800 text-white px-4 py-2 text-xs flex items-center justify-between">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-300" />
              <span>
                Your account email ({user.email}) is pending verification.
              </span>
            </div>
            <button
              onClick={() => openVerify(lastVerificationCode || undefined)}
              className="bg-white text-[#008751] font-bold px-3 py-1 rounded-lg hover:bg-emerald-50 transition shrink-0 shadow-2xs"
            >
              Verify Email Now
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {!user ? (
          <WelcomeView />
        ) : currentView === 'feed' ? (
          <FeedView onNavigateToChat={handleStartChat} />
        ) : currentView === 'people' ? (
          <PeopleView onStartChat={handleStartChat} />
        ) : currentView === 'communities' ? (
          <CommunitiesView />
        ) : currentView === 'chat' ? (
          <ChatView initialPartnerId={chatTargetUserId} />
        ) : currentView === 'notifications' ? (
          <NotificationsView
            onNavigateToChat={handleStartChat}
            onNavigateToFeed={() => setCurrentView('feed')}
          />
        ) : currentView === 'profile' ? (
          <ProfileView onNavigateToChat={handleStartChat} />
        ) : currentView === 'admin' ? (
          <AdminView />
        ) : null}
      </main>

      <AuthModal />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
