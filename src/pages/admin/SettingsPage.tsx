import { useState } from 'react';

interface GameConfig {
  id: string;
  name: string;
  image: string;
  enabled: boolean;
  features: { tournaments: boolean; marketplace: boolean; boost: boolean; rental: boolean; training: boolean };
}

interface AdminRole {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: 'owner' | 'admin' | 'moderator' | 'support';
  permissions: string[];
}

const mockGames: GameConfig[] = [
  { id: 'pubg-mobile', name: 'PUBG Mobile', image: 'https://picsum.photos/seed/gpubg/40/40', enabled: true, features: { tournaments: true, marketplace: true, boost: true, rental: true, training: true } },
  { id: 'free-fire', name: 'Free Fire', image: 'https://picsum.photos/seed/gff/40/40', enabled: false, features: { tournaments: false, marketplace: false, boost: false, rental: false, training: false } },
  { id: 'cod-mobile', name: 'Call of Duty Mobile', image: 'https://picsum.photos/seed/gcod/40/40', enabled: false, features: { tournaments: false, marketplace: false, boost: false, rental: false, training: false } },
];

const mockAdmins: AdminRole[] = [
  { id: '1', name: 'Максим', username: 'maksym_owner', avatar: 'https://picsum.photos/seed/adm1/40/40', role: 'owner', permissions: ['all'] },
  { id: '2', name: 'Алексей', username: 'alex_admin', avatar: 'https://picsum.photos/seed/adm2/40/40', role: 'admin', permissions: ['users', 'listings', 'tournaments', 'finances', 'support', 'content'] },
  { id: '3', name: 'Ирина', username: 'irina_mod', avatar: 'https://picsum.photos/seed/adm3/40/40', role: 'moderator', permissions: ['listings', 'support', 'content'] },
  { id: '4', name: 'Дмитрий', username: 'dmitry_sup', avatar: 'https://picsum.photos/seed/adm4/40/40', role: 'support', permissions: ['support'] },
];

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'games' | 'roles'>('general');

  // General settings state
  const [commissionSale, setCommissionSale] = useState('2');
  const [commissionTournament, setCommissionTournament] = useState('5');
  const [commissionListing, setCommissionListingFee] = useState('0.50');
  const [minDeposit, setMinDeposit] = useState('5');
  const [minWithdraw, setMinWithdraw] = useState('10');
  const [maxWithdraw, setMaxWithdraw] = useState('5000');
  const [minPrice, setMinPrice] = useState('1');
  const [maxPrice, setMaxPrice] = useState('10000');
  const [autoApprove, setAutoApprove] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return <span className="px-2 py-0.5 bg-red-400/10 text-red-400 rounded-lg text-xs font-medium">Владелец</span>;
      case 'admin': return <span className="px-2 py-0.5 bg-purple-400/10 text-purple-400 rounded-lg text-xs font-medium">Админ</span>;
      case 'moderator': return <span className="px-2 py-0.5 bg-blue-400/10 text-blue-400 rounded-lg text-xs font-medium">Модератор</span>;
      case 'support': return <span className="px-2 py-0.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-xs font-medium">Поддержка</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Настройки</h1>

      {/* Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {(['general', 'games', 'roles'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            {t === 'general' ? '⚙️ Общие' : t === 'games' ? '🎮 Игры' : '👤 Роли'}
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div className="space-y-6 max-w-2xl">
          {/* Commissions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm">💎 Комиссии</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">С продаж (%)</label>
                <input
                  type="number"
                  value={commissionSale}
                  onChange={e => setCommissionSale(e.target.value)}
                  step="0.1"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">С турниров (%)</label>
                <input
                  type="number"
                  value={commissionTournament}
                  onChange={e => setCommissionTournament(e.target.value)}
                  step="0.1"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Платное размещение ($)</label>
                <input
                  type="number"
                  value={commissionListing}
                  onChange={e => setCommissionListingFee(e.target.value)}
                  step="0.1"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm">📏 Лимиты</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Мин. депозит ($)</label>
                <input type="number" value={minDeposit} onChange={e => setMinDeposit(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Мин. вывод ($)</label>
                <input type="number" value={minWithdraw} onChange={e => setMinWithdraw(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Макс. вывод ($)</label>
                <input type="number" value={maxWithdraw} onChange={e => setMaxWithdraw(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Мин. цена товара ($)</label>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-500">Макс. цена товара ($)</label>
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm">🔧 Режимы</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white text-sm font-medium">Авто-одобрение объявлений</p>
                  <p className="text-zinc-500 text-xs">Объявления публикуются без модерации</p>
                </div>
                <button
                  onClick={() => setAutoApprove(!autoApprove)}
                  className={`w-12 h-6 rounded-full transition-all relative ${autoApprove ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${autoApprove ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white text-sm font-medium">Режим обслуживания</p>
                  <p className="text-zinc-500 text-xs">Сайт недоступен для пользователей</p>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-12 h-6 rounded-full transition-all relative ${maintenanceMode ? 'bg-red-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${maintenanceMode ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Сохранить настройки
          </button>
        </div>
      )}

      {/* Games */}
      {activeTab === 'games' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">{mockGames.length} игр · {mockGames.filter(g => g.enabled).length} активных</p>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
              + Добавить игру
            </button>
          </div>

          {mockGames.map(game => (
            <div key={game.id} className={`bg-zinc-900 border rounded-xl p-5 space-y-4 ${game.enabled ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={game.image} alt="" className="w-10 h-10 rounded-xl" />
                  <div>
                    <p className="text-white font-medium text-sm">{game.name}</p>
                    <p className="text-zinc-500 text-xs">{game.id}</p>
                  </div>
                </div>
                <button className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${game.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {game.enabled ? '✓ Активна' : 'Выключена'}
                </button>
              </div>

              {game.enabled && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(game.features).map(([key, value]) => (
                    <div key={key} className={`px-3 py-2 rounded-xl text-xs text-center font-medium ${value ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-600'}`}>
                      {key === 'tournaments' ? '🏆 Турниры' : key === 'marketplace' ? '🏷️ Маркет' : key === 'boost' ? '⚡ Буст' : key === 'rental' ? '🔑 Аренда' : '📚 Обучение'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Roles */}
      {activeTab === 'roles' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">{mockAdmins.length} сотрудников</p>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
              + Добавить
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Сотрудник</th>
                  <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Роль</th>
                  <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Доступы</th>
                  <th className="text-right text-zinc-500 text-xs font-medium px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {mockAdmins.map(admin => (
                  <tr key={admin.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={admin.avatar} alt="" className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="text-white text-sm font-medium">{admin.name}</p>
                          <p className="text-zinc-500 text-xs">@{admin.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(admin.role)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.map(p => (
                          <span key={p} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px]">{p === 'all' ? 'Полный доступ' : p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {admin.role !== 'owner' && (
                        <div className="flex items-center justify-end gap-1">
                          <button className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs transition-all">✏️</button>
                          <button className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition-all">🗑</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
