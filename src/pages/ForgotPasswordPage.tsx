import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, ApiError } from '../lib/api';

type Step = 'email' | 'code' | 'password' | 'done';

const Spinner = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
  }, [step]);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.sendCode(email, 'reset_password');
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
      await authApi.verifyCode(email, code, 'reset_password');
      setStep('password');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(email, password);
      setStep('done');
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
      await authApi.sendCode(email, 'reset_password');
      setCountdown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка подключения');
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'code') { setStep('email'); setCode(''); }
    else if (step === 'password') { setStep('code'); setPassword(''); setConfirmPassword(''); }
  };

  const inputClass = "w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors";
  const btnPrimary = "w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Сброс пароля</h1>
          <p className="text-white/50 text-sm mt-1">Восстанови доступ к аккаунту</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" className={inputClass} autoFocus />
              </div>
              <button type="submit" disabled={isLoading} className={btnPrimary}>
                {isLoading ? <><Spinner /> Отправка...</> : 'Отправить код'}
              </button>
              <p className="text-zinc-500 text-xs text-center">Мы отправим код для сброса пароля на вашу почту</p>
            </form>
          )}

          {/* Step: Code */}
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

          {/* Step: New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <button type="button" onClick={goBack} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Назад
              </button>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Новый пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Минимум 8 символов"
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
                <p className="text-zinc-500 text-xs mt-1">Заглавная буква + цифра, минимум 8 символов</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Подтвердите пароль</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Повторите пароль"
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={isLoading} className={btnPrimary}>
                {isLoading ? <><Spinner /> Сохранение...</> : 'Сохранить новый пароль'}
              </button>
            </form>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Пароль изменён!</h2>
              <p className="text-zinc-400 text-sm">Теперь вы можете войти с новым паролем</p>
              <button onClick={() => navigate('/login')} className={btnPrimary}>
                Войти
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-white/50 text-sm mt-6">
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Вернуться к входу
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
