import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, storeTokens, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [banned, setBanned] = useState<{ reason: string } | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Код авторизации не получен');
      return;
    }

    (async () => {
      try {
        const redirect_uri = `${window.location.origin}/auth/google/callback`;
        const res = await authApi.googleAuth(code, redirect_uri);
        storeTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
        await refreshUser();
        navigate('/', { replace: true });
      } catch (err: unknown) {
        if (err instanceof ApiError && err.message === 'BANNED') {
          setBanned({ reason: err.reason || 'Нарушение правил платформы' });
        } else {
          setError('Ошибка авторизации через Google');
        }
      }
    })();
  }, [searchParams, navigate, refreshUser]);

  if (banned) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-2xl p-8 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
            <span className="text-4xl">🚫</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Аккаунт заблокирован</h1>
            <p className="text-zinc-500 text-sm mt-1">Ваш аккаунт был заблокирован администратором</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-zinc-400 text-xs mb-1">Причина:</p>
            <p className="text-red-400 font-medium text-sm">{banned.reason}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl px-4 py-3 text-left space-y-2">
            <p className="text-zinc-400 text-sm font-medium">Что делать?</p>
            <ul className="text-zinc-500 text-xs space-y-1">
              <li>• Напишите в поддержку для обжалования</li>
              <li>• Telegram: @tourneyhub_support</li>
              <li>• Email: support@tourneyhub.com</li>
            </ul>
          </div>
          <button onClick={() => navigate('/login')} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-400">{error}</p>
          <button onClick={() => navigate('/login')} className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <svg className="w-10 h-10 animate-spin text-emerald-400 mx-auto" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-zinc-400">Авторизация через Google...</p>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
