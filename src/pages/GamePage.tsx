import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { GameMode, TeamMode, ServerRegion } from '../types';
import { tournamentLeaders, serverNames } from '../data/tournaments';
import { wowLeaders } from '../data/wow';
import { tournamentApi, wowApi, classicApi, type TournamentListItem, type ActiveTournamentData, type WoWMapItem, type WoWTournamentListItem, type ClassicTournamentListItem } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import AuthPromptModal from '../components/AuthPromptModal';
import RulesModal from '../components/RulesModal';
import ClassicSection from '../components/ClassicSection';
import ClassicRegistrationModal from '../components/ClassicRegistrationModal';
import SearchingView from '../components/SearchingView';
import WoWCreateSection from '../components/WoWCreateSection';
import TDMCreateSection from '../components/TDMCreateSection';

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
  const [myClassicTournamentIds, setMyClassicTournamentIds] = useState<Set<string>>(new Set());
  
  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
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

  // ============= SEARCHING VIEW =============
  if (viewState === 'searching') {
    return (
      <SearchingView
        user={user}
        bet={bet}
        teamMode={teamMode}
        teamCount={teamCount}
        server={server}
        searchTime={searchTime}
        canCancel={canCancel}
        foundOpponent={foundOpponent}
        allOpponents={allOpponents}
        activeGameType={activeGameType}
        activeWoWMapInfo={activeWoWMapInfo}
        activeTeamCount={activeTeamCount}
        activeTournamentId={activeTournamentId}
        teamsJoinedCount={teamsJoinedCount}
        prizes={prizes}
        formatTime={formatTime}
        onGoBack={handleGoBack}
        onCancelSearch={handleCancelSearch}
      />
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
          <WoWCreateSection
            wowMaps={wowMaps}
            selectedMap={selectedMap}
            setSelectedMap={setSelectedMap}
            bet={bet}
            setBet={setBet}
            server={server}
            setServer={setServer}
            playerId={playerId}
            setPlayerId={setPlayerId}
            partnerId={partnerId}
            setPartnerId={setPartnerId}
            wowExtraIds={wowExtraIds}
            setWowExtraIds={setWowExtraIds}
            idError={idError}
            setIdError={setIdError}
            createError={createError}
            onShowRules={() => setShowRulesModal(true)}
            onCreate={handleWoWCreate}
          />
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
          <TDMCreateSection
            bet={bet} setBet={setBet}
            teamMode={teamMode} setTeamMode={setTeamMode}
            teamCount={teamCount} setTeamCount={setTeamCount}
            server={server} setServer={setServer}
            playerId={playerId} setPlayerId={setPlayerId}
            partnerId={partnerId} setPartnerId={setPartnerId}
            idError={idError} setIdError={setIdError}
            createError={createError}
            totalPool={totalPool} platformFee={platformFee} prizes={prizes}
            onShowRules={() => setShowRulesModal(true)}
            onStartSearch={handleStartSearch}
          />
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
          <ClassicSection
            tournaments={classicTournaments}
            loading={classicLoading}
            currentTime={currentTime}
            myIds={myClassicTournamentIds}
            onRegister={(t) => {
              if (!isAuthenticated) { setShowAuthModal(true); return; }
              setSelectedClassicTournament(t);
              setShowClassicRegistration(true);
            }}
          />
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
            <TDMCreateSection
              bet={bet} setBet={setBet}
              teamMode={teamMode} setTeamMode={setTeamMode}
              teamCount={teamCount} setTeamCount={setTeamCount}
              server={server} setServer={setServer}
              playerId={playerId} setPlayerId={setPlayerId}
              partnerId={partnerId} setPartnerId={setPartnerId}
              idError={idError} setIdError={setIdError}
              createError={createError}
              totalPool={totalPool} platformFee={platformFee} prizes={prizes}
              onShowRules={() => setShowRulesModal(true)}
              onStartSearch={handleStartSearch}
            />
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
            <WoWCreateSection
              wowMaps={wowMaps}
              selectedMap={selectedMap}
              setSelectedMap={setSelectedMap}
              bet={bet}
              setBet={setBet}
              server={server}
              setServer={setServer}
              playerId={playerId}
              setPlayerId={setPlayerId}
              partnerId={partnerId}
              setPartnerId={setPartnerId}
              wowExtraIds={wowExtraIds}
              setWowExtraIds={setWowExtraIds}
              idError={idError}
              setIdError={setIdError}
              createError={createError}
              onShowRules={() => setShowRulesModal(true)}
              onCreate={handleWoWCreate}
            />
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
            <ClassicSection
              tournaments={classicTournaments}
              loading={classicLoading}
              currentTime={currentTime}
              myIds={myClassicTournamentIds}
              onRegister={(t) => {
                if (!isAuthenticated) { setShowAuthModal(true); return; }
                setSelectedClassicTournament(t);
                setShowClassicRegistration(true);
              }}
            />
          )}

        </main>
      </div>
      {/* ===== RULES MODAL ===== */}
      {showRulesModal && <RulesModal onClose={() => setShowRulesModal(false)} />}
      {/* ===== CLASSIC REGISTRATION MODAL ===== */}
      {showClassicRegistration && selectedClassicTournament && (
        <ClassicRegistrationModal
          tournament={selectedClassicTournament}
          onClose={() => setShowClassicRegistration(false)}
          onSuccess={loadClassicTournaments}
        />
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
