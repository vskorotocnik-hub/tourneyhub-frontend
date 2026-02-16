import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentApi, type TournamentDetail, type TournamentMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TournamentRoomPage = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [messages, setMessages] = useState<TournamentMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultSubmitted, setResultSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load tournament data
  const loadTournament = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const data = await tournamentApi.get(tournamentId);
      setTournament(data);
    } catch {
      setError('Турнир не найден');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const lastMsg = messages.length > 0 ? messages[messages.length - 1].createdAt : undefined;
      const data = await tournamentApi.getMessages(tournamentId, lastMsg);
      if (data.messages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = data.messages.filter(m => !existingIds.has(m.id));
          return [...prev, ...newMsgs];
        });
      }
    } catch {
      // ignore
    }
  }, [tournamentId, messages]);

  useEffect(() => {
    loadTournament();
    // Initial full messages load
    if (tournamentId) {
      tournamentApi.getMessages(tournamentId).then(data => {
        setMessages(data.messages);
      }).catch(() => {});
    }
  }, [loadTournament, tournamentId]);

  // Poll for updates
  useEffect(() => {
    if (!tournamentId || !tournament) return;
    const interval = setInterval(() => {
      loadTournament();
      loadMessages();
    }, 4000);
    return () => clearInterval(interval);
  }, [tournamentId, tournament, loadTournament, loadMessages]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!tournamentId || !newMessage.trim()) return;
    try {
      const msg = await tournamentApi.sendMessage(tournamentId, newMessage.trim());
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch {
      // ignore
    }
  };

  // Submit match result
  const handleSubmitResult = async (matchId: string, winnerId: string) => {
    if (!tournamentId || submitting) return;
    setSubmitting(true);
    try {
      const result = await tournamentApi.submitResult(tournamentId, matchId, winnerId);
      setResultSubmitted(true);
      if (result.status === 'resolved' || result.status === 'disputed') {
        // Refresh tournament
        await loadTournament();
        await loadMessages();
      }
    } catch {
      setError('Ошибка отправки результата');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Турнир не найден'}</p>
          <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white text-sm">← Назад</button>
        </div>
      </div>
    );
  }

  const activeMatch = tournament.matches.find(m => m.status === 'ACTIVE');
  const isUserInActiveMatch = activeMatch && (
    activeMatch.teamA?.players.some(p => p.user.username === user?.username) ||
    activeMatch.teamB?.players.some(p => p.user.username === user?.username)
  );
  const userAlreadySubmitted = activeMatch && tournament.userTeamId && (
    (activeMatch.teamA?.id === tournament.userTeamId && activeMatch.teamAResult) ||
    (activeMatch.teamB?.id === tournament.userTeamId && activeMatch.teamBResult)
  );

  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Назад</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">⚔️ Турнир</h1>
            <p className="text-xs text-white/40">
              {tournament.teamMode === 'SOLO' ? '1v1' : '2v2'} • {tournament.teamCount} команды • {tournament.bet} UC
            </p>
          </div>
          <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
            tournament.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
            tournament.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
            tournament.status === 'DISPUTED' ? 'bg-red-500/20 text-red-400' :
            'bg-white/10 text-white/50'
          }`}>
            {tournament.status === 'IN_PROGRESS' ? '🔴 Идёт' :
             tournament.status === 'COMPLETED' ? '✅ Завершён' :
             tournament.status === 'DISPUTED' ? '⚠️ Спор' :
             tournament.status}
          </div>
        </div>

        {/* Bracket */}
        <div className="bg-zinc-900/80 rounded-xl border border-white/10 p-4 mb-4">
          <h2 className="text-sm font-bold text-white mb-3">📋 Сетка турнира</h2>
          <div className="space-y-3">
            {tournament.matches.map((match) => {
              const teamAName = match.teamA
                ? `Команда ${match.teamA.slot} (${match.teamA.players.find(p => p.isCaptain)?.user.username || '?'})`
                : 'Ожидание...';
              const teamBName = match.teamB
                ? `Команда ${match.teamB.slot} (${match.teamB.players.find(p => p.isCaptain)?.user.username || '?'})`
                : 'Ожидание...';

              return (
                <div key={match.id} className={`rounded-xl p-3 border ${
                  match.status === 'ACTIVE' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  match.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/30' :
                  match.status === 'DISPUTED' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50">
                      {match.round === 1 && tournament.teamCount <= 3 ? 'Раунд 1' :
                       match.round === 1 ? `Полуфинал ${match.matchOrder}` :
                       'Финал'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      match.status === 'ACTIVE' ? 'bg-yellow-500/20 text-yellow-400' :
                      match.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      match.status === 'DISPUTED' ? 'bg-red-500/20 text-red-400' :
                      'bg-white/10 text-white/40'
                    }`}>
                      {match.status === 'ACTIVE' ? '⚔️ Играют' :
                       match.status === 'COMPLETED' ? '✅ Завершён' :
                       match.status === 'DISPUTED' ? '⚠️ Спор' :
                       '⏳ Ожидание'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`flex-1 text-center py-2 rounded-lg ${
                      match.winnerId === match.teamA?.id ? 'bg-green-500/20 border border-green-500/40' : 'bg-white/5'
                    }`}>
                      <p className="text-sm text-white font-medium">{teamAName}</p>
                      {match.winnerId === match.teamA?.id && <p className="text-xs text-green-400">🏆 Победитель</p>}
                    </div>
                    <span className="text-white/30 font-bold text-lg">VS</span>
                    <div className={`flex-1 text-center py-2 rounded-lg ${
                      match.winnerId === match.teamB?.id ? 'bg-green-500/20 border border-green-500/40' : 'bg-white/5'
                    }`}>
                      <p className="text-sm text-white font-medium">{teamBName}</p>
                      {match.winnerId === match.teamB?.id && <p className="text-xs text-green-400">🏆 Победитель</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Result (only for active match participants) */}
        {activeMatch && isUserInActiveMatch && !userAlreadySubmitted && tournament.status === 'IN_PROGRESS' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-yellow-400 mb-2">🏆 Кто победил?</h3>
            <p className="text-xs text-white/50 mb-3">Оба игрока должны отправить результат. Если результаты совпадают — автоматически засчитается.</p>
            <div className="flex gap-2">
              {activeMatch.teamA && (
                <button
                  onClick={() => handleSubmitResult(activeMatch.id, activeMatch.teamA!.id)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-accent-green/20 border border-accent-green/50 text-accent-green text-sm font-semibold hover:bg-accent-green/30 disabled:opacity-50"
                >
                  Команда {activeMatch.teamA.slot} выиграла
                </button>
              )}
              {activeMatch.teamB && (
                <button
                  onClick={() => handleSubmitResult(activeMatch.id, activeMatch.teamB!.id)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-semibold hover:bg-red-500/30 disabled:opacity-50"
                >
                  Команда {activeMatch.teamB.slot} выиграла
                </button>
              )}
            </div>
          </div>
        )}

        {/* Already submitted result */}
        {userAlreadySubmitted && !resultSubmitted && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-center">
            <p className="text-white/60 text-sm">⏳ Вы отправили результат. Ожидаем ответ другой команды...</p>
          </div>
        )}

        {/* Chat */}
        <div className="bg-zinc-900/80 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10">
            <h2 className="text-sm font-bold text-white">💬 Чат турнира</h2>
          </div>

          <div className="h-64 overflow-y-auto px-4 py-2 space-y-2">
            {messages.length === 0 ? (
              <p className="text-white/30 text-center text-sm py-8">Пока нет сообщений</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`${msg.isSystem ? 'text-center' : ''}`}>
                  {msg.isSystem ? (
                    <p className="text-xs text-yellow-400/70 bg-yellow-500/10 rounded-lg px-3 py-1.5 inline-block">
                      {msg.content}
                    </p>
                  ) : (
                    <div className={`flex gap-2 ${msg.user.id === user?.id ? 'flex-row-reverse' : ''}`}>
                      <img
                        src={msg.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user.username}`}
                        alt={msg.user.username}
                        className="w-7 h-7 rounded-full flex-shrink-0"
                      />
                      <div className={`max-w-[70%] ${msg.user.id === user?.id ? 'text-right' : ''}`}>
                        <p className="text-xs text-white/40 mb-0.5">{msg.user.username}</p>
                        <div className={`inline-block px-3 py-1.5 rounded-xl text-sm ${
                          msg.user.id === user?.id
                            ? 'bg-red-600/30 text-white'
                            : 'bg-white/10 text-white/90'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input (only for captains) */}
          {tournament.isParticipant && tournament.status !== 'COMPLETED' && (
            <div className="px-4 py-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Написать сообщение..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-red-500/50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90"
              >
                →
              </button>
            </div>
          )}
        </div>

        {/* Teams list */}
        <div className="mt-4 bg-zinc-900/80 rounded-xl border border-white/10 p-4">
          <h2 className="text-sm font-bold text-white mb-3">👥 Команды</h2>
          <div className="space-y-2">
            {tournament.teams.map((team) => (
              <div key={team.id} className={`flex items-center justify-between p-3 rounded-lg ${
                team.id === tournament.userTeamId ? 'bg-accent-green/10 border border-accent-green/30' : 'bg-white/5'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{team.id === tournament.userTeamId ? '🟢' : '🔵'}</span>
                  <div>
                    <p className="text-sm text-white font-medium">Команда {team.slot}</p>
                    <p className="text-xs text-white/40">
                      {team.players.map(p => `${p.user.username} (${p.gameId})`).join(', ')}
                    </p>
                  </div>
                </div>
                {team.id === tournament.userTeamId && (
                  <span className="text-xs text-accent-green font-semibold">Ваша</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TournamentRoomPage;
