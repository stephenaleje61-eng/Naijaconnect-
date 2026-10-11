import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, getStoredToken, setStoredToken, UserProfile } from '../lib/api.ts';

interface AuthCounts {
  unreadNotifications: number;
  unreadMessages: number;
  pendingRequests: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  counts: AuthCounts;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'verify' | 'forgot';
  lastVerificationCode: string | null;
  openLogin: () => void;
  openRegister: () => void;
  openVerify: (code?: string) => void;
  closeAuthModal: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: { name: string; username: string; email: string; password: string; age: number; state: string; city: string }) => Promise<string | undefined>;
  verifyEmail: (code: string) => Promise<void>;
  resendCode: () => Promise<string | undefined>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updatePrivacy: (data: UserProfile['privacy']) => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [counts, setCounts] = useState<AuthCounts>({ unreadNotifications: 0, unreadMessages: 0, pendingRequests: 0 });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'verify' | 'forgot'>('login');
  const [lastVerificationCode, setLastVerificationCode] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch<{ user: UserProfile; counts: AuthCounts }>('/api/auth/me');
      setUser(res.user);
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      console.warn('Failed to load current session:', err);
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  // Periodic polling for counts and messages if authenticated
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshMe();
    }, 8000);
    return () => clearInterval(interval);
  }, [user, refreshMe]);

  const openLogin = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  const openVerify = (code?: string) => {
    if (code) setLastVerificationCode(code);
    setAuthModalMode('verify');
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const login = async (identifier: string, password: string) => {
    const res = await apiFetch<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    await refreshMe();
  };

  const register = async (payload: { name: string; username: string; email: string; password: string; age: number; state: string; city: string }) => {
    const res = await apiFetch<{ user: UserProfile; token: string; verificationCode?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.verificationCode) {
      setLastVerificationCode(res.verificationCode);
    }
    setAuthModalMode('verify');
    return res.verificationCode;
  };

  const verifyEmail = async (code: string) => {
    const res = await apiFetch<{ user: UserProfile; message: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    setUser(res.user);
    setAuthModalOpen(false);
    await refreshMe();
  };

  const resendCode = async () => {
    const res = await apiFetch<{ code?: string; message: string }>('/api/auth/resend-code', {
      method: 'POST',
    });
    if (res.code) setLastVerificationCode(res.code);
    return res.code;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setCounts({ unreadNotifications: 0, unreadMessages: 0, pendingRequests: 0 });
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const res = await apiFetch<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setUser(res.user);
  };

  const updatePrivacy = async (data: UserProfile['privacy']) => {
    const res = await apiFetch<{ privacy: UserProfile['privacy'] }>('/api/auth/privacy', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (user) {
      setUser({ ...user, privacy: res.privacy });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        counts,
        authModalOpen,
        authModalMode,
        lastVerificationCode,
        openLogin,
        openRegister,
        openVerify,
        closeAuthModal,
        login,
        register,
        verifyEmail,
        resendCode,
        logout,
        updateProfile,
        updatePrivacy,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
