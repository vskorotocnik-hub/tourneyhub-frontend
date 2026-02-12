import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tourneyhub_welcome_seen';

const WelcomeModal = () => {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, countdown]);

  const close = () => {
    if (countdown > 0) return;
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="text-4xl">🚀</span>
          <h2 className="text-xl font-bold text-white mt-2">Добро пожаловать!</h2>
          <p className="text-zinc-400 text-sm mt-1">Прочитай перед тем как смотреть</p>
        </div>

        {/* Info items */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-3 items-start">
            <span className="text-lg shrink-0 mt-0.5">⏳</span>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Сайт размещён на <span className="text-white font-medium">бесплатном сервере</span>, который «засыпает» без активности. При первом заходе сервер просыпается — <span className="text-white font-medium">загрузка может занять до ~30 секунд</span>, особенно фотографии.
            </p>
          </div>

          <div className="flex gap-3 items-start">
            <span className="text-lg shrink-0 mt-0.5">🛠️</span>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Это <span className="text-white font-medium">бета-версия</span> — некоторые тексты и логика сейчас в процессе доработки, могут встречаться недочёты.
            </p>
          </div>

          <div className="flex gap-3 items-start">
            <span className="text-lg shrink-0 mt-0.5">💬</span>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Если что-то непонятно или есть идеи по улучшению — напиши в Instagram: <span className="text-purple-400 font-semibold">@maxim.__v2</span>
            </p>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={close}
          disabled={countdown > 0}
          className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all
                     ${countdown > 0
                       ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                       : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-[0.98]'}`}
        >
          {countdown > 0 ? `Подожди... (${countdown})` : 'Понятно, смотрю!'}
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
