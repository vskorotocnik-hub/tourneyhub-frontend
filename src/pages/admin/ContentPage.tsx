import { useState } from 'react';

interface AdminBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  gradient: string;
  active: boolean;
  order: number;
}

interface AdminTask {
  id: string;
  title: string;
  description: string;
  type: 'social' | 'game' | 'daily' | 'special';
  reward: number;
  currency: string;
  icon: string;
  active: boolean;
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'active' | 'sellers' | 'buyers';
  sentAt: string;
  read: number;
  total: number;
}

const mockBanners: AdminBanner[] = [
  { id: '1', title: 'Турниры PUBG Mobile', subtitle: 'Играй и выигрывай', image: 'https://picsum.photos/seed/ban1/800/300', gradient: 'from-blue-900/80 to-transparent', active: true, order: 1 },
  { id: '2', title: 'Маркетплейс', subtitle: 'Аккаунты, костюмы, машины', image: 'https://picsum.photos/seed/ban2/800/300', gradient: 'from-purple-900/80 to-transparent', active: true, order: 2 },
  { id: '3', title: 'Популярность', subtitle: 'Машинки, самолёты и другие типы', image: 'https://picsum.photos/seed/ban3/800/300', gradient: 'from-emerald-900/80 to-transparent', active: true, order: 3 },
  { id: '4', title: 'Буст рейтинга', subtitle: 'Профессиональные бустеры', image: 'https://picsum.photos/seed/ban4/800/300', gradient: 'from-orange-900/80 to-transparent', active: false, order: 4 },
  { id: '5', title: 'Акция: -20% на всё', subtitle: 'Только до конца недели', image: 'https://picsum.photos/seed/ban5/800/300', gradient: 'from-red-900/80 to-transparent', active: false, order: 5 },
];

const mockTasks: AdminTask[] = [
  { id: '1', title: 'Подпишись на Telegram', description: 'Подпишись на наш Telegram-канал', type: 'social', reward: 0.5, currency: 'USD', icon: '📱', active: true },
  { id: '2', title: 'Первая покупка', description: 'Сделай первую покупку на маркетплейсе', type: 'game', reward: 1.0, currency: 'USD', icon: '🛒', active: true },
  { id: '3', title: 'Сыграй 3 турнира', description: 'Прими участие в 3 турнирах', type: 'daily', reward: 0.75, currency: 'USD', icon: '🏆', active: true },
  { id: '4', title: 'Пригласи друга', description: 'Пригласи друга по реферальной ссылке', type: 'social', reward: 2.0, currency: 'USD', icon: '👥', active: true },
  { id: '5', title: 'Выиграй 5 турниров', description: 'Одержи 5 побед в турнирах', type: 'special', reward: 5.0, currency: 'USD', icon: '🔥', active: false },
  { id: '6', title: 'Ежедневный бонус', description: 'Заходи каждый день', type: 'daily', reward: 0.25, currency: 'USD', icon: '📅', active: true },
];

const mockNotifications: AdminNotification[] = [
  { id: '1', title: 'Обновление платформы', message: 'Мы обновили маркетплейс! Теперь доступны новые категории.', target: 'all', sentAt: '2 ч назад', read: 8421, total: 12847 },
  { id: '2', title: 'Новый турнир', message: 'Глобальный турнир с призом $5000! Регистрация открыта.', target: 'active', sentAt: '1 день назад', read: 5200, total: 6500 },
  { id: '3', title: 'Для продавцов', message: 'Комиссия снижена до 1.5% до конца месяца.', target: 'sellers', sentAt: '3 дня назад', read: 890, total: 1200 },
];

