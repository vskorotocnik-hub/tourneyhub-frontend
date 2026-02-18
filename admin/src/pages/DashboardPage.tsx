import { useState, useEffect } from 'react';
import { adminApi } from '../lib/api';
import type { AdminStatsResponse } from '../lib/api';

const chartData = [
  { day: 'Пн', revenue: 1200 },
  { day: 'Вт', revenue: 1500 },
  { day: 'Ср', revenue: 1350 },
  { day: 'Чт', revenue: 1800 },
  { day: 'Пт', revenue: 2100 },
  { day: 'Сб', revenue: 1950 },
  { day: 'Вс', revenue: 1430 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.stats();
        setStats(data);
      } catch { /* */ }
      finally { setStatsLoading(false); }
    })();
  }, []);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Дашборд</h1>
        <p className="text-zinc-500 text-sm mt-1">Обзор платформы</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="h-16 bg-zinc-800 rounded animate-pulse" />
            </div>
          ))
        ) : (
          [
            { label: 'Пользователи', value: stats?.totalUsers ?? 0, sub: `+${stats?.usersThisWeek ?? 0} за нед.`, icon: '👥' },
            { label: 'Активные (7д)', value: stats?.activeLastWeek ?? 0, sub: '', icon: '🟢' },
            { label: 'Верифицированы', value: stats?.verifiedUsers ?? 0, sub: '', icon: '✅' },
            { label: 'Общий баланс', value: `$${(stats?.totalBalance ?? 0).toFixed(2)}`, sub: '', icon: '💰' },
            { label: 'Забанены', value: stats?.bannedUsers ?? 0, sub: '', icon: '🔒' },
            { label: 'За месяц', value: `+${stats?.usersThisMonth ?? 0}`, sub: '', icon: '📈' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{s.icon}</span>
                {s.sub && <span className="text-xs font-medium text-emerald-400">{s.sub}</span>}
              </div>
              <p className="text-white font-bold text-lg">{s.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))
        )}
      </div>

      {/* График */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Доход за неделю (демо)</h2>
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
    </div>
  );
}
