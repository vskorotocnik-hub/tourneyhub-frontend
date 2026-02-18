import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi, type AdminTournamentItem, type AdminTournamentDetail } from '../lib/api';

const statusLabels: Record<string, { label: string; color: string }> = {
  SEARCHING: { label: 'Поиск', color: 'bg-blue-500/20 text-blue-400' },
  IN_PROGRESS: { label: 'Идёт', color: 'bg-yellow-500/20 text-yellow-400' },
  COMPLETED: { label: 'Завершён', color: 'bg-emerald-500/20 text-emerald-400' },
  CANCELLED: { label: 'Отменён', color: 'bg-zinc-500/20 text-zinc-400' },
  DISPUTED: { label: 'Спор', color: 'bg-red-500/20 text-red-400' },
};

const userColors = ['text-blue-400', 'text-pink-400', 'text-emerald-400', 'text-orange-400', 'text-violet-400', 'text-cyan-400'];
const userBgColors = ['bg-blue-500', 'bg-pink-500', 'bg-emerald-500', 'bg-orange-500', 'bg-violet-500', 'bg-cyan-500'];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<AdminTournamentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail view
  const [detail, setDetail] = useState<AdminTournamentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolveWinnerId, setResolveWinnerId] = useState('');
  const [resolving, setResolving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.tournaments(params);
      setTournaments(res.tournaments);
      setTotal(res.total);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { loadList(); }, [loadList]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const d = await adminApi.getTournament(id);
      setDetail(d);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const refreshDetail = async () => {
    if (!detail) return;
    try {
      const d = await adminApi.getTournament(detail.id);
      setDetail(d);
    } catch { /* ignore */ }
  };

  const handleSendMessage = async () => {
    if (!detail || !adminMessage.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      await adminApi.sendMessage(detail.id, adminMessage.trim());
      setAdminMessage('');
      await refreshDetail();
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { /* ignore */ }
    setSendingMessage(false);
  };

  const handleAdminImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !detail) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('Максимум 5 МБ'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      setSendingMessage(true);
      try {
        await adminApi.sendMessage(detail.id, '', reader.result as string);
        await refreshDetail();
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } catch { /* ignore */ }
      setSendingMessage(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // handleResolve is now inline in the button onClick

  // Detail view
  if (detail) {
    const openDisputes = detail.disputes.filter(d => d.status === 'OPEN');
    const hasActiveMatch = detail.matches.some(m => m.status === 'ACTIVE' || m.status === 'DISPUTED');
    const needsWinner = hasActiveMatch && (detail.status === 'DISPUTED' || detail.status === 'IN_PROGRESS');

    // Build user color map for chat
    const userIdList = [...new Set(detail.messages.filter(m => !m.isSystem && !m.isAdmin).map(m => m.user.id))];
    const userColorMap: Record<string, number> = {};
    userIdList.forEach((uid, i) => { userColorMap[uid] = i % userColors.length; });

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setDetail(null)} className="text-zinc-400 hover:text-white transition-colors text-sm">&larr; Назад</button>
          <h1 className="text-xl font-bold text-white">Турнир</h1>
          <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${statusLabels[detail.status]?.color || 'bg-zinc-700 text-zinc-300'}`}>
            {statusLabels[detail.status]?.label || detail.status}
          </span>
        </div>

        {/* Two-column layout: Info + Actions | Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column: Info + Teams + Actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Info cards */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Режим', value: detail.teamMode },
                { label: 'Команд', value: String(detail.teamCount) },
                { label: 'Ставка', value: `${detail.bet} UC`, cls: 'text-yellow-400' },
                { label: 'Приз', value: `${detail.prizePool} UC`, cls: 'text-emerald-400' },
              ].map(i => (
                <div key={i.label} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{i.label}</p>
                  <p className={`text-sm font-bold ${i.cls || 'text-white'}`}>{i.value}</p>
                </div>
              ))}
            </div>

            {/* Teams */}
            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Команды</h3>
              <div className="space-y-2">
                {detail.teams.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${userBgColors[i % userBgColors.length]} flex items-center justify-center text-[10px] font-bold text-white`}>
                      {t.slot}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        {t.players.map(p => p.user.username).join(', ')}
                      </p>
                      <p className="text-[10px] text-zinc-600">{t.id.slice(0, 8)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assign Winner — always visible when needed */}
            {needsWinner && (
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <h3 className="text-sm font-bold text-emerald-400 mb-3">🏆 Назначить победителя</h3>
                <div className="space-y-2">
                  {detail.teams.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setResolveWinnerId(t.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        resolveWinnerId === t.id
                          ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500'
                          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${userBgColors[i % userBgColors.length]} flex items-center justify-center text-[9px] font-bold text-white`}>
                        {t.slot}
                      </div>
                      <span className="text-xs text-white font-medium">{t.players.map(p => p.user.username).join(', ')}</span>
                      {resolveWinnerId === t.id && <span className="ml-auto text-emerald-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>

                <textarea
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  placeholder="Решение / комментарий..."
                  className="w-full mt-3 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none resize-none"
                  rows={2}
                />

                <button
                  onClick={async () => {
                    if (!resolveWinnerId || !resolution.trim() || resolving) return;
                    setResolving(true);
                    try {
                      const openD = openDisputes[0];
                      if (openD) {
                        await adminApi.resolveDispute(openD.id, resolution.trim(), resolveWinnerId);
                      }
                      await adminApi.assignWinner(detail.id, resolveWinnerId, resolution.trim());
                      setResolution('');
                      setResolveWinnerId('');
                      await refreshDetail();
                      loadList();
                    } catch (e: any) {
                      alert(e?.message || 'Ошибка');
                    }
                    setResolving(false);
                  }}
                  disabled={resolving || !resolveWinnerId || !resolution.trim()}
                  className="w-full mt-2 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40"
                >
                  {resolving ? '⏳ Обработка...' : '✅ Подтвердить победителя'}
                </button>
              </div>
            )}

            {/* Open Disputes */}
            {openDisputes.length > 0 && (
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">⚠️ Жалобы ({openDisputes.length})</h3>
                {openDisputes.map(d => {
                  const reporterName = detail.teams.flatMap(t => t.players).find(p => p.user.id === d.reporterId)?.user.username || d.reporterId.slice(0, 8);
                  // Parse target from reason: "[На: username] actual reason"
                  const targetMatch = d.reason.match(/^\[На: (.+?)\] (.*)$/s);
                  const targetName = targetMatch ? targetMatch[1] : null;
                  const actualReason = targetMatch ? targetMatch[2] : d.reason;
                  return (
                    <div key={d.id} className="mb-3 last:mb-0 bg-zinc-900/50 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-400">Ожидает</span>
                        <span className="text-[10px] text-zinc-600">{new Date(d.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs"><span className="text-zinc-500">Кто подал:</span> <span className="text-red-300 font-medium">{reporterName}</span></p>
                      {targetName && (
                        <p className="text-xs"><span className="text-zinc-500">На кого:</span> <span className="text-orange-300 font-medium">{targetName}</span></p>
                      )}
                      <p className="text-xs"><span className="text-zinc-500">Причина:</span> <span className="text-white">{actualReason}</span></p>
                      {d.videoUrl && (
                        <p className="text-xs"><span className="text-zinc-500">🎥 Видео:</span>{' '}
                          <a href={d.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">{d.videoUrl}</a>
                        </p>
                      )}
                      {d.response && <p className="text-xs"><span className="text-zinc-500">Ответ:</span> <span className="text-white">{d.response}</span></p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right column: Chat */}
          <div className="lg:col-span-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50 flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="px-4 py-3 border-b border-zinc-700/50 shrink-0">
              <h3 className="text-sm font-semibold text-white">💬 Чат <span className="text-zinc-500 font-normal">({detail.messages.length})</span></h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
              {detail.messages.map(m => {
                if (m.isSystem) {
                  return (
                    <div key={m.id} className="flex justify-center py-1">
                      <div className="bg-zinc-700/40 rounded-full px-3 py-1 max-w-md">
                        <p className="text-[11px] text-zinc-400 text-center">{m.content}</p>
                      </div>
                    </div>
                  );
                }

                if (m.isAdmin) {
                  return (
                    <div key={m.id} className="flex items-start gap-2 py-1">
                      <div className="w-7 h-7 rounded-full bg-yellow-600 flex items-center justify-center text-[10px] shrink-0">👑</div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg rounded-tl-sm px-3 py-2 max-w-md">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-bold text-yellow-400">Администратор</span>
                          <span className="text-[10px] text-zinc-600">{new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {m.imageUrl && <img src={m.imageUrl} alt="" className="rounded max-h-40 mb-1 cursor-pointer" onClick={() => window.open(m.imageUrl!, '_blank')} />}
                        {m.content && m.content !== '� Фото' && <p className="text-xs text-zinc-200">{m.content}</p>}
                      </div>
                    </div>
                  );
                }

                const colorIdx = userColorMap[m.user.id] ?? 0;
                return (
                  <div key={m.id} className="flex items-start gap-2 py-1">
                    <div className={`w-7 h-7 rounded-full ${userBgColors[colorIdx]} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                      {m.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-zinc-700/40 rounded-lg rounded-tl-sm px-3 py-2 max-w-md">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[11px] font-bold ${userColors[colorIdx]}`}>{m.user.username}</span>
                        <span className="text-[10px] text-zinc-600">{new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {m.imageUrl && <img src={m.imageUrl} alt="" className="rounded max-h-40 mb-1 cursor-pointer" onClick={() => window.open(m.imageUrl!, '_blank')} />}
                      {m.content && m.content !== '📷 Фото' && <p className="text-xs text-zinc-200">{m.content}</p>}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Admin input bar — hidden for cancelled/searching tournaments */}
            {detail.status === 'CANCELLED' || detail.status === 'SEARCHING' ? (
              <div className="px-3 py-2.5 border-t border-zinc-700/50 shrink-0 text-center">
                <p className="text-[11px] text-zinc-500">
                  {detail.status === 'CANCELLED' ? '🚫 Турнир отменён — чат закрыт' : '🔍 Турнир ещё не начался — чат недоступен'}
                </p>
              </div>
            ) : (
              <div className="px-3 py-2.5 border-t border-zinc-700/50 shrink-0">
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAdminImage} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sendingMessage}
                    className="px-2.5 py-2 rounded-lg bg-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    title="Прикрепить фото"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={adminMessage}
                    onChange={e => setAdminMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Написать как админ..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-yellow-600/50 transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !adminMessage.trim()}
                    className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-xs font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    👑 Отправить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Турниры</h1>
          <p className="text-xs text-zinc-500">Всего: {total}</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">Все статусы</option>
          <option value="SEARCHING">Поиск</option>
          <option value="IN_PROGRESS">Идёт</option>
          <option value="DISPUTED">Спор</option>
          <option value="COMPLETED">Завершён</option>
          <option value="CANCELLED">Отменён</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-zinc-500 text-sm">Загрузка...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-zinc-500 text-sm">Нет турниров</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tournaments.map(t => {
            const st = statusLabels[t.status] || { label: t.status, color: 'bg-zinc-700 text-zinc-300' };
            const players = t.teams.flatMap(tm => tm.players.map(p => p.user.username));
            return (
              <button
                key={t.id}
                onClick={() => openDetail(t.id)}
                className="w-full bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700/50 p-4 text-left transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{t.teamMode} {t.teamCount}T</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${st.color}`}>{st.label}</span>
                    {t.disputes.length > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400">⚠️ {t.disputes.length} жалоб</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">{new Date(t.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span>Ставка: <span className="text-yellow-400">{t.bet} UC</span></span>
                  <span>Приз: <span className="text-emerald-400">{t.prizePool} UC</span></span>
                  <span>Сообщений: {t._count.messages}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 truncate">Игроки: {players.join(', ') || '—'}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 text-sm disabled:opacity-30">←</button>
          <span className="text-sm text-zinc-500 py-1">Стр. {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={tournaments.length < 20}
            className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 text-sm disabled:opacity-30">→</button>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <p className="text-white">Загрузка...</p>
        </div>
      )}
    </div>
  );
}
