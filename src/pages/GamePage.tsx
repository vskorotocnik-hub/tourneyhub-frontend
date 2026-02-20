import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { GameMode, TeamMode, ServerRegion } from '../types';
import { tournamentLeaders, serverNames, classicLeaders } from '../data/tournaments';
import { wowLeaders } from '../data/wow';
import { tournamentApi, wowApi, classicApi, type TournamentListItem, type ActiveTournamentData, type WoWMapItem, type WoWTournamentListItem, type ClassicTournamentListItem } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import AuthPromptModal from '../components/AuthPromptModal';

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
  const { user, isAuthenticated } = useAuth();
  const [activeMode, setActiveMode] = useState<GameMode>('tdm');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMadaraBubble, setShowMadaraBubble] = useState(false);

  // Real tournament state
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [myActiveTournaments, setMyActiveTournaments] = useState<ActiveTournamentData[]>([]);
  const [openTournaments, setOpenTournaments] = useState<TournamentListItem[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [createError, setCreateError] = useState('');

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
  const [wowMaps, setWowMaps] = useState<WoWMapItem[]>([]);
  const [selectedMap, setSelectedMap] = useState<WoWMapItem | null>(null);
  const [wowOpenTournaments, setWowOpenTournaments] = useState<WoWTournamentListItem[]>([]);
  const [wowExtraIds, setWowExtraIds] = useState<string[]>([]);
  const [_wowLoading, setWowLoading] = useState(false);
  const [joiningWoW, setJoiningWoW] = useState<WoWTournamentListItem | null>(null);
  const [wowJoinIds, setWowJoinIds] = useState<string[]>([]);
  const [wowJoinError, setWowJoinError] = useState('');
  const [wowJoinLoading, setWowJoinLoading] = useState(false);
  
  // Classic state
  const [showClassicRegistration, setShowClassicRegistration] = useState(false);
  const [selectedClassicTournament, setSelectedClassicTournament] = useState<ClassicTournamentListItem | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [classicTournaments, setClassicTournaments] = useState<ClassicTournamentListItem[]>([]);
  const [classicLoading, setClassicLoading] = useState(false);
  const [classicRegError, setClassicRegError] = useState('');
  const [classicRegLoading, setClassicRegLoading] = useState(false);
  const [myClassicTournamentIds, setMyClassicTournamentIds] = useState<Set<string>>(new Set());
  
  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [classicPlayerIds, setClassicPlayerIds] = useState<string[]>(['']);
  
  // Active tournament type tracking (for search/found view)
  const [activeGameType, setActiveGameType] = useState<'TDM' | 'WOW'>('TDM');
  const [activeWoWMapInfo, setActiveWoWMapInfo] = useState<WoWMapItem | null>(null);
  const [activeTeamCount, setActiveTeamCount] = useState(2);

  // Search state
  const [searchTime, setSearchTime] = useState(0);
  const [canCancel, setCanCancel] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [foundOpponent, setFoundOpponent] = useState<{username: string, avatar: string} | null>(null);
  const [teamsJoinedCount, setTeamsJoinedCount] = useState(1); // creator's team is always joined
  const [allOpponents, setAllOpponents] = useState<{username: string, avatar: string}[]>([]);

  // Join flow state — which tournament card is expanded for ID input
  const [joiningTournament, setJoiningTournament] = useState<TournamentListItem | null>(null);
  const [joinPlayerId, setJoinPlayerId] = useState('');
  const [joinPartnerId, setJoinPartnerId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // Poll tournament status while searching
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let pollInterval: ReturnType<typeof setInterval>;
    if (viewState === 'searching' && activeTournamentId) {
      // Only tick timer while still searching (stop when opponent found)
      if (!foundOpponent) {
        interval = setInterval(() => {
          setSearchTime(prev => prev + 1);
        }, 1000);
      }
      // Poll tournament status every 3 seconds
      pollInterval = setInterval(async () => {
        try {
          const data = await tournamentApi.get(activeTournamentId);
          // Track how many teams have joined
          setTeamsJoinedCount(data.teams.length);
          // Collect ALL opponent teams (even while still SEARCHING — partial fills)
          const opponentTeams = data.teams.filter(t => t.id !== data.userTeamId);
          const opponents = opponentTeams
            .map(t => {
              const captain = t.players.find(p => p.isCaptain) || t.players[0];
              return captain ? {
                username: captain.user.username,
                avatar: captain.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${captain.user.username}`,
              } : null;
            })
            .filter((o): o is {username: string; avatar: string} => o !== null);
          setAllOpponents(opponents);
          // Mark as "found" only when tournament actually started (all teams in)
          if (data.status === 'IN_PROGRESS' && !foundOpponent && opponents.length > 0) {
            setFoundOpponent(opponents[0]);
          }
          // If tournament was cancelled by someone else, go back
          if (data.status === 'CANCELLED') {
            setActiveTournamentId(null);
            setViewState('create');
            setFoundOpponent(null);
            setAllOpponents([]);
          }
        } catch {
          // ignore poll errors
        }
      }, 3000);
    }
    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
    };
  }, [viewState, activeTournamentId, navigate, foundOpponent]);

  // Load open tournaments for Join tab
  const loadOpenTournaments = useCallback(() => {
    if (activeMode === 'tdm' && actionTab === 'join') {
      setLoadingTournaments(true);
      tournamentApi.list({ server: server.toUpperCase() })
        .then(res => setOpenTournaments(res.tournaments))
        .catch(() => {})
        .finally(() => setLoadingTournaments(false));
    }
  }, [activeMode, actionTab, server]);

  useEffect(() => {
    loadOpenTournaments();
  }, [loadOpenTournaments]);

  // Real-time: global tournament list changes + tournament started via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleListChanged = () => {
      // Refresh open tournaments list (join tab)
      if (activeMode === 'tdm' && actionTab === 'join') {
        tournamentApi.list({ server: server.toUpperCase() })
          .then(res => setOpenTournaments(res.tournaments))
          .catch(() => {});
      }
      // Refresh active tournaments banner
      if (user) {
        tournamentApi.myActive().then(res => {
          setMyActiveTournaments(res.tournaments || []);
        }).catch(() => {});
      }
    };

    const handleTournamentStarted = (data: { tournamentId: string }) => {
      // If this is our active tournament, load opponent data
      if (data.tournamentId === activeTournamentId && viewState === 'searching') {
        tournamentApi.get(data.tournamentId).then(tData => {
          setTeamsJoinedCount(tData.teams.length);
          const opponentTeams = tData.teams.filter(t => t.id !== tData.userTeamId);
          const opponents = opponentTeams
            .map(t => {
              const captain = t.players.find(p => p.isCaptain) || t.players[0];
              return captain ? {
                username: captain.user.username,
                avatar: captain.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${captain.user.username}`,
              } : null;
            })
            .filter((o): o is {username: string; avatar: string} => o !== null);
          setAllOpponents(opponents);
          if (opponents.length > 0) setFoundOpponent(opponents[0]);
        }).catch(() => {});
      }
    };

    socket.on('tournaments:list_changed', handleListChanged);
    socket.on('tournament:started', handleTournamentStarted);
    return () => {
      socket.off('tournaments:list_changed', handleListChanged);
      socket.off('tournament:started', handleTournamentStarted);
    };
  }, [activeMode, actionTab, server, activeTournamentId, viewState, user]);

  // Load all active tournaments on mount
  const loadActiveTournaments = useCallback(() => {
    if (!user) return;
    tournamentApi.myActive().then(res => {
      setMyActiveTournaments(res.tournaments || []);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    loadActiveTournaments();
  }, [loadActiveTournaments]);

  // Load classic tournaments when tab is active
  const loadClassicTournaments = useCallback(() => {
    if (activeMode !== 'classic') return;
    setClassicLoading(true);
    Promise.all([
      classicApi.list(),
      isAuthenticated ? classicApi.myActive().catch(() => ({ tournaments: [] })) : Promise.resolve({ tournaments: [] }),
    ])
      .then(([listRes, activeRes]) => {
        setClassicTournaments(listRes.tournaments);
        setMyClassicTournamentIds(new Set(activeRes.tournaments.map((t: { id: string }) => t.id)));
      })
      .catch(() => {})
      .finally(() => setClassicLoading(false));
  }, [activeMode, isAuthenticated]);

  useEffect(() => {
    loadClassicTournaments();
  }, [loadClassicTournaments]);

  useEffect(() => {
    if (activeMode === 'wow' && wowMaps.length === 0) {
      setWowLoading(true);
      wowApi.getMaps().then(r => {
        setWowMaps(r.maps);
        if (r.maps.length > 0 && !selectedMap) setSelectedMap(r.maps[0]);
      }).catch(() => {}).finally(() => setWowLoading(false));
    }
  }, [activeMode]);

  useEffect(() => {
    if (activeMode === 'wow' && actionTab === 'join') {
      wowApi.getOpen().then(r => setWowOpenTournaments(r.tournaments)).catch(() => {});
    }
  }, [activeMode, actionTab]);

  useEffect(() => {
    if (selectedMap) setWowExtraIds(Array(Math.max(0, selectedMap?.playersPerTeam - 1)).fill(''));
  }, [selectedMap?.id]);

  // Handler: open searching view for a specific active tournament
  const handleViewActiveTournament = async (t: ActiveTournamentData) => {
    setActiveTournamentId(t.id);
    setBet(t.bet);
    setTeamMode(t.teamMode === 'DUO' ? 'duo' : 'solo');
    setTeamCount(t.teamCount);
    setServer((t.server?.toLowerCase() || 'europe') as ServerRegion);
    // Detect WoW vs TDM
    const isWoW = t.gameType === 'WOW';
    setActiveGameType(isWoW ? 'WOW' : 'TDM');
    setActiveWoWMapInfo(isWoW && t.wowMap ? t.wowMap : null);
    setActiveTeamCount(t.teamCount);
    const elapsed = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 1000);
    setSearchTime(Math.max(0, elapsed));
    setViewState('searching');
    // If already IN_PROGRESS, load opponent data immediately
    if (t.status === 'IN_PROGRESS') {
      try {
        const data = await tournamentApi.get(t.id);
        const opponentTeam = data.teams.find(team => team.id !== data.userTeamId);
        if (opponentTeam && opponentTeam.players.length > 0) {
          const captain = opponentTeam.players.find(p => p.isCaptain) || opponentTeam.players[0];
          setFoundOpponent({
            username: captain.user.username,
            avatar: captain.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${captain.user.username}`,
          });
        }
      } catch { /* ignore */ }
    }
  };

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

  const handleStartSearch = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
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
    setCreateError('');

    try {
      const result = await tournamentApi.create({
        teamMode: teamMode === 'solo' ? 'SOLO' : 'DUO',
        teamCount,
        bet,
        server: server.toUpperCase(),
        playerId,
        partnerId: teamMode === 'duo' ? partnerId : undefined,
      });
      setActiveTournamentId(result.id);
      setActiveGameType('TDM');
      setActiveWoWMapInfo(null);
      setActiveTeamCount(teamCount);
      setSearchTime(0);
      setCanCancel(true);
      setViewState('searching');
      loadActiveTournaments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка создания турнира';
      setCreateError(msg);
    }
  }, [playerId, partnerId, teamMode, teamCount, bet, server, user, navigate, loadActiveTournaments]);

  const handleCancelSearch = useCallback(async () => {
    if (canCancel && activeTournamentId) {
      try {
        await tournamentApi.cancel(activeTournamentId);
        setActiveTournamentId(null);
        setViewState('create');
        setSearchTime(0);
        setCanCancel(true);
        setFoundOpponent(null);
        setAllOpponents([]);
        setTeamsJoinedCount(1);
        loadActiveTournaments();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Ошибка отмены';
        setCreateError(msg);
      }
    }
  }, [canCancel, activeTournamentId, loadActiveTournaments]);

  const handleGoBack = useCallback(() => {
    setViewState('create');
    setActiveTournamentId(null);
    setFoundOpponent(null);
    setAllOpponents([]);
    setTeamsJoinedCount(1);
    setSearchTime(0);
    setCanCancel(true);
    setActiveGameType('TDM');
    setActiveWoWMapInfo(null);
    setActiveTeamCount(2);
  }, []);

  const handleWoWCreate = useCallback(async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (!selectedMap) return;
    if (!validateId(playerId)) { setIdError('ID: 10 цифр'); return; }
    const ppt = selectedMap.playersPerTeam;
    if (ppt >= 2 && !validateId(partnerId)) { setIdError('ID друга #2: 10 цифр'); return; }
    for (const e of wowExtraIds) { if (!validateId(e)) { setIdError('Все ID: 10 цифр'); return; } }
    setIdError(''); setCreateError('');
    try {
      // Собираем все extraIds: partnerId (друг #2) + wowExtraIds (друзья #3, #4)
      const allExtras: string[] = [];
      if (ppt >= 2) allExtras.push(partnerId);
      allExtras.push(...wowExtraIds);
      const r = await wowApi.create({ mapId: selectedMap.id, bet, server: server.toUpperCase(), playerId, extraIds: allExtras.length > 0 ? allExtras : undefined });
      if (r.tournamentStarted) { navigate(`/messages/${r.id}`); } else { setActiveTournamentId(r.id); setActiveGameType('WOW'); setActiveWoWMapInfo(selectedMap); setActiveTeamCount(selectedMap.teamCount); setSearchTime(0); setCanCancel(true); setViewState('searching'); }
      loadActiveTournaments();
    } catch (e: any) { setCreateError(e?.message || 'Ошибка'); }
  }, [selectedMap, playerId, partnerId, wowExtraIds, bet, server, isAuthenticated, loadActiveTournaments, navigate]);

  const handleWoWJoin = useCallback(async (t: WoWTournamentListItem) => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    const ppt = t.wowMap?.playersPerTeam || 1;
    for (let i = 0; i < ppt; i++) { if (!validateId(wowJoinIds[i] || '')) { setWowJoinError('Все ID: 10 цифр'); return; } }
    setWowJoinError(''); setWowJoinLoading(true);
    try {
      const ex = wowJoinIds.slice(1);
      const r = await wowApi.join(t.id, { playerId: wowJoinIds[0], extraIds: ex.length > 0 ? ex : undefined });
      if (r.tournamentStarted) { navigate(`/messages/${t.id}`); } else { setActiveTournamentId(t.id); setViewState('searching'); }
      loadActiveTournaments(); setJoiningWoW(null);
    } catch (e: any) { setWowJoinError(e?.message || 'Ошибка'); }
    finally { setWowJoinLoading(false); }
  }, [isAuthenticated, wowJoinIds, loadActiveTournaments, navigate]);

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

  // ============= SEARCHING VIEW =============
  if (viewState === 'searching') {
    return (
      <div className="min-h-screen pb-32">
        {/* ── Mobile version ── */}
        <div className="md:hidden">
          <main className="px-4 pt-4 pb-4">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={handleGoBack} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                <span className="text-xs">Назад</span>
              </button>
              <span className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                {activeGameType === 'WOW' ? `WoW • ${activeWoWMapInfo?.format || ''} • ${activeWoWMapInfo?.name || ''}` : `TDM • ${teamMode === 'solo' ? '1v1' : '2v2'}`} • {server === 'europe' ? 'EU' : server.toUpperCase()}
              </span>
              <span className="text-sm font-mono font-bold text-white/80">{formatTime(searchTime)}</span>
            </div>

            {/* VS Arena — dynamic: shows N-1 opponent slots */}
            <div className="relative py-8 mb-6">
              {/* Pulse ring background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-36 h-36 rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: '2s' }} />
              </div>

              <div className="relative z-10 flex items-center justify-center gap-4 flex-wrap">
                {/* Your avatar */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-500 overflow-hidden bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <span className="text-[10px] text-white font-medium truncate max-w-[70px]">{user?.username || 'Ты'}</span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Готов</span>
                </div>

                {/* VS badge */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <span className="text-white font-black text-xs">VS</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-400 mt-1">{bet} UC</span>
                </div>

                {/* Opponent slots — one per opponent team needed */}
                {Array.from({ length: activeTeamCount - 1 }).map((_, i) => {
                  const opponent = allOpponents[i];
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      {opponent ? (
                        <>
                          <div className="w-16 h-16 rounded-full border-2 border-red-500 overflow-hidden bg-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/20">
                            <img src={opponent.avatar} alt={opponent.username} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] text-white font-medium truncate max-w-[70px]">{opponent.username}</span>
                          <span className="text-[9px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Команда {i + 2}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
                              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 100 + 150}ms` }} />
                              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 100 + 300}ms` }} />
                            </div>
                          </div>
                          <span className="text-[10px] text-white/40">Поиск...</span>
                          <span className="text-[9px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full">Команда {i + 2}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prize distribution */}
            {activeGameType === 'WOW' && activeWoWMapInfo && (
              <div className="bg-dark-200/60 rounded-xl border border-white/10 p-3 mb-4">
                <div className="flex gap-3">
                  <img src={activeWoWMapInfo.image} alt={activeWoWMapInfo.name} className="w-16 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-white">{activeWoWMapInfo.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-[10px] bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded">{activeWoWMapInfo.format}</span>
                      <span className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded">{activeWoWMapInfo.rounds}R</span>
                      <span className="text-[10px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded">{activeTeamCount} команд</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 rounded-2xl border border-yellow-500/20 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/60">💰 Призы по местам</p>
                <span className="text-[10px] text-white/40">Пул {bet * activeTeamCount} UC • 10% комиссия</span>
              </div>
              <div className={`grid gap-1.5 ${activeTeamCount === 2 ? 'grid-cols-2' : activeTeamCount === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {prizes.map((p) => (
                  <div key={p.place} className={`text-center py-2 rounded-xl ${p.place === 1 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5'}`}>
                    <p className="text-[10px] text-white/40 mb-0.5">{p.place} место</p>
                    <p className={`text-sm font-bold ${p.place === 1 ? 'text-yellow-400' : p.place === teamCount ? 'text-red-400' : 'text-white/70'}`}>
                      {p.amount} UC
                    </p>
                    <p className="text-[9px] text-white/30">{p.pct}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status steps */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm text-white">Турнир создан, ставка списана</span>
              </div>

              {/* Team join progress for 3-4 teams */}
              {activeTeamCount > 2 && !foundOpponent && (
                <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{teamsJoinedCount}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-white">Команд собралось: {teamsJoinedCount}/{activeTeamCount}</span>
                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(teamsJoinedCount / activeTeamCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {foundOpponent ? (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-sm text-white">
                    {allOpponents.length > 1 ? `${allOpponents.length} соперника найдено!` : 'Соперник найден!'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                  <div className="relative w-6 h-6 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-yellow-500/50 animate-ping" />
                    <div className="relative w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-xs">🔍</span>
                    </div>
                  </div>
                  <span className="text-sm text-white">{teamCount > 2 ? 'Ждём остальные команды...' : 'Ищем достойного соперника...'}</span>
                </div>
              )}
              <button
                onClick={() => foundOpponent && activeTournamentId && navigate(`/messages/t-${activeTournamentId}`)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 w-full text-left transition-all ${
                  foundOpponent
                    ? 'bg-purple-500/20 border-2 border-purple-500/50 animate-pulse'
                    : 'bg-white/5 border border-white/10 opacity-40'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  foundOpponent ? 'bg-purple-500' : 'bg-white/10'
                }`}>
                  <span className="text-xs">💬</span>
                </div>
                <span className="text-sm text-white font-medium">Чат матча и игра</span>
                {foundOpponent && <span className="ml-auto text-xs text-purple-300">Перейти →</span>}
              </button>
            </div>

            {/* Found message */}
            {foundOpponent && (
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 p-3 mb-4">
                <p className="text-sm font-semibold text-white mb-1">
                  🎮 {allOpponents.length > 1 ? 'Все команды собрались!' : 'Соперник найден!'}
                </p>
                {allOpponents.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {allOpponents.map((op, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
                        <img src={op.avatar} alt="" className="w-5 h-5 rounded-full" />
                        <span className="text-xs text-white/80">{op.username}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-white/70">Перейдите в <span className="text-purple-300 font-medium">Чат матча</span> — там вся информация для начала игры.</p>
              </div>
            )}
          </main>

          {/* Sticky Bottom Button */}
          <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-dark-100 via-dark-100/95 to-transparent pt-8">
            {foundOpponent ? (
              <button
                onClick={() => activeTournamentId && navigate(`/messages/t-${activeTournamentId}`)}
                className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all active:scale-[0.98]"
              >
                💬 Перейти в чат матча
              </button>
            ) : (
              <button
                onClick={handleCancelSearch}
                disabled={!canCancel}
                className="w-full py-3.5 rounded-xl text-sm font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all active:scale-[0.98]"
              >
                ❌ Отменить поиск
              </button>
            )}
          </div>
        </div>

        {/* ── Desktop version ── */}
        <div className="hidden md:block">
          <main className="max-w-3xl mx-auto px-8 pt-8">
            {/* Header */}
            <div className="relative text-center mb-8">
              <button onClick={handleGoBack} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                <span className="text-sm">Назад</span>
              </button>
              <h1 className="text-2xl font-bold text-white mb-1">{foundOpponent ? '✅ Соперники найдены!' : 'Поиск соперника'}</h1>
              <p className="text-sm text-white/40">{activeGameType === 'WOW' ? `WoW • ${activeWoWMapInfo?.format || ''} • ${activeWoWMapInfo?.name || ''}` : `TDM • ${teamMode === 'solo' ? '1v1 Solo' : '2v2 Duo'}`} • {server === 'europe' ? 'Европа' : server} • {bet} UC</p>
            </div>

            {/* VS Arena — Desktop — dynamic: shows N-1 opponent slots */}
            <div className="relative py-12 mb-8">
              {/* Animated rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: '4s' }} />
                <div className="absolute w-48 h-48 rounded-full border border-red-500/15 animate-ping" style={{ animationDuration: '2.5s' }} />
              </div>

              <div className="relative z-10 flex items-center justify-center gap-10 flex-wrap">
                {/* You */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full border-3 border-emerald-500 overflow-hidden bg-emerald-500/20 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">👤</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{user?.username || 'Ты'}</p>
                    <p className="text-xs text-emerald-400">Рейтинг: {user?.rating ?? 1000}</p>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">✓ Готов</span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shadow-xl shadow-red-500/30 ring-4 ring-red-500/20">
                    <span className="text-white font-black text-base">VS</span>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-bold text-yellow-400">{bet} UC</span>
                    <p className="text-[10px] text-white/30 mt-0.5">ставка</p>
                  </div>
                </div>

                {/* Opponent slots */}
                {Array.from({ length: activeTeamCount - 1 }).map((_, i) => {
                  const opponent = allOpponents[i];
                  return (
                    <div key={i} className="flex flex-col items-center gap-3">
                      {opponent ? (
                        <>
                          <div className="w-24 h-24 rounded-full border-3 border-red-500 overflow-hidden bg-red-500/20 flex items-center justify-center shadow-xl shadow-red-500/20">
                            <img src={opponent.avatar} alt={opponent.username} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-white">{opponent.username}</p>
                            <p className="text-xs text-red-400">Команда {i + 2}</p>
                          </div>
                          <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">⚔️ Найден</span>
                        </>
                      ) : (
                        <>
                          <div className="w-24 h-24 rounded-full border-3 border-dashed border-white/20 bg-white/5 flex items-center justify-center">
                            <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
                              <div className="w-2.5 h-2.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 100 + 200}ms` }} />
                              <div className="w-2.5 h-2.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${i * 100 + 400}ms` }} />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-white/40">Поиск...</p>
                            <p className="text-xs text-white/20">Команда {i + 2}</p>
                          </div>
                          <span className="text-xs text-white/20 bg-white/5 border border-white/10 px-3 py-1 rounded-full">⏳ Ожидание</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WoW Map Info */}
            {activeGameType === 'WOW' && activeWoWMapInfo && (
              <div className="bg-dark-200/60 rounded-xl border border-white/10 p-4 mb-4 flex gap-4 items-center">
                <img src={activeWoWMapInfo.image} alt={activeWoWMapInfo.name} className="w-20 h-14 rounded-lg object-cover" />
                <div>
                  <p className="text-sm font-semibold text-white">{activeWoWMapInfo.name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-red-600/30 text-red-400 px-2 py-0.5 rounded">{activeWoWMapInfo.format}</span>
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">{activeWoWMapInfo.rounds}R</span>
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">{activeTeamCount} команд</span>
                    <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">{activeWoWMapInfo.playersPerTeam} игр./ком.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timer + Prize distribution row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-dark-200/60 rounded-2xl border border-white/10 p-5 text-center">
                <p className="text-xs text-white/40 mb-2">Время поиска</p>
                <p className="text-3xl font-mono font-bold text-white">{formatTime(searchTime)}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-600/15 to-orange-600/15 rounded-2xl border border-yellow-500/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/60">💰 Призы по местам</p>
                  <span className="text-[10px] text-white/40">Пул {bet * activeTeamCount} UC</span>
                </div>
                <div className={`grid gap-1 ${activeTeamCount === 2 ? 'grid-cols-2' : activeTeamCount === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {prizes.map((p) => (
                    <div key={p.place} className={`text-center py-1.5 rounded-lg ${p.place === 1 ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                      <p className="text-[10px] text-white/40">{p.place} место</p>
                      <p className={`text-sm font-bold ${p.place === 1 ? 'text-yellow-400' : p.place === teamCount ? 'text-red-400' : 'text-white/70'}`}>
                        {p.amount} UC
                      </p>
                      <p className="text-[9px] text-white/30">{p.pct}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-xs text-white">Ставка списана</span>
              </div>
              {foundOpponent ? (
                <div className="flex-1 flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-xs text-white">{allOpponents.length > 1 ? `${allOpponents.length} соперника` : 'Соперник найден'}</span>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                  <div className="relative w-5 h-5 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-yellow-500/40 animate-ping" />
                    <div className="relative w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-[10px]">🔍</span>
                    </div>
                  </div>
                  <span className="text-xs text-white">{activeTeamCount > 2 ? `Команд: ${teamsJoinedCount}/${activeTeamCount}` : 'Ищем соперника'}</span>
                </div>
              )}
              <button
                onClick={() => foundOpponent && activeTournamentId && navigate(`/messages/t-${activeTournamentId}`)}
                className={`flex-1 flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all ${
                  foundOpponent
                    ? 'bg-purple-500/20 border-2 border-purple-500/50 animate-pulse cursor-pointer'
                    : 'bg-white/5 border border-white/10 opacity-40 cursor-default'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  foundOpponent ? 'bg-purple-500' : 'bg-white/10'
                }`}>
                  <span className="text-[10px]">💬</span>
                </div>
                <span className="text-xs text-white">Чат и игра</span>
                {foundOpponent && <span className="ml-auto text-[10px] text-purple-300">→</span>}
              </button>
            </div>

            {/* Found message — desktop */}
            {foundOpponent && (
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 p-4 mb-6 text-center">
                <p className="text-sm font-semibold text-white mb-1">
                  🎮 {allOpponents.length > 1 ? 'Все команды собрались!' : 'Соперник найден!'}
                </p>
                {allOpponents.length > 1 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    {allOpponents.map((op, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1">
                        <img src={op.avatar} alt="" className="w-5 h-5 rounded-full" />
                        <span className="text-xs text-white/80">{op.username}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-white/70">Перейдите в <span className="text-purple-300 font-medium">Чат матча</span> — там вся информация для начала игры.</p>
              </div>
            )}

            {/* Bottom button — desktop */}
            <div className="flex justify-center">
              {foundOpponent ? (
                <button
                  onClick={() => activeTournamentId && navigate(`/messages/t-${activeTournamentId}`)}
                  className="px-12 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all"
                >
                  💬 Перейти в чат матча
                </button>
              ) : (
                <button
                  onClick={handleCancelSearch}
                  disabled={!canCancel}
                  className="px-12 py-3 rounded-xl text-sm font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all"
                >
                  ❌ Отменить поиск
                </button>
              )}
            </div>
          </main>
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
                <span className="text-white font-bold">{user ? `${Number(user.ucBalance).toLocaleString()} UC` : '— UC'}</span>
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

        {/* ===== ACTIVE TOURNAMENTS BANNER ===== */}
        {myActiveTournaments.length > 0 && viewState === 'create' && (
          <div className="mb-4 space-y-2">
            {myActiveTournaments.map(t => {
              const isSearching = t.status === 'SEARCHING';
              return (
                <button
                  key={t.id}
                  onClick={() => handleViewActiveTournament(t)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 hover:opacity-90 transition-all text-left ${
                    isSearching
                      ? 'bg-yellow-500/10 border border-yellow-500/30'
                      : 'bg-emerald-500/10 border border-emerald-500/30'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${isSearching ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white">
                      {isSearching ? '🔍 Идёт поиск...' : '✅ Соперник найден'}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-white/50">{t.gameType === 'WOW' ? 'WoW' : 'TDM'}</span>
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs text-white/50">{t.gameType === 'WOW' && t.wowMap ? t.wowMap.format : (t.teamMode === 'SOLO' ? '1 на 1' : '2 на 2')}</span>
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs text-white/50">{t.teamCount} команд</span>
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs text-yellow-400">{t.bet} UC</span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${isSearching ? 'text-yellow-400' : 'text-emerald-400'}`}>Перейти →</span>
                </button>
              );
            })}
          </div>
        )}

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
                              ${selectedMap?.id === map.id 
                                ? 'border-red-500 ring-2 ring-red-500/30' 
                                : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="relative h-[100px] sm:h-[110px] md:h-[120px]">
                      <img src={map.image} alt={map.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white/70 font-mono">
                        ID: {map.mapId}
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 bg-blue-600/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-semibold">
                        {map.format}
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
                  <p className="text-sm font-bold text-purple-300">{selectedMap?.format}</p>
                </div>
                <div className="bg-zinc-700/80 rounded-lg p-2.5 text-center border border-zinc-600">
                  <p className="text-xs text-zinc-300 mb-1">Команд</p>
                  <p className="text-sm font-bold text-cyan-300">{selectedMap?.teamCount}</p>
                </div>
                <div className="bg-zinc-700/80 rounded-lg p-2.5 text-center border border-zinc-600">
                  <p className="text-xs text-zinc-300 mb-1">Раундов</p>
                  <p className="text-sm font-bold text-yellow-300">{selectedMap?.rounds}</p>
                </div>
              </div>
              {selectedMap?.rules && (
                <p className="text-xs text-zinc-300 mt-3 text-center bg-zinc-700/50 rounded-lg py-2 px-3">{selectedMap?.rules}</p>
              )}
            </div>

            {/* WoW Bet & Settings */}
            <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
              {/* Prize Distribution for WoW */}
              {(() => {
                const wowPool = bet * (selectedMap?.teamCount || 2);
                const wowFee = wowPool * 0.1;
                const wowNet = wowPool - wowFee;
                const wowPrizes = selectedMap?.teamCount === 2 
                  ? [{ place: 1, pct: 100, amount: wowNet.toFixed(0) }, { place: 2, pct: 0, amount: '0' }]
                  : selectedMap?.teamCount === 3
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
                          <p className={`text-sm font-bold ${p.place === 1 ? 'text-yellow-400' : p.place === selectedMap?.teamCount ? 'text-red-400' : 'text-white/70'}`}>
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
                const wowMultiplier = selectedMap?.teamCount === 2 ? 1 : selectedMap?.teamCount === 3 ? 1.5 : 2;
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
                  {servers.map((s) => {
                    const isAvailable = s.id === 'europe';
                    return (
                      <button
                        key={s.id}
                        onClick={() => isAvailable && setServer(s.id)}
                        disabled={!isAvailable}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all
                                  ${!isAvailable
                                    ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                                    : server === s.id 
                                      ? 'bg-red-600/30 text-red-400 border border-red-500/50' 
                                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}
                      >
                        {s.label}{!isAvailable && ' (скоро)'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player IDs - based on playersPerTeam */}
              <div className="mb-4">
                <p className="text-sm text-white font-medium mb-2">🆔 ID игроков ({selectedMap?.playersPerTeam} чел.)</p>
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
                  {(selectedMap?.playersPerTeam ?? 0) >= 2 && (
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
                  {(selectedMap?.playersPerTeam || 0) >= 3 && (
                    <input
                      type="text"
                      value={wowExtraIds[0] || ''}
                      onChange={(e) => { const n = [...wowExtraIds]; n[0] = e.target.value.replace(/\D/g, ''); setWowExtraIds(n); setIdError(''); }}
                      placeholder="ID друга #3 (10 цифр)"
                      maxLength={10}
                      className="w-full bg-zinc-700/80 border border-zinc-600 rounded-xl px-4 py-3
                               text-sm text-white placeholder-zinc-400 outline-none
                               focus:border-red-500/50 transition-colors"
                    />
                  )}
                  {(selectedMap?.playersPerTeam || 0) >= 4 && (
                    <input
                      type="text"
                      value={wowExtraIds[1] || ''}
                      onChange={(e) => { const n = [...wowExtraIds]; n[1] = e.target.value.replace(/\D/g, ''); setWowExtraIds(n); setIdError(''); }}
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
                onClick={handleWoWCreate}
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
            {wowOpenTournaments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/40">Нет активных матчей</p>
                <p className="text-xs text-white/30 mt-1">Создай свой!</p>
              </div>
            ) : (
              wowOpenTournaments.map((t) => {
                const isFull = t.teamsJoined >= t.teamCount;
                return (
                  <div key={t.id} className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                    <div className="flex gap-3 mb-3">
                      {t.wowMap && (
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={t.wowMap.image} alt={t.wowMap.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-1 left-1 text-[8px] text-white/80 font-mono">ID: {t.wowMap.mapId}</div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{t.wowMap?.name || 'WoW'}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded">{t.wowMap?.format}</span>
                          <span className="text-xs bg-white/10 text-white/60 px-1.5 py-0.5 rounded">{t.wowMap?.rounds}R</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img src={t.creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=u`} alt="" className="w-6 h-6 rounded-full" />
                        <span className="text-xs text-white/70">{t.creator?.username || 'Игрок'}</span>
                      </div>
                      <span className="text-sm font-bold text-accent-green">{t.bet} UC</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                      <span>{serverNames[t.server.toLowerCase() as ServerRegion] || t.server}</span>
                      <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-yellow-400'}`}>
                        {t.teamsJoined}/{t.teamCount} команд
                      </span>
                    </div>
                    <button
                      onClick={() => { if (!isAuthenticated) { setShowAuthModal(true); return; } setJoiningWoW(t); setWowJoinIds(Array(t.wowMap?.playersPerTeam || 1).fill('')); setWowJoinError(''); }}
                      disabled={isFull}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                                ${isFull 
                                  ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                                  : 'bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30'}`}
                    >
                      {isFull ? '🔒 Заполнен' : '⚡ Вступить'}
                    </button>
                    {joiningWoW?.id === t.id && (
                      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                        {Array.from({ length: t.wowMap?.playersPerTeam || 1 }).map((_, i) => (
                          <input key={i} type="text" value={wowJoinIds[i] || ''} onChange={e => { const n = [...wowJoinIds]; n[i] = e.target.value.replace(/\D/g, ''); setWowJoinIds(n); setWowJoinError(''); }} placeholder={i === 0 ? 'Твой ID (10 цифр)' : `ID друга #${i+1}`} maxLength={10} className="w-full bg-zinc-700/80 border border-zinc-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50" />
                        ))}
                        {wowJoinError && <p className="text-red-400 text-xs">{wowJoinError}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => setJoiningWoW(null)} className="flex-1 py-2 rounded-xl bg-white/10 text-white/60 text-sm">Отмена</button>
                          <button onClick={() => handleWoWJoin(t)} disabled={wowJoinLoading} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
                            {wowJoinLoading ? '...' : '⚡ Вступить'}
                          </button>
                        </div>
                      </div>
                    )}
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
            <div className={`grid gap-1 ${teamCount === 2 ? 'grid-cols-2' : teamCount === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
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

          {/* Error */}
          {createError && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-3">
              <p className="text-red-400 text-sm">{createError}</p>
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
            <span className="text-xs text-white/40">{openTournaments.length} активных</span>
          </div>

          {loadingTournaments ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-white/20 border-t-red-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-white/40 text-sm">Загрузка...</p>
            </div>
          ) : openTournaments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40">Нет доступных турниров</p>
              <p className="text-xs text-white/30 mt-1">Создай свой!</p>
            </div>
          ) : (
          <div className="space-y-2">
            {openTournaments.map((t) => {
              const isExpanded = joiningTournament?.id === t.id;
              const isDuo = t.teamMode === 'DUO';
              return (
              <div 
                key={t.id} 
                className={`bg-dark-200/60 backdrop-blur-sm rounded-xl border p-3 transition-all ${
                  isExpanded ? 'border-accent-green/50' : 'border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src={t.creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.creator?.username || 'user'}`}
                    alt={t.creator?.username || 'Игрок'}
                    className="w-10 h-10 rounded-full border border-white/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.creator?.username || 'Игрок'}</p>
                    <p className="text-xs text-white/40">
                      {isDuo ? 'Duo' : 'Solo'} • {t.teamCount} команды • {serverNames[t.server.toLowerCase() as ServerRegion] || t.server}
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
                      {Array.from({ length: t.teamsJoined }).map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-red-500/50 border-2 border-dark-200 flex items-center justify-center text-xs">
                          👤
                        </div>
                      ))}
                      {Array.from({ length: t.teamCount - t.teamsJoined }).map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-white/10 border-2 border-dark-200 flex items-center justify-center text-xs text-white/30">
                          ?
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-white/50">{t.teamsJoined}/{t.teamCount} команд</span>
                  </div>
                  {!isExpanded && (
                    <button
                      onClick={() => {
                        if (!isAuthenticated) { setShowAuthModal(true); return; }
                        setJoiningTournament(t);
                        setJoinPlayerId('');
                        setJoinPartnerId('');
                        setJoinError('');
                      }}
                      className="px-4 py-1.5 rounded-lg bg-accent-green/20 border border-accent-green/50 
                               text-accent-green text-xs font-semibold hover:bg-accent-green/30 transition-colors"
                    >
                      Вступить
                    </button>
                  )}
                </div>

                {/* Inline join form — appears after clicking Вступить */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <p className="text-xs text-white/60 font-medium">
                      {isDuo ? '👥 Режим Duo — введи свой ID и ID напарника' : '👤 Режим Solo — введи свой PUBG ID'}
                    </p>
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={joinPlayerId}
                        onChange={e => { setJoinPlayerId(e.target.value.replace(/\D/g, '')); setJoinError(''); }}
                        placeholder="Твой PUBG ID (10 цифр)"
                        autoFocus
                        className="w-full bg-dark-100/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors"
                      />
                      <p className="text-xs text-white/30 mt-0.5 text-right">{joinPlayerId.length}/10</p>
                    </div>
                    {isDuo && (
                      <div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={joinPartnerId}
                          onChange={e => { setJoinPartnerId(e.target.value.replace(/\D/g, '')); setJoinError(''); }}
                          placeholder="ID напарника (10 цифр)"
                          className="w-full bg-dark-100/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors"
                        />
                        <p className="text-xs text-white/30 mt-0.5 text-right">{joinPartnerId.length}/10</p>
                      </div>
                    )}
                    {joinError && <p className="text-red-400 text-xs">{joinError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setJoiningTournament(null)}
                        className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-medium hover:bg-white/10 transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={async () => {
                          if (!validateId(joinPlayerId)) { setJoinError('Введи свой ID (10 цифр)'); return; }
                          if (isDuo && !validateId(joinPartnerId)) { setJoinError('Введи ID напарника (10 цифр)'); return; }
                          setJoinLoading(true);
                          setJoinError('');
                          try {
                            setBet(t.bet);
                            setTeamMode(isDuo ? 'duo' : 'solo');
                            setTeamCount(t.teamCount);
                            if (t.server) setServer((t.server.toLowerCase() || 'europe') as ServerRegion);
                            const result = await tournamentApi.join(t.id, {
                              playerId: joinPlayerId,
                              partnerId: isDuo ? joinPartnerId : undefined,
                            });
                            setActiveTournamentId(t.id);
                            setViewState('searching');
                            setSearchTime(0);
                            setJoiningTournament(null);
                            if (result.tournamentStarted) {
                              try {
                                const data = await tournamentApi.get(t.id);
                                const opponentTeams = data.teams.filter(team => team.id !== data.userTeamId);
                                const opponents = opponentTeams.map(team => {
                                  const captain = team.players.find(p => p.isCaptain) || team.players[0];
                                  return captain ? { username: captain.user.username, avatar: captain.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${captain.user.username}` } : null;
                                }).filter((o): o is {username: string; avatar: string} => o !== null);
                                setAllOpponents(opponents);
                                if (opponents.length > 0) setFoundOpponent(opponents[0]);
                              } catch {}
                            }
                          } catch (err: any) {
                            setJoinError(err?.message || 'Ошибка при вступлении');
                          } finally {
                            setJoinLoading(false);
                          }
                        }}
                        disabled={joinLoading || !validateId(joinPlayerId) || (isDuo && !validateId(joinPartnerId))}
                        className="flex-1 py-2 rounded-lg bg-accent-green/20 border border-accent-green/50 text-accent-green text-xs font-semibold hover:bg-accent-green/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {joinLoading ? '...' : 'Подтвердить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
          )}

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
            {classicLoading ? (
              <div className="text-center py-8"><p className="text-white/50 text-sm">Загрузка турниров...</p></div>
            ) : classicTournaments.length === 0 ? (
              <div className="text-center py-8"><p className="text-white/50 text-sm">Нет доступных турниров</p></div>
            ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {classicTournaments.map((tournament) => {
                const timeLeft = new Date(tournament.startTime).getTime() - currentTime;
                const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                const cModeLabels: Record<string, string> = { SOLO: '👤 Solo', DUO: '👥 Duo', SQUAD: '🎯 Squad' };
                const cModeColors: Record<string, string> = { SOLO: 'bg-purple-600', DUO: 'bg-cyan-600', SQUAD: 'bg-orange-600' };
                const regCount = tournament.registeredPlayers ?? 0;
                
                const isExpired = timeLeft <= 0 && !myClassicTournamentIds.has(tournament.id);
                const isFull = regCount >= tournament.maxParticipants;
                const isRegistered = myClassicTournamentIds.has(tournament.id);
                const fillPct = Math.min((regCount / tournament.maxParticipants) * 100, 100);
                
                return (
                  <div 
                    key={tournament.id}
                    className={`group relative rounded-2xl overflow-hidden border transition-all ${
                      isRegistered ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' :
                      isExpired ? 'border-white/5 opacity-50' :
                      'border-white/10 hover:border-purple-500/30'
                    }`}
                    style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d15 100%)' }}
                  >
                    {/* Map Image */}
                    <div className="relative h-36">
                      {tournament.mapImage ? (
                        <img src={tournament.mapImage} alt={tournament.map} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/60 via-zinc-900 to-zinc-800" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-black/40 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`${cModeColors[tournament.mode] || 'bg-purple-600'} px-2 py-0.5 rounded-md text-[11px] text-white font-semibold`}>
                          {cModeLabels[tournament.mode] || tournament.mode}
                        </span>
                        <span className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] text-white/70">{tournament.server}</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        <span className="text-[11px] text-emerald-400 font-bold">{tournament.prizePool} UC</span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-bold text-base leading-tight">{tournament.title || tournament.map}</p>
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-3 space-y-2.5">
                      {/* Timer + Entry */}
                      <div className="flex gap-2">
                        {timeLeft > 0 ? (
                          <div className="flex-1 flex items-center gap-2 bg-yellow-500/8 border border-yellow-500/15 rounded-xl px-3 py-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                            <div>
                              <p className="text-[10px] text-white/40 mb-0.5">Старт через</p>
                              <p className="text-sm font-bold text-yellow-400 tabular-nums">{days > 0 && `${days}д `}{hours > 0 && `${hours}:`}{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center bg-zinc-800/60 border border-white/5 rounded-xl px-3 py-2">
                            <p className="text-xs font-semibold text-white/30">Регистрация закрыта</p>
                          </div>
                        )}
                        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center min-w-[80px]">
                          <p className="text-[10px] text-white/40 mb-0.5">Взнос</p>
                          <p className="text-sm font-bold text-white">{tournament.entryFee} UC</p>
                        </div>
                      </div>
                      
                      {/* Prizes row */}
                      <div className="flex gap-1.5">
                        <div className="flex-1 bg-yellow-500/8 border border-yellow-500/15 rounded-xl py-1.5 text-center">
                          <p className="text-[9px] text-yellow-500/60">1 место</p>
                          <p className="text-sm font-extrabold text-yellow-400">{tournament.prize1}</p>
                        </div>
                        {tournament.winnerCount >= 2 && (
                          <div className="flex-1 bg-zinc-400/8 border border-zinc-500/15 rounded-xl py-1.5 text-center">
                            <p className="text-[9px] text-zinc-400/60">2 место</p>
                            <p className="text-sm font-extrabold text-zinc-300">{tournament.prize2}</p>
                          </div>
                        )}
                        {tournament.winnerCount >= 3 && (
                          <div className="flex-1 bg-orange-500/8 border border-orange-500/15 rounded-xl py-1.5 text-center">
                            <p className="text-[9px] text-orange-400/60">3 место</p>
                            <p className="text-sm font-extrabold text-orange-400">{tournament.prize3}</p>
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
                        <button onClick={() => navigate('/messages')}
                          className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-sm font-bold hover:bg-emerald-500/25 transition-colors">
                          ✅ Зарегистрирован · Чат
                        </button>
                      ) : isExpired ? (
                        <div className="w-full py-2.5 rounded-xl bg-white/3 text-white/25 text-sm font-bold text-center">Регистрация закрыта</div>
                      ) : isFull ? (
                        <div className="w-full py-2.5 rounded-xl bg-white/3 text-white/25 text-sm font-bold text-center">Мест нет</div>
                      ) : (
                        <button onClick={() => {
                            if (!isAuthenticated) { setShowAuthModal(true); return; }
                            setSelectedClassicTournament(tournament);
                            setClassicPlayerIds(tournament.mode === 'SOLO' ? [''] : tournament.mode === 'DUO' ? ['', ''] : ['', '', '', '']);
                            setClassicRegError('');
                            setShowClassicRegistration(true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold hover:brightness-110 transition-all">
                          Зарегистрироваться
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
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
                <span className="text-white text-sm font-bold">{user ? `${Number(user.ucBalance).toLocaleString()} UC` : '— UC'}</span>
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

          {/* ===== ACTIVE TOURNAMENTS BANNER (mobile) ===== */}
          {myActiveTournaments.length > 0 && viewState === 'create' && (
            <div className="mb-3 space-y-2">
              {myActiveTournaments.map(t => {
                const isSearching = t.status === 'SEARCHING';
                return (
                  <button
                    key={t.id}
                    onClick={() => handleViewActiveTournament(t)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:opacity-90 transition-all text-left ${
                      isSearching
                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                        : 'bg-emerald-500/10 border border-emerald-500/30'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${isSearching ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white">
                        {isSearching ? '🔍 Идёт поиск...' : '✅ Соперник найден'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-white/50">{t.gameType === 'WOW' ? 'WoW' : 'TDM'}</span>
                        <span className="text-[10px] text-white/30">•</span>
                        <span className="text-[10px] text-white/50">{t.gameType === 'WOW' && t.wowMap ? t.wowMap.format : (t.teamMode === 'SOLO' ? '1 на 1' : '2 на 2')}</span>
                        <span className="text-[10px] text-white/30">•</span>
                        <span className="text-[10px] text-white/50">{t.teamCount} команд</span>
                        <span className="text-[10px] text-white/30">•</span>
                        <span className="text-[10px] text-yellow-400">{t.bet} UC</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${isSearching ? 'text-yellow-400' : 'text-emerald-400'}`}>→</span>
                  </button>
                );
              })}
            </div>
          )}

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
              <div className={`grid gap-1 ${teamCount === 2 ? 'grid-cols-2' : teamCount === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
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
                  inputMode="numeric"
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
                    inputMode="numeric"
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

            {/* Error */}
            {createError && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-3">
                <p className="text-red-400 text-sm">{createError}</p>
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

          {/* ===== TDM JOIN SECTION (Mobile) ===== */}
          {activeMode === 'tdm' && actionTab === 'join' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">⚡ Доступные турниры</h2>
              <span className="text-xs text-white/40">{openTournaments.length} активных</span>
            </div>

            {loadingTournaments ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-white/20 border-t-red-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-white/40 text-sm">Загрузка...</p>
              </div>
            ) : openTournaments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/40">Нет доступных турниров</p>
                <p className="text-xs text-white/30 mt-1">Создай свой!</p>
              </div>
            ) : (
            <div className="space-y-2">
              {openTournaments.map((t) => {
                const isExpanded = joiningTournament?.id === t.id;
                const isDuo = t.teamMode === 'DUO';
                return (
                <div 
                  key={t.id} 
                  className={`bg-dark-200/60 backdrop-blur-sm rounded-xl border p-3 transition-all ${
                    isExpanded ? 'border-accent-green/50' : 'border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img 
                      src={t.creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.creator?.username || 'user'}`}
                      alt={t.creator?.username || 'Игрок'}
                      className="w-10 h-10 rounded-full border border-white/20"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{t.creator?.username || 'Игрок'}</p>
                      <p className="text-xs text-white/40">
                        {isDuo ? 'Duo' : 'Solo'} • {t.teamCount} команды • {serverNames[t.server.toLowerCase() as ServerRegion] || t.server}
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
                        {Array.from({ length: t.teamsJoined }).map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-red-500/50 border-2 border-dark-200 flex items-center justify-center text-xs">
                            👤
                          </div>
                        ))}
                        {Array.from({ length: t.teamCount - t.teamsJoined }).map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-white/10 border-2 border-dark-200 flex items-center justify-center text-xs text-white/30">
                            ?
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-white/50">{t.teamsJoined}/{t.teamCount} команд</span>
                    </div>
                    {!isExpanded && (
                      <button
                        onClick={() => {
                          if (!isAuthenticated) { setShowAuthModal(true); return; }
                          setJoiningTournament(t);
                          setJoinPlayerId('');
                          setJoinPartnerId('');
                          setJoinError('');
                        }}
                        className="px-4 py-1.5 rounded-lg bg-accent-green/20 border border-accent-green/50 
                                 text-accent-green text-xs font-semibold hover:bg-accent-green/30 transition-colors"
                      >
                        Вступить
                      </button>
                    )}
                  </div>

                  {/* Inline join form — appears after clicking Вступить */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <p className="text-xs text-white/60 font-medium">
                        {isDuo ? '👥 Режим Duo — введи свой ID и ID напарника' : '👤 Режим Solo — введи свой PUBG ID'}
                      </p>
                      <div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={joinPlayerId}
                          onChange={e => { setJoinPlayerId(e.target.value.replace(/\D/g, '')); setJoinError(''); }}
                          placeholder="Твой PUBG ID (10 цифр)"
                          autoFocus
                          className="w-full bg-dark-100/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors"
                        />
                        <p className="text-xs text-white/30 mt-0.5 text-right">{joinPlayerId.length}/10</p>
                      </div>
                      {isDuo && (
                        <div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            value={joinPartnerId}
                            onChange={e => { setJoinPartnerId(e.target.value.replace(/\D/g, '')); setJoinError(''); }}
                            placeholder="ID напарника (10 цифр)"
                            className="w-full bg-dark-100/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent-green/50 transition-colors"
                          />
                          <p className="text-xs text-white/30 mt-0.5 text-right">{joinPartnerId.length}/10</p>
                        </div>
                      )}
                      {joinError && <p className="text-red-400 text-xs">{joinError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setJoiningTournament(null)}
                          className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-medium hover:bg-white/10 transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={async () => {
                            if (!validateId(joinPlayerId)) { setJoinError('Введи свой ID (10 цифр)'); return; }
                            if (isDuo && !validateId(joinPartnerId)) { setJoinError('Введи ID напарника (10 цифр)'); return; }
                            setJoinLoading(true);
                            setJoinError('');
                            try {
                              setBet(t.bet);
                              setTeamMode(isDuo ? 'duo' : 'solo');
                              setTeamCount(t.teamCount);
                              if (t.server) setServer((t.server.toLowerCase() || 'europe') as ServerRegion);
                              const result = await tournamentApi.join(t.id, {
                                playerId: joinPlayerId,
                                partnerId: isDuo ? joinPartnerId : undefined,
                              });
                              setActiveTournamentId(t.id);
                              setViewState('searching');
                              setSearchTime(0);
                              setJoiningTournament(null);
                              if (result.tournamentStarted) {
                                try {
                                  const data = await tournamentApi.get(t.id);
                                  const opponentTeams = data.teams.filter(team => team.id !== data.userTeamId);
                                  const opponents = opponentTeams.map(team => {
                                    const captain = team.players.find(p => p.isCaptain) || team.players[0];
                                    return captain ? { username: captain.user.username, avatar: captain.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${captain.user.username}` } : null;
                                  }).filter((o): o is {username: string; avatar: string} => o !== null);
                                  setAllOpponents(opponents);
                                  if (opponents.length > 0) setFoundOpponent(opponents[0]);
                                } catch {}
                              }
                            } catch (err: any) {
                              setJoinError(err?.message || 'Ошибка при вступлении');
                            } finally {
                              setJoinLoading(false);
                            }
                          }}
                          disabled={joinLoading || !validateId(joinPlayerId) || (isDuo && !validateId(joinPartnerId))}
                          className="flex-1 py-2 rounded-lg bg-accent-green/20 border border-accent-green/50 text-accent-green text-xs font-semibold hover:bg-accent-green/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {joinLoading ? '...' : 'Подтвердить'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
            )}

            <p className="text-xs text-white/30 text-center mt-3">
              💡 После вступления отключиться можно только через 1 час
            </p>
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
                      className={`flex-shrink-0 w-44 cursor-pointer rounded-xl overflow-hidden border-2 transition-all
                                ${selectedMap?.id === map.id 
                                  ? 'border-red-500 ring-2 ring-red-500/30' 
                                  : 'border-white/10'}`}
                    >
                      <div className="relative h-24">
                        <img src={map.image} alt={map.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-1 right-1 bg-black/50 backdrop-blur-sm px-1 py-0.5 rounded text-[8px] text-white/70 font-mono">
                          ID: {map.mapId}
                        </div>
                        <div className="absolute bottom-1 left-1 bg-blue-600/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white font-semibold">
                          {map.format}
                        </div>
                      </div>
                      <div className="bg-dark-200/90 p-2">
                        <p className="text-[11px] text-white font-medium truncate">{map.name}</p>
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
                    <p className="text-xs font-bold text-purple-300">{selectedMap?.format}</p>
                  </div>
                  <div className="bg-zinc-700/80 rounded-lg p-2 text-center border border-zinc-600">
                    <p className="text-xs text-zinc-300">Команд</p>
                    <p className="text-xs font-bold text-cyan-300">{selectedMap?.teamCount}</p>
                  </div>
                  <div className="bg-zinc-700/80 rounded-lg p-2 text-center border border-zinc-600">
                    <p className="text-xs text-zinc-300">Раундов</p>
                    <p className="text-xs font-bold text-yellow-300">{selectedMap?.rounds}</p>
                  </div>
                </div>
                {selectedMap?.rules && (
                  <p className="text-xs text-zinc-300 mt-2 text-center bg-zinc-700/50 rounded-lg py-1.5 px-2">{selectedMap?.rules}</p>
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
                  <p className="text-xs text-white font-medium mb-2">🆔 ID игроков ({selectedMap?.playersPerTeam} чел.)</p>
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
                    {(selectedMap?.playersPerTeam ?? 0) >= 2 && (
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
                    {(selectedMap?.playersPerTeam || 0) >= 3 && (
                      <input
                        type="text"
                        value={wowExtraIds[0] || ''}
                        onChange={(e) => { const n = [...wowExtraIds]; n[0] = e.target.value.replace(/\D/g, ''); setWowExtraIds(n); setIdError(''); }}
                        placeholder="ID друга #3 (10 цифр)"
                        maxLength={10}
                        className="w-full bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-2.5
                                 text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50"
                      />
                    )}
                    {(selectedMap?.playersPerTeam || 0) >= 4 && (
                      <input
                        type="text"
                        value={wowExtraIds[1] || ''}
                        onChange={(e) => { const n = [...wowExtraIds]; n[1] = e.target.value.replace(/\D/g, ''); setWowExtraIds(n); setIdError(''); }}
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
                  onClick={handleWoWCreate}
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
              {wowOpenTournaments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/40">Нет активных матчей</p>
                  <p className="text-xs text-white/30 mt-1">Создай свой!</p>
                </div>
              ) : (
                wowOpenTournaments.map((t) => {
                  const isFull = t.teamsJoined >= t.teamCount;
                  return (
                    <div key={t.id} className="bg-dark-200/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                      <div className="flex gap-3 mb-3">
                        {t.wowMap && (
                          <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={t.wowMap.image} alt={t.wowMap.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-1 left-1 text-[8px] text-white/80 font-mono">ID: {t.wowMap.mapId}</div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{t.wowMap?.name || 'WoW'}</p>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            <span className="text-xs bg-red-600/30 text-red-400 px-1.5 py-0.5 rounded">{t.wowMap?.format}</span>
                            <span className="text-xs bg-white/10 text-white/60 px-1.5 py-0.5 rounded">{t.wowMap?.rounds}R</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <img src={t.creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=u`} alt="" className="w-6 h-6 rounded-full" />
                          <span className="text-xs text-white/70">{t.creator?.username || 'Игрок'}</span>
                        </div>
                        <span className="text-sm font-bold text-accent-green">{t.bet} UC</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                        <span>{serverNames[t.server.toLowerCase() as ServerRegion] || t.server}</span>
                        <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-yellow-400'}`}>
                          {t.teamsJoined}/{t.teamCount} команд
                        </span>
                      </div>
                      <button
                        onClick={() => { if (!isAuthenticated) { setShowAuthModal(true); return; } setJoiningWoW(t); setWowJoinIds(Array(t.wowMap?.playersPerTeam || 1).fill('')); setWowJoinError(''); }}
                        disabled={isFull}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                                  ${isFull 
                                    ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                                    : 'bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30'}`}
                      >
                        {isFull ? '🔒 Заполнен' : '⚡ Вступить'}
                      </button>
                      {joiningWoW?.id === t.id && (
                        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                          {Array.from({ length: t.wowMap?.playersPerTeam || 1 }).map((_, i) => (
                            <input key={i} type="text" value={wowJoinIds[i] || ''} onChange={e => { const n = [...wowJoinIds]; n[i] = e.target.value.replace(/\D/g, ''); setWowJoinIds(n); setWowJoinError(''); }} placeholder={i === 0 ? 'Твой ID (10 цифр)' : `ID друга #${i+1}`} maxLength={10} className="w-full bg-zinc-700/80 border border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-400 outline-none focus:border-red-500/50" />
                          ))}
                          {wowJoinError && <p className="text-red-400 text-xs">{wowJoinError}</p>}
                          <div className="flex gap-2">
                            <button onClick={() => setJoiningWoW(null)} className="flex-1 py-2 rounded-lg bg-white/10 text-white/60 text-sm">Отмена</button>
                            <button onClick={() => handleWoWJoin(t)} disabled={wowJoinLoading} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
                              {wowJoinLoading ? '...' : '⚡ Вступить'}
                            </button>
                          </div>
                        </div>
                      )}
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
              {classicLoading ? (
                <div className="text-center py-8"><p className="text-white/50 text-sm">Загрузка турниров...</p></div>
              ) : classicTournaments.length === 0 ? (
                <div className="text-center py-8"><p className="text-white/50 text-sm">Нет доступных турниров</p></div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classicTournaments.map((tournament) => {
                  const timeLeft = new Date(tournament.startTime).getTime() - currentTime;
                  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                  const cModeLabels: Record<string, string> = { SOLO: '👤 Solo', DUO: '👥 Duo', SQUAD: '🎯 Squad' };
                  const cModeColors: Record<string, string> = { SOLO: 'bg-purple-600', DUO: 'bg-cyan-600', SQUAD: 'bg-orange-600' };
                  const regCount = tournament.registeredPlayers ?? 0;
                  const isExpiredM = timeLeft <= 0 && !myClassicTournamentIds.has(tournament.id);
                  const isFullM = regCount >= tournament.maxParticipants;
                  const isRegM = myClassicTournamentIds.has(tournament.id);
                  const fillM = Math.min((regCount / tournament.maxParticipants) * 100, 100);
                  
                  return (
                    <div 
                      key={tournament.id}
                      className={`rounded-2xl overflow-hidden border transition-all ${
                        isRegM ? 'border-emerald-500/40' : isExpiredM ? 'border-white/5 opacity-50' : 'border-white/10'
                      }`}
                      style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d15 100%)' }}
                    >
                      <div className="relative h-28">
                        {tournament.mapImage ? (
                          <img src={tournament.mapImage} alt={tournament.map} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-900/60 via-zinc-900 to-zinc-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d15] via-black/40 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                          <span className={`${cModeColors[tournament.mode] || 'bg-purple-600'} px-2 py-0.5 rounded-md text-[11px] text-white font-semibold`}>
                            {cModeLabels[tournament.mode] || tournament.mode}
                          </span>
                          <span className="bg-black/50 px-2 py-0.5 rounded-md text-[11px] text-white/70">{tournament.server}</span>
                        </div>
                        <div className="absolute top-2.5 right-2.5 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          <span className="text-[11px] text-emerald-400 font-bold">{tournament.prizePool} UC</span>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 right-2.5">
                          <p className="text-white font-bold text-sm leading-tight">{tournament.title || tournament.map}</p>
                        </div>
                      </div>
                      
                      <div className="p-3 space-y-2">
                        {/* Timer + Entry */}
                        <div className="flex gap-2">
                          {timeLeft > 0 ? (
                            <div className="flex-1 flex items-center gap-2 bg-yellow-500/8 border border-yellow-500/15 rounded-xl px-2.5 py-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                              <div>
                                <p className="text-[10px] text-white/40">Старт через</p>
                                <p className="text-xs font-bold text-yellow-400 tabular-nums">{hours}:{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center bg-zinc-800/60 border border-white/5 rounded-xl px-2.5 py-1.5">
                              <p className="text-[11px] font-semibold text-white/30">Регистрация закрыта</p>
                            </div>
                          )}
                          <div className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-center min-w-[70px]">
                            <p className="text-[10px] text-white/40">Взнос</p>
                            <p className="text-xs font-bold text-white">{tournament.entryFee} UC</p>
                          </div>
                        </div>

                        {/* Prizes row */}
                        <div className="flex gap-1.5">
                          <div className="flex-1 bg-yellow-500/8 border border-yellow-500/15 rounded-xl py-1.5 text-center">
                            <p className="text-[9px] text-yellow-500/60">1 место</p>
                            <p className="text-xs font-extrabold text-yellow-400">{tournament.prize1}</p>
                          </div>
                          {tournament.winnerCount >= 2 && (
                            <div className="flex-1 bg-zinc-400/8 border border-zinc-500/15 rounded-xl py-1.5 text-center">
                              <p className="text-[9px] text-zinc-400/60">2 место</p>
                              <p className="text-xs font-extrabold text-zinc-300">{tournament.prize2}</p>
                            </div>
                          )}
                          {tournament.winnerCount >= 3 && (
                            <div className="flex-1 bg-orange-500/8 border border-orange-500/15 rounded-xl py-1.5 text-center">
                              <p className="text-[9px] text-orange-400/60">3 место</p>
                              <p className="text-xs font-extrabold text-orange-400">{tournament.prize3}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Players bar */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-white/40">{regCount}/{tournament.maxParticipants}</span>
                            <span className={`font-semibold ${isFullM ? 'text-red-400' : 'text-purple-400'}`}>{Math.round(fillM)}%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isFullM ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${fillM}%` }} />
                          </div>
                        </div>
                        
                        {/* Action */}
                        {isRegM ? (
                          <button onClick={() => navigate('/messages')}
                            className="w-full py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
                            ✅ Зарегистрирован · Чат
                          </button>
                        ) : isExpiredM ? (
                          <div className="w-full py-2 rounded-xl bg-white/3 text-white/25 text-xs font-bold text-center">Закрыта</div>
                        ) : isFullM ? (
                          <div className="w-full py-2 rounded-xl bg-white/3 text-white/25 text-xs font-bold text-center">Мест нет</div>
                        ) : (
                          <button onClick={() => {
                              if (!isAuthenticated) { setShowAuthModal(true); return; }
                              setSelectedClassicTournament(tournament);
                              setClassicPlayerIds(tournament.mode === 'SOLO' ? [''] : tournament.mode === 'DUO' ? ['', ''] : ['', '', '', '']);
                              setClassicRegError('');
                              setShowClassicRegistration(true);
                            }}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold">
                            Зарегистрироваться
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}
        </main>
      </div>
      {/* ===== RULES MODAL (shared desktop + mobile) ===== */}
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
      {/* ===== CLASSIC REGISTRATION MODAL (shared desktop + mobile) ===== */}
      {showClassicRegistration && selectedClassicTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !classicRegLoading && setShowClassicRegistration(false)}
          />
          <div className="relative w-full max-w-lg bg-dark-100 rounded-2xl border border-white/20 p-4 pb-6 animate-slide-up"
               style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">📝 Регистрация на турнир</h3>
              <p className="text-xs text-white/50">
                {selectedClassicTournament.title || selectedClassicTournament.map} • {selectedClassicTournament.mode === 'SOLO' ? 'Solo' : selectedClassicTournament.mode === 'DUO' ? 'Duo' : 'Squad'}
              </p>
              <p className="text-xs text-white/40 mt-1">
                Взнос: <span className="text-yellow-400 font-semibold">{selectedClassicTournament.entryFee} UC</span> • Приз: <span className="text-accent-green font-semibold">{selectedClassicTournament.prizePool} UC</span>
              </p>
            </div>

            {classicRegError && (
              <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{classicRegError}</div>
            )}

            <div className="space-y-3 mb-4">
              <p className="text-xs text-white/60">🆔 PUBG Mobile ID (ровно 10 цифр)</p>
              {classicPlayerIds.map((id, index) => (
                <div key={index}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={id}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      const newIds = [...classicPlayerIds];
                      newIds[index] = val;
                      setClassicPlayerIds(newIds);
                    }}
                    placeholder={index === 0 ? 'Твой PUBG ID (10 цифр)' : `ID тиммейта ${index} (10 цифр)`}
                    className={`w-full bg-white/5 border rounded-lg px-3 py-2.5
                             text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50
                             ${id.length > 0 && id.length !== 10 ? 'border-red-500/50' : 'border-white/10'}`}
                  />
                  {id.length > 0 && id.length !== 10 && (
                    <p className="text-[10px] text-red-400 mt-0.5">{id.length}/10 цифр</p>
                  )}
                </div>
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
                disabled={classicRegLoading}
                onClick={async () => {
                  const requiredIds = selectedClassicTournament.mode === 'SOLO' ? 1 : selectedClassicTournament.mode === 'DUO' ? 2 : 4;
                  const filledIds = classicPlayerIds.slice(0, requiredIds);
                  // Validate all IDs are exactly 10 digits
                  for (let i = 0; i < requiredIds; i++) {
                    if (!/^\d{10}$/.test(filledIds[i] || '')) {
                      setClassicRegError(`ID ${i === 0 ? 'игрока' : `тиммейта ${i}`} должен быть ровно 10 цифр`);
                      return;
                    }
                  }
                  setClassicRegLoading(true);
                  setClassicRegError('');
                  try {
                    const result = await classicApi.register(selectedClassicTournament.id, filledIds);
                    setShowClassicRegistration(false);
                    loadClassicTournaments();
                    // Navigate to classic chats page after successful registration
                    navigate(`/messages/classic-${result.registrationId}`);
                  } catch (e: any) {
                    setClassicRegError(e?.message || 'Ошибка регистрации');
                  }
                  setClassicRegLoading(false);
                }}
                className="w-full py-3 rounded-xl bg-purple-600 
                         text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {classicRegLoading ? '⏳ Регистрация...' : `✅ Подтвердить (${selectedClassicTournament.entryFee} UC)`}
              </button>
              <button
                onClick={() => setShowClassicRegistration(false)}
                disabled={classicRegLoading}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 
                         text-white/70 font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===== AUTH PROMPT MODAL ===== */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Войдите или зарегистрируйтесь, чтобы создать или присоединиться к турниру"
      />
    </div>
  );
};

export default GamePage;
