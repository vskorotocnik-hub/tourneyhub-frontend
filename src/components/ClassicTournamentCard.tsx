import type { ClassicTournamentListItem } from '../lib/api';

const cModeLabels: Record<string, string> = { SOLO: '👤 Solo', DUO: '👥 Duo', SQUAD: '🎯 Squad' };
const cModeColors: Record<string, string> = { SOLO: 'bg-purple-600', DUO: 'bg-cyan-600', SQUAD: 'bg-orange-600' };

interface ClassicTournamentCardProps {
  tournament: ClassicTournamentListItem;
  currentTime: number;
  isRegistered: boolean;
  variant: 'desktop' | 'mobile';
  onRegister: (tournament: ClassicTournamentListItem) => void;
  onOpenChat: () => void;
}

const ClassicTournamentCard = ({
  tournament,
  currentTime,
  isRegistered,
  variant,
  onRegister,
  onOpenChat,
}: ClassicTournamentCardProps) => {
  const timeLeft = new Date(tournament.startTime).getTime() - currentTime;
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const regCount = tournament.registeredPlayers ?? 0;

  const isExpired = timeLeft <= 0 && !isRegistered;
  const isFull = regCount >= tournament.maxParticipants;
  const fillPct = Math.min((regCount / tournament.maxParticipants) * 100, 100);

  const isMobile = variant === 'mobile';
  const imgH = isMobile ? 'h-28' : 'h-36';
  const padCls = isMobile ? 'top-2.5 left-2.5' : 'top-3 left-3';
  const padClsR = isMobile ? 'top-2.5 right-2.5' : 'top-3 right-3';
  const padClsB = isMobile ? 'bottom-2.5 left-2.5 right-2.5' : 'bottom-3 left-3 right-3';
  const titleSize = isMobile ? 'text-sm' : 'text-base';
  const btnPy = isMobile ? 'py-2' : 'py-2.5';
  const btnText = isMobile ? 'text-xs' : 'text-sm';

  return (
    <div
      className={`rounded-2xl overflow-hidden border transition-all ${
        isRegistered ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' :
        isExpired ? 'border-white/5 opacity-50' :
        'border-white/10 hover:border-purple-500/30'
      }`}
      style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d15 100%)' }}
    >
      {/* Map Image */}
      <div className={`relative ${imgH}`}>
        {tournament.mapImage ? (
          <img src={tournament.mapImage} alt={tournament.map} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/60 via-zinc-900 to-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-black/40 to-transparent" />
        <div className={`absolute ${padCls} flex gap-1.5`}>
          <span className={`${cModeColors[tournament.mode] || 'bg-purple-600'} px-2 py-0.5 rounded-md text-[11px] text-white font-semibold`}>
            {cModeLabels[tournament.mode] || tournament.mode}
          </span>
          <span className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] text-white/70">{tournament.server}</span>
        </div>
        <div className={`absolute ${padClsR} bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md`}>
          <span className="text-[11px] text-emerald-400 font-bold">{tournament.prizePool} UC</span>
        </div>
        <div className={`absolute ${padClsB}`}>
          <p className={`text-white font-bold ${titleSize} leading-tight`}>{tournament.title || tournament.map}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className={`p-3 ${isMobile ? 'space-y-2' : 'space-y-2.5'}`}>
        {/* Timer + Entry */}
        <div className="flex gap-2">
          {timeLeft > 0 ? (
            <div className={`flex-1 flex items-center gap-2 bg-yellow-500/8 border border-yellow-500/15 rounded-xl ${isMobile ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              <div>
                <p className="text-[10px] text-white/40 mb-0.5">Старт через</p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-yellow-400 tabular-nums`}>
                  {isMobile
                    ? `${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
                    : `${days > 0 ? `${days}д ` : ''}${hours > 0 ? `${hours}:` : ''}${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className={`flex-1 flex items-center justify-center bg-zinc-800/60 border border-white/5 rounded-xl ${isMobile ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
              <p className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-semibold text-white/30`}>Регистрация закрыта</p>
            </div>
          )}
          <div className={`bg-white/5 border border-white/10 rounded-xl text-center ${isMobile ? 'px-2.5 py-1.5 min-w-[70px]' : 'px-3 py-2 min-w-[80px]'}`}>
            <p className="text-[10px] text-white/40 mb-0.5">Взнос</p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-white`}>{tournament.entryFee} UC</p>
          </div>
        </div>

        {/* Prizes row */}
        <div className="flex gap-1.5">
          <div className="flex-1 bg-yellow-500/8 border border-yellow-500/15 rounded-xl py-1.5 text-center">
            <p className="text-[9px] text-yellow-500/60">1 место</p>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-extrabold text-yellow-400`}>{tournament.prize1}</p>
          </div>
          {tournament.winnerCount >= 2 && (
            <div className="flex-1 bg-zinc-400/8 border border-zinc-500/15 rounded-xl py-1.5 text-center">
              <p className="text-[9px] text-zinc-400/60">2 место</p>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-extrabold text-zinc-300`}>{tournament.prize2}</p>
            </div>
          )}
          {tournament.winnerCount >= 3 && (
            <div className="flex-1 bg-orange-500/8 border border-orange-500/15 rounded-xl py-1.5 text-center">
              <p className="text-[9px] text-orange-400/60">3 место</p>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-extrabold text-orange-400`}>{tournament.prize3}</p>
            </div>
          )}
        </div>

        {/* Players bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-white/40">{regCount}/{tournament.maxParticipants} игроков</span>
            <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-purple-400'}`}>{Math.round(fillPct)}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${fillPct}%` }} />
          </div>
        </div>

        {/* Action Button */}
        {isRegistered ? (
          <button onClick={onOpenChat}
            className={`w-full ${btnPy} rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 ${btnText} font-bold hover:bg-emerald-500/25 transition-colors`}>
            ✅ Зарегистрирован · Чат
          </button>
        ) : isExpired ? (
          <div className={`w-full ${btnPy} rounded-xl bg-white/3 text-white/25 ${btnText} font-bold text-center`}>Регистрация закрыта</div>
        ) : isFull ? (
          <div className={`w-full ${btnPy} rounded-xl bg-white/3 text-white/25 ${btnText} font-bold text-center`}>Мест нет</div>
        ) : (
          <button onClick={() => onRegister(tournament)}
            className={`w-full ${btnPy} rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white ${btnText} font-bold hover:brightness-110 transition-all`}>
            Зарегистрироваться
          </button>
        )}
      </div>
    </div>
  );
};

export default ClassicTournamentCard;
