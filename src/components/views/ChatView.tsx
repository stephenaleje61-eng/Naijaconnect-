import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiFetch, ConversationItem, MessageItem, UserProfile } from '../../lib/api.ts';
import {
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Circle,
  ArrowLeft,
  Smile,
  ShieldCheck,
  MapPin
} from 'lucide-react';

export const ChatView: React.FC<{ initialPartnerId?: string | null }> = ({ initialPartnerId }) => {
  const { user, refreshMe } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId || null);
  const [activePartner, setActivePartner] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [loadingConv, setLoadingConv] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const NAIJA_EMOJIS = ['🇳🇬', '🤝', '🔥', '❤️', '🙌', '😂', '👏', '✨', '💪', '💯'];

  // Scroll to bottom on messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await apiFetch<{ conversations: ConversationItem[] }>('/api/messages/conversations');
      setConversations(res.conversations);

      // If activePartnerId is set but partner details are missing, find or load
      if (activePartnerId && !activePartner) {
        const found = res.conversations.find(c => c.partnerId === activePartnerId)?.partner;
        if (found) {
          setActivePartner(found);
        } else {
          // fetch user directly
          const uRes = await apiFetch<{ user: UserProfile }>(`/api/people/${activePartnerId}`);
          setActivePartner(uRes.user);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConv(false);
    }
  };

  // Load messages for active partner
  const loadActiveMessages = async (partnerId: string) => {
    try {
      const res = await apiFetch<{ partner: UserProfile; messages: MessageItem[] }>(`/api/messages/${partnerId}`);
      setMessages(res.messages);
      setActivePartner(res.partner);
      // Mark read
      await apiFetch(`/api/messages/read/${partnerId}`, { method: 'POST' });
      await refreshMe();
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [activePartnerId]);

  useEffect(() => {
    if (activePartnerId) {
      loadActiveMessages(activePartnerId);
    }
  }, [activePartnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time polling every 3 seconds for new messages
  useEffect(() => {
    const timer = setInterval(() => {
      loadConversations();
      if (activePartnerId) {
        apiFetch<{ partner: UserProfile; messages: MessageItem[] }>(`/api/messages/${activePartnerId}`)
          .then(res => {
            if (res.messages.length !== messages.length) {
              setMessages(res.messages);
            }
          })
          .catch(() => {});
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [activePartnerId, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !mediaUrl.trim()) || !activePartnerId) return;

    setSending(true);
    try {
      const res = await apiFetch<{ data: MessageItem }>(`/api/messages/${activePartnerId}`, {
        method: 'POST',
        body: JSON.stringify({
          content: inputMessage.trim(),
          mediaUrl: mediaUrl.trim() || undefined,
        }),
      });

      setMessages(prev => [...prev, res.data]);
      setInputMessage('');
      setMediaUrl('');
      setShowMediaInput(false);
      setShowEmojis(false);
      await loadConversations();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] min-h-[550px] bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row mb-16">
      
      {/* Sidebar: Conversations List */}
      <div
        className={`w-full md:w-80 border-r border-slate-200/80 flex flex-col shrink-0 bg-slate-50/50 ${
          activePartnerId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-base font-bold text-slate-900">Messages 🇳🇬</h2>
          <p className="text-[11px] text-slate-500">End-to-end Nigerian connection chats</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingConv ? (
            <div className="p-4 text-xs text-slate-400 text-center">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <p>No messages yet.</p>
              <p className="text-[11px]">Discover people across Nigeria and say hello!</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = c.partnerId === activePartnerId;
              return (
                <button
                  key={c.partnerId}
                  onClick={() => {
                    setActivePartnerId(c.partnerId);
                    setActivePartner(c.partner);
                  }}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition ${
                    isSelected ? 'bg-white border-l-4 border-l-[#008751] shadow-2xs' : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={c.partner?.avatar || '/src/assets/images/avatar_chioma_adebayo_1791742160027.jpg'}
                      alt={c.partner?.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                    {c.partner?.privacy?.showOnlineStatus !== false && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#008751] border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{c.partner?.name}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(c.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-slate-500 truncate">{c.latestMessage.content}</p>
                      {c.unreadCount > 0 && (
                        <span className="ml-2 w-4 h-4 rounded-full bg-[#008751] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {c.unreadCount}
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

      {/* Main Chat Thread */}
      <div className={`flex-1 flex flex-col bg-white ${!activePartnerId ? 'hidden md:flex' : 'flex'}`}>
        {activePartner ? (
          <>
            {/* Thread Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActivePartnerId(null)}
                  className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                  <img
                    src={activePartner.avatar}
                    alt={activePartner.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#008751] border-2 border-white" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900">{activePartner.name}</h3>
                    {activePartner.verified && (
                      <span className="text-[#008751] text-xs font-bold" title="Verified Profile">✓</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3 text-[#008751]" />
                    <span>{activePartner.city}, {activePartner.state}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">Active now</span>
                  </div>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-[11px] text-slate-400">One Nigeria Safe Chat</span>
              </div>
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAF9]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <div className="text-3xl">👋</div>
                  <p className="text-xs">Say hello to {activePartner.name}!</p>
                  <p className="text-[11px] text-slate-400">Start the conversation with warmth and respect.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderId === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                          isMine
                            ? 'bg-[#008751] text-white rounded-br-xs'
                            : 'bg-white text-slate-800 rounded-bl-xs border border-slate-100'
                        }`}
                      >
                        {m.content}
                        {m.mediaUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden max-h-48 border border-white/20">
                            <img src={m.mediaUrl} alt="Chat media" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (
                          <span>
                            {m.isRead ? (
                              <CheckCheck className="w-3 h-3 text-[#008751]" />
                            ) : (
                              <Check className="w-3 h-3 text-slate-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emoji Bar */}
            {showEmojis && (
              <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
                {NAIJA_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInputMessage((prev) => prev + emoji)}
                    className="text-lg p-1 hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Media Attachment Bar */}
            {showMediaInput && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Paste image URL (e.g. /src/assets/images/lagos_city_vibe_1791742147929.jpg)"
                  className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setMediaUrl('/src/assets/images/lagos_city_vibe_1791742147929.jpg')}
                  className="text-[11px] text-[#008751] font-semibold"
                >
                  Sample Photo
                </button>
              </div>
            )}

            {/* Message Composer */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className="p-2 text-slate-500 hover:text-[#008751] rounded-xl hover:bg-slate-50 transition"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowMediaInput(!showMediaInput)}
                className="p-2 text-slate-500 hover:text-[#008751] rounded-xl hover:bg-slate-50 transition"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#008751]"
              />

              <button
                type="submit"
                disabled={sending || (!inputMessage.trim() && !mediaUrl.trim())}
                className="p-2.5 rounded-xl bg-[#008751] text-white hover:bg-[#007043] transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
            <div className="text-4xl">🇳🇬</div>
            <h3 className="text-base font-bold text-slate-800">Your NaijaConnect Chat Room</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Select any conversation on the left, or search and connect with new people to chat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
