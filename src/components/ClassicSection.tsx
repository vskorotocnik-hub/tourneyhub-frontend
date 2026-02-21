import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classicLeaders } from '../data/tournaments';
import type { ClassicTournamentListItem } from '../lib/api';
import ClassicTournamentCard from './ClassicTournamentCard';

interface Props {
  tournaments: ClassicTournamentListItem[];
  loading: boolean;
  currentTime: number;
  myIds: Set<string>;
  onRegister: (t: ClassicTournamentListItem) => void;
}

const ClassicSection = ({ tournaments, loading, currentTime, myIds, onRegister }: Props) => {
  const navigate = useNavigate();
  const [showLeaders, setShowLeaders] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLeaders) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShowLeaders(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showLeaders]);

  const goChat = () => navigate('/messages');

  const leaders = (
    <div className="max-h-80 overflow-y-auto">
      {classicLeaders.map((l) => (
        <div key={l.id} className="flex items-center gap-3 px-3 py-2 border-b border-white/5 last:border-0">
          <span className={`w-6 text-center text-sm font-bold ${l.rank === 1 ? 'text-yellow-400' : l.rank === 2 ? 'text-gray-300' : l.rank === 3 ? 'text-orange-400' : 'text-white/40'}`}>
            {l.rank <= 3 ? ['🥇','🥈','🥉'][l.rank-1] : l.rank}
          </span>
          <img src={l.avatar} alt="" className="w-8 h-8 rounded-full bg-white/10" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{l.username}</p>
            <p className="text-xs text-white/40">{l.wins} побед</p>
          </div>
          <span className="text-xs text-accent-green font-semibold">{l.earnings} UC</span>
        </div>
      ))}
    </div>
  );

  const leaderBtn = (
    <div ref={ref}>
      <button onClick={() => setShowLeaders(!showLeaders)}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${showLeaders ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400' : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/25'}`}>
        👑 Топ-20 лидеров
        <svg className={`w-4 h-4 transition-transform ${showLeaders ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showLeaders && <div className="bg-dark-200/95 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden mt-2">{leaders}</div>}
    </div>
  );

  if (loading) return <div className="space-y-4">{leaderBtn}<div className="text-center py-8"><p className="text-white/50 text-sm">Загрузка турниров...</p></div></div>;
  if (tournaments.length === 0) return <div className="space-y-4">{leaderBtn}<div className="text-center py-8"><p className="text-white/50 text-sm">Нет доступных турниров</p></div></div>;

  return (
    <div className="space-y-4">
      {leaderBtn}
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-4">
        {tournaments.map(t => <ClassicTournamentCard key={t.id} tournament={t} currentTime={currentTime} isRegistered={myIds.has(t.id)} variant="desktop" onRegister={onRegister} onOpenChat={goChat} />)}
      </div>
      {/* Mobile */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tournaments.map(t => <ClassicTournamentCard key={t.id} tournament={t} currentTime={currentTime} isRegistered={myIds.has(t.id)} variant="mobile" onRegister={onRegister} onOpenChat={goChat} />)}
      </div>
    </div>
  );
};

export default ClassicSection;
