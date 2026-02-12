import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, ApiError } from '../lib/api';

type Step = 'methods' | 'email' | 'code' | 'password';

const Spinner = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, startTelegramAuth, cancelTelegramAuth, telegramAuthStatus } = useAuth();

  const [step, setStep] = useState<Step>('methods');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tgWaiting, setTgWaiting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (telegramAuthStatus === 'expired') {
      setTgWaiting(false);
      setError('Ссылка для входа истекла. Попробуй ещё раз.');
    }
  }, [telegramAuthStatus]);

  useEffect(() => {
    return () => cancelTelegramAuth();
  }, [cancelTelegramAuth]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
  }, [step]);

  const handleTelegramClick = async () => {
    setError('');
    setTgWaiting(true);
    try {
      const deepLink = await startTelegramAuth();
      window.open(deepLink, '_blank');
    } catch {
      setError('Ошибка подключения к серверу');
      setTgWaiting(false);
    }
  };

  const handleGoogleClick = async () => {
    setError('');
    try {
      const config = await authApi.googleConfig();
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
      });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch {
      setError('Google OAuth не настроен');
    }
  };

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.sendCode(email, 'login');
      setStep('code');
      setCountdown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.verifyCode(email, code, 'login');
      setStep('password');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setError('');
    try {
      await authApi.sendCode(email, 'login');
      setCountdown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка подключения');
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'code') { setStep('email'); setCode(''); }
    else if (step === 'password') { setStep('code'); setPassword(''); }
    else if (step === 'email') { setStep('methods'); setEmail(''); }
  };

  const inputClass = "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors";
  const btnPrimary = "w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Вход в аккаунт</h1>
          <p className="text-white/50 text-sm mt-1">Войди, чтобы продолжить</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Step: Auth Methods ── */}
          {step === 'methods' && (
            <div className="space-y-3">
              {/* Telegram */}
              {tgWaiting ? (
                <div className="space-y-3">
                  <div className="w-full py-3 rounded-xl bg-[#2AABEE]/80 text-white font-semibold flex items-center justify-center gap-2">
                    <Spinner />
                    Ожидание подтверждения в Telegram...
                  </div>
                  <p className="text-center text-zinc-400 text-xs">
                    Нажми <b>Start</b> в боте Telegram, затем вернись сюда
                  </p>
                  <button type="button" onClick={() => { cancelTelegramAuth(); setTgWaiting(false); }} className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                    Отменить
                  </button>
                </div>
              ) : (
                <button type="button" onClick={handleTelegramClick} className="w-full py-3 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-semibold transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Войти через Telegram
                </button>
              )}

              {/* Google */}
              <button type="button" onClick={handleGoogleClick} className="w-full py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 font-semibold transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Войти через Google
              </button>

              {/* Divider */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-700" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-3 bg-zinc-900/80 text-zinc-500">или</span></div>
              </div>

              {/* Email button */}
              <button type="button" onClick={() => setStep('email')} className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Войти через Email
              </button>
            </div>
          )}

          {/* ── Step: Enter Email ── */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <button type="button" onClick={goBack} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Назад
              </button>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" className={inputClass} autoFocus />
              </div>
              <button type="submit" disabled={isLoading} className={btnPrimary}>
                {isLoading ? <><Spinner /> Отправка...</> : 'Отправить код'}
              </button>
              <p className="text-zinc-500 text-xs text-center">Мы отправим 6-значный код на вашу почту</p>
            </form>
          )}

          {/* ── Step: Enter Code ── */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <button type="button" onClick={goBack} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Назад
              </button>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Код подтверждения</label>
                <p className="text-zinc-500 text-xs mb-2">Отправлен на {email}</p>
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="000000"
                  className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                />
              </div>
              <button type="submit" disabled={isLoading || code.length !== 6} className={btnPrimary}>
                {isLoading ? <><Spinner /> Проверка...</> : 'Подтвердить'}
              </button>
              <div className="text-center">
                {countdown > 0 ? (
                  <span className="text-zinc-500 text-sm">Отправить повторно через {countdown}с</span>
                ) : (
                  <button type="button" onClick={handleResendCode} className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                    Отправить код повторно
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── Step: Enter Password ── */}
          {step === 'password' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <button type="button" onClick={goBack} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Назад
              </button>
              <p className="text-zinc-400 text-sm">Вход как <span className="text-white font-medium">{email}</span></p>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Введите пароль"
                    className={`${inputClass} pr-12`}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className={btnPrimary}>
                {isLoading ? <><Spinner /> Вход...</> : 'Войти'}
              </button>
              <div className="text-center">
                <Link to="/forgot-password" className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                  Забыл пароль?
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-white/50 text-sm mt-6">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Зарегистрируйся
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
