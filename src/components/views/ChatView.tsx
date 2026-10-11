import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  apiFetch,
  ChatRoomItem,
  PublicChatMessageItem,
  ConversationItem,
  MessageItem,
  UserProfile
} from '../../lib/api.ts';
import {
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  ArrowLeft,
  Smile,
  MapPin,
  Users,
  Hash,
  Radio,
  Reply,
  X,
  Search,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const ChatView: React.FC<{ initialPartnerId?: string | null }> = ({ initialPartnerId }) => {
  const { user, refreshMe } = useAuth();

  // Mode: 'rooms' (National Live Spaces where everybody sees each other) vs 'direct' (1-on-1 private DMs)
  const [chatMode, setChatMode] = useState<'rooms' | 'direct'>(initialPartnerId ? 'direct' : 'rooms');

  /* =========================================================================
     PUBLIC ROOMS STATE
     ========================================================================= */
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('one-nigeria');
  const [roomMessages, setRoomMessages] = useState<PublicChatMessageItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingRoomMsgs, setLoadingRoomMsgs] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; content: string } | null>(null);

  /* =========================================================================
     DIRECT MESSAGES STATE
     ========================================================================= */
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId || null);
  const [activePartner, setActivePartner] = useState<UserProfile | null>(null);
  const [directMessages, setDirectMessages] = useState<MessageItem[]>([]);
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [directTab, setDirectTab] = useState<'chats' | 'contacts'>('chats');
  const [loadingConv, setLoadingConv] = useState(true);

  /* =========================================================================
     COMPOSER STATE
     ========================================================================= */
  const [inputMessage, setInputMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const NAIJA_EMOJIS = ['🇳🇬', '🤝', '🔥', '❤️', '🙌', '😂', '👏', '✨', '💪', '💯'];

  const SAMPLE_MEDIA = [
    { label: 'Lagos Skyline', url: '/src/assets/images/lagos_city_vibe_1791742147929.jpg' },
    { label: 'Abuja Tech Hub', url: '/src/assets/images/community_abuja_tech_1791742137722.jpg' },
    { label: 'One Nigeria Gathering', url: '/src/assets/images/hero_nigerians_connecting_1791742121950.jpg' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /* =========================================================================
     LOAD ROOMS & MESSAGES
     ========================================================================= */
  const loadRooms = async () => {
    try {
      const res = await apiFetch<{ rooms: ChatRoomItem[] }>('/api/chat/rooms');
      setRooms(res.rooms);
    } catch (err) {
      console.error('Failed to load chat rooms', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadRoomMessages = async (roomId: string) => {
    try {
      const res = await apiFetch<{ room: any; messages: PublicChatMessageItem[] }>(`/api/chat/rooms/${roomId}/messages`);
      setRoomMessages(res.messages);
    } catch (err) {
      console.error('Failed to load room messages', err);
    }
  };

  /* =========================================================================
     LOAD DIRECT CONVERSATIONS & CONTACTS
     ========================================================================= */
  const loadConversations = async () => {
    try {
      const res = await apiFetch<{ conversations: ConversationItem[] }>('/api/messages/conversations');
      setConversations(res.conversations);

      if (activePartnerId && !activePartner) {
        const found = res.conversations.find((c) => c.partnerId === activePartnerId)?.partner;
        if (found) {
          setActivePartner(found);
        } else {
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

  const loadContacts = async () => {
    try {
      const res = await apiFetch<{ contacts: UserProfile[] }>('/api/messages/contacts');
      setContacts(res.contacts);
    } catch (err) {
      console.error('Failed to load contacts', err);
    }
  };

  const loadActiveDirectMessages = async (partnerId: string) => {
    try {
      const res = await apiFetch<{ partner: UserProfile; messages: MessageItem[] }>(`/api/messages/${partnerId}`);
      setDirectMessages(res.messages);
      setActivePartner(res.partner);
      await apiFetch(`/api/messages/read/${partnerId}`, { method: 'POST' });
      await refreshMe();
    } catch (err) {
      console.error('Failed to load direct messages', err);
    }
  };

  // Initial load
  useEffect(() => {
    loadRooms();
    loadConversations();
    loadContacts();
  }, []);

  // When room changes
  useEffect(() => {
    if (chatMode === 'rooms' && activeRoomId) {
      setLoadingRoomMsgs(true);
      loadRoomMessages(activeRoomId).finally(() => setLoadingRoomMsgs(false));
    }
  }, [chatMode, activeRoomId]);

  // When active partner changes
  useEffect(() => {
    if (chatMode === 'direct' && activePartnerId) {
      loadActiveDirectMessages(activePartnerId);
    }
  }, [chatMode, activePartnerId]);

  // Auto-scroll on messages change
  useEffect(() => {
    scrollToBottom();
  }, [roomMessages, directMessages, chatMode]);

  // Real-time polling every 2.5 seconds so everybody sees each other's messages live
  useEffect(() => {
    const timer = setInterval(() => {
      if (chatMode === 'rooms' && activeRoomId) {
        apiFetch<{ room: any; messages: PublicChatMessageItem[] }>(`/api/chat/rooms/${activeRoomId}/messages`)
          .then((res) => {
            if (res.messages.length !== roomMessages.length || JSON.stringify(res.messages) !== JSON.stringify(roomMessages)) {
              setRoomMessages(res.messages);
            }
          })
          .catch(() => {});
      } else if (chatMode === 'direct') {
        loadConversations();
        if (activePartnerId) {
          apiFetch<{ partner: UserProfile; messages: MessageItem[] }>(`/api/messages/${activePartnerId}`)
            .then((res) => {
              if (res.messages.length !== directMessages.length) {
                setDirectMessages(res.messages);
              }
            })
            .catch(() => {});
        }
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [chatMode, activeRoomId, activePartnerId, roomMessages.length, directMessages.length]);

  /* =========================================================================
     SEND HANDLER
     ========================================================================= */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !mediaUrl.trim()) return;

    setSending(true);

    if (chatMode === 'rooms') {
      try {
        const res = await apiFetch<{ message: string; data: PublicChatMessageItem }>(
          `/api/chat/rooms/${activeRoomId}/messages`,
          {
            method: 'POST',
            body: JSON.stringify({
              content: inputMessage.trim(),
              mediaUrl: mediaUrl.trim() || undefined,
              replyTo: replyingTo || undefined,
            }),
          }
        );

        setRoomMessages((prev) => [...prev, res.data]);
        setInputMessage('');
        setMediaUrl('');
        setShowMediaInput(false);
        setShowEmojis(false);
        setReplyingTo(null);
        scrollToBottom();
        // Refresh room list counts in background
        loadRooms();
      } catch (err: any) {
        alert(err.message || 'Failed to send room message');
      } finally {
        setSending(false);
      }
    } else {
      // Direct message
      if (!activePartnerId) return;
      try {
        const res = await apiFetch<{ data: MessageItem }>(`/api/messages/${activePartnerId}`, {
          method: 'POST',
          body: JSON.stringify({
            content: inputMessage.trim(),
            mediaUrl: mediaUrl.trim() || undefined,
          }),
        });

        setDirectMessages((prev) => [...prev, res.data]);
        setInputMessage('');
        setMediaUrl('');
        setShowMediaInput(false);
        setShowEmojis(false);
        scrollToBottom();
        await loadConversations();
      } catch (err: any) {
        alert(err.message || 'Failed to send message');
      } finally {
        setSending(false);
      }
    }
  };

  /* =========================================================================
     TOGGLE REACTION IN PUBLIC ROOM
     ========================================================================= */
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await apiFetch<{ reactions: Record<string, string[]> }>(
        `/api/chat/rooms/${activeRoomId}/messages/${messageId}/react`,
        {
          method: 'POST',
          body: JSON.stringify({ emoji }),
        }
      );

      setRoomMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m))
      );
    } catch (err) {
      console.error('Failed to react', err);
    }
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || {
    id: 'one-nigeria',
    name: 'One Nigeria Live Lounge',
    slogan: 'National Live Chat for All 36 States & FCT',
    icon: '🇳🇬',
    description: 'The national town square where all Nigerians meet and connect.',
    category: 'National',
    activeCount: 18,
    messagesCount: roomMessages.length,
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.state.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.username.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-130px)] min-h-[580px] bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col mb-16">
      
      {/* =========================================================================
          TOP NAV: MODE SWITCHER
          ========================================================================= */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setChatMode('rooms')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              chatMode === 'rooms'
                ? 'bg-white text-[#008751] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="text-sm">🇳🇬</span>
            <span>One Nigeria Chat Rooms</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => setChatMode('direct')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              chatMode === 'direct'
                ? 'bg-white text-[#008751] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Direct Messages</span>
            {conversations.some((c) => c.unreadCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-semibold text-slate-700">Live Space</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] text-slate-500">All 36 States & FCT Connected</span>
        </div>
      </div>

      {/* =========================================================================
          MAIN CONTAINER (SIDEBAR + ACTIVE CHAT PANE)
          ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* =======================================================================
            SIDEBAR
            ======================================================================= */}
        <div
          className={`w-full md:w-80 lg:w-84 border-r border-slate-200 bg-slate-50/60 flex flex-col shrink-0 ${
            (chatMode === 'direct' && activePartnerId) || (chatMode === 'rooms' && false)
              ? 'hidden md:flex'
              : 'flex'
          }`}
        >
          {chatMode === 'rooms' ? (
            /* ROOMS SIDEBAR */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3.5 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    National Spaces 🇳🇬
                  </h3>
                  <span className="text-[11px] font-semibold text-[#008751] bg-emerald-50 px-2 py-0.5 rounded-full">
                    {rooms.length} Rooms
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Join any room to view and send messages live
                </p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                {loadingRooms ? (
                  <div className="p-4 text-xs text-slate-400 text-center">Loading rooms...</div>
                ) : (
                  rooms.map((room) => {
                    const isSelected = room.id === activeRoomId;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setActiveRoomId(room.id)}
                        className={`w-full p-3 rounded-xl text-left transition flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#008751] text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100/80 text-slate-800 border border-slate-100'
                        }`}
                      >
                        <span className="text-xl shrink-0 p-1 rounded-lg bg-black/5 flex items-center justify-center">
                          {room.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold truncate">
                              {room.name}
                            </h4>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {room.activeCount || 15} online
                            </span>
                          </div>
                          <p
                            className={`text-[11px] truncate mt-0.5 ${
                              isSelected ? 'text-emerald-100' : 'text-slate-500'
                            }`}
                          >
                            {room.slogan}
                          </p>
                          {room.lastMessage && (
                            <p
                              className={`text-[10px] truncate mt-1 italic ${
                                isSelected ? 'text-emerald-200' : 'text-slate-400'
                              }`}
                            >
                              {room.lastMessage.sender?.name.split(' ')[0]}: {room.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* DIRECT MESSAGES SIDEBAR */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Direct Sub-tabs: Chats vs All Members */}
              <div className="p-2 border-b border-slate-200 bg-white grid grid-cols-2 gap-1">
                <button
                  onClick={() => setDirectTab('chats')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    directTab === 'chats'
                      ? 'bg-[#008751] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  My Chats ({conversations.length})
                </button>
                <button
                  onClick={() => setDirectTab('contacts')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    directTab === 'contacts'
                      ? 'bg-[#008751] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Start New Chat
                </button>
              </div>

              {directTab === 'chats' ? (
                /* Existing conversations list */
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {loadingConv ? (
                    <div className="p-4 text-xs text-slate-400 text-center">Loading conversations...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 space-y-3">
                      <p>No direct messages yet.</p>
                      <button
                        onClick={() => setDirectTab('contacts')}
                        className="px-3 py-1.5 bg-[#008751] text-white rounded-xl font-bold text-xs hover:bg-[#007043] transition shadow-xs"
                      >
                        Say hello to members
                      </button>
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
                          className={`w-full p-3 text-left flex items-start gap-3 transition ${
                            isSelected ? 'bg-white border-l-4 border-l-[#008751] shadow-2xs' : 'hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={c.partner?.avatar || '/src/assets/images/avatar_chioma_adebayo_1791742160027.jpg'}
                              alt={c.partner?.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#008751] border-2 border-white" />
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
              ) : (
                /* All Members Directory to start chat with anyone */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Search Nigerian members..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#008751]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {filteredContacts.length === 0 ? (
                      <div className="p-4 text-xs text-slate-400 text-center">No members found</div>
                    ) : (
                      filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => {
                            setActivePartnerId(contact.id);
                            setActivePartner(contact);
                            setDirectTab('chats');
                          }}
                          className="w-full p-2.5 text-left flex items-center gap-3 hover:bg-slate-100/70 transition"
                        >
                          <img
                            src={contact.avatar || '/src/assets/images/avatar_chioma_adebayo_1791742160027.jpg'}
                            alt={contact.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{contact.name}</h4>
                              {contact.verified && (
                                <span className="text-[#008751] text-[10px] font-bold">✓</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {contact.city}, {contact.state}
                            </p>
                          </div>
                          <span className="text-[11px] text-[#008751] font-semibold shrink-0">Chat →</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =======================================================================
            MAIN CHAT VIEW AREA
            ======================================================================= */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {chatMode === 'rooms' ? (
            /* ===================================================================
               PUBLIC ROOM STREAM (EVERYBODY SEES EACH OTHER'S MESSAGES)
               =================================================================== */
            <>
              {/* Room Header */}
              <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {activeRoom.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">{activeRoom.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#008751] border border-emerald-200">
                        Public Space
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{activeRoom.slogan}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-[#008751]" />
                    <span>{activeRoom.activeCount || 18} Active</span>
                  </span>
                </div>
              </div>

              {/* Room Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8FAF9]">
                {loadingRoomMsgs ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Loading {activeRoom.name} messages...
                  </div>
                ) : roomMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                    <div className="text-3xl">🇳🇬</div>
                    <h4 className="text-sm font-bold text-slate-800">Welcome to {activeRoom.name}!</h4>
                    <p className="text-xs max-w-sm">
                      Be the first to share a warm Nigerian greeting in this space! Everyone in the community will see it.
                    </p>
                  </div>
                ) : (
                  roomMessages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    const senderName = m.sender?.name || 'Nigerian Member';
                    const senderAvatar = m.sender?.avatar || '/src/assets/images/hero_nigerians_connecting_1791742121950.jpg';
                    const senderState = m.sender?.state || 'Nigeria';

                    return (
                      <div
                        key={m.id}
                        className={`flex gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMine && (
                          <img
                            src={senderAvatar}
                            alt={senderName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                          />
                        )}

                        <div className={`max-w-[85%] sm:max-w-lg flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          {/* Sender Meta */}
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[11px] font-bold text-slate-800">
                              {isMine ? 'You' : senderName}
                            </span>
                            {!isMine && m.sender?.verified && (
                              <span className="text-[#008751] text-[10px] font-bold" title="Verified">✓</span>
                            )}
                            <span className="text-[10px] text-slate-400">·</span>
                            <span className="text-[10px] text-slate-500 font-medium bg-slate-200/60 px-1.5 py-0.2 rounded-md">
                              {senderState}
                            </span>
                            <span className="text-[10px] text-slate-400">·</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Quoted Reply if any */}
                          {m.replyTo && (
                            <div className="mb-1 text-[11px] p-2 rounded-lg bg-slate-100 border-l-2 border-[#008751] text-slate-600 max-w-full truncate">
                              <span className="font-semibold text-slate-800">{m.replyTo.senderName}: </span>
                              <span>{m.replyTo.content}</span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] shadow-2xs leading-relaxed ${
                              isMine
                                ? 'bg-[#008751] text-white rounded-tr-xs'
                                : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.content}</p>

                            {m.mediaUrl && (
                              <div className="mt-2.5 rounded-xl overflow-hidden max-h-56 border border-black/10">
                                <img
                                  src={m.mediaUrl}
                                  alt="Shared photo"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {/* Message Footer: Reactions + Reply Button */}
                          <div className="flex items-center gap-2 mt-1 px-1 flex-wrap">
                            {/* Reactions display */}
                            {m.reactions && Object.keys(m.reactions).length > 0 && (
                              <div className="flex items-center gap-1">
                                {Object.entries(m.reactions).map(([emoji, userIds]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(m.id, emoji)}
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition flex items-center gap-1 ${
                                      userIds.includes(user?.id || '')
                                        ? 'bg-emerald-50 border-emerald-300 text-[#008751]'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    <span>{userIds.length}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Quick Add Reaction Pop */}
                            <div className="flex items-center gap-1 text-[11px] opacity-70 hover:opacity-100 transition">
                              <button
                                onClick={() => handleToggleReaction(m.id, '🇳🇬')}
                                className="hover:scale-125 transition-transform"
                                title="One Nigeria"
                              >
                                🇳🇬
                              </button>
                              <button
                                onClick={() => handleToggleReaction(m.id, '❤️')}
                                className="hover:scale-125 transition-transform"
                                title="Love"
                              >
                                ❤️
                              </button>
                              <button
                                onClick={() => handleToggleReaction(m.id, '🔥')}
                                className="hover:scale-125 transition-transform"
                                title="Fire"
                              >
                                🔥
                              </button>
                            </div>

                            {/* Reply button */}
                            <button
                              onClick={() => setReplyingTo({ id: m.id, senderName, content: m.content })}
                              className="text-[10px] text-slate-400 hover:text-[#008751] flex items-center gap-0.5 font-medium transition"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>

                        {isMine && (
                          <img
                            src={senderAvatar}
                            alt={senderName}
                            className="w-8 h-8 rounded-full object-cover border border-[#008751] shrink-0 mt-0.5"
                          />
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            /* ===================================================================
               DIRECT 1-ON-1 CHAT PANE
               =================================================================== */
            activePartner ? (
              <>
                {/* DM Thread Header */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white z-10 shrink-0">
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

                {/* DM Message History */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAF9]">
                  {directMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                      <div className="text-3xl">👋</div>
                      <p className="text-xs">Say hello to {activePartner.name}!</p>
                      <p className="text-[11px] text-slate-400">Start the conversation with warmth and respect.</p>
                    </div>
                  ) : (
                    directMessages.map((m) => {
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
                            <p className="whitespace-pre-wrap">{m.content}</p>
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
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <div className="text-4xl">💬</div>
                <h3 className="text-base font-bold text-slate-800">Your Direct Messages</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Select a chat on the left, or click "Start New Chat" to begin a private conversation with any Nigerian member.
                </p>
                <button
                  onClick={() => setDirectTab('contacts')}
                  className="px-4 py-2 bg-[#008751] text-white font-bold text-xs rounded-xl hover:bg-[#007043] transition shadow-xs"
                >
                  Browse Members Directory
                </button>
              </div>
            )
          )}

          {/* ===================================================================
              REPLYING-TO BAR (if set)
              =================================================================== */}
          {replyingTo && (
            <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-3.5 h-3.5 text-[#008751] shrink-0" />
                <span className="font-semibold">Replying to {replyingTo.senderName}:</span>
                <span className="text-slate-600 truncate italic">"{replyingTo.content}"</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ===================================================================
              EMOJI BAR (if toggled)
              =================================================================== */}
          {showEmojis && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
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

          {/* ===================================================================
              MEDIA INPUT BAR (if toggled)
              =================================================================== */}
          {showMediaInput && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#008751]"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaInput(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Quick Photos:</span>
                {SAMPLE_MEDIA.map((photo) => (
                  <button
                    key={photo.label}
                    type="button"
                    onClick={() => setMediaUrl(photo.url)}
                    className="text-[11px] text-[#008751] font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
                  >
                    {photo.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================
              COMPOSER INPUT FORM
              =================================================================== */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className="p-2 text-slate-500 hover:text-[#008751] rounded-xl hover:bg-slate-50 transition"
              title="Add emojis"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className="p-2 text-slate-500 hover:text-[#008751] rounded-xl hover:bg-slate-50 transition"
              title="Attach photo"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                chatMode === 'rooms'
                  ? `Message #${activeRoom.name}... (Everybody in room can see)`
                  : activePartner
                  ? `Message ${activePartner.name}...`
                  : 'Select a conversation...'
              }
              disabled={chatMode === 'direct' && !activePartnerId}
              className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#008751] disabled:bg-slate-50 disabled:text-slate-400"
            />

            <button
              type="submit"
              disabled={
                sending ||
                (!inputMessage.trim() && !mediaUrl.trim()) ||
                (chatMode === 'direct' && !activePartnerId)
              }
              className="px-4 py-2.5 rounded-xl bg-[#008751] text-white hover:bg-[#007043] transition disabled:opacity-50 font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
