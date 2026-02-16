import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { authApi, storeTokens, clearTokens, getStoredTokens, ApiError, type AuthUser } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

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
