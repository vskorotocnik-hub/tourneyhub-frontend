import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { authApi, storeTokens, clearTokens, getStoredTokens, ApiError, type AuthUser } from '../lib/api';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  loginWithTelegram: (data: Record<string, unknown>) => Promise<void>;
  startTelegramAuth: () => Promise<string>;
  cancelTelegramAuth: () => void;
  telegramAuthStatus: 'idle' | 'waiting' | 'completed' | 'expired' | 'error';
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  banInfo: { reason: string } | null;
  clearBan: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [banInfo, setBanInfo] = useState<{ reason: string } | null>(null);
  const clearBan = useCallback(() => { setBanInfo(null); }, []);

  // Load user on mount if tokens exist
  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens) {
      authApi
        .me()
        .then((res) => {
          setState({ user: res.user, isLoading: false, isAuthenticated: true });
          // Connect Socket.IO with access token
          connectSocket(tokens.accessToken);
        })
        .catch((err) => {
          if (err instanceof ApiError && err.message === 'BANNED') {
            setBanInfo({ reason: err.reason || 'Нарушение правил платформы' });
          }
          clearTokens();
          setState({ user: null, isLoading: false, isAuthenticated: false });
        });
    } else {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    storeTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    const me = await authApi.me();
    setState({ user: me.user, isLoading: false, isAuthenticated: true });
    connectSocket(res.accessToken);
  }, []);

  const register = useCallback(async (email: string, password: string, username: string) => {
    const res = await authApi.register({ email, password, username });
    storeTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    const me = await authApi.me();
    setState({ user: me.user, isLoading: false, isAuthenticated: true });
    connectSocket(res.accessToken);
  }, []);

  const loginWithTelegram = useCallback(async (data: Record<string, unknown>) => {
    const res = await authApi.telegram(data);
    storeTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    const me = await authApi.me();
    setState({ user: me.user, isLoading: false, isAuthenticated: true });
    connectSocket(res.accessToken);
  }, []);

  // ─── Bot-based Telegram Auth (native app) ──────────────────
  const [telegramAuthStatus, setTelegramAuthStatus] = useState<'idle' | 'waiting' | 'completed' | 'expired' | 'error'>('idle');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancelTelegramAuth = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setTelegramAuthStatus('idle');
  }, []);

  const startTelegramAuth = useCallback(async (): Promise<string> => {
    cancelTelegramAuth();
    setTelegramAuthStatus('waiting');

    const { token, deepLink } = await authApi.telegramInit();

    // Start polling every 2 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const result = await authApi.telegramStatus(token);

        if (result.status === 'completed' && result.accessToken && result.refreshToken) {
          // Auth succeeded!
          cancelTelegramAuth();
          setTelegramAuthStatus('completed');
          storeTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
          const me = await authApi.me();
          setState({ user: me.user, isLoading: false, isAuthenticated: true });
          connectSocket(result.accessToken);
        } else if (result.status === 'expired' || result.status === 'not_found') {
          cancelTelegramAuth();
          setTelegramAuthStatus('expired');
        }
      } catch (err) {
        if (err instanceof ApiError && err.message === 'BANNED') {
          cancelTelegramAuth();
          setTelegramAuthStatus('error');
          setBanInfo({ reason: err.reason || 'Нарушение правил платформы' });
        }
      }
    }, 2000);

    return deepLink;
  }, [cancelTelegramAuth]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const logout = useCallback(async () => {
    const tokens = getStoredTokens();
    try {
      if (tokens?.refreshToken) {
        await authApi.logout(tokens.refreshToken);
      }
    } catch {
      // Ignore logout errors
    } finally {
      disconnectSocket();
      clearTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setState({ user: me.user, isLoading: false, isAuthenticated: true });
    } catch {
      // Ignore refresh errors
    }
  }, []);

  // ─── Real-time balance updates via Socket.IO ──────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleBalance = (data: { balance: number; ucBalance: number }) => {
      setState(prev => {
        if (!prev.user) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            balance: String(data.balance),
            ucBalance: String(data.ucBalance),
          },
        };
      });
    };

    socket.on('balance:update', handleBalance);
    return () => { socket.off('balance:update', handleBalance); };
  }, [state.isAuthenticated]);

  // ─── Cross-tab auth sync via localStorage events ─────────────
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tourneyhub_access_token') {
        if (!e.newValue) {
          // Another tab logged out
          disconnectSocket();
          setState({ user: null, isLoading: false, isAuthenticated: false });
        } else if (!state.isAuthenticated && e.newValue) {
          // Another tab logged in — reload user
          authApi.me().then(res => {
            setState({ user: res.user, isLoading: false, isAuthenticated: true });
            connectSocket(e.newValue!);
          }).catch(() => {});
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [state.isAuthenticated]);

  // ─── Periodic token keep-alive (refresh every 10 min) ────────
  useEffect(() => {
    if (!state.isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const newTokens = await authApi.refresh();
        if (newTokens) {
          // Reconnect socket with fresh token
          const tokens = getStoredTokens();
          if (tokens) {
            disconnectSocket();
            connectSocket(tokens.accessToken);
          }
        }
      } catch { /* ignore */ }
    }, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginWithTelegram, startTelegramAuth, cancelTelegramAuth, telegramAuthStatus, logout, refreshUser, banInfo, clearBan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
