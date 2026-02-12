import { useState } from 'react';

interface AdminTournament {
  id: string;
  title: string;
  game: string;
  mode: string;
  format: string;
  prize: number;
  players: string;
  status: 'active' | 'finished' | 'dispute' | 'cancelled';
  createdAt: string;
  creator: string;
  creatorAvatar: string;
}

const mockTournaments: AdminTournament[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  title: `Турнир #${1000 + i}`,
  game: 'PUBG Mobile',
  mode: ['TDM', 'Classic', 'WoW'][i % 3],
  format: ['1v1', '2v2', '4v4'][i % 3],
  prize: [10, 20, 50, 100, 200, 500][i % 6],
  players: `${Math.min(2 + (i % 4), [2, 4, 8][i % 3])}/${[2, 4, 8][i % 3]}`,
  status: i < 3 ? 'dispute' : i < 12 ? 'active' : i < 25 ? 'finished' : 'cancelled',
  createdAt: `${Math.floor(Math.random() * 48)} ч назад`,
  creator: ['ProGamer_X', 'ShadowKiller', 'NightOwl', 'DragonSlayer', 'IceQueen'][i % 5],
  creatorAvatar: `https://picsum.photos/seed/tcreator${i}/40/40`,
}));

const AdminTournamentsPage = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'finished' | 'dispute' | 'cancelled'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'TDM' | 'Classic' | 'WoW'>('all');
  const [search, setSearch] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<AdminTournament | null>(null);

  const filtered = mockTournaments.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (modeFilter !== 'all' && t.mode !== modeFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.creator.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const disputeCount = mockTournaments.filter(t => t.status === 'dispute').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2 py-0.5 bg-blue-400/10 text-blue-400 rounded-lg text-xs font-medium">Активный</span>;
      case 'finished': return <span className="px-2 py-0.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-xs font-medium">Завершён</span>;
      case 'dispute': return <span className="px-2 py-0.5 bg-orange-400/10 text-orange-400 rounded-lg text-xs font-medium">Спор</span>;
      case 'cancelled': return <span className="px-2 py-0.5 bg-zinc-400/10 text-zinc-400 rounded-lg text-xs font-medium">Отменён</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Турниры</h1>
          <p className="text-zinc-500 text-sm mt-1">{disputeCount > 0 && <span className="text-orange-400">{disputeCount} споров · </span>}{mockTournaments.filter(t => t.status === 'active').length} активных</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(['all', 'dispute', 'active', 'finished', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {s === 'all' ? 'Все' : s === 'dispute' ? `Споры (${disputeCount})` : s === 'active' ? 'Активные' : s === 'finished' ? 'Завершённые' : 'Отменённые'}
            </button>
          ))}
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(['all', 'TDM', 'Classic', 'WoW'] as const).map(m => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                modeFilter === m ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {m === 'all' ? 'Все режимы' : m}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Турнир</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Режим</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden lg:table-cell">Формат</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Приз</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Игроки</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Статус</th>
                <th className="text-right text-zinc-500 text-xs font-medium px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${t.status === 'dispute' ? 'bg-orange-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={t.creatorAvatar} alt="" className="w-7 h-7 rounded-full" />
                      <div>
                        <p className="text-white text-sm font-medium">{t.title}</p>
                        <p className="text-zinc-500 text-xs">{t.creator} · {t.createdAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-zinc-400 text-sm">{t.mode}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="text-zinc-400 text-sm">{t.format}</span></td>
                  <td className="px-4 py-3"><span className="text-emerald-400 font-bold text-sm">${t.prize}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-zinc-400 text-sm">{t.players}</span></td>
                  <td className="px-4 py-3">{getStatusBadge(t.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedTournament(t)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs transition-all"
                      >
                        Детали
                      </button>
                      {t.status === 'dispute' && (
                        <button className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-xs transition-all">
                          Решить
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tournament detail / dispute modal */}
      {selectedTournament && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedTournament(null)} />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{selectedTournament.title}</h2>
                <button onClick={() => setSelectedTournament(null)} className="text-zinc-500 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Режим</p>
                  <p className="text-white font-medium">{selectedTournament.mode}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Формат</p>
                  <p className="text-white font-medium">{selectedTournament.format}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Приз</p>
                  <p className="text-emerald-400 font-bold">${selectedTournament.prize}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Игроки</p>
                  <p className="text-white font-medium">{selectedTournament.players}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Создатель</p>
                  <div className="flex items-center gap-2 mt-1">
                    <img src={selectedTournament.creatorAvatar} alt="" className="w-5 h-5 rounded-full" />
                    <p className="text-white text-sm">{selectedTournament.creator}</p>
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Статус</p>
                  <div className="mt-1">{getStatusBadge(selectedTournament.status)}</div>
                </div>
              </div>

              {selectedTournament.status === 'dispute' && (
                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  <h3 className="text-white font-semibold text-sm">Решение спора</h3>
                  <p className="text-zinc-400 text-sm">Выберите победителя или отмените турнир с возвратом средств:</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
                      Игрок 1 победил
                    </button>
                    <button className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors">
                      Игрок 2 победил
                    </button>
                  </div>
                  <button className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors">
                    Отменить с возвратом
                  </button>
                </div>
              )}

              {selectedTournament.status === 'active' && (
                <button className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">
                  Отменить турнир
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTournamentsPage;
