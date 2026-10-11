export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  age: number;
  state: string;
  city: string;
  bio: string;
  avatar: string;
  coverImage?: string;
  interests: string[];
  role: 'admin' | 'user';
  verified: boolean;
  isSuspended: boolean;
  privacy: {
    profilePublic: boolean;
    showOnlineStatus: boolean;
    allowDirectMessages: 'everyone' | 'connections_only';
  };
  createdAt: string;
  lastActive: string;
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'connected';
  connectionId?: string;
}

export interface PostItem {
  id: string;
  authorId: string;
  content: string;
  mediaUrl?: string;
  stateTag?: string;
  communityId?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author?: UserProfile;
  hasLiked?: boolean;
}

export interface PostCommentItem {
  id: string;
  postId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  createdAt: string;
  author?: UserProfile;
}

export interface CommunityItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  stateTag?: string;
  banner?: string;
  icon?: string;
  membersCount: number;
  isMember?: boolean;
}

export interface ConversationItem {
  partnerId: string;
  partner: UserProfile;
  latestMessage: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    mediaUrl?: string;
    isRead: boolean;
    createdAt: string;
  };
  unreadCount: number;
}

export interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
  actor?: UserProfile;
}

const TOKEN_KEY = 'naijaconnect_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(
      netErr?.message?.includes('Failed to fetch')
        ? 'Cannot reach the authentication server. Please check your internet connection or server status.'
        : `Network error: ${netErr?.message || 'Connection failed'}`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  // If server returned HTML (e.g. 404 or 500 error page from Vercel or proxy)
  if (data === null) {
    const rawText = await res.text().catch(() => '');

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          'Authentication service endpoint was not found (404). Please verify the backend API route is active.'
        );
      } else if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error('The authentication service is temporarily unavailable. Please retry in a moment.');
      } else if (res.status >= 500) {
        throw new Error('A server error occurred while processing your request. Please try again.');
      }
      throw new Error(`Request failed with status ${res.status}.`);
    }

    // Attempt parsing in case Content-Type was omitted
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText };
    }
  }

  if (!res.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (typeof data === 'string' ? data : `Request failed with status ${res.status}`);
    throw new Error(errorMsg);
  }

  return data as T;
}
