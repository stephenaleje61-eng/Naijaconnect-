import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiFetch, NotificationItem } from '../../lib/api.ts';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  ShieldCheck,
  Check,
  CheckCheck
} from 'lucide-react';

export const NotificationsView: React.FC<{
  onNavigateToChat?: (userId: string) => void;
  onNavigateToFeed?: () => void;
}> = ({ onNavigateToChat, onNavigateToFeed }) => {
  const { refreshMe } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const res = await apiFetch<{ notifications: NotificationItem[] }>('/api/notifications');
      setNotifications(res.notifications);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read', { method: 'POST', body: JSON.stringify({}) });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await refreshMe();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'post_like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'post_comment':
        return <MessageCircle className="w-4 h-4 text-[#008751]" />;
      case 'connection_request':
      case 'connection_accepted':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'security_alert':
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-[#008751]" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500">Updates from your Nigerian network</p>
        </div>

        <button
          onClick={markAllRead}
          className="text-xs font-semibold text-[#008751] hover:underline flex items-center gap-1"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="text-3xl">🔔</div>
            <p className="text-xs font-medium">You are all caught up!</p>
            <p className="text-[11px] text-slate-400">New requests, messages, and likes will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start gap-3 transition ${
                !n.isRead ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.actor?.avatar ? (
                  <img
                    src={n.actor.avatar}
                    alt={n.actor.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    {getIcon(n.type)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{n.message}</p>

                {/* Inline Action helper */}
                {n.type === 'new_message' && n.entityId && onNavigateToChat && (
                  <button
                    onClick={() => onNavigateToChat(n.entityId!)}
                    className="mt-2 text-xs font-semibold text-[#008751] hover:underline"
                  >
                    Reply in Chat →
                  </button>
                )}
                {(n.type === 'post_like' || n.type === 'post_comment') && onNavigateToFeed && (
                  <button
                    onClick={onNavigateToFeed}
                    className="mt-2 text-xs font-semibold text-[#008751] hover:underline"
                  >
                    View Post →
                  </button>
                )}
              </div>

              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-[#008751] shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
