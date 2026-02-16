import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const funPhrases = [
  '⚔️ Загружаем арену...',
  '🎮 Подключаемся к серверу...',
  '🏆 Готовим турнир...',
  '💰 Считаем UC...',
  '🔥 Разогреваем стволы...',
  '🎯 Прицеливаемся...',
  '👑 Ищем чемпионов...',
  '🚀 Запускаем матч...',
  '⚡ Ускоряемся...',
  '🛡️ Надеваем броню...',
  '🗺️ Загружаем карту...',
  '💣 Готовим гранаты...',
];

const DURATION = 1000;

const PageLoader = () => {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phrase, setPhrase] = useState('');
  const [phase, setPhase] = useState<'run' | 'fade'>('run');
  const prevPath = useRef(pathname);
  const rafId = useRef(0);
  const fadeTimer = useRef<number>(0);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    clearTimeout(fadeTimer.current);
  }, []);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    const prev = prevPath.current;
    prevPath.current = pathname;

    // Skip animation for same-section navigation (e.g. /messages <-> /messages/:chatId)
    const prevSection = prev.split('/').filter(Boolean)[0];
    const newSection = pathname.split('/').filter(Boolean)[0];
    if (prevSection && newSection && prevSection === newSection) return;

    // Cancel any running animation
    cleanup();

    // Start fresh
    setPhrase(funPhrases[Math.floor(Math.random() * funPhrases.length)]);
    setProgress(0);
    setPhase('run');
    setLoading(true);

    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      setProgress(Math.round(p * 100));

      if (p < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        setPhase('fade');
        fadeTimer.current = window.setTimeout(() => {
          setLoading(false);
        }, 250);
      }
    };

    rafId.current = requestAnimationFrame(tick);

    return cleanup;
  }, [pathname, cleanup]);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] flex flex-col items-center justify-center
                  ${phase === 'fade' ? 'animate-[fadeOut_250ms_ease-out_forwards]' : ''}`}
      style={{
        background: `linear-gradient(to bottom, rgba(10, 10, 20, 0.80), rgba(10, 10, 20, 0.87)),
                     url('/bg.jpg') center/cover fixed`,
      }}
    >
      {/* Animated glow circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-pink-600/8 blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 w-full max-w-sm">
        {/* Logo / Icon */}
        <div className="text-5xl animate-bounce" style={{ animationDuration: '1.5s' }}>
          🎮
        </div>

        {/* Fun phrase */}
        <p className="text-sm text-purple-300 font-medium tracking-wide animate-pulse">
          {phrase}
        </p>

        {/* Percentage */}
        <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tabular-nums">
          {progress}%
        </span>

        {/* Progress bar */}
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Bottom text */}
        <p className="text-xs text-white/20 mt-2">TourneyHub</p>
      </div>
    </div>
  );
};

export default PageLoader;
