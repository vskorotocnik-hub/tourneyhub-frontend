import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '../lib/api';
import type { WoWMapItem } from '../lib/api';

interface Prize {
  place: number;
  amount: string;
  pct: number;
}

interface Props {
  user: AuthUser | null;
  bet: number;
  teamMode: string;
  teamCount: number;
  server: string;
  searchTime: number;
  canCancel: boolean;
  foundOpponent: { username: string; avatar: string } | null;
  allOpponents: { username: string; avatar: string }[];
  activeGameType: 'TDM' | 'WOW';
  activeWoWMapInfo: WoWMapItem | null;
  activeTeamCount: number;
  activeTournamentId: string | null;
  teamsJoinedCount: number;
  prizes: Prize[];
  formatTime: (seconds: number) => string;
  onGoBack: () => void;
  onCancelSearch: () => void;
}

const SearchingView = ({
  user, bet, teamMode, teamCount, server, searchTime, canCancel,
  foundOpponent, allOpponents, activeGameType, activeWoWMapInfo,
  activeTeamCount, activeTournamentId, teamsJoinedCount, prizes,
  formatTime, onGoBack, onCancelSearch,
}: Props) => {
  const navigate = useNavigate();

  return (
      <div className="min-h-screen pb-32">
        {/* ── Mobile version ── */}
        <div className="md:hidden">
          <main className="px-4 pt-4 pb-4">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={onGoBack} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
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
                onClick={onCancelSearch}
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
              <button onClick={onGoBack} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
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
                  onClick={onCancelSearch}
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
};

export default SearchingView;
