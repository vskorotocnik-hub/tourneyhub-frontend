import { useState } from 'react';

const stats = [
  { label: 'Пользователи', value: '12,847', change: '+234', changeType: 'up' as const, icon: '👥' },
  { label: 'Объявления', value: '3,291', change: '+87', changeType: 'up' as const, icon: '🏷️' },
  { label: 'Турниры сегодня', value: '156', change: '+12', changeType: 'up' as const, icon: '🏆' },
  { label: 'Оборот (24ч)', value: '$8,432', change: '+$1,204', changeType: 'up' as const, icon: '💰' },
  { label: 'На модерации', value: '23', change: '-5', changeType: 'down' as const, icon: '⏳' },
  { label: 'Споры', value: '4', change: '+1', changeType: 'up' as const, icon: '⚠️' },
];

const recentActions = [
  { id: '1', type: 'listing', text: 'Новое объявление: Аккаунт Lv.85 — $900', user: 'ProGamer_X', time: '2 мин назад', status: 'pending' as const },
  { id: '2', type: 'user', text: 'Регистрация нового пользователя', user: 'NewPlayer_2024', time: '5 мин назад', status: 'info' as const },
  { id: '3', type: 'dispute', text: 'Спор по турниру TDM #4521', user: 'ShadowKiller', time: '8 мин назад', status: 'warning' as const },
  { id: '4', type: 'transaction', text: 'Запрос на вывод: $250', user: 'TopSeller', time: '12 мин назад', status: 'pending' as const },
  { id: '5', type: 'listing', text: 'Объявление одобрено: McLaren 570S — $180', user: 'CarDealer', time: '15 мин назад', status: 'approved' as const },
  { id: '6', type: 'report', text: 'Жалоба на пользователя Scammer123', user: 'HonestPlayer', time: '20 мин назад', status: 'warning' as const },
  { id: '7', type: 'transaction', text: 'Покупка аккаунта: $340', user: 'Buyer_Pro', time: '25 мин назад', status: 'info' as const },
  { id: '8', type: 'listing', text: 'Объявление отклонено: подозрительные фото', user: 'NewSeller', time: '30 мин назад', status: 'rejected' as const },
  { id: '9', type: 'tournament', text: 'Турнир Classic #892 завершён', user: 'System', time: '35 мин назад', status: 'info' as const },
  { id: '10', type: 'user', text: 'Пользователь забанен: нарушение правил', user: 'Admin', time: '40 мин назад', status: 'rejected' as const },
];

const topSellers = [
  { rank: 1, name: 'ProGamer_X', avatar: 'https://picsum.photos/seed/seller1/40/40', sales: 142, revenue: '$12,400' },
  { rank: 2, name: 'TopSeller', avatar: 'https://picsum.photos/seed/seller2/40/40', sales: 98, revenue: '$8,700' },
  { rank: 3, name: 'SkinMaster', avatar: 'https://picsum.photos/seed/seller3/40/40', sales: 87, revenue: '$7,200' },
  { rank: 4, name: 'AccountKing', avatar: 'https://picsum.photos/seed/seller4/40/40', sales: 65, revenue: '$5,900' },
  { rank: 5, name: 'BoostPro', avatar: 'https://picsum.photos/seed/seller5/40/40', sales: 54, revenue: '$4,100' },
];

const chartData = [
  { day: 'Пн', users: 180, revenue: 1200 },
  { day: 'Вт', users: 220, revenue: 1500 },
  { day: 'Ср', users: 195, revenue: 1350 },
  { day: 'Чт', users: 260, revenue: 1800 },
  { day: 'Пт', users: 310, revenue: 2100 },
  { day: 'Сб', users: 280, revenue: 1950 },
  { day: 'Вс', users: 234, revenue: 1430 },
];

const AdminDashboardPage = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'approved': return 'text-emerald-400 bg-emerald-400/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      case 'warning': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-zinc-400 bg-zinc-400/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'approved': return 'Одобрено';
      case 'rejected': return 'Отклонено';
      case 'warning': return 'Внимание';
      default: return 'Инфо';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Дашборд</h1>
          <p className="text-zinc-500 text-sm mt-1">Обзор платформы</p>
        </div>
        <div className="flex bg-zinc-800 rounded-xl p-1">
          {(['day', 'week', 'month'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{stat.icon}</span>
              <span className={`text-xs font-medium ${stat.changeType === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-white font-bold text-lg">{stat.value}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-white font-semibold text-sm mb-4">Доход за неделю</h2>
          <div className="flex items-end gap-2 h-40">
            {chartData.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-zinc-500 text-xs">${d.revenue}</span>
                <div
                  className="w-full bg-emerald-500/20 rounded-t-lg relative overflow-hidden"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/60 to-emerald-500/20" />
                </div>
                <span className="text-zinc-500 text-xs">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top sellers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-white font-semibold text-sm mb-4">Топ продавцы</h2>
          <div className="space-y-3">
            {topSellers.map(s => (
              <div key={s.rank} className="flex items-center gap-3">
                <span className={`w-6 text-center font-bold text-sm ${s.rank <= 3 ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {s.rank}
                </span>
                <img src={s.avatar} alt="" className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{s.name}</p>
                  <p className="text-zinc-500 text-xs">{s.sales} продаж</p>
                </div>
                <span className="text-emerald-400 font-bold text-sm">{s.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Последние действия</h2>
        <div className="space-y-2">
          {recentActions.map(action => (
            <div key={action.id} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{action.text}</p>
                <p className="text-zinc-500 text-xs">{action.user} · {action.time}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(action.status)}`}>
                {getStatusLabel(action.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
