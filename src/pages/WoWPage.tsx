import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ServerRegion, WoWMap, WoWMatch } from '../types';
import { wowMaps, wowActiveMatches, wowLeaders, serverNames } from '../data/wow';

type ViewState = 'create' | 'searching' | 'found';
type ActionTab = 'create' | 'join';

const WoWPage = () => {
  const navigate = useNavigate();
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
  const [selectedMap, setSelectedMap] = useState<WoWMap>(wowMaps[0]);
  const [bet, setBet] = useState(5);
  const [server, setServer] = useState<ServerRegion>('europe');
  const [playerId, setPlayerId] = useState('');
  
  // Search state
  const [searchTime, setSearchTime] = useState(0);
  const [canCancel, setCanCancel] = useState(false);
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
          username: 'WoWChampion',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WoWChampion'
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
    const totalPool = bet * selectedMap.teamCount;
    const platformFee = totalPool * 0.1;
    const netPool = totalPool - platformFee;
    
    // Prize distribution based on team count
    const prizes: { place: number; pct: number; amount: string }[] = [];
    if (selectedMap.teamCount === 2) {
      prizes.push({ place: 1, pct: 100, amount: netPool.toFixed(0) });
      prizes.push({ place: 2, pct: 0, amount: '0' });
    } else if (selectedMap.teamCount === 3) {
      prizes.push({ place: 1, pct: 70, amount: (netPool * 0.7).toFixed(0) });
      prizes.push({ place: 2, pct: 30, amount: (netPool * 0.3).toFixed(0) });
      prizes.push({ place: 3, pct: 0, amount: '0' });
    } else if (selectedMap.teamCount === 4) {
      prizes.push({ place: 1, pct: 50, amount: (netPool * 0.5).toFixed(0) });
      prizes.push({ place: 2, pct: 30, amount: (netPool * 0.3).toFixed(0) });
      prizes.push({ place: 3, pct: 20, amount: (netPool * 0.2).toFixed(0) });
      prizes.push({ place: 4, pct: 0, amount: '0' });
    }
    
    return { totalPool, platformFee, prizes };
  };

  const handleStartSearch = useCallback(() => {
    if (!playerId.trim()) {
      alert('Введи свой ID в игре!');
      return;
    }
    setSearchTime(0);
    setCanCancel(false);
    setViewState('searching');
  }, [playerId]);

  const handleCancelSearch = useCallback(() => {
    if (canCancel) {
      setViewState('create');
      setSearchTime(0);
      setCanCancel(false);
      setFoundOpponent(null);
    }
  }, [canCancel]);

  const handleJoinMatch = (match: WoWMatch) => {
    if (match.teamsJoined < match.teamsNeeded) {
      console.log('Joining WoW match:', match.id);
      navigate(`/messages/wow-${match.id}`);
    }
  };

  const { totalPool, platformFee, prizes } = calculateWinnings();

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
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${playerId}`}
                alt="You"
                className="w-20 h-20 rounded-full border-2 border-accent-green mx-auto mb-2"
              />
              <p className="text-sm font-semibold text-white">{playerId}</p>
              <p className="text-xs text-accent-green">Ты</p>
            </div>
            <div className="text-3xl font-bold text-yellow-400 animate-pulse">VS</div>
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

          <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-6">
            <p className="text-lg font-bold text-accent-green mb-1">🎮 Матч найден!</p>
            <p className="text-xs text-white/60">WoW • {selectedMap.name} • Ставка ${bet}</p>
          </div>

          <button
            onClick={() => navigate('/messages/wow-new')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 
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
    return (
      <div className="min-h-screen pb-24">
        <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center relative mb-4 py-1">
            <button onClick={() => setViewState('create')} className="flex items-center gap-2 text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">WoW • {selectedMap.format} • ${bet}</span>
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">🔍 Поиск соперников</h1>
          </div>

          <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl border border-purple-500/40 p-4 mb-4">
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

          <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-3">🗺️ Карта: {selectedMap.name}</h3>
            <div className="flex gap-2 text-xs text-white/60">
              <span className="bg-white/10 px-2 py-1 rounded">{selectedMap.format}</span>
              <span className="bg-white/10 px-2 py-1 rounded">{selectedMap.teamCount} команд</span>
              <span className="bg-white/10 px-2 py-1 rounded">{selectedMap.rounds} раундов</span>
            </div>
          </div>

          <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-3">👥 Команды (1/{selectedMap.teamCount})</h3>
            <div className="space-y-2">
              {Array.from({ length: selectedMap.teamCount }).map((_, i) => (
                <div key={i} className={`flex items-center justify-between rounded-lg p-3 transition-all
                                       ${i === 0 ? 'bg-accent-green/10 border border-accent-green/30' : 'bg-white/5 border border-dashed border-white/10'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{i === 0 ? '🟢' : '⏳'}</span>
                    <div>
                      <p className="text-sm text-white font-medium">
                        {i === 0 ? `Твоя команда` : `Ожидаем...`}
                      </p>
                      <p className="text-xs text-white/40">
                        {i === 0 ? `ID: ${playerId}` : 'Слот свободен'}
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

          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-xl border border-yellow-500/30 p-4">
            <h3 className="text-sm font-semibold text-yellow-400 mb-3">🏆 Призы по местам</h3>
            <div className="flex gap-2">
              {prizes.map((p) => (
                <div key={p.place} className="flex-1 text-center">
                  <p className="text-lg font-bold text-white">${p.amount}</p>
                  <p className="text-xs text-white/50">
                    {p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : '4️⃣'} {p.pct}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-dark-100 via-dark-100/95 to-transparent">
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

  // ============= MAIN VIEW =============
  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4">
        {/* Header */}
        <div className="flex items-center relative mb-4 py-1">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">PUBG Mobile</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-white">🎯 WoW / Мир Чудес</h1>
        </div>

        {/* Action Tabs */}
        <div className="relative flex gap-2 mb-4">
          <button
            onClick={() => setActionTab('create')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${actionTab === 'create' 
                        ? 'bg-accent-green/20 text-accent-green border border-accent-green/50' 
                        : 'bg-dark-200/60 text-white/50 border border-white/10 hover:text-white/70'}`}
          >
            🎮 Создать
          </button>
          <button
            onClick={() => setActionTab('join')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${actionTab === 'join' 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
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

            {/* Leaders Dropdown */}
            {showLeaders && (
              <div className="absolute top-full right-0 mt-2 w-72 z-50 bg-dark-200/95 backdrop-blur-md rounded-xl border border-white/20 shadow-xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {wowLeaders.map((leader) => (
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
                      <span className="text-sm font-semibold text-accent-green">${leader.earnings}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== CREATE TAB ===== */}
        {actionTab === 'create' && (
          <div className="space-y-4">
            {/* Map Selection - Horizontal Scroll */}
            <div>
              <p className="text-xs text-white/60 mb-2">🗺️ Выбери карту</p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {wowMaps.map((map) => (
                  <div
                    key={map.id}
                    onClick={() => setSelectedMap(map)}
                    className={`flex-shrink-0 w-[calc(50%-8px)] snap-start cursor-pointer rounded-xl overflow-hidden border-2 transition-all
                              ${selectedMap.id === map.id 
                                ? 'border-purple-500 ring-2 ring-purple-500/30' 
                                : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="relative h-24">
                      <img 
                        src={map.image} 
                        alt={map.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Map ID Badge */}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white/80 font-mono">
                        ID: {map.mapId}
                      </div>
                      {/* Arena Badge */}
                      <div className="absolute bottom-2 left-2 bg-purple-600/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-medium">
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

            {/* Selected Map Info (Read-only) */}
            <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
              <p className="text-xs text-white/60 mb-2">📋 Параметры карты</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-xs text-white/40">Формат</p>
                  <p className="text-sm font-semibold text-purple-400">{selectedMap.format}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-xs text-white/40">Команд</p>
                  <p className="text-sm font-semibold text-cyan-400">{selectedMap.teamCount}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-xs text-white/40">Раундов</p>
                  <p className="text-sm font-semibold text-yellow-400">{selectedMap.rounds}</p>
                </div>
              </div>
              {selectedMap.rules && (
                <p className="text-xs text-white/50 mt-2 text-center">{selectedMap.rules}</p>
              )}
            </div>

            {/* Bet Slider + Prizes + Rating */}
            <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
              {/* Prize Distribution */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-3 mb-4 border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/60">💰 Выплаты по местам</p>
                  <span className="text-xs text-white/40">Пул ${totalPool} • Комиссия {platformFee.toFixed(0)}$ (10%)</span>
                </div>
                <div className={`grid gap-1 ${prizes.length === 2 ? 'grid-cols-2' : prizes.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {prizes.map((p) => (
                    <div key={p.place} className={`text-center py-1.5 rounded-lg ${p.place === 1 ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                      <p className={`text-sm font-bold ${p.place === 1 ? 'text-yellow-400' : p.place === selectedMap.teamCount ? 'text-red-400' : 'text-white/70'}`}>
                        ${p.amount}
                      </p>
                      <p className="text-[9px] text-white/40">
                        {p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : p.place === 3 ? '🥉' : '4️⃣'} {p.pct}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Prediction */}
              <div className="flex justify-center gap-6 mb-4 text-xs">
                <span className="text-white/60">Победа: <span className="text-accent-green font-semibold">+{Math.round(10 + bet * 0.5)} 🏆</span></span>
                <span className="text-white/60">Поражение: <span className="text-red-400 font-semibold">-{Math.round(5 + bet * 0.3)} 🏆</span></span>
              </div>

              {/* Bet Slider */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-white/60">💵 Ставка</p>
                  <span className="text-xl font-bold text-accent-green">${bet}</span>
                </div>
                {(() => {
                  const betValues = [1,2,3,4,5,6,7,8,9,10,12,14,16,18,20,25,30,35,40,45,50];
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
                                 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-lg
                                 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30"
                      />
                      <div className="flex justify-between text-xs text-white/40 mt-1">
                        <span>$1</span>
                        <span>$50</span>
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
                                  ? 'bg-purple-600/30 text-purple-400 border border-purple-500/50' 
                                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player ID */}
              <div className="mb-4">
                <p className="text-xs text-white/60 mb-2">🆔 Твой ID в игре</p>
                <input
                  type="text"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="Введи свой ID..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                           text-sm text-white placeholder-white/30 outline-none
                           focus:border-purple-500/50 transition-colors"
                />
              </div>

              {/* Start Search Button */}
              <button
                onClick={handleStartSearch}
                disabled={!playerId.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 
                         text-white font-semibold hover:opacity-90 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 Найти соперника
              </button>
            </div>
          </div>
        )}

        {/* ===== JOIN TAB ===== */}
        {actionTab === 'join' && (
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
                  <div 
                    key={match.id}
                    className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4"
                  >
                    {/* Map Preview */}
                    <div className="flex gap-3 mb-3">
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={match.map.image} alt={match.map.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-1 left-1 text-[8px] text-white/80 font-mono">
                          ID: {match.map.mapId}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{match.map.name}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs bg-purple-600/30 text-purple-400 px-1.5 py-0.5 rounded">{match.map.format}</span>
                          <span className="text-xs bg-white/10 text-white/60 px-1.5 py-0.5 rounded">{match.map.rounds}R</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Info */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img src={match.creatorAvatar} alt="" className="w-6 h-6 rounded-full" />
                        <span className="text-xs text-white/70">{match.creatorName}</span>
                      </div>
                      <span className="text-sm font-bold text-accent-green">${match.bet}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                      <span>{serverNames[match.server]}</span>
                      <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-yellow-400'}`}>
                        {match.teamsJoined}/{match.teamsNeeded} команд
                      </span>
                      <span>{formatTime(match.searchTime)} в поиске</span>
                    </div>

                    <button
                      onClick={() => handleJoinMatch(match)}
                      disabled={isFull}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                                ${isFull 
                                  ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                                  : 'bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-600/30'}`}
                    >
                      {isFull ? '🔒 Матч заполнен' : '⚡ Вступить'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WoWPage;
