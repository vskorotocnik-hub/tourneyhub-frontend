import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { GameMode, TeamMode, ServerRegion, ActiveTournament } from '../types';
import { tournamentLeaders, activeTournaments, serverNames, classicTournaments, classicLeaders, type ClassicTournament, type ClassicMode } from '../data/tournaments';
import { wowMaps, wowActiveMatches, wowLeaders } from '../data/wow';

type ViewState = 'create' | 'searching' | 'found';
type ActionTab = 'create' | 'join';

// Madara quote
const madaraQuote = {
  title: 'MADARA UCHIHA',
  text: 'Очнись и загляни на реальность: не всегда всё идёт по плану. Чем дольше ты живёшь, тем больше начинаешь понимать это.',
};

const GamePage = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [activeMode, setActiveMode] = useState<GameMode>('tdm');
  const [showMadaraBubble, setShowMadaraBubble] = useState(false);

  // Auto-close Madara bubble after 9 seconds
  useEffect(() => {
    if (!showMadaraBubble) return;
    const timer = setTimeout(() => {
      setShowMadaraBubble(false);
    }, 9000);
    return () => clearTimeout(timer);
  }, [showMadaraBubble]);

  const handleMadaraClick = () => {
    setShowMadaraBubble(prev => !prev);
  };
  const [viewState, setViewState] = useState<ViewState>('create');
  const [actionTab, setActionTab] = useState<ActionTab>('create');
  const [showLeaders, setShowLeaders] = useState(false);
  const leadersRef = useRef<HTMLDivElement>(null);

  // Close leaders dropdown on outside click
  useEffect(() => {
    if (!showLeaders) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (leadersRef.current && !leadersRef.current.contains(e.target as Node)) {
        setShowLeaders(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLeaders]);
  
  // Form state
  const [bet, setBet] = useState(300);
  const [teamMode, setTeamMode] = useState<TeamMode>('solo');
  const [teamCount, setTeamCount] = useState(2);
  const [server, setServer] = useState<ServerRegion>('europe');
  const [playerId, setPlayerId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [idError, setIdError] = useState('');

  const validateId = (id: string) => /^\d{10}$/.test(id);
  
  // WoW state
  const [selectedMap, setSelectedMap] = useState(wowMaps[0]);
  
  // Classic state
  const [showClassicRegistration, setShowClassicRegistration] = useState(false);
  const [selectedClassicTournament, setSelectedClassicTournament] = useState<ClassicTournament | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [classicPlayerIds, setClassicPlayerIds] = useState<string[]>(['', '', '', '']);
  
  // Search state
  const [searchTime, setSearchTime] = useState(0);
  const [canCancel, setCanCancel] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [foundOpponent, setFoundOpponent] = useState<{username: string, avatar: string} | null>(null);

  // Timer for search + demo: find opponent after 5 seconds
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let foundTimeout: ReturnType<typeof setTimeout>;
    if (viewState === 'searching') {
      interval = setInterval(() => {
        setSearchTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 30 * 60) setCanCancel(true);
          return newTime;
        });
      }, 1000);
      // Demo: find opponent after 5 seconds
      foundTimeout = setTimeout(() => {
        setFoundOpponent({
          username: 'ProGamer228',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer228'
        });
        setViewState('found');
      }, 5000);
    }
    return () => {
      clearInterval(interval);
      clearTimeout(foundTimeout);
    };
  }, [viewState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateWinnings = () => {
    // Ставка за команду, не за игрока (Solo/Duo — одна команда)
    const totalPool = bet * teamCount;
    const platformFee = totalPool * 0.1;
    const netPool = totalPool - platformFee;
    
    // Prize distribution by place
    const distributions: Record<number, number[]> = {
      2: [1.0, 0],
      3: [0.6, 0.3, 0.1],
      4: [0.5, 0.25, 0.15, 0.1],
    };
    const dist = distributions[teamCount] || distributions[2];
    const prizes = dist.map((pct, i) => ({
      place: i + 1,
      amount: (netPool * pct).toFixed(0),
      pct: Math.round(pct * 100),
    }));
    
    return { totalPool, platformFee, netPool, prizes };
  };

  const handleStartSearch = useCallback(() => {
    if (!playerId.trim()) {
      setIdError('Введи свой ID!');
      return;
    }
    if (!validateId(playerId)) {
      setIdError('ID должен состоять из 10 цифр');
      return;
    }
    if (teamMode === 'duo' && !partnerId.trim()) {
      setIdError('Введи ID напарника!');
      return;
    }
    if (teamMode === 'duo' && !validateId(partnerId)) {
      setIdError('ID напарника должен состоять из 10 цифр');
      return;
    }
    setIdError('');
    setSearchTime(0);
    setCanCancel(false);
    setViewState('searching');
  }, [playerId, partnerId, teamMode]);

  const handleCancelSearch = useCallback(() => {
    if (canCancel) {
      setViewState('create');
      setSearchTime(0);
      setCanCancel(false);
      setFoundOpponent(null);
    }
  }, [canCancel]);

  const handleJoinTournament = (tournament: ActiveTournament) => {
    console.log('Joining tournament:', tournament.id);
    navigate(`/messages/tournament-${tournament.id}`);
  };

  const { totalPool, platformFee, prizes } = calculateWinnings();

  const modes: { id: GameMode; label: string; icon: string }[] = [
    { id: 'tdm', label: 'TDM', icon: '⚔️' },
    { id: 'wow', label: 'WoW', icon: '🎯' },
    { id: 'classic', label: 'Классика', icon: '🏆' },
  ];

  const servers: { id: ServerRegion; label: string }[] = [
    { id: 'europe', label: '🇪🇺 Европа' },
    { id: 'na', label: '🇺🇸 С. Америка' },
    { id: 'asia', label: '🇯🇵 Азия' },
    { id: 'me', label: '🇦🇪 Бл. Восток' },
    { id: 'sa', label: '🇧🇷 Ю. Америка' },
  ];

  // ============= FOUND VIEW =============
  if (viewState === 'found' && foundOpponent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          {/* VS Animation */}
          <div className="flex items-center justify-center gap-6 mb-8">
            {/* Your card */}
            <div className="text-center">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${playerId}`}
                alt="You"
                className="w-20 h-20 rounded-full border-2 border-accent-green mx-auto mb-2"
              />
              <p className="text-sm font-semibold text-white">{playerId}</p>
              <p className="text-xs text-accent-green">Ты</p>
            </div>
            
            {/* VS */}
            <div className="text-3xl font-bold text-yellow-400 animate-pulse">VS</div>
            
            {/* Opponent card */}
            <div className="text-center">
              <img 
                src={foundOpponent.avatar}
                alt={foundOpponent.username}
                className="w-20 h-20 rounded-full border-2 border-red-500 mx-auto mb-2"
              />
              <p className="text-sm font-semibold text-white">{foundOpponent.username}</p>
              <p className="text-xs text-red-400">Соперник</p>
            </div>
          </div>

          {/* Match info */}
          <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-6">
            <p className="text-lg font-bold text-accent-green mb-1">🎮 Матч найден!</p>
            <p className="text-xs text-white/60">TDM • {teamMode === 'solo' ? 'Solo' : 'Duo'} • Ставка {bet} UC</p>
          </div>

          {/* Go to chat button */}
          <button
            onClick={() => navigate('/messages/tournament-new')}
            className="w-full py-3.5 rounded-xl bg-red-600 
                     text-white font-semibold hover:opacity-90 transition-opacity"
          >
            💬 Перейти в чат матча
          </button>
          
          <p className="text-xs text-white/40 mt-3">
            ⚠️ Сыграйте в течение 1 часа. Отменить нельзя.
          </p>
        </div>
      </div>
    );
  }

  // ============= SEARCHING VIEW =============
  if (viewState === 'searching') {
    const prizes = [
      { place: 1, label: '🥇 1 место', amount: (totalPool * 0.9).toFixed(0) },
      { place: 2, label: '🥈 2 место', amount: '0' },
    ];
    if (teamCount >= 3) {
      prizes[1].amount = (totalPool * 0.9 * 0.3).toFixed(0);
      prizes[0].amount = (totalPool * 0.9 * 0.7).toFixed(0);
    }

    return (
      <div className="min-h-screen pb-44">
        <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4">
          {/* Header */}
          <div className="flex items-center relative mb-4 py-1">
            <button onClick={() => setViewState('create')} className="flex items-center gap-2 text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">TDM • {teamMode === 'solo' ? 'Solo' : 'Duo'} • {bet} UC</span>
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">🔍 Поиск соперников</h1>
          </div>

          {/* Action Status Banner */}
          <div className="bg-red-600/30 rounded-xl border border-red-500/40 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 animate-ping absolute" />
                  <div className="w-4 h-4 rounded-full bg-yellow-500 relative" />
                </div>
                <span className="text-sm font-semibold text-white">Активный поиск</span>
              </div>
              <span className="text-2xl font-mono font-bold text-white">{formatTime(searchTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((searchTime / (30 * 60)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-white/50">{Math.round((searchTime / (30 * 60)) * 100)}%</span>
            </div>
          </div>

          {/* Teams Visual */}
          <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-3">👥 Команды ({1}/{teamCount})</h3>
            <div className="space-y-2">
              {Array.from({ length: teamCount }).map((_, i) => (
                <div key={i} className={`flex items-center justify-between rounded-lg p-3 transition-all
                                       ${i === 0 ? 'bg-accent-green/10 border border-accent-green/30' : 'bg-white/5 border border-dashed border-white/10'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{i === 0 ? '🟢' : '⏳'}</span>
                    <div>
                      <p className="text-sm text-white font-medium">
                        {i === 0 ? `Твоя команда` : `Ожидаем игрока...`}
                      </p>
                      <p className="text-xs text-white/40">
                        {i === 0 ? `ID: ${playerId}${teamMode === 'duo' ? ` + ${partnerId}` : ''}` : 'Слот свободен'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${i === 0 ? 'bg-accent-green/20 text-accent-green' : 'bg-white/10 text-white/40'}`}>
                    {i === 0 ? '✓ Готов' : '...'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prizes */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-xl border border-yellow-500/30 p-4 mb-4">
            <h3 className="text-sm font-semibold text-yellow-400 mb-3">🏆 Призы по местам</h3>
            <div className="flex gap-4">
              {prizes.map((p) => (
                <div key={p.place} className="flex-1 text-center">
                  <p className="text-lg font-bold text-white">{p.amount} UC</p>
                  <p className="text-xs text-white/50">{p.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
            <h3 className="text-sm font-semibold text-white mb-2">📋 Что дальше?</h3>
            <ol className="text-xs text-white/60 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">1.</span>
                <span>Соперники найдены → создастся чат турнира</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">2.</span>
                <span>В чате договоритесь и начнёте матч</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">3.</span>
                <span>Укажите результат → получите выигрыш!</span>
              </li>
            </ol>
          </div>
        </main>

        {/* Sticky Cancel Button - above bottom nav */}
        <div className="fixed bottom-16 left-0 right-0 p-4">
          <button
            onClick={handleCancelSearch}
            disabled={!canCancel}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all
                      ${canCancel 
                        ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30' 
                        : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed'}`}
          >
            {canCancel ? '❌ Отменить поиск' : `🔒 Отмена доступна через ${formatTime(30 * 60 - searchTime)}`}
          </button>
        </div>
      </div>
    );
  }

  // ============= CREATE VIEW =============
  return (
    <div className="min-h-screen pb-40">
      {/* Madara - Fixed position, left side */}
      <div className="hidden desk:flex fixed left-16 top-[175px] bottom-[-40px] w-[320px] lg:w-[400px] z-20 items-end justify-center pointer-events-none">
        <img 
          src="/madara.png" 
          alt="Madara Uchiha"
          className="pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-105"
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
            transform: 'scale(1.128)',
            transformOrigin: 'bottom',
          }}
          onClick={handleMadaraClick}
        />
        {/* Speech Bubble - above everything */}
        {showMadaraBubble && (
          <div className="absolute top-[80px] left-[85%] z-[9999] animate-in fade-in zoom-in-95 duration-300 pointer-events-auto">
            {/* Comic dots connector */}
            <div className="absolute -left-10 top-6 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-4 h-4 rounded-full bg-red-500/80" />
            </div>
            <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-red-500/40 rounded-xl p-4 min-w-[300px] max-w-[340px] shadow-2xl shadow-red-500/30 overflow-hidden">
              {/* Akatsuki clouds background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <ellipse cx="20" cy="30" rx="12" ry="8" fill="#dc2626" />
                  <ellipse cx="75" cy="70" rx="15" ry="10" fill="#dc2626" />
                  <ellipse cx="50" cy="50" rx="10" ry="6" fill="#dc2626" />
                </svg>
              </div>
              {/* Tail pointing left */}
              <div className="absolute -left-3 top-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-red-500/40" />
              <div className="absolute -left-[10px] top-6 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-zinc-900/95" />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-600/15 via-transparent to-red-900/20 pointer-events-none" />
              {/* Content */}
              <div className="relative">
                <h4 className="text-xs uppercase tracking-widest text-red-400 font-bold mb-1">{madaraQuote.title}</h4>
                <div className="w-12 h-px bg-gradient-to-r from-red-500 to-transparent mb-3" />
                <p className="text-sm text-zinc-100 leading-relaxed font-medium">{madaraQuote.text}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop/Tablet version */}
      <div className="hidden desk:block">
        {/* Header - fixed under global header (desktop only) */}
        <header className="fixed top-[57px] left-0 right-0 px-8 py-3 z-30 bg-dark-100/95">
          <div className="flex items-center justify-between">
            {/* Left - Back button */}
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Турниры</span>
            </button>
            {/* Right - UC Balance */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-dark-200/80 border border-white/10 rounded-xl px-4 py-2">
                <span className="text-white font-bold">1,250 UC</span>
              </div>
              <button 
                onClick={() => navigate(`/game/${gameId}/currency`)}
                className="px-4 py-2 text-sm font-medium text-white 
                               bg-accent-green hover:bg-accent-green/90
                               rounded-xl transition-all">
                Пополнить
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - shifted right, with top padding for fixed header */}
        <main className="ml-[400px] lg:ml-[500px] max-w-[1400px] px-8 pt-24 pb-4">

        {/* Mode Tabs + Balance */}
        <div className="flex items-center gap-4 mb-4">
          {/* Mode Tabs - narrower */}
          <div className="flex bg-dark-200/60 backdrop-blur-sm rounded-xl p-1 border border-white/10">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${activeMode === mode.id 
                            ? 'bg-red-600 text-white border border-red-400' 
                            : 'text-white/50 hover:text-white/70 border border-transparent'}`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
          
          </div>

        {/* ===== ACTION TABS (only for TDM and WoW) ===== */}
        {activeMode !== 'classic' && (
        <div className="relative flex gap-2 mb-4">
          <button
            onClick={() => setActionTab('create')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${actionTab === 'create' 
                        ? 'bg-accent-green/20 text-accent-green border border-accent-green/50' 
                        : 'bg-slate-800/60 text-white/50 border border-white/10 hover:text-white/70'}`}
          >
            🎮 Создать
          </button>
          <button
            onClick={() => setActionTab('join')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${actionTab === 'join' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                        : 'bg-dark-200/60 text-white/50 border border-white/10 hover:text-white/70'}`}
          >
            ⚡ Вступить
          </button>
          <div ref={leadersRef} className="ml-auto relative">
            <button
              onClick={() => setShowLeaders(!showLeaders)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1
                        ${showLeaders 
                          ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400' 
                          : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/25'}`}
            >
              👑 Топ-20
              <svg 
                className={`w-3 h-3 transition-transform ${showLeaders ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* ===== LEADERS DROPDOWN ===== */}
            {showLeaders && (
              <div className="absolute top-full right-0 mt-2 w-72 z-50 bg-dark-200/95 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                {(activeMode === 'wow' ? wowLeaders : tournamentLeaders).map((leader) => (
                  <div 
                    key={leader.id}
                    className="flex items-center gap-3 px-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <span className={`w-6 text-center text-sm font-bold
                                    ${leader.rank === 1 ? 'text-yellow-400' : 
                                      leader.rank === 2 ? 'text-gray-300' : 
                                      leader.rank === 3 ? 'text-orange-400' : 'text-white/40'}`}>
                      {leader.rank <= 3 ? ['🥇', '🥈', '🥉'][leader.rank - 1] : leader.rank}
                    </span>
                    <img 
                      src={leader.avatar} 
                      alt={leader.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{leader.username}</p>
                      <p className="text-xs text-white/40">{leader.wins} побед</p>
                    </div>
                    <span className="text-sm font-semibold text-accent-green">{leader.earnings} UC</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
        )}

        {/* ===== WOW MODE CONTENT ===== */}
        {activeMode === 'wow' && actionTab === 'create' && (
          <div className="space-y-4">
            {/* Map Selection - Horizontal Scroll */}
            <div>
              <p className="text-xs text-white/60 mb-2">🗺️ Выбери карту</p>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                {wowMaps.map((map) => (
                  <div
                    key={map.id}
                    onClick={() => setSelectedMap(map)}
                    className={`flex-shrink-0 w-48 sm:w-52 md:w-56 max-w-[240px] snap-start cursor-pointer rounded-xl overflow-hidden border-2 transition-all
                              ${selectedMap.id === map.id 
                                ? 'border-red-500 ring-2 ring-red-500/30' 
                                : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="relative h-[86px] sm:h-[94px] md:h-[100px]">
                      <img src={map.image} alt={map.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white/80 font-mono">
                        ID: {map.mapId}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-red-600/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-medium">
                        Арена
                      </div>
                    </div>
                    <div className="bg-dark-200/90 p-2">
                      <p className="text-xs text-white font-medium truncate">{map.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Map Info */}
            <div className="bg-zinc-800/90 backdrop-blur-sm rounded-xl border border-zinc-600 p-4">
              <p className="text-sm text-white font-medium mb-3">📋 Параметры карты</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-700/80 rounded-lg p-2.5 text-center border border-zinc-600">
                  <p className="text-xs text-zinc-300 mb-1">Формат</p>
                  <p className="text-sm font-bold text-purple-300">{selectedMap.format}</p>
                </div>
                <div className="bg-zinc-700/80 rounded-lg p-2.5 text-center border border-zinc-600">
                  <p className="text-xs text-zinc-300 mb-1">Команд</p>
                  <p className="text-sm font-bold text-cyan-300">{selectedMap.teamCount}</p>
                </div>
                <div className="bg-zinc-700/80 rounded-lg p-2.5 text-center border border-zinc-600">
                  <p className="text-xs text-zinc-300 mb-1">Раундов</p>
                  <p className="text-sm font-bold text-yellow-300">{selectedMap.rounds}</p>
                </div>
              </div>
              {selectedMap.rules && (
                <p className="text-xs text-zinc-300 mt-3 text-center bg-zinc-700/50 rounded-lg py-2 px-3">{selectedMap.rules}</p>
              )}
            </div>

            {/* WoW Bet & Settings */}
            <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
              {/* Prize Distribution for WoW */}
              {(() => {
                const wowPool = bet * selectedMap.teamCount;
                const wowFee = wowPool * 0.1;
                const wowNet = wowPool - wowFee;
                const wowPrizes = selectedMap.teamCount === 2 
                  ? [{ place: 1, pct: 100, amount: wowNet.toFixed(0) }, { place: 2, pct: 0, amount: '0' }]
                  : selectedMap.teamCount === 3
                  ? [{ place: 1, pct: 70, amount: (wowNet * 0.7).toFixed(0) }, { place: 2, pct: 30, amount: (wowNet * 0.3).toFixed(0) }, { place: 3, pct: 0, amount: '0' }]
                  : [{ place: 1, pct: 50, amount: (wowNet * 0.5).toFixed(0) }, { place: 2, pct: 30, amount: (wowNet * 0.3).toFixed(0) }, { place: 3, pct: 20, amount: (wowNet * 0.2).toFixed(0) }, { place: 4, pct: 0, amount: '0' }];
                return (
                  <div className="bg-red-600/20 rounded-xl p-3 mb-4 border border-red-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-white/60">💰 Выплаты по местам</p>
                      <span className="text-xs text-white/40">Пул {wowPool} UC • Комиссия {wowFee.toFixed(0)} UC (10%)</span>
                    </div>
                    <div className={`grid gap-1 ${wowPrizes.length === 2 ? 'grid-cols-2' : wowPrizes.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                      {wowPrizes.map((p) => (
                        <div key={p.place} className={`text-center py-1.5 rounded-lg ${p.place === 1 ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                          <p className={`text-sm font-bold ${p.place === 1 ? 'text-yellow-400' : p.place === selectedMap.teamCount ? 'text-red-400' : 'text-white/70'}`}>
                            {p.amount} UC
                          </p>
                          <p className="text-[9px] text-white/40">
                            {p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : '4️⃣'} {p.pct}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Rating Prediction */}
              {(() => {
                const wowMultiplier = selectedMap.teamCount === 2 ? 1 : selectedMap.teamCount === 3 ? 1.5 : 2;
                const winRating = Math.round((10 + bet * 0.5) * wowMultiplier);
                const loseRating = Math.round((5 + bet * 0.3) * wowMultiplier);
                return (
                  <div className="flex justify-center gap-6 mb-4 text-xs">
                    <span className="text-white/60">Победа: <span className="text-accent-green font-semibold">+{winRating} 🏆</span></span>
                    <span className="text-white/60">Поражение: <span className="text-red-400 font-semibold">-{loseRating} 🏆</span></span>
                  </div>
                );
              })()}

              {/* Bet Slider */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-white/60">� Ставка (UC)</p>
                  <span className="text-xl font-bold text-accent-green">{bet} UC</span>
                </div>
                {(() => {
                  const betValues = [60,120,180,240,300,360,420,480,540,600,720,840,960,1080,1200,1500,1800,2100,2400,2700,3000];
                  const currentIndex = betValues.indexOf(bet) >= 0 ? betValues.indexOf(bet) : 0;
                  return (
                    <>
                      <input
                        type="range"
                        min={0}
                        max={betValues.length - 1}
                        value={currentIndex}
                        onChange={(e) => setBet(betValues[Number(e.target.value)])}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                                 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
                                 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:shadow-lg
                                 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30
                                 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150"
                      />
                      <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>60 UC</span>
                        <span>3000 UC</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Server */}
              <div className="mb-4">
                <p className="text-xs text-white/60 mb-2">🌍 Сервер</p>
                <div className="flex flex-wrap gap-2">
                  {servers.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setServer(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all
                                ${server === s.id 
                                  ? 'bg-red-600/30 text-red-400 border border-red-500/50' 
                                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player IDs - based on playersPerTeam */}
              <div className="mb-4">
                <p className="text-sm text-white font-medium mb-2">🆔 ID игроков ({selectedMap.playersPerTeam} чел.)</p>
                <div className="space-y-2">
                  <div>
                    <input
                      type="text"
                      value={playerId}
                      onChange={(e) => { setPlayerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
                      placeholder="Твой ID (10 цифр)"
                      maxLength={10}
                      className={`w-full bg-zinc-700/80 border rounded-xl px-4 py-3
                               text-sm text-white placeholder-zinc-400 outline-none
                               focus:border-red-500/50 transition-colors ${idError && !validateId(playerId) ? 'border-red-500' : 'border-zinc-600'}`}
                    />
                    <p className="text-xs text-zinc-400 mt-1">{playerId.length}/10 цифр</p>
                  </div>
                  {selectedMap.playersPerTeam >= 2 && (
                    <div>
                      <input
                        type="text"
                        value={partnerId}
                        onChange={(e) => { setPartnerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
                        placeholder="ID друга #2 (10 цифр)"
                        maxLength={10}
                        className="w-full bg-zinc-700/80 border border-zinc-600 rounded-xl px-4 py-3
                                 text-sm text-white placeholder-zinc-400 outline-none
                                 focus:border-red-500/50 transition-colors"
                      />
                      <p className="text-xs text-zinc-400 mt-1">{partnerId.length}/10 цифр</p>
                    </div>
                  )}
                  {selectedMap.playersPerTeam >= 3 && (
                    <input
                      type="text"
                      placeholder="ID друга #3 (10 цифр)"
                      maxLength={10}
                      className="w-full bg-zinc-700/80 border border-zinc-600 rounded-xl px-4 py-3
                               text-sm text-white placeholder-zinc-400 outline-none
                               focus:border-red-500/50 transition-colors"
                    />
                  )}
                  {selectedMap.playersPerTeam >= 4 && (
                    <input
                      type="text"
                      placeholder="ID друга #4 (10 цифр)"
                      maxLength={10}
                      className="w-full bg-zinc-700/80 border border-zinc-600 rounded-xl px-4 py-3
                               text-sm text-white placeholder-zinc-400 outline-none
                               focus:border-red-500/50 transition-colors"
                    />
                  )}
                </div>
                {idError && <p className="text-red-400 text-xs mt-2">{idError}</p>}
              </div>

              {/* Warning about cheats */}
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-red-400/80">⚠️ Использование читов или мошенничества — блокировка, ставка сгорает.</p>
                  <button 
                    onClick={() => setShowRulesModal(true)}
                    className="text-xs text-purple-400 underline hover:text-purple-300"
                  >
                    Правила
                  </button>
                </div>
              </div>

              {/* Start Search Button */}
              <button
                onClick={handleStartSearch}
                disabled={!playerId.trim()}
                className="w-full py-3.5 rounded-xl bg-red-600 
                         text-white font-semibold hover:opacity-90 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 Найти соперника
              </button>
            </div>
          </div>
        )}

        {/* ===== WOW JOIN TAB ===== */}
        {activeMode === 'wow' && actionTab === 'join' && (
          <div className="space-y-3">
            {wowActiveMatches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/40">Нет активных матчей</p>
                <p className="text-xs text-white/30 mt-1">Создай свой!</p>
              </div>
            ) : (
              wowActiveMatches.map((match) => {
                const isFull = match.teamsJoined >= match.teamsNeeded;
                return (
                  <div key={match.id} className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                    <div className="flex gap-3 mb-3">
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={match.map.image} alt={match.map.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-1 left-1 text-[8px] text-white/80 font-mono">ID: {match.map.mapId}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{match.map.name}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded">{match.map.format}</span>
                          <span className="text-xs bg-white/10 text-white/60 px-1.5 py-0.5 rounded">{match.map.rounds}R</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img src={match.creatorAvatar} alt="" className="w-6 h-6 rounded-full" />
                        <span className="text-xs text-white/70">{match.creatorName}</span>
                      </div>
                      <span className="text-sm font-bold text-accent-green">{match.bet} UC</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                      <span>{serverNames[match.server]}</span>
                      <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-yellow-400'}`}>
                        {match.teamsJoined}/{match.teamsNeeded} команд
                      </span>
                      <span>{formatTime(match.searchTime)} в поиске</span>
                    </div>
                    <button
                      onClick={() => navigate(`/messages/wow-${match.id}`)}
                      disabled={isFull}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                                ${isFull 
                                  ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                                  : 'bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30'}`}
                    >
                      {isFull ? '🔒 Матч заполнен' : '⚡ Вступить'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===== TDM CREATE TOURNAMENT SECTION ===== */}
        {activeMode === 'tdm' && actionTab === 'create' && (
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-4">

          {/* Prediction */}
          <div className="bg-red-600/20 rounded-xl p-3 mb-4 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/60">💰 Выплаты по местам</p>
              <span className="text-xs text-white/40">Пул {totalPool} UC • Комиссия {platformFee.toFixed(0)} UC (10%)</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {prizes.map((p) => (
                <div key={p.place} className={`text-center py-1.5 rounded-lg ${p.place === 1 ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                  <p className={`text-sm font-bold ${p.place === 1 ? 'text-yellow-400' : p.place === teamCount ? 'text-red-400' : 'text-white/70'}`}>
                    {p.amount} UC
                  </p>
                  <p className="text-[9px] text-white/40">
                    {p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : '4️⃣'} {p.pct}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Prediction */}
          {(() => {
            const teamMultiplier = teamCount === 2 ? 1 : teamCount === 3 ? 1.5 : 2;
            const winRating = Math.round((10 + bet * 0.5) * teamMultiplier);
            const loseRating = Math.round((5 + bet * 0.3) * teamMultiplier);
            return (
              <div className="flex justify-center gap-6 mb-4 text-xs">
                <span className="text-white/60">Победа: <span className="text-accent-green font-semibold">+{winRating} 🏆</span></span>
                <span className="text-white/60">Поражение: <span className="text-red-400 font-semibold">-{loseRating} 🏆</span></span>
              </div>
            );
          })()}

          {/* Bet Slider */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-white/60">💰 Ставка (UC)</p>
              <span className="text-xl font-bold text-accent-green">{bet} UC</span>
            </div>
            {(() => {
              const betValues = [60,120,180,240,300,360,420,480,540,600,720,840,960,1080,1200,1500,1800,2100,2400,2700,3000];
              const currentIndex = betValues.indexOf(bet) >= 0 ? betValues.indexOf(bet) : 0;
              return (
                <>
                  <input
                    type="range"
                    min={0}
                    max={betValues.length - 1}
                    value={currentIndex}
                    onChange={(e) => setBet(betValues[Number(e.target.value)])}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                             [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
                             [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:shadow-lg
                             [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30
                             [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>60 UC</span>
                    <span>3000 UC</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Team Mode */}
          <div className="mb-4">
            <p className="text-xs text-white/60 mb-2">👥 Режим команды</p>
            <div className="flex gap-2 mb-3">
              {(['solo', 'duo'] as TeamMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTeamMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border
                            ${teamMode === mode 
                              ? 'bg-red-600/30 border-red-500 text-white' 
                              : 'bg-white/5 border-white/10 text-white/50'}`}
                >
                  {mode === 'solo' ? '👤 Solo' : '👥 Duo'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setTeamCount(count)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border
                            ${teamCount === count 
                              ? 'bg-red-600/30 border-red-500 text-white' 
                              : 'bg-white/5 border-white/10 text-white/50'}`}
                >
                  {count} команды
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-2 text-center">
              Всего игроков: {teamMode === 'solo' ? teamCount : teamCount * 2}
            </p>
          </div>

          {/* Server */}
          <div className="mb-4">
            <p className="text-xs text-white/60 mb-2">🌐 Сервер</p>
            <div className="grid grid-cols-3 gap-2">
              {servers.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServer(s.id)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all border
                            ${server === s.id 
                              ? 'bg-red-600/30 border-red-500 text-white' 
                              : 'bg-white/5 border-white/10 text-white/50'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Player IDs */}
          <div className="mb-4">
            <p className="text-xs text-white/60 mb-2">🆔 ID в игре</p>
            <div className="mb-2">
              <input
                type="text"
                value={playerId}
                onChange={(e) => { setPlayerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
                placeholder="Твой ID (10 цифр)"
                maxLength={10}
                className={`w-full bg-white/5 border rounded-lg px-3 py-2.5
                         text-sm text-white placeholder-white/30 outline-none focus:border-red-500/50 ${idError && !validateId(playerId) ? 'border-red-500' : 'border-white/10'}`}
              />
              <p className="text-xs text-white/40 mt-1">{playerId.length}/10 цифр</p>
            </div>
            {teamMode === 'duo' && (
              <div>
                <input
                  type="text"
                  value={partnerId}
                  onChange={(e) => { setPartnerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
                  placeholder="ID напарника (10 цифр)"
                  maxLength={10}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5
                           text-sm text-white placeholder-white/30 outline-none focus:border-red-500/50"
                />
                <p className="text-xs text-white/40 mt-1">{partnerId.length}/10 цифр</p>
              </div>
            )}
            {idError && <p className="text-red-400 text-xs mt-2">{idError}</p>}
          </div>

          {/* Map & Rules Info */}
          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <p className="text-xs text-white/70 mb-1">📍 <strong>Карта:</strong> Warehouse (TDM)</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-red-400/80">⚠️ Использование читов или мошенничества — блокировка, ставка сгорает.</p>
              <button 
                onClick={() => setShowRulesModal(true)}
                className="text-xs text-purple-400 underline hover:text-purple-300"
              >
                Подробнее
              </button>
            </div>
          </div>

          {/* Rules Modal */}
          {showRulesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-dark-200 border border-white/20 rounded-2xl p-4 max-w-sm w-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-white">📋 Правила турнира</h3>
                  <button onClick={() => setShowRulesModal(false)} className="text-white/50 hover:text-white">
                    ✕
                  </button>
                </div>
                <div className="space-y-2 text-xs text-white/70">
                  <p>🚫 <strong className="text-red-400">Запрещено:</strong> читы, эмуляторы, баги</p>
                  <p>⚠️ При нарушении — <strong className="text-red-400">бан аккаунта</strong> + потеря ставки</p>
                  <p>📹 Администрация может запросить видео матча</p>
                  <p>🤝 Споры решаются через поддержку в чате</p>
                  <p>⏱️ На подачу результата — 30 минут после матча</p>
                </div>
                <button 
                  onClick={() => setShowRulesModal(false)}
                  className="w-full mt-4 py-2 rounded-lg bg-red-600/30 border border-red-500/50 
                           text-red-300 text-sm font-medium hover:bg-red-600/40"
                >
                  Понятно
                </button>
              </div>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleStartSearch}
            className="w-full py-3.5 rounded-xl bg-red-600 
                     text-white font-bold hover:opacity-90 transition-opacity"
          >
            🚀 Найти соперника
          </button>
        </div>
        )}

        {/* ===== JOIN TOURNAMENT SECTION ===== */}
        {activeMode === 'tdm' && actionTab === 'join' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">⚡ Доступные турниры</h2>
            <span className="text-xs text-white/40">{activeTournaments.length} активных</span>
          </div>
          
          <div className="space-y-2">
            {activeTournaments.map((t) => (
              <div 
                key={t.id} 
                className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-3"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src={t.creatorAvatar} 
                    alt={t.creatorName}
                    className="w-10 h-10 rounded-full border border-white/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.creatorName}</p>
                    <p className="text-xs text-white/40">
                      {t.teamMode === 'solo' ? 'Solo' : 'Duo'} • {t.teamCount} команды • {serverNames[t.server]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-accent-green">{t.bet} UC</p>
                    <p className="text-xs text-white/40">ставка</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {Array.from({ length: t.playersJoined }).map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-red-500/50 border-2 border-dark-200 flex items-center justify-center text-xs">
                          👤
                        </div>
                      ))}
                      {Array.from({ length: t.playersNeeded - t.playersJoined }).map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-white/10 border-2 border-dark-200 flex items-center justify-center text-xs text-white/30">
                          ?
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-white/50">{t.playersJoined}/{t.playersNeeded}</span>
                  </div>
                  <button
                    onClick={() => handleJoinTournament(t)}
                    className="px-4 py-1.5 rounded-lg bg-accent-green/20 border border-accent-green/50 
                             text-accent-green text-xs font-semibold hover:bg-accent-green/30 transition-colors"
                  >
                    Вступить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/30 text-center mt-3">
            💡 После вступления отключиться можно только через 1 час
          </p>
        </div>
        )}

        {/* ===== CLASSIC MODE CONTENT ===== */}
        {activeMode === 'classic' && (
          <div className="space-y-4">
            {/* Top-20 Button - Full Width */}
            <div ref={leadersRef}>
              <button
                onClick={() => setShowLeaders(!showLeaders)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                          ${showLeaders 
                            ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400' 
                            : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/25'}`}
              >
                👑 Топ-20 лидеров
                <svg 
                  className={`w-4 h-4 transition-transform ${showLeaders ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Leaders Dropdown for Classic */}
              {showLeaders && (
                <div className="bg-dark-200/95 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden mt-2">
                  <div className="max-h-80 overflow-y-auto">
                    {classicLeaders.map((leader) => (
                      <div 
                        key={leader.id}
                        className="flex items-center gap-3 px-3 py-2 border-b border-white/5 last:border-0"
                      >
                        <span className={`w-6 text-center text-sm font-bold
                                        ${leader.rank === 1 ? 'text-yellow-400' : 
                                          leader.rank === 2 ? 'text-gray-300' : 
                                          leader.rank === 3 ? 'text-orange-400' : 'text-white/40'}`}>
                          {leader.rank <= 3 ? ['🥇', '🥈', '🥉'][leader.rank - 1] : leader.rank}
                        </span>
                        <img src={leader.avatar} alt="" className="w-8 h-8 rounded-full bg-white/10" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{leader.username}</p>
                          <p className="text-xs text-white/40">{leader.wins} побед</p>
                        </div>
                        <span className="text-xs text-accent-green font-semibold">{leader.earnings} UC</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tournament Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {classicTournaments.map((tournament) => {
                const timeLeft = tournament.startTime.getTime() - currentTime;
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                const modeLabels: Record<ClassicMode, string> = { solo: '👤 Solo', duo: '👥 Duo', squad: '🎯 Squad' };
                const modeColors: Record<ClassicMode, string> = { solo: 'bg-purple-600', duo: 'bg-cyan-600', squad: 'bg-orange-600' };
                
                return (
                  <div 
                    key={tournament.id}
                    className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
                  >
                    {/* Map Image */}
                    <div className="relative h-32 sm:h-36">
                      <img src={tournament.mapImage} alt={tournament.map} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className={`absolute top-2 left-2 ${modeColors[tournament.mode]} backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-medium`}>
                        {modeLabels[tournament.mode]}
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white/80">
                        {serverNames[tournament.server]}
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <p className="text-white font-bold text-lg">{tournament.map}</p>
                      </div>
                    </div>
                    
                    {/* Tournament Info */}
                    <div className="p-3 space-y-3">
                      {/* Timer */}
                      <div className="flex items-center gap-2 bg-yellow-500/10 rounded-lg p-2.5">
                        <span className="text-yellow-400 text-lg">⏱️</span>
                        <div className="flex-1">
                          <p className="text-xs text-white/60 mb-0.5">Запуск через</p>
                          <p className="text-base font-bold text-yellow-400">
                            {days > 0 && `${days}д `}{hours > 0 && `${hours}ч `}{minutes}м {seconds}с
                          </p>
                        </div>
                      </div>
                      
                      {/* Entry & Prize */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-white/60 mb-0.5">Вход</p>
                          <p className="text-base font-bold text-white">{tournament.entryFee} UC</p>
                        </div>
                        <div className="bg-accent-green/10 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-white/60 mb-0.5">Призовой фонд</p>
                          <p className="text-base font-bold text-accent-green">{tournament.prizePool} UC</p>
                        </div>
                      </div>
                      
                      {/* Players */}
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span>Участников: {tournament.registeredPlayers}/{tournament.maxPlayers}</span>
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${(tournament.registeredPlayers / tournament.maxPlayers) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Info text */}
                      <p className="text-xs text-white/60 leading-relaxed">
                        📌 После регистрации откроется чат с информацией о турнире.
                      </p>
                      
                      {/* Join Button */}
                      <button
                        onClick={() => {
                          setSelectedClassicTournament(tournament);
                          setClassicPlayerIds(tournament.mode === 'solo' ? [''] : tournament.mode === 'duo' ? ['', ''] : ['', '', '', '']);
                          setShowClassicRegistration(true);
                        }}
                        className="w-full py-2.5 rounded-lg bg-purple-600 
                                 text-white text-sm font-bold hover:opacity-90 transition-opacity"
                      >
                        🎮 Зарегистрироваться
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        </main>
      </div>

      {/* Mobile/Tablet: No Madara, full width content */}
      <div className="desk:hidden">
        <main className="max-w-[1800px] mx-auto px-2 md:px-8 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {/* Left - Back button */}
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Турниры</span>
            </button>
            {/* Right - UC Balance */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-dark-200/80 border border-white/10 rounded-lg px-3 py-1.5">
                <span className="text-white text-sm font-bold">1,250 UC</span>
              </div>
              <button 
                onClick={() => navigate(`/game/${gameId}/currency`)}
                className="px-3 py-1.5 text-xs font-medium text-white 
                         bg-accent-green hover:bg-accent-green/90
                         rounded-lg transition-all">
                Пополнить
              </button>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-dark-200/60 backdrop-blur-sm rounded-xl p-1 mb-3 border border-white/10">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
                          ${activeMode === mode.id 
                            ? 'bg-purple-600 text-white' 
                            : 'text-white/50 hover:text-white/70'}`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>

          {/* Action Tabs - Создать / Вступить */}
          {activeMode !== 'classic' && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActionTab('create')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                          ${actionTab === 'create' 
                            ? 'bg-accent-green/20 text-accent-green border border-accent-green/50' 
                            : 'bg-dark-200/60 text-white/50 border border-white/10'}`}
              >
                🎮 Создать
              </button>
              <button
                onClick={() => setActionTab('join')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                          ${actionTab === 'join' 
                            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' 
                            : 'bg-dark-200/60 text-white/50 border border-white/10'}`}
              >
                ⚡ Вступить
              </button>
            </div>
          )}

          {/* ===== TDM CREATE TOURNAMENT SECTION (Mobile) ===== */}
          {activeMode === 'tdm' && actionTab === 'create' && (
          <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-4">

            {/* Prediction */}
            <div className="bg-red-600/20 rounded-xl p-3 mb-4 border border-red-500/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/60">💰 Выплаты по местам</p>
                <span className="text-xs text-white/40">Пул {totalPool} UC • Комиссия {platformFee.toFixed(0)} UC (10%)</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {prizes.map((p) => (
                  <div key={p.place} className={`text-center py-1.5 rounded-lg ${p.place === 1 ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                    <p className={`text-sm font-bold ${p.place === 1 ? 'text-yellow-400' : p.place === teamCount ? 'text-red-400' : 'text-white/70'}`}>
                      {p.amount} UC
                    </p>
                    <p className="text-[9px] text-white/40">
                      {p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : '4️⃣'} {p.pct}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Prediction */}
            {(() => {
              const teamMultiplier = teamCount === 2 ? 1 : teamCount === 3 ? 1.5 : 2;
              const winRating = Math.round((10 + bet * 0.5) * teamMultiplier);
              const loseRating = Math.round((5 + bet * 0.3) * teamMultiplier);
              return (
                <div className="flex justify-center gap-6 mb-4 text-xs">
                  <span className="text-white/60">Победа: <span className="text-accent-green font-semibold">+{winRating} 🏆</span></span>
                  <span className="text-white/60">Поражение: <span className="text-red-400 font-semibold">-{loseRating} 🏆</span></span>
                </div>
              );
            })()}

            {/* Bet Slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs text-white/60">💰 Ставка (UC)</p>
                <span className="text-xl font-bold text-accent-green">{bet} UC</span>
              </div>
              {(() => {
                const betValues = [60,120,180,240,300,360,420,480,540,600,720,840,960,1080,1200,1500,1800,2100,2400,2700,3000];
                const currentIndex = betValues.indexOf(bet) >= 0 ? betValues.indexOf(bet) : 0;
                return (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={betValues.length - 1}
                      value={currentIndex}
                      onChange={(e) => setBet(betValues[Number(e.target.value)])}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                               [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
                               [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:shadow-lg
                               [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>60 UC</span>
                      <span>3000 UC</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Team Mode */}
            <div className="mb-4">
              <p className="text-xs text-white/60 mb-2">👥 Режим команды</p>
              <div className="flex gap-2 mb-3">
                {(['solo', 'duo'] as TeamMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTeamMode(mode)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border
                              ${teamMode === mode 
                                ? 'bg-red-600/30 border-red-500 text-white' 
                                : 'bg-white/5 border-white/10 text-white/50'}`}
                  >
                    {mode === 'solo' ? '👤 Solo' : '👥 Duo'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTeamCount(count)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border
                              ${teamCount === count 
                                ? 'bg-red-600/30 border-red-500 text-white' 
                                : 'bg-white/5 border-white/10 text-white/50'}`}
                  >
                    {count} команды
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/30 mt-2 text-center">
                Всего игроков: {teamMode === 'solo' ? teamCount : teamCount * 2}
              </p>
            </div>

            {/* Server */}
            <div className="mb-4">
              <p className="text-xs text-white/60 mb-2">🌐 Сервер</p>
              <div className="grid grid-cols-3 gap-2">
                {servers.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setServer(s.id)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all border
                              ${server === s.id 
                                ? 'bg-red-600/30 border-red-500 text-white' 
                                : 'bg-white/5 border-white/10 text-white/50'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Player IDs */}
            <div className="mb-4">
              <p className="text-xs text-white/60 mb-2">🆔 ID в игре</p>
              <div className="mb-2">
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => { setPlayerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
                  placeholder="Твой ID (10 цифр)"
                  maxLength={10}
                  className={`w-full bg-white/5 border rounded-lg px-3 py-2.5
                           text-sm text-white placeholder-white/30 outline-none focus:border-red-500/50 ${idError && !validateId(playerId) ? 'border-red-500' : 'border-white/10'}`}
                />
                <p className="text-xs text-white/40 mt-1">{playerId.length}/10 цифр</p>
              </div>
              {teamMode === 'duo' && (
                <div>
                  <input
                    type="text"
                    value={partnerId}
                    onChange={(e) => { setPartnerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
                    placeholder="ID напарника (10 цифр)"
                    maxLength={10}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5
                             text-sm text-white placeholder-white/30 outline-none focus:border-red-500/50"
                  />
                  <p className="text-xs text-white/40 mt-1">{partnerId.length}/10 цифр</p>
                </div>
              )}
              {idError && <p className="text-red-400 text-xs mt-2">{idError}</p>}
            </div>

            {/* Map & Rules Info */}
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="text-xs text-white/70 mb-1">📍 <strong>Карта:</strong> Warehouse (TDM)</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-red-400/80">⚠️ Использование читов или мошенничества — блокировка, ставка сгорает.</p>
                <button 
                  onClick={() => setShowRulesModal(true)}
                  className="text-xs text-purple-400 underline hover:text-purple-300"
                >
                  Подробнее
                </button>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleStartSearch}
              className="w-full py-3.5 rounded-xl bg-red-600 
                       text-white font-bold hover:opacity-90 transition-opacity"
            >
              🚀 Найти соперника
            </button>
          </div>
          )}

          {/* ===== TDM JOIN SECTION (Mobile) ===== */}
          {activeMode === 'tdm' && actionTab === 'join' && (
            <div className="space-y-3">
              {activeTournaments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/40">Нет активных матчей</p>
                  <p className="text-xs text-white/30 mt-1">Создай свой!</p>
                </div>
              ) : (
                activeTournaments.map((t) => (
                  <div key={t.id} className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={t.creatorAvatar} alt="" className="w-10 h-10 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{t.creatorName}</p>
                        <p className="text-xs text-white/50">{t.teamMode === 'solo' ? 'Solo' : 'Duo'} • {t.teamCount} команд</p>
                      </div>
                      <span className="text-lg font-bold text-accent-green">{t.bet} UC</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                      <span>{serverNames[t.server]}</span>
                      <span>{t.playersJoined}/{t.playersNeeded} игроков</span>
                    </div>
                    <button
                      onClick={() => navigate(`/messages/tdm-${t.id}`)}
                      className="w-full py-2.5 rounded-xl bg-red-600/20 border border-red-500/50 
                               text-red-400 text-sm font-semibold hover:bg-red-600/30"
                    >
                      ⚡ Вступить
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===== WOW MODE CONTENT (Mobile) ===== */}
          {activeMode === 'wow' && actionTab === 'create' && (
            <div className="space-y-4">
              {/* Map Selection */}
              <div>
                <p className="text-xs text-white/60 mb-2">🗺️ Выбери карту</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {wowMaps.map((map) => (
                    <div
                      key={map.id}
                      onClick={() => setSelectedMap(map)}
                      className={`flex-shrink-0 w-40 cursor-pointer rounded-xl overflow-hidden border-2 transition-all
                                ${selectedMap.id === map.id 
                                  ? 'border-red-500 ring-2 ring-red-500/30' 
                                  : 'border-white/10'}`}
                    >
                      <div className="relative h-20">
                        <img src={map.image} alt={map.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>
                      <div className="bg-dark-200/90 p-2">
                        <p className="text-xs text-white font-medium truncate">{map.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Map Info (Mobile) */}
              <div className="bg-zinc-800/90 backdrop-blur-sm rounded-xl border border-zinc-600 p-3">
                <p className="text-sm text-white font-medium mb-2">📋 Параметры карты</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-700/80 rounded-lg p-2 text-center border border-zinc-600">
                    <p className="text-xs text-zinc-300">Формат</p>
                    <p className="text-xs font-bold text-purple-300">{selectedMap.format}</p>
                  </div>
                  <div className="bg-zinc-700/80 rounded-lg p-2 text-center border border-zinc-600">
                    <p className="text-xs text-zinc-300">Команд</p>
                    <p className="text-xs font-bold text-cyan-300">{selectedMap.teamCount}</p>
                  </div>
                  <div className="bg-zinc-700/80 rounded-lg p-2 text-center border border-zinc-600">
                    <p className="text-xs text-zinc-300">Раундов</p>
                    <p className="text-xs font-bold text-yellow-300">{selectedMap.rounds}</p>
                  </div>
                </div>
                {selectedMap.rules && (
                  <p className="text-xs text-zinc-300 mt-2 text-center bg-zinc-700/50 rounded-lg py-1.5 px-2">{selectedMap.rules}</p>
                )}
              </div>

              {/* WoW Settings */}
              <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                {/* Bet Slider */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-white/60">� Ставка (UC)</p>
                    <span className="text-xl font-bold text-accent-green">{bet} UC</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={3000}
                    step={60}
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Server */}
                <div className="mb-4">
                  <p className="text-xs text-white/60 mb-2">🌍 Сервер</p>
                  <div className="grid grid-cols-3 gap-2">
                    {servers.slice(0, 3).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setServer(s.id)}
                        className={`py-2 rounded-lg text-xs font-medium transition-all border
                                  ${server === s.id 
                                    ? 'bg-red-600/30 border-red-500 text-white' 
                                    : 'bg-white/5 border-white/10 text-white/50'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player IDs - based on playersPerTeam (Mobile) */}
                <div className="mb-4">
                  <p className="text-xs text-white font-medium mb-2">🆔 ID игроков ({selectedMap.playersPerTeam} чел.)</p>
                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        value={playerId}
                        onChange={(e) => { setPlayerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
                        placeholder="Твой ID (10 цифр)"
                        maxLength={10}
                        className={`w-full bg-zinc-700/80 border rounded-lg px-3 py-2.5
                                 text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50 ${idError && !validateId(playerId) ? 'border-red-500' : 'border-zinc-600'}`}
                      />
                      <p className="text-xs text-zinc-400 mt-1">{playerId.length}/10 цифр</p>
                    </div>
                    {selectedMap.playersPerTeam >= 2 && (
                      <div>
                        <input
                          type="text"
                          value={partnerId}
                          onChange={(e) => { setPartnerId(e.target.value.replace(/\D/g, '')); setIdError(''); }}
                          placeholder="ID друга #2 (10 цифр)"
                          maxLength={10}
                          className="w-full bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-2.5
                                   text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50"
                        />
                        <p className="text-xs text-zinc-400 mt-1">{partnerId.length}/10 цифр</p>
                      </div>
                    )}
                    {selectedMap.playersPerTeam >= 3 && (
                      <input
                        type="text"
                        placeholder="ID друга #3 (10 цифр)"
                        maxLength={10}
                        className="w-full bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-2.5
                                 text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50"
                      />
                    )}
                    {selectedMap.playersPerTeam >= 4 && (
                      <input
                        type="text"
                        placeholder="ID друга #4 (10 цифр)"
                        maxLength={10}
                        className="w-full bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-2.5
                                 text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50"
                      />
                    )}
                  </div>
                  {idError && <p className="text-red-400 text-xs mt-2">{idError}</p>}
                </div>

                {/* Warning about cheats (Mobile) */}
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-red-400/80">⚠️ Использование читов или мошенничества — блокировка, ставка сгорает.</p>
                    <button 
                      onClick={() => setShowRulesModal(true)}
                      className="text-xs text-purple-400 underline hover:text-purple-300"
                    >
                      Правила
                    </button>
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleStartSearch}
                  className="w-full py-3.5 rounded-xl bg-red-600 
                           text-white font-bold hover:opacity-90 transition-opacity"
                >
                  🔍 Найти соперника
                </button>
              </div>
            </div>
          )}

          {/* ===== WOW JOIN TAB (Mobile) ===== */}
          {activeMode === 'wow' && actionTab === 'join' && (
            <div className="space-y-3">
              {wowActiveMatches.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/40">Нет активных матчей</p>
                  <p className="text-xs text-white/30 mt-1">Создай свой!</p>
                </div>
              ) : (
                wowActiveMatches.map((match) => {
                  const isFull = match.teamsJoined >= match.teamsNeeded;
                  return (
                    <div key={match.id} className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                      <div className="flex gap-3 mb-3">
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={match.map.image} alt={match.map.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-1 left-1 text-[8px] text-white/80 font-mono">ID: {match.map.mapId}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{match.map.name}</p>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            <span className="text-xs bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded">{match.map.format}</span>
                            <span className="text-xs bg-white/10 text-white/60 px-1.5 py-0.5 rounded">{match.map.rounds}R</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <img src={match.creatorAvatar} alt="" className="w-6 h-6 rounded-full" />
                          <span className="text-xs text-white/70">{match.creatorName}</span>
                        </div>
                        <span className="text-sm font-bold text-accent-green">{match.bet} UC</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                        <span>{serverNames[match.server]}</span>
                        <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-yellow-400'}`}>
                          {match.teamsJoined}/{match.teamsNeeded} команд
                        </span>
                        <span>{formatTime(match.searchTime)} в поиске</span>
                      </div>
                      <button
                        onClick={() => navigate(`/messages/wow-${match.id}`)}
                        disabled={isFull}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                                  ${isFull 
                                    ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                                    : 'bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30'}`}
                      >
                        {isFull ? '🔒 Матч заполнен' : '⚡ Вступить'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ===== CLASSIC MODE CONTENT (Mobile) ===== */}
          {activeMode === 'classic' && (
            <div className="space-y-4">
              {/* Tournament Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classicTournaments.map((tournament) => {
                  const timeLeft = tournament.startTime.getTime() - currentTime;
                  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                  const modeLabels: Record<ClassicMode, string> = { solo: '👤 Solo', duo: '👥 Duo', squad: '🎯 Squad' };
                  const modeColors: Record<ClassicMode, string> = { solo: 'bg-purple-600', duo: 'bg-cyan-600', squad: 'bg-orange-600' };
                  
                  return (
                    <div 
                      key={tournament.id}
                      className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
                    >
                      {/* Map Image */}
                      <div className="relative h-32">
                        <img src={tournament.mapImage} alt={tournament.map} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className={`absolute top-2 left-2 ${modeColors[tournament.mode]} backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-medium`}>
                          {modeLabels[tournament.mode]}
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <p className="text-white font-bold text-base">{tournament.map}</p>
                        </div>
                      </div>
                      
                      {/* Tournament Info */}
                      <div className="p-3 space-y-2.5">
                        {/* Timer */}
                        <div className="flex items-center gap-2 bg-yellow-500/10 rounded-lg px-2.5 py-2">
                          <span className="text-yellow-400 text-base">⏱️</span>
                          <div>
                            <p className="text-xs text-white/50">Запуск через</p>
                            <p className="text-sm font-bold text-yellow-400">{hours}ч {minutes}м</p>
                          </div>
                        </div>
                        
                        {/* Entry & Prize */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 rounded-lg py-2 text-center">
                            <p className="text-xs text-white/50">Вход</p>
                            <p className="text-sm font-bold text-white">{tournament.entryFee} UC</p>
                          </div>
                          <div className="bg-accent-green/10 rounded-lg py-2 text-center">
                            <p className="text-xs text-white/50">Призовой</p>
                            <p className="text-sm font-bold text-accent-green">{tournament.prizePool} UC</p>
                          </div>
                        </div>
                        
                        {/* Players */}
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>{tournament.registeredPlayers}/{tournament.maxPlayers} игроков</span>
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(tournament.registeredPlayers / tournament.maxPlayers) * 100}%` }} />
                          </div>
                        </div>
                        
                        {/* Register Button */}
                        <button
                          onClick={() => {
                            setSelectedClassicTournament(tournament);
                            setClassicPlayerIds(tournament.mode === 'solo' ? [''] : tournament.mode === 'duo' ? ['', ''] : ['', '', '', '']);
                            setShowClassicRegistration(true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
                        >
                          🎮 Регистрация
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
      {/* ===== CLASSIC REGISTRATION MODAL (shared desktop + mobile) ===== */}
      {showClassicRegistration && selectedClassicTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowClassicRegistration(false)}
          />
          <div className="relative w-full max-w-lg bg-dark-100 rounded-2xl border border-white/20 p-4 pb-6 animate-slide-up"
               style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">📝 Регистрация на турнир</h3>
              <p className="text-xs text-white/50">
                {selectedClassicTournament.map} • {selectedClassicTournament.mode === 'solo' ? 'Solo' : selectedClassicTournament.mode === 'duo' ? 'Duo' : 'Squad'}
              </p>
            </div>
            <div className="space-y-3 mb-4">
              <p className="text-xs text-white/60">🆔 ID игроков</p>
              {classicPlayerIds.map((id, index) => (
                <input
                  key={index}
                  type="text"
                  value={id}
                  onChange={(e) => {
                    const newIds = [...classicPlayerIds];
                    newIds[index] = e.target.value;
                    setClassicPlayerIds(newIds);
                  }}
                  placeholder={index === 0 ? 'Твой игровой ID' : `ID тиммейта ${index}`}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5
                           text-sm text-white placeholder-white/30 outline-none focus:border-red-500/50"
                />
              ))}
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-400/90 leading-relaxed">
                ⚠️ Мы хотели бы напомнить вам о важности соблюдать правила кастом-матча.
                Если вы оказались на чужом месте и ваше место занято, вам необходимо выйти из лобби.
                Вас пригласят обратно, когда ваше место освободится.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const requiredIds = selectedClassicTournament.mode === 'solo' ? 1 : selectedClassicTournament.mode === 'duo' ? 2 : 4;
                  const filledIds = classicPlayerIds.slice(0, requiredIds).filter(id => id.trim()).length;
                  if (filledIds < requiredIds) {
                    alert(`Заполните все ${requiredIds} ID!`);
                    return;
                  }
                  setShowClassicRegistration(false);
                  navigate(`/messages/classic-${selectedClassicTournament.id}`);
                }}
                className="w-full py-3 rounded-xl bg-purple-600 
                         text-white font-bold hover:opacity-90 transition-opacity"
              >
                ✅ Подтвердить регистрацию
              </button>
              <button
                onClick={() => setShowClassicRegistration(false)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 
                         text-white/70 font-medium hover:bg-white/10 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
