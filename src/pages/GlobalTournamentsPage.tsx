import { useNavigate } from 'react-router-dom';

const GlobalTournamentsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 py-10 overflow-hidden">
      {/* BG glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 left-1/4 w-64 h-48 bg-fuchsia-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-40 bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-5 left-4 z-10 flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Назад
      </button>

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Card glow ring */}
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/20 blur-sm" />

        <div className="relative rounded-3xl bg-zinc-900/80 border border-zinc-700/40 backdrop-blur-xl p-8 sm:p-10 text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center">
            <span className="text-3xl">🏆</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Скоро
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
            Мы готовим глобальные турниры и&nbsp;дорабатываем систему регионов, пинга и&nbsp;расписаний, чтобы всё было честно и&nbsp;без&nbsp;лагов. Страница временно в&nbsp;режиме&nbsp;«Скоро».
          </p>

          {/* Divider */}
          <div className="w-12 h-px mx-auto bg-zinc-700 mb-4" />

          {/* Footer note */}
          <p className="text-xs text-zinc-500">
            Следите за обновлениями — анонс будет здесь.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalTournamentsPage;
