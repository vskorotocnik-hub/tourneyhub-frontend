import { useState, useEffect, useCallback } from 'react';
import { classicApi, type ClassicTournamentItem, type ClassicTournamentDetail, type ClassicRegistrationItem } from '../lib/api';
import ChatPanel from '../components/ChatPanel';
import FormModal, { type FormData } from '../components/FormModal';

const statusLabels: Record<string, { label: string; color: string }> = {
  REGISTRATION: { label: 'Регистрация', color: 'bg-blue-500/20 text-blue-400' },
  IN_PROGRESS: { label: 'Идёт', color: 'bg-yellow-500/20 text-yellow-400' },
  COMPLETED: { label: 'Завершён', color: 'bg-emerald-500/20 text-emerald-400' },
  CANCELLED: { label: 'Отменён', color: 'bg-zinc-500/20 text-zinc-400' },
};

const modeLabels: Record<string, string> = { SOLO: 'Соло', DUO: 'Дуо', SQUAD: 'Сквад' };


const emptyForm = {
  title: '', description: '', map: '', mapImage: '', mode: 'SOLO', server: 'EUROPE',
  startTime: '', entryFee: 0, prizePool: 0, maxParticipants: 100,
  winnerCount: 1, prize1: 0, prize2: 0, prize3: 0,
};

// ─── MAIN COMPONENT ─────────────────────────────────────────

