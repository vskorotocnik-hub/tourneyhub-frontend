import { useState } from 'react';

interface AdminUser {
  id: string;
  username: string;
  avatar: string;
  email: string;
  balance: number;
  registeredAt: string;
  status: 'active' | 'banned' | 'warned';
  totalSpent: number;
  totalEarned: number;
  listings: number;
  tournaments: number;
  lastOnline: string;
}

const mockUsers: AdminUser[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  username: [
    'ProGamer_X','TopSeller','SkinMaster','AccountKing','BoostPro',
    'ShadowKiller','NightOwl','DragonSlayer','IceQueen','StormBringer',
    'PhoenixRise','WolfPack','CyberNinja','DarkKnight','StarHunter',
    'FireEagle','GhostReaper','GoldenLion','CrystalWolf','VenomSquad',
    'AlphaStrike','OmegaForce','ThunderHawk','SteelTitan','BloodRaven',
    'NeonViper','ArcticFox','BattleBorn','WarMachine','SupremeElite',
  ][i],
  avatar: `https://picsum.photos/seed/user${i + 1}/40/40`,
  email: `user${i + 1}@example.com`,
  balance: Math.round(Math.random() * 5000 * 100) / 100,
  registeredAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('ru'),
  status: i === 5 ? 'banned' : i === 12 ? 'warned' : 'active',
  totalSpent: Math.round(Math.random() * 10000),
  totalEarned: Math.round(Math.random() * 8000),
  listings: Math.floor(Math.random() * 50),
  tournaments: Math.floor(Math.random() * 200),
  lastOnline: ['Онлайн', '5 мин назад', '1 час назад', '3 часа назад', 'Вчера', '3 дня назад'][Math.floor(Math.random() * 6)],
}));

const AdminUsersPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'warned'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceChange, setBalanceChange] = useState('');
  const [balanceReason, setBalanceReason] = useState('');

  const filtered = mockUsers.filter(u => {
    if (search && !u.username.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2 py-0.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-xs font-medium">Активен</span>;
      case 'banned': return <span className="px-2 py-0.5 bg-red-400/10 text-red-400 rounded-lg text-xs font-medium">Забанен</span>;
      case 'warned': return <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded-lg text-xs font-medium">Предупреждён</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Пользователи</h1>
        <p className="text-zinc-500 text-sm mt-1">{mockUsers.length} зарегистрировано</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по нику или email..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(['all', 'active', 'banned', 'warned'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {s === 'all' ? 'Все' : s === 'active' ? 'Активные' : s === 'banned' ? 'Баны' : 'Предупр.'}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Пользователь</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Баланс</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden lg:table-cell">Потратил</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden lg:table-cell">Заработал</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Статус</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden xl:table-cell">Онлайн</th>
                <th className="text-right text-zinc-500 text-xs font-medium px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-white text-sm font-medium">{user.username}</p>
                        <p className="text-zinc-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-emerald-400 font-bold text-sm">${user.balance.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-zinc-400 text-sm">${user.totalSpent}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-zinc-400 text-sm">${user.totalEarned}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{getStatusBadge(user.status)}</td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className={`text-xs ${user.lastOnline === 'Онлайн' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {user.lastOnline}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs transition-all"
                      >
                        Профиль
                      </button>
                      <button
                        onClick={() => { setSelectedUser(user); setShowBalanceModal(true); }}
                        className="px-2 py-1 bg-zinc-800 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 rounded-lg text-xs transition-all"
                      >
                        $
                      </button>
                      <button className="px-2 py-1 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg text-xs transition-all">
                        {user.status === 'banned' ? '🔓' : '🔒'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User profile modal */}
      {selectedUser && !showBalanceModal && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedUser(null)} />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Профиль пользователя</h2>
                <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <img src={selectedUser.avatar} alt="" className="w-16 h-16 rounded-full" />
                <div>
                  <p className="text-white font-bold text-lg">{selectedUser.username}</p>
                  <p className="text-zinc-500 text-sm">{selectedUser.email}</p>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Баланс</p>
                  <p className="text-emerald-400 font-bold text-lg">${selectedUser.balance.toFixed(2)}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Регистрация</p>
                  <p className="text-white font-medium text-sm">{selectedUser.registeredAt}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Потратил</p>
                  <p className="text-red-400 font-bold">${selectedUser.totalSpent}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Заработал</p>
                  <p className="text-emerald-400 font-bold">${selectedUser.totalEarned}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Объявления</p>
                  <p className="text-white font-bold">{selectedUser.listings}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-xs">Турниры</p>
                  <p className="text-white font-bold">{selectedUser.tournaments}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowBalanceModal(true)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Изменить баланс
                </button>
                <button className="flex-1 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-xl transition-colors">
                  Предупреждение
                </button>
                <button className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">
                  {selectedUser.status === 'banned' ? 'Разбанить' : 'Забанить'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Balance modal */}
      {showBalanceModal && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => { setShowBalanceModal(false); setBalanceChange(''); setBalanceReason(''); }} />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl z-50">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Изменить баланс</h2>
              <p className="text-zinc-400 text-sm">Пользователь: <span className="text-white font-medium">{selectedUser.username}</span></p>
              <p className="text-zinc-400 text-sm">Текущий баланс: <span className="text-emerald-400 font-bold">${selectedUser.balance.toFixed(2)}</span></p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">Сумма изменения ($)</label>
                <input
                  type="number"
                  value={balanceChange}
                  onChange={e => setBalanceChange(e.target.value)}
                  placeholder="+100 или -50"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">Причина</label>
                <textarea
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                  placeholder="Причина изменения баланса..."
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowBalanceModal(false); setBalanceChange(''); setBalanceReason(''); }}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
                  Применить
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsersPage;
