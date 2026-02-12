import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTournamentById, mockTeams, mockMatches, mockSchedule } from '../data/globalTournaments';
import type { TournamentMatch, TournamentStage } from '../data/globalTournaments';

type TabType = 'overview' | 'schedule' | 'bracket' | 'matches' | 'teams' | 'rules' | 'prizes';

const TournamentDetailPage = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const tournament = useMemo(() => getTournamentById(tournamentId || ''), [tournamentId]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!tournament) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Турнир не найден</h2>
          <button
            onClick={() => navigate('/global-tournaments')}
            className="px-6 py-3 rounded-xl bg-purple-600 text-white font-medium"
          >
            К списку турниров
          </button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'registration':
        return { label: 'Регистрация открыта', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' };
      case 'upcoming':
        return { label: 'Скоро старт', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' };
      case 'checkin':
        return { label: 'Check-in активен', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', dot: 'bg-purple-400 animate-pulse' };
      case 'live':
        return { label: 'Турнир идёт', color: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500 animate-pulse' };
      case 'finished':
        return { label: 'Завершён', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', dot: 'bg-zinc-400' };
      default:
        return { label: status, color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', dot: 'bg-zinc-400' };
    }
  };

  const formatPrize = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getTimeRemaining = () => {
    const now = new Date();
    let targetDate: Date;
    let label: string;

    if (tournament.status === 'registration') {
      targetDate = new Date(tournament.dates.registrationEnd);
      label = 'до конца регистрации';
    } else if (tournament.status === 'checkin') {
      targetDate = new Date(tournament.dates.checkInEnd);
      label = 'до конца check-in';
    } else if (tournament.status === 'upcoming') {
      targetDate = new Date(tournament.dates.tournamentStart);
      label = 'до старта турнира';
    } else {
      return null;
    }

    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, label };
  };

  const timeRemaining = getTimeRemaining();
  const statusConfig = getStatusConfig(tournament.status);

  const getCTAButton = () => {
    switch (tournament.status) {
      case 'registration':
        return (
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Зарегистрироваться — ${tournament.entryFee}
          </button>
        );
      case 'checkin':
        return (
          <button
            onClick={() => setIsCheckedIn(!isCheckedIn)}
            className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              isCheckedIn
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
            }`}
          >
            {isCheckedIn ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Check-in выполнен ✓
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Подтвердить участие (Check-in)
              </>
            )}
          </button>
        );
      case 'live':
        return (
          <button
            onClick={() => setActiveTab('matches')}
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Перейти к матчам
          </button>
        );
      case 'finished':
        return (
          <button
            onClick={() => setActiveTab('teams')}
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Смотреть результаты
          </button>
        );
      default:
        return null;
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Обзор', icon: '📋' },
    { id: 'schedule', label: 'Расписание', icon: '📅' },
    { id: 'bracket', label: 'Сетка', icon: '🏆' },
    { id: 'matches', label: 'Матчи', icon: '⚔️' },
    { id: 'teams', label: 'Команды', icon: '👥' },
    { id: 'rules', label: 'Правила', icon: '📜' },
    { id: 'prizes', label: 'Призы', icon: '💰' },
  ];

  // TAB CONTENT COMPONENTS
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Description */}
      <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>📋</span> О турнире
        </h3>
        <p className="text-zinc-400 leading-relaxed">{tournament.description}</p>
      </div>

      {/* Requirements */}
      <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>⚙️</span> Требования
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-zinc-800/50 rounded-xl text-center">
            <p className="text-zinc-500 text-xs mb-1">Регион</p>
            <p className="text-white font-bold">{tournament.region}</p>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-xl text-center">
            <p className="text-zinc-500 text-xs mb-1">Сервер</p>
            <p className="text-white font-bold">{tournament.server}</p>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-xl text-center">
            <p className="text-zinc-500 text-xs mb-1">Мин. уровень</p>
            <p className="text-white font-bold">{tournament.minLevel}</p>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-xl text-center">
            <p className="text-zinc-500 text-xs mb-1">Мин. ранг</p>
            <p className="text-white font-bold">{tournament.minRank}</p>
          </div>
        </div>
      </div>

      {/* Stages Timeline */}
      <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🗓️</span> Этапы турнира
        </h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-700" />
          <div className="space-y-4">
            {tournament.stages.map((stage, idx) => (
              <div key={idx} className="relative pl-10">
                <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  stage.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
                  stage.status === 'live' ? 'bg-purple-500 border-purple-500 animate-pulse' :
                  'bg-zinc-800 border-zinc-600'
                }`}>
                  {stage.status === 'completed' && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${
                  stage.status === 'live' ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-zinc-800/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className={`font-bold ${stage.status === 'live' ? 'text-purple-400' : 'text-white'}`}>
                      {stage.name}
                    </p>
                    {stage.status === 'live' && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500 text-white">LIVE</span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-sm">{stage.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>💡</span> Как участвовать?
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step: 1, title: 'Зарегистрируйся', desc: 'Оплати взнос и подай заявку на участие', icon: '✍️' },
            { step: 2, title: 'Пройди Check-in', desc: 'Подтверди участие за 30 мин до старта', icon: '✅' },
            { step: 3, title: 'Играй и побеждай', desc: 'Сражайся за призовые места', icon: '🏆' },
          ].map((item) => (
            <div key={item.step} className="relative p-4 bg-zinc-900/50 rounded-xl">
              <div className="absolute -top-3 -left-2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                {item.step}
              </div>
              <div className="pt-2">
                <p className="text-2xl mb-2">{item.icon}</p>
                <p className="text-white font-bold mb-1">{item.title}</p>
                <p className="text-zinc-500 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ScheduleTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">📅 Расписание матчей</h3>
        <span className="text-sm text-zinc-500">Время указано по UTC</span>
      </div>
      {mockSchedule.map((event) => (
        <div
          key={event.id}
          className={`p-4 rounded-xl border transition-all ${
            event.isLive
              ? 'bg-purple-500/10 border-purple-500/30'
              : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="text-center min-w-[60px]">
              <p className="text-lg font-bold text-white">{event.date}</p>
              <p className="text-sm text-zinc-500">{event.time}</p>
            </div>
            <div className="w-px h-12 bg-zinc-700" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold">{event.title}</p>
                {event.isLive && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white animate-pulse">LIVE</span>
                )}
              </div>
              <p className="text-zinc-500 text-sm">{event.description}</p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                event.stage === 'qualifiers' ? 'bg-blue-500/20 text-blue-400' :
                event.stage === 'playoffs' ? 'bg-amber-500/20 text-amber-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
                {event.stage.charAt(0).toUpperCase() + event.stage.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const BracketTab = () => {
    const bracketMatches = mockMatches.filter(m => m.stage === 'playoffs' || m.stage === 'final');
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">🏆 Сетка плей-офф</h3>
          <span className="text-sm text-zinc-500">Single Elimination</span>
        </div>

        {/* Bracket Visualization */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[800px] flex gap-8">
            {/* Round 1 */}
            <div className="space-y-4">
              <p className="text-center text-zinc-500 text-sm font-medium mb-4">Полуфиналы</p>
              {bracketMatches.filter(m => m.round === 1).map((match) => (
                <BracketMatchCard key={match.id} match={match} />
              ))}
            </div>

            {/* Connector */}
            <div className="flex items-center">
              <div className="w-16 border-t-2 border-zinc-700" />
            </div>

            {/* Round 2 / Final */}
            <div className="flex flex-col justify-center">
              <p className="text-center text-zinc-500 text-sm font-medium mb-4">Финал</p>
              {bracketMatches.filter(m => m.round === 2 || m.stage === 'final').map((match) => (
                <BracketMatchCard key={match.id} match={match} isFinal />
              ))}
            </div>

            {/* Winner */}
            <div className="flex items-center">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                <p className="text-amber-400 text-sm font-bold mb-2">🏆 Чемпион</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔷</span>
                  <span className="text-white font-bold">TBD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BracketMatchCard = ({ match, isFinal }: { match: TournamentMatch; isFinal?: boolean }) => (
    <div className={`p-3 rounded-xl border ${
      isFinal ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30' :
      match.status === 'live' ? 'bg-purple-500/10 border-purple-500/30' :
      'bg-zinc-900/50 border-zinc-800'
    }`}>
      <div className="space-y-2">
        <div className={`flex items-center justify-between p-2 rounded-lg ${match.winner === match.teamA?.id ? 'bg-emerald-500/20' : 'bg-zinc-800/50'}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{match.teamA?.logo || '❓'}</span>
            <span className="text-white text-sm font-medium">{match.teamA?.name || 'TBD'}</span>
          </div>
          <span className="text-white font-bold">{match.teamA?.score ?? '-'}</span>
        </div>
        <div className={`flex items-center justify-between p-2 rounded-lg ${match.winner === match.teamB?.id ? 'bg-emerald-500/20' : 'bg-zinc-800/50'}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{match.teamB?.logo || '❓'}</span>
            <span className="text-white text-sm font-medium">{match.teamB?.name || 'TBD'}</span>
          </div>
          <span className="text-white font-bold">{match.teamB?.score ?? '-'}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-zinc-500">{match.map}</span>
        {match.status === 'live' && (
          <span className="px-2 py-0.5 rounded bg-red-500 text-white font-bold">LIVE</span>
        )}
      </div>
    </div>
  );

  const MatchesTab = () => {
    const [stageFilter, setStageFilter] = useState<TournamentStage | ''>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const filteredMatches = mockMatches.filter(m => {
      if (stageFilter && m.stage !== stageFilter) return false;
      if (statusFilter && m.status !== statusFilter) return false;
      return true;
    });

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as TournamentStage | '')}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">Все этапы</option>
            <option value="qualifiers">Квалификация</option>
            <option value="playoffs">Плей-офф</option>
            <option value="final">Финал</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">Все статусы</option>
            <option value="upcoming">Предстоящие</option>
            <option value="live">Идут сейчас</option>
            <option value="finished">Завершённые</option>
          </select>
        </div>

        {/* Matches List */}
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className={`p-4 rounded-xl border transition-all hover:border-purple-500/50 cursor-pointer ${
                match.status === 'live' ? 'bg-purple-500/10 border-purple-500/30' :
                'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    match.stage === 'qualifiers' ? 'bg-blue-500/20 text-blue-400' :
                    match.stage === 'playoffs' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {match.stage}
                  </span>
                  <span className="text-zinc-500 text-sm">Round {match.round} • Match {match.matchNumber}</span>
                </div>
                {match.status === 'live' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500 text-white text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                {/* Team A */}
                <div className={`flex-1 flex items-center gap-3 p-3 rounded-lg ${match.winner === match.teamA?.id ? 'bg-emerald-500/20' : 'bg-zinc-800/50'}`}>
                  <span className="text-2xl">{match.teamA?.logo || '❓'}</span>
                  <div>
                    <p className="text-white font-bold">{match.teamA?.name || 'TBD'}</p>
                    {match.winner === match.teamA?.id && <span className="text-emerald-400 text-xs">Победитель</span>}
                  </div>
                  <p className="ml-auto text-2xl font-bold text-white">{match.teamA?.score ?? '-'}</p>
                </div>

                <div className="px-4 text-zinc-500 font-bold">VS</div>

                {/* Team B */}
                <div className={`flex-1 flex items-center gap-3 p-3 rounded-lg ${match.winner === match.teamB?.id ? 'bg-emerald-500/20' : 'bg-zinc-800/50'}`}>
                  <p className="text-2xl font-bold text-white">{match.teamB?.score ?? '-'}</p>
                  <div className="ml-auto text-right">
                    <p className="text-white font-bold">{match.teamB?.name || 'TBD'}</p>
                    {match.winner === match.teamB?.id && <span className="text-emerald-400 text-xs">Победитель</span>}
                  </div>
                  <span className="text-2xl">{match.teamB?.logo || '❓'}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-zinc-500">
                <span>🗺️ {match.map}</span>
                <span>{new Date(match.scheduledTime).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TeamsTab = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'points' | 'wins' | 'kills'>('points');

    const sortedTeams = [...mockTeams]
      .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.tag.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b[sortBy] - a[sortBy]);

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск команды..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex gap-2">
            {(['points', 'wins', 'kills'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === sort ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {sort === 'points' ? 'По очкам' : sort === 'wins' ? 'По победам' : 'По киллам'}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {sortedTeams.slice(0, 3).map((team, idx) => (
            <div
              key={team.id}
              className={`p-4 rounded-2xl border ${
                idx === 0 ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/30' :
                idx === 1 ? 'bg-gradient-to-br from-zinc-400/20 to-zinc-500/10 border-zinc-400/30' :
                'bg-gradient-to-br from-orange-500/20 to-amber-600/10 border-orange-500/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold ${
                  idx === 0 ? 'bg-amber-500/30 text-amber-400' :
                  idx === 1 ? 'bg-zinc-400/30 text-zinc-300' :
                  'bg-orange-500/30 text-orange-400'
                }`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </div>
                <div>
                  <p className="text-white font-bold">{team.name}</p>
                  <p className="text-zinc-500 text-xs">[{team.tag}]</p>
                </div>
                <span className="ml-auto text-3xl">{team.logo}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-black/20 rounded-lg">
                  <p className="text-white font-bold">{team.points}</p>
                  <p className="text-zinc-500 text-xs">Очки</p>
                </div>
                <div className="p-2 bg-black/20 rounded-lg">
                  <p className="text-white font-bold">{team.wins}</p>
                  <p className="text-zinc-500 text-xs">Победы</p>
                </div>
                <div className="p-2 bg-black/20 rounded-lg">
                  <p className="text-white font-bold">{team.kills}</p>
                  <p className="text-zinc-500 text-xs">Киллы</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Teams Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Команда</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase">Очки</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase">Победы</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase">Киллы</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-500 uppercase">Check-in</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, idx) => (
                <tr key={team.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-bold ${idx < 3 ? 'text-amber-400' : 'text-zinc-500'}`}>{idx + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{team.logo}</span>
                      <div>
                        <p className="text-white font-medium">{team.name}</p>
                        <p className="text-zinc-500 text-xs">{team.captain}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-white font-bold">{team.points}</td>
                  <td className="px-4 py-3 text-center text-white">{team.wins}</td>
                  <td className="px-4 py-3 text-center text-white">{team.kills}</td>
                  <td className="px-4 py-3 text-center">
                    {team.isCheckedIn ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Ready
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const RulesTab = () => (
    <div className="space-y-6">
      <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📜</span> Правила турнира
        </h3>
        <div className="space-y-3">
          {tournament.rules.map((rule, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs shrink-0">
                {idx + 1}
              </div>
              <p className="text-zinc-300">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
        <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
          <span>⚠️</span> Важно
        </h3>
        <ul className="space-y-2 text-zinc-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-amber-400">•</span>
            Опоздание на матч более 5 минут = техническое поражение
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400">•</span>
            Все спорные ситуации решаются администрацией
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400">•</span>
            Решение администрации является окончательным
          </li>
        </ul>
      </div>

      {/* Contact */}
      <div className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>📞</span> Связь с организаторами
        </h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2">
            <span>💬</span> Discord
          </button>
          <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2">
            <span>📧</span> Email
          </button>
          <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2">
            <span>📱</span> Telegram
          </button>
        </div>
      </div>
    </div>
  );

  const PrizesTab = () => (
    <div className="space-y-6">
      {/* Prize Pool Header */}
      <div className="text-center p-8 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border border-amber-500/30 rounded-2xl">
        <p className="text-amber-400/70 text-sm uppercase tracking-wider mb-2">Общий призовой фонд</p>
        <p className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
          {formatPrize(tournament.prizePool)}
        </p>
      </div>

      {/* Prizes Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🏆</span> Распределение призов
          </h3>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {tournament.prizes.map((prize, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-4 ${
                idx === 0 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' :
                idx === 1 ? 'bg-gradient-to-r from-zinc-400/10 to-transparent' :
                idx === 2 ? 'bg-gradient-to-r from-orange-500/10 to-transparent' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{prize.icon}</span>
                <div>
                  <p className="text-white font-bold text-lg">{prize.place} место</p>
                  <p className="text-zinc-500 text-sm">
                    {idx === 0 ? 'Чемпион турнира' :
                     idx === 1 ? 'Серебряный призёр' :
                     idx === 2 ? 'Бронзовый призёр' : 'Призовое место'}
                  </p>
                </div>
              </div>
              <p className={`text-2xl font-black ${
                idx === 0 ? 'text-amber-400' :
                idx === 1 ? 'text-zinc-300' :
                idx === 2 ? 'text-orange-400' : 'text-white'
              }`}>
                {formatPrize(prize.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Info */}
      <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
        <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
          <span>💳</span> Выплата призов
        </h3>
        <ul className="space-y-2 text-zinc-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">✓</span>
            Выплаты производятся в течение 7 дней после завершения турнира
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">✓</span>
            Доступные методы: PayPal, банковский перевод, криптовалюта
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400">✓</span>
            Минимальная сумма для вывода: $10
          </li>
        </ul>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'schedule': return <ScheduleTab />;
      case 'bracket': return <BracketTab />;
      case 'matches': return <MatchesTab />;
      case 'teams': return <TeamsTab />;
      case 'rules': return <RulesTab />;
      case 'prizes': return <PrizesTab />;
      default: return <OverviewTab />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Загрузка турнира...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Header */}
      <div className="relative">
        {/* Banner Image */}
        <div className="absolute inset-0 h-72 md:h-80">
          <img
            src={tournament.bannerImage}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/30" />
        </div>

        <div className="relative max-w-[1800px] mx-auto px-8 pt-6 pb-8">
          {/* Navigation */}
          <button
            onClick={() => navigate('/global-tournaments')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Все турниры</span>
          </button>

          {/* Tournament Header */}
          <div className="pt-20 md:pt-24">
            {/* Status & Format */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                <span className="text-sm font-semibold">{statusConfig.label}</span>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                tournament.format === 'solo' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                tournament.format === 'duo' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {tournament.format.toUpperCase()}
              </span>
              {tournament.streamUrl && (
                <a
                  href={tournament.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="text-sm font-semibold">Смотреть</span>
                </a>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{tournament.name}</h1>
            <p className="text-zinc-400 mb-6">{tournament.subtitle}</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {/* Prize Pool */}
              <div className="p-4 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-amber-400/70 text-xs uppercase tracking-wider mb-1">Призовой фонд</p>
                <p className="text-2xl font-black text-amber-400">{formatPrize(tournament.prizePool)}</p>
                <button
                  onClick={() => setShowPrizesModal(true)}
                  className="text-amber-400/70 text-xs hover:text-amber-400 mt-1"
                >
                  Показать призы →
                </button>
              </div>

              {/* Entry Fee */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-700 rounded-xl">
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Взнос</p>
                <p className="text-2xl font-black text-white">
                  {tournament.entryFee === 0 ? 'FREE' : `$${tournament.entryFee}`}
                </p>
                {tournament.commission > 0 && (
                  <p className="text-zinc-500 text-xs mt-1">+${tournament.commission} комиссия</p>
                )}
              </div>

              {/* Participants */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-700 rounded-xl">
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Участники</p>
                <p className="text-2xl font-black text-white">
                  {tournament.participants.current}
                  <span className="text-zinc-500 font-normal">/{tournament.participants.max}</span>
                </p>
                <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${(tournament.participants.current / tournament.participants.max) * 100}%` }}
                  />
                </div>
              </div>

              {/* Timer */}
              {timeRemaining && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <p className="text-purple-400/70 text-xs uppercase tracking-wider mb-1">{timeRemaining.label}</p>
                  <div className="flex items-baseline gap-1">
                    {timeRemaining.days > 0 && (
                      <>
                        <span className="text-2xl font-black text-purple-400">{timeRemaining.days}</span>
                        <span className="text-purple-400/70 text-sm">д</span>
                      </>
                    )}
                    <span className="text-2xl font-black text-purple-400">{timeRemaining.hours}</span>
                    <span className="text-purple-400/70 text-sm">ч</span>
                    <span className="text-2xl font-black text-purple-400">{timeRemaining.minutes}</span>
                    <span className="text-purple-400/70 text-sm">м</span>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="flex flex-col md:flex-row gap-3">
              {getCTAButton()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 /95 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="flex overflow-x-auto scrollbar-hide -mx-8 px-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-purple-500'
                    : 'text-zinc-500 border-transparent hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-6">
        {renderTabContent()}
      </div>

      {/* Prizes Modal */}
      {showPrizesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPrizesModal(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">🏆 Призовой фонд</h3>
              <button onClick={() => setShowPrizesModal(false)} className="text-zinc-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="text-center mb-4">
                <p className="text-3xl font-black text-amber-400">{formatPrize(tournament.prizePool)}</p>
              </div>
              <div className="space-y-2">
                {tournament.prizes.map((prize, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{prize.icon}</span>
                      <span className="text-white font-medium">{prize.place}</span>
                    </div>
                    <span className="text-white font-bold">{formatPrize(prize.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRegistrationModal(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Регистрация на турнир</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl text-center">
                <p className="text-zinc-400 text-sm mb-1">Стоимость участия</p>
                <p className="text-3xl font-black text-white">${tournament.entryFee + tournament.commission}</p>
                <p className="text-zinc-500 text-xs mt-1">(${tournament.entryFee} взнос + ${tournament.commission} комиссия)</p>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Ваш PUBG ID"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Название команды"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="rules" className="mt-1" />
                <label htmlFor="rules" className="text-zinc-400 text-sm">
                  Я прочитал и согласен с <span className="text-purple-400">правилами турнира</span>
                </label>
              </div>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold transition-all"
              >
                Оплатить и зарегистрироваться
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetailPage;