export default function ClassicTournamentsPage() {
  const [tournaments, setTournaments] = useState<ClassicTournamentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ClassicTournamentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [winners, setWinners] = useState<{ registrationId: string; place: number }[]>([]);
  const [chatReg, setChatReg] = useState<ClassicRegistrationItem | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await classicApi.list({ page, limit: 20, ...(statusFilter ? { status: statusFilter } : {}) });
      setTournaments(res.tournaments);
      setTotal(res.total);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { loadList(); }, [loadList]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try { setDetail(await classicApi.get(id)); } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const refreshDetail = async () => {
    if (!detail) return;
    try { setDetail(await classicApi.get(detail.id)); } catch { /* ignore */ }
  };

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm }); setFormError(''); setShowForm(true); };

  const openEdit = (t: ClassicTournamentDetail) => {
    setEditingId(t.id);
    setForm({
      title: t.title || '', description: t.description || '', map: t.map,
      mapImage: t.mapImage || '', mode: t.mode, server: t.server,
      startTime: t.startTime ? new Date(t.startTime).toISOString().slice(0, 16) : '',
      entryFee: t.entryFee, prizePool: t.prizePool, maxParticipants: t.maxParticipants,
      winnerCount: t.winnerCount, prize1: t.prize1, prize2: t.prize2, prize3: t.prize3,
    });
    setFormError(''); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.map || !form.server || !form.startTime) { setFormError('Заполните: карта, сервер, время старта'); return; }
    setSaving(true); setFormError('');
    try {
      const body: Record<string, unknown> = {
        ...form, entryFee: Number(form.entryFee), prizePool: Number(form.prizePool),
        maxParticipants: Number(form.maxParticipants), winnerCount: Number(form.winnerCount),
        prize1: Number(form.prize1), prize2: Number(form.prize2), prize3: Number(form.prize3),
        startTime: new Date(form.startTime).toISOString(),
      };
      if (!body.title) delete body.title;
      if (!body.description) delete body.description;
      // Handle image: if mapImage is base64, send as imageData for server upload
      if (typeof body.mapImage === 'string' && (body.mapImage as string).startsWith('data:image/')) {
        body.imageData = body.mapImage;
        delete body.mapImage;
      } else if (!body.mapImage) {
        delete body.mapImage;
      }
      if (editingId) await classicApi.update(editingId, body);
      else await classicApi.create(body);
      setShowForm(false); loadList();
      if (editingId && detail) refreshDetail();
    } catch (e: any) {
      setFormError(e?.message || 'Ошибка');
    }
    setSaving(false);
  };

  const handleAction = async (action: string, _id: string, confirmMsg: string, apiFn: () => Promise<unknown>) => {
    if (!confirm(confirmMsg)) return;
    setActionLoading(action);
    try { await apiFn(); await refreshDetail(); loadList(); } catch (e: any) { alert(e?.message || 'Ошибка'); }
    setActionLoading('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить турнир безвозвратно?')) return;
    setActionLoading('delete');
    try { await classicApi.remove(id); setDetail(null); loadList(); } catch (e: any) { alert(e?.message || 'Ошибка'); }
    setActionLoading('');
  };

  const toggleWinner = (regId: string, place: number) => {
    setWinners(prev => {
      if (prev.find(w => w.registrationId === regId)) return prev.filter(w => w.registrationId !== regId);
      return [...prev.filter(w => w.place !== place), { registrationId: regId, place }];
    });
  };

  const handleComplete = async () => {
    if (!detail || winners.length === 0) return;
    setActionLoading('complete');
    try { await classicApi.complete(detail.id, winners); setShowComplete(false); await refreshDetail(); loadList(); } catch (e: any) { alert(e?.message || 'Ошибка'); }
    setActionLoading('');
  };

  // ─── DETAIL VIEW ──────────────────────────────────────────
  if (detail) {
    const st = statusLabels[detail.status] || { label: detail.status, color: 'bg-zinc-700 text-zinc-300' };
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setDetail(null)} className="text-zinc-400 hover:text-white text-sm">&larr; Назад</button>
          <h1 className="text-xl font-bold text-white">{detail.title || detail.map}</h1>
          <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${st.color}`}>{st.label}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Карта', v: detail.map }, { l: 'Режим', v: modeLabels[detail.mode] || detail.mode },
                { l: 'Сервер', v: detail.server },
                { l: 'Старт', v: new Date(detail.startTime).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
                { l: 'Взнос', v: `${detail.entryFee} UC`, c: 'text-yellow-400' },
                { l: 'Фонд', v: `${detail.prizePool} UC`, c: 'text-emerald-400' },
                { l: 'Участники', v: `${detail._count?.registrations ?? detail.registrations.length} / ${detail.maxParticipants}` },
                { l: 'Победители', v: String(detail.winnerCount) },
              ].map(i => (
                <div key={i.l} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{i.l}</p>
                  <p className={`text-sm font-bold ${i.c || 'text-white'}`}>{i.v}</p>
                </div>
              ))}
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Призы</h3>
              <p className="text-xs text-white">1 место: <span className="text-emerald-400 font-bold">{detail.prize1} UC</span></p>
              {detail.winnerCount >= 2 && <p className="text-xs text-white">2 место: <span className="text-emerald-400 font-bold">{detail.prize2} UC</span></p>}
              {detail.winnerCount >= 3 && <p className="text-xs text-white">3 место: <span className="text-emerald-400 font-bold">{detail.prize3} UC</span></p>}
            </div>
            <div className="space-y-2">
              {detail.status === 'REGISTRATION' && (<>
                <button onClick={() => openEdit(detail)} className="w-full py-2 rounded-lg bg-zinc-700 text-white text-xs font-medium hover:bg-zinc-600">Редактировать</button>
                <button onClick={() => handleAction('start', detail.id, 'Начать турнир? Регистрация закроется.', () => classicApi.start(detail.id))} disabled={!!actionLoading}
                  className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                  {actionLoading === 'start' ? 'Загрузка...' : 'Начать турнир'}
                </button>
                <button onClick={() => handleAction('cancel', detail.id, 'Отменить турнир? Взносы вернутся.', () => classicApi.cancel(detail.id))} disabled={!!actionLoading}
                  className="w-full py-2 rounded-lg bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 disabled:opacity-50">
                  {actionLoading === 'cancel' ? 'Загрузка...' : 'Отменить'}
                </button>
                <button onClick={() => handleDelete(detail.id)} disabled={!!actionLoading}
                  className="w-full py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50">
                  {actionLoading === 'delete' ? 'Загрузка...' : '🗑 Удалить турнир'}
                </button>
              </>)}
              {detail.status === 'IN_PROGRESS' && (<>
                <button onClick={() => openEdit(detail)} className="w-full py-2 rounded-lg bg-zinc-700 text-white text-xs font-medium hover:bg-zinc-600">✏️ Редактировать</button>
                <button onClick={() => { setWinners([]); setShowComplete(true); }}
                  className="w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700">
                  🏆 Завершить — назначить победителей
                </button>
                <button onClick={() => handleAction('cancel', detail.id, 'Отменить и вернуть взносы?', () => classicApi.cancel(detail.id))} disabled={!!actionLoading}
                  className="w-full py-2 rounded-lg bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 disabled:opacity-50">
                  {actionLoading === 'cancel' ? 'Загрузка...' : 'Отменить и возврат'}
                </button>
              </>)}
              {/* Delete — always available */}
              {detail.status !== 'IN_PROGRESS' && detail.status !== 'REGISTRATION' && (
                <button onClick={() => handleDelete(detail.id)} disabled={!!actionLoading}
                  className="w-full py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50">
                  {actionLoading === 'delete' ? 'Загрузка...' : '🗑 Удалить турнир'}
                </button>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {/* PUBG IDs Quick Copy */}
            {detail.registrations.length > 0 && (
              <div className="bg-yellow-500/5 rounded-lg border border-yellow-500/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-yellow-400">📋 PUBG ID</h3>
                  <button onClick={() => { navigator.clipboard.writeText(detail.registrations.flatMap(r => r.pubgIds).join('\n')); alert('Скопировано!'); }}
                    className="px-3 py-1 rounded-lg bg-yellow-600/20 text-yellow-400 text-xs hover:bg-yellow-600/30">Копировать все</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detail.registrations.map(r => r.pubgIds.map(pid => (
                    <button key={`${r.id}-${pid}`} onClick={() => navigator.clipboard.writeText(pid)}
                      className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-xs text-white font-mono hover:bg-zinc-700" title="Копировать">{pid}</button>
                  )))}
                </div>
              </div>
            )}
            {/* Broadcast */}
            {detail.registrations.length > 0 && (detail.status === 'REGISTRATION' || detail.status === 'IN_PROGRESS') && (
              <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-4">
                <h3 className="text-sm font-semibold text-white mb-2">📢 Отправить всем</h3>
                <textarea value={broadcastText} onChange={e => setBroadcastText(e.target.value)} rows={2}
                  placeholder="Room ID: 12345, Password: 678..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none resize-none mb-2" />
                <button onClick={async () => {
                  if (!broadcastText.trim()) return;
                  setBroadcastSending(true);
                  try { const r = await classicApi.broadcast(detail.id, broadcastText.trim()); alert(`Отправлено ${r.sent} участникам`); setBroadcastText(''); } catch (e: any) { alert(e?.message || 'Ошибка'); }
                  setBroadcastSending(false);
                }} disabled={broadcastSending || !broadcastText.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                  {broadcastSending ? 'Отправка...' : '📤 Отправить всем'}
                </button>
              </div>
            )}
            {/* Participants */}
            <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 flex flex-col" style={{ maxHeight: '55vh' }}>
            <div className="px-4 py-3 border-b border-zinc-700/50 shrink-0">
              <h3 className="text-sm font-semibold text-white">Участники <span className="text-zinc-500 font-normal">({detail.registrations.length})</span></h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {detail.registrations.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-4">Нет регистраций</p>
              ) : detail.registrations.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 bg-zinc-700/30 rounded-lg p-3 border border-zinc-700/30">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{r.user.username}</p>
                    <p className="text-[10px] text-zinc-500">PUBG: {r.pubgIds.join(', ')}</p>
                    {r.place && <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Место: {r.place} — Приз: {r.prizeAmount} UC</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-zinc-600">{r._count.messages} сообщ.</span>
                    <button onClick={() => setChatReg(r)} className="px-2.5 py-1 rounded-lg bg-zinc-700 text-zinc-300 text-[10px] hover:bg-zinc-600">Чат</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

        {showComplete && detail && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowComplete(false)}>
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-white mb-4">Назначить победителей</h2>
              <p className="text-xs text-zinc-400 mb-3">Выберите игрока для каждого призового места</p>
              {[1, 2, 3].slice(0, detail.winnerCount).map(place => (
                <div key={place} className="mb-3">
                  <p className="text-xs text-zinc-500 mb-1">{place} место — {place === 1 ? detail.prize1 : place === 2 ? detail.prize2 : detail.prize3} UC</p>
                  <div className="space-y-1">
                    {detail.registrations.map(r => {
                      const sel = winners.find(w => w.registrationId === r.id && w.place === place);
                      const taken = winners.find(w => w.registrationId === r.id && w.place !== place);
                      return (
                        <button key={r.id} onClick={() => toggleWinner(r.id, place)} disabled={!!taken}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                            sel ? 'bg-emerald-600/20 border-emerald-500 text-white' : taken ? 'opacity-30 border-zinc-700' : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600 text-zinc-300'
                          }`}>
                          <span className="font-medium">{r.user.username}</span>
                          <span className="text-zinc-600 ml-auto">{r.pubgIds[0]}</span>
                          {sel && <span className="text-emerald-400">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowComplete(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Отмена</button>
                <button onClick={handleComplete} disabled={winners.length !== detail.winnerCount || !!actionLoading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                  {actionLoading === 'complete' ? 'Загрузка...' : 'Подтвердить'}
                </button>
              </div>
            </div>
          </div>
        )}

        {chatReg && <ChatPanel registration={chatReg} onClose={() => setChatReg(null)} />}
        {showForm && <FormModal form={form} setForm={setForm} editingId={editingId} saving={saving} formError={formError} onSave={handleSave} onClose={() => setShowForm(false)} />}
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Classic Турниры</h1>
          <p className="text-xs text-zinc-500">Всего: {total}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none">
            <option value="">Все статусы</option>
            <option value="REGISTRATION">Регистрация</option>
            <option value="IN_PROGRESS">Идёт</option>
            <option value="COMPLETED">Завершён</option>
            <option value="CANCELLED">Отменён</option>
          </select>
          <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">Создать</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><p className="text-zinc-500 text-sm">Загрузка...</p></div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-zinc-500 text-sm">Нет турниров</p>
          <button onClick={openCreate} className="mt-3 text-emerald-400 text-sm hover:underline">Создать первый</button>
        </div>
      ) : (
        <div className="space-y-2">
          {tournaments.map(t => {
            const st = statusLabels[t.status] || { label: t.status, color: 'bg-zinc-700 text-zinc-300' };
            return (
              <button key={t.id} onClick={() => openDetail(t.id)}
                className="w-full bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700/50 p-4 text-left transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{t.title || t.map}</span>
                    <span className="text-xs text-zinc-500">{modeLabels[t.mode] || t.mode}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{new Date(t.startTime).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span>Сервер: {t.server}</span>
                  <span>Взнос: <span className="text-yellow-400">{t.entryFee} UC</span></span>
                  <span>Фонд: <span className="text-emerald-400">{t.prizePool} UC</span></span>
                  <span>Участники: {t._count.registrations}/{t.maxParticipants}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 text-sm disabled:opacity-30">&larr;</button>
          <span className="text-sm text-zinc-500 py-1">Стр. {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={tournaments.length < 20} className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 text-sm disabled:opacity-30">&rarr;</button>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <p className="text-white">Загрузка...</p>
        </div>
      )}

      {showForm && <FormModal form={form} setForm={setForm} editingId={editingId} saving={saving} formError={formError} onSave={handleSave} onClose={() => setShowForm(false)} />}
    </div>
  );
}
