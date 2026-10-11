import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from '../pwa/PWAInstallButton.tsx';
import {
  Compass,
  Home,
  MessageSquare,
  Users,
  Bell,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Shield
} from 'lucide-react';

interface NavbarProps {
  currentView: 'feed' | 'people' | 'communities' | 'chat' | 'notifications' | 'profile' | 'admin';
  setCurrentView: (view: 'feed' | 'people' | 'communities' | 'chat' | 'notifications' | 'profile' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const { user, counts, openLogin, openRegister, logout } = useAuth();

  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar (Strict 3-zone contract) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <button
            onClick={() => setCurrentView('people')}
            className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
          >
            <span className="text-xl">🇳🇬</span>
            <span>NAIJAMATCH</span>
          </button>

          {/* Zone 2: 4–5 Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setCurrentView('people')}
              className={`hover:text-[#008751] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentView === 'people' ? 'border-[#008751] text-[#008751]' : 'border-transparent'
              }`}
            >
              Find Love
            </button>

            <button
              onClick={() => setCurrentView('feed')}
              className={`hover:text-[#008751] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentView === 'feed' ? 'border-[#008751] text-[#008751]' : 'border-transparent'
              }`}
            >
              Feed
            </button>

            <button
              onClick={() => setCurrentView('communities')}
              className={`hover:text-[#008751] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentView === 'communities' ? 'border-[#008751] text-[#008751]' : 'border-transparent'
              }`}
            >
              Circles
            </button>

            <button
              onClick={() => setCurrentView('chat')}
              className={`hover:text-[#008751] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 relative ${
                currentView === 'chat' ? 'border-[#008751] text-[#008751]' : 'border-transparent'
              }`}
            >
              <span>Chat & Rooms</span>
              {counts.unreadMessages > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#008751] text-white text-[10px] font-bold">
                  {counts.unreadMessages}
                </span>
              )}
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`hover:text-[#008751] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1 ${
                  currentView === 'admin' ? 'border-[#008751] text-[#008751]' : 'border-transparent text-emerald-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#008751]" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Zone 3: 1 Primary Action Group */}
          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton />

            {user ? (
              <div className="flex items-center gap-2">
                {/* Notifications trigger */}
                <button
                  onClick={() => setCurrentView('notifications')}
                  className={`p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative ${
                    currentView === 'notifications' ? 'bg-slate-100 text-[#008751]' : ''
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {counts.unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600" />
                  )}
                </button>

                {/* Profile Avatar */}
                <button
                  onClick={() => setCurrentView('profile')}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition"
                  title="My Profile"
                >
                  <img
                    src={user.avatar || '/src/assets/images/avatar_chioma_adebayo_1791742160027.jpg'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <span className="hidden lg:inline text-xs font-bold text-slate-800 max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {/* Log Out */}
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition hidden sm:inline-flex"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={openLogin}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                >
                  Log In
                </button>
                <button
                  onClick={openRegister}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#008751] rounded-xl hover:bg-[#007043] transition shadow-xs whitespace-nowrap"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Natural Thumb Zone) */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
          <div className="grid grid-cols-5 items-center h-14">
            <button
              onClick={() => setCurrentView('feed')}
              className={`flex flex-col items-center justify-center py-1 transition ${
                currentView === 'feed' ? 'text-[#008751]' : 'text-slate-500'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Feed</span>
            </button>

            <button
              onClick={() => setCurrentView('people')}
              className={`flex flex-col items-center justify-center py-1 transition ${
                currentView === 'people' ? 'text-[#008751]' : 'text-slate-500'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Discover</span>
            </button>

            <button
              onClick={() => setCurrentView('communities')}
              className={`flex flex-col items-center justify-center py-1 transition ${
                currentView === 'communities' ? 'text-[#008751]' : 'text-slate-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Circles</span>
            </button>

            <button
              onClick={() => setCurrentView('chat')}
              className={`flex flex-col items-center justify-center py-1 transition relative ${
                currentView === 'chat' ? 'text-[#008751]' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                {counts.unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#008751] text-white text-[9px] font-bold flex items-center justify-center">
                    {counts.unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-0.5">Chat</span>
            </button>

            <button
              onClick={() => setCurrentView('profile')}
              className={`flex flex-col items-center justify-center py-1 transition ${
                currentView === 'profile' ? 'text-[#008751]' : 'text-slate-500'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">Profile</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
