import { useState } from 'react';

interface Transaction {
  id: string;
  type: 'deposit' | 'purchase' | 'sale' | 'withdrawal' | 'commission' | 'refund';
  user: string;
  userAvatar: string;
  amount: number;
  description: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
}

interface WithdrawalRequest {
  id: string;
  user: string;
  userAvatar: string;
  amount: number;
  method: string;
  details: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const financeStats = [
  { label: 'Баланс платформы', value: '$48,291', icon: '🏦', color: 'text-emerald-400' },
  { label: 'Оборот (30д)', value: '$124,580', icon: '📈', color: 'text-blue-400' },
  { label: 'Комиссии (30д)', value: '$6,229', icon: '💎', color: 'text-purple-400' },
  { label: 'Ожидают вывода', value: '$3,420', icon: '⏳', color: 'text-yellow-400' },
];

const mockTransactions: Transaction[] = Array.from({ length: 20 }, (_, i) => {
  const types: Transaction['type'][] = ['deposit', 'purchase', 'sale', 'withdrawal', 'commission', 'refund'];
  const type = types[i % 6];
  return {
    id: String(i + 1),
    type,
    user: ['ProGamer_X', 'TopSeller', 'SkinMaster', 'AccountKing', 'BoostPro'][i % 5],
    userAvatar: `https://picsum.photos/seed/fuser${i}/40/40`,
    amount: [25, 120, 340, 50, 6.8, 95, 15, 250, 500, 12.5][i % 10],
    description: {
      deposit: 'Пополнение баланса',
      purchase: 'Покупка аккаунта',
      sale: 'Продажа костюма',
      withdrawal: 'Вывод средств',
      commission: 'Комиссия платформы 2%',
      refund: 'Возврат за отменённый турнир',
    }[type],
    createdAt: `${i + 1} ч назад`,
    status: i === 3 ? 'pending' : i === 7 ? 'failed' : 'completed',
  };
});

const mockWithdrawals: WithdrawalRequest[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  user: ['TopSeller', 'AccountKing', 'BoostPro', 'SkinMaster', 'ProGamer_X', 'NightOwl', 'DragonSlayer', 'IceQueen'][i],
  userAvatar: `https://picsum.photos/seed/wuser${i}/40/40`,
  amount: [250, 120, 500, 80, 340, 95, 180, 420][i],
  method: ['USDT TRC-20', 'Карта Visa', 'USDT TRC-20', 'Bitcoin', 'Карта MC', 'USDT TRC-20', 'PayPal', 'Карта Visa'][i],
  details: i % 2 === 0 ? 'TRC20...x8f4a' : '**** **** **** 4521',
  createdAt: `${i * 3 + 1} ч назад`,
  status: i < 5 ? 'pending' : i < 7 ? 'approved' : 'rejected',
}));

const AdminFinancesPage = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals'>('transactions');
  const [typeFilter, setTypeFilter] = useState<'all' | Transaction['type']>('all');

  const filteredTransactions = mockTransactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    return true;
  });

  const pendingWithdrawals = mockWithdrawals.filter(w => w.status === 'pending').length;

  const getTypeLabel = (type: string) => {
    const map: Record<string, { label: string; color: string; icon: string }> = {
      deposit: { label: 'Пополнение', color: 'text-emerald-400 bg-emerald-400/10', icon: '↓' },
      purchase: { label: 'Покупка', color: 'text-red-400 bg-red-400/10', icon: '🛒' },
      sale: { label: 'Продажа', color: 'text-blue-400 bg-blue-400/10', icon: '💰' },
      withdrawal: { label: 'Вывод', color: 'text-orange-400 bg-orange-400/10', icon: '↑' },
      commission: { label: 'Комиссия', color: 'text-purple-400 bg-purple-400/10', icon: '💎' },
      refund: { label: 'Возврат', color: 'text-yellow-400 bg-yellow-400/10', icon: '↩' },
    };
    const info = map[type] || { label: type, color: 'text-zinc-400 bg-zinc-400/10', icon: '?' };
    return <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${info.color}`}>{info.icon} {info.label}</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="text-emerald-400 text-xs">✓</span>;
      case 'pending': return <span className="text-yellow-400 text-xs">⏳</span>;
      case 'failed': return <span className="text-red-400 text-xs">✕</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Финансы</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {financeStats.map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-xl">{s.icon}</span>
            <p className={`font-bold text-xl mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'transactions' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
        >
          Транзакции
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${activeTab === 'withdrawals' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
        >
          Выводы
          {pendingWithdrawals > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {pendingWithdrawals}
            </span>
          )}
        </button>
      </div>

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'deposit', 'purchase', 'sale', 'withdrawal', 'commission', 'refund'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  typeFilter === t ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800'
                }`}
              >
                {t === 'all' ? 'Все' : t === 'deposit' ? 'Пополнения' : t === 'purchase' ? 'Покупки' : t === 'sale' ? 'Продажи' : t === 'withdrawal' ? 'Выводы' : t === 'commission' ? 'Комиссии' : 'Возвраты'}
              </button>
            ))}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Пользователь</th>
                  <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Тип</th>
                  <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Описание</th>
                  <th className="text-right text-zinc-500 text-xs font-medium px-4 py-3">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={t.userAvatar} alt="" className="w-6 h-6 rounded-full" />
                        <div>
                          <span className="text-white text-sm">{t.user}</span>
                          <p className="text-zinc-600 text-xs">{t.createdAt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getTypeLabel(t.type)}</td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-zinc-400 text-sm">{t.description}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-bold text-sm ${['deposit', 'sale', 'commission'].includes(t.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                          {['deposit', 'sale', 'commission'].includes(t.type) ? '+' : '-'}${t.amount}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Withdrawals tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Пользователь</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Метод</th>
                <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden lg:table-cell">Реквизиты</th>
                <th className="text-right text-zinc-500 text-xs font-medium px-4 py-3">Сумма</th>
                <th className="text-right text-zinc-500 text-xs font-medium px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {mockWithdrawals.map(w => (
                <tr key={w.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${w.status === 'pending' ? 'bg-yellow-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={w.userAvatar} alt="" className="w-6 h-6 rounded-full" />
                      <div>
                        <span className="text-white text-sm">{w.user}</span>
                        <p className="text-zinc-600 text-xs">{w.createdAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-zinc-400 text-sm">{w.method}</span></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><span className="text-zinc-500 text-xs font-mono">{w.details}</span></td>
                  <td className="px-4 py-3 text-right"><span className="text-orange-400 font-bold text-sm">${w.amount}</span></td>
                  <td className="px-4 py-3 text-right">
                    {w.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-1">
                        <button className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs transition-all">
                          ✓
                        </button>
                        <button className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition-all">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs ${w.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {w.status === 'approved' ? 'Выплачено' : 'Отклонено'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminFinancesPage;