const AdminContentPage = () => {
  const [activeTab, setActiveTab] = useState<'banners' | 'tasks' | 'notifications'>('banners');
  const [editingBanner, setEditingBanner] = useState<AdminBanner | null>(null);
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
  const [showNewNotification, setShowNewNotification] = useState(false);
  const [newNotifTitle, setNewNotifTitle] = useState('');
  const [newNotifMessage, setNewNotifMessage] = useState('');
  const [newNotifTarget, setNewNotifTarget] = useState<'all' | 'active' | 'sellers' | 'buyers'>('all');

  const getTypeLabel = (type: string) => {
    const map: Record<string, { label: string; color: string }> = {
      social: { label: 'Социальное', color: 'text-blue-400 bg-blue-400/10' },
      game: { label: 'Игровое', color: 'text-emerald-400 bg-emerald-400/10' },
      daily: { label: 'Ежедневное', color: 'text-yellow-400 bg-yellow-400/10' },
      special: { label: 'Особое', color: 'text-purple-400 bg-purple-400/10' },
    };
    const info = map[type] || { label: type, color: 'text-zinc-400 bg-zinc-400/10' };
    return <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${info.color}`}>{info.label}</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Контент</h1>

      {/* Tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {(['banners', 'tasks', 'notifications'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            {t === 'banners' ? '🖼 Баннеры' : t === 'tasks' ? '📋 Задания' : '🔔 Уведомления'}
          </button>
        ))}
      </div>

      {/* Banners */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">{mockBanners.length} баннеров · {mockBanners.filter(b => b.active).length} активных</p>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
              + Добавить баннер
            </button>
          </div>

          <div className="space-y-3">
            {mockBanners.map(banner => (
              <div key={banner.id} className={`bg-zinc-900 border rounded-xl overflow-hidden flex items-center gap-4 pr-4 ${banner.active ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'}`}>
                <img src={banner.image} alt="" className="w-32 h-20 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0 py-3">
                  <p className="text-white font-medium text-sm">{banner.title}</p>
                  <p className="text-zinc-500 text-xs">{banner.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-zinc-600 text-xs">#{banner.order}</span>
                  <button
                    onClick={() => setEditingBanner(banner)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs transition-all"
                  >
                    ✏️
                  </button>
                  <button className={`px-2 py-1 rounded-lg text-xs transition-all ${banner.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {banner.active ? 'Вкл' : 'Выкл'}
                  </button>
                  <button className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs transition-all">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">{mockTasks.length} заданий · {mockTasks.filter(t => t.active).length} активных</p>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
              + Добавить задание
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Задание</th>
                  <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3 hidden md:table-cell">Тип</th>
                  <th className="text-left text-zinc-500 text-xs font-medium px-4 py-3">Награда</th>
                  <th className="text-right text-zinc-500 text-xs font-medium px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {mockTasks.map(task => (
                  <tr key={task.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${!task.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{task.icon}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{task.title}</p>
                          <p className="text-zinc-500 text-xs">{task.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{getTypeLabel(task.type)}</td>
                    <td className="px-4 py-3"><span className="text-emerald-400 font-bold text-sm">${task.reward}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs transition-all"
                        >
                          ✏️
                        </button>
                        <button className={`px-2 py-1 rounded-lg text-xs transition-all ${task.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          {task.active ? 'Вкл' : 'Выкл'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">{mockNotifications.length} отправлено</p>
            <button
              onClick={() => setShowNewNotification(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              + Новое уведомление
            </button>
          </div>

          <div className="space-y-3">
            {mockNotifications.map(notif => (
              <div key={notif.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium text-sm">{notif.title}</h3>
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs">
                        {notif.target === 'all' ? 'Всем' : notif.target === 'active' ? 'Активным' : notif.target === 'sellers' ? 'Продавцам' : 'Покупателям'}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-zinc-600 text-xs">{notif.sentAt}</span>
                      <span className="text-zinc-600 text-xs">Прочитано: {notif.read}/{notif.total} ({Math.round(notif.read / notif.total * 100)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* New notification modal */}
          {showNewNotification && (
            <>
              <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setShowNewNotification(false)} />
              <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[450px] bg-zinc-900 border border-zinc-800 rounded-2xl z-50">
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-bold text-white">Новое уведомление</h2>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white">Заголовок</label>
                    <input
                      type="text"
                      value={newNotifTitle}
                      onChange={e => setNewNotifTitle(e.target.value)}
                      placeholder="Заголовок уведомления"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white">Сообщение</label>
                    <textarea
                      value={newNotifMessage}
                      onChange={e => setNewNotifMessage(e.target.value)}
                      placeholder="Текст уведомления..."
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white">Кому отправить</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['all', 'active', 'sellers', 'buyers'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setNewNotifTarget(t)}
                          className={`py-2 rounded-xl text-xs font-medium transition-all ${
                            newNotifTarget === t ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                          }`}
                        >
                          {t === 'all' ? 'Всем' : t === 'active' ? 'Активным' : t === 'sellers' ? 'Продавцам' : 'Покупателям'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowNewNotification(false)}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      Отмена
                    </button>
                    <button className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
                      Отправить
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit banner modal */}
      {editingBanner && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setEditingBanner(null)} />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[450px] bg-zinc-900 border border-zinc-800 rounded-2xl z-50">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Редактировать баннер</h2>
              <img src={editingBanner.image} alt="" className="w-full aspect-[8/3] rounded-xl object-cover" />
              <input type="text" defaultValue={editingBanner.title} placeholder="Заголовок" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              <input type="text" defaultValue={editingBanner.subtitle} placeholder="Подзаголовок" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              <input type="text" defaultValue={editingBanner.image} placeholder="URL изображения" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              <div className="flex gap-2">
                <button onClick={() => setEditingBanner(null)} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors">Отмена</button>
                <button onClick={() => setEditingBanner(null)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">Сохранить</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit task modal */}
      {editingTask && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setEditingTask(null)} />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[450px] bg-zinc-900 border border-zinc-800 rounded-2xl z-50">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Редактировать задание</h2>
              <input type="text" defaultValue={editingTask.title} placeholder="Название" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              <textarea defaultValue={editingTask.description} placeholder="Описание" rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600 resize-none" />
              <input type="number" defaultValue={editingTask.reward} placeholder="Награда ($)" step="0.01" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-600" />
              <div className="flex gap-2">
                <button onClick={() => setEditingTask(null)} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors">Отмена</button>
                <button onClick={() => setEditingTask(null)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">Сохранить</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminContentPage;
