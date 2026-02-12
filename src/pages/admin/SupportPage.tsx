import { useState } from 'react';

interface SupportChat {
  id: string;
  type: 'support' | 'order';
  user: string;
  userAvatar: string;
  secondUser?: string;
  secondUserAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  status: 'open' | 'resolved' | 'escalated';
  orderId?: string;
  orderType?: string;
  orderAmount?: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  isAdmin: boolean;
  content: string;
  time: string;
}

const mockChats: SupportChat[] = [
  { id: '1', type: 'support', user: 'ProGamer_X', userAvatar: 'https://picsum.photos/seed/sc1/40/40', lastMessage: 'Не могу вывести средства', lastMessageTime: '2 мин', unread: 3, status: 'open' },
  { id: '2', type: 'order', user: 'TopSeller', userAvatar: 'https://picsum.photos/seed/sc2/40/40', secondUser: 'Buyer_Pro', secondUserAvatar: 'https://picsum.photos/seed/sc2b/40/40', lastMessage: 'Продавец не отвечает', lastMessageTime: '5 мин', unread: 1, status: 'escalated', orderId: 'ORD-4521', orderType: 'Аккаунт', orderAmount: 340 },
  { id: '3', type: 'support', user: 'NewPlayer_2024', userAvatar: 'https://picsum.photos/seed/sc3/40/40', lastMessage: 'Как пополнить баланс?', lastMessageTime: '12 мин', unread: 0, status: 'resolved' },
  { id: '4', type: 'order', user: 'SkinMaster', userAvatar: 'https://picsum.photos/seed/sc4/40/40', secondUser: 'CostumeHunter', secondUserAvatar: 'https://picsum.photos/seed/sc4b/40/40', lastMessage: 'Передал данные, жду подтверждения', lastMessageTime: '18 мин', unread: 0, status: 'open', orderId: 'ORD-4518', orderType: 'Костюм', orderAmount: 120 },
  { id: '5', type: 'support', user: 'ShadowKiller', userAvatar: 'https://picsum.photos/seed/sc5/40/40', lastMessage: 'Жалоба на пользователя Scammer123', lastMessageTime: '25 мин', unread: 2, status: 'open' },
  { id: '6', type: 'order', user: 'AccountKing', userAvatar: 'https://picsum.photos/seed/sc6/40/40', secondUser: 'NightOwl', secondUserAvatar: 'https://picsum.photos/seed/sc6b/40/40', lastMessage: 'Спор по сделке, не совпадает описание', lastMessageTime: '30 мин', unread: 4, status: 'escalated', orderId: 'ORD-4510', orderType: 'Аккаунт', orderAmount: 500 },
  { id: '7', type: 'support', user: 'DragonSlayer', userAvatar: 'https://picsum.photos/seed/sc7/40/40', lastMessage: 'Спасибо за помощь!', lastMessageTime: '1 ч', unread: 0, status: 'resolved' },
  { id: '8', type: 'order', user: 'BoostPro', userAvatar: 'https://picsum.photos/seed/sc8/40/40', secondUser: 'RankPlayer', secondUserAvatar: 'https://picsum.photos/seed/sc8b/40/40', lastMessage: 'Буст завершён, жду оплату', lastMessageTime: '1.5 ч', unread: 0, status: 'open', orderId: 'ORD-4505', orderType: 'Буст', orderAmount: 80 },
  { id: '9', type: 'support', user: 'IceQueen', userAvatar: 'https://picsum.photos/seed/sc9/40/40', lastMessage: 'Верните деньги за отменённый турнир', lastMessageTime: '2 ч', unread: 1, status: 'open' },
  { id: '10', type: 'order', user: 'GoldenLion', userAvatar: 'https://picsum.photos/seed/sc10/40/40', secondUser: 'PopularityGod', secondUserAvatar: 'https://picsum.photos/seed/sc10b/40/40', lastMessage: 'Популярность начислена, проверьте', lastMessageTime: '3 ч', unread: 0, status: 'resolved', orderId: 'ORD-4498', orderType: 'Популярность', orderAmount: 45 },
];

const getMockMessages = (chatId: string): ChatMessage[] => [
  { id: '1', sender: 'Пользователь', senderAvatar: 'https://picsum.photos/seed/msg1/40/40', isAdmin: false, content: 'Здравствуйте, у меня проблема с заказом', time: '14:20' },
  { id: '2', sender: 'Пользователь', senderAvatar: 'https://picsum.photos/seed/msg1/40/40', isAdmin: false, content: 'Продавец не отвечает уже 2 часа', time: '14:21' },
  { id: '3', sender: 'Модератор', senderAvatar: 'https://picsum.photos/seed/admin/40/40', isAdmin: true, content: 'Здравствуйте! Мы разберёмся с ситуацией. Какой номер заказа?', time: '14:25' },
  { id: '4', sender: 'Пользователь', senderAvatar: 'https://picsum.photos/seed/msg1/40/40', isAdmin: false, content: `Заказ ${chatId === '2' ? 'ORD-4521' : 'ORD-4510'}`, time: '14:26' },
  { id: '5', sender: 'Модератор', senderAvatar: 'https://picsum.photos/seed/admin/40/40', isAdmin: true, content: 'Вижу заказ. Сейчас свяжемся с продавцом.', time: '14:28' },
];

const AdminSupportPage = () => {
  const [activeChat, setActiveChat] = useState<SupportChat | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'support' | 'order'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'escalated' | 'resolved'>('all');
  const [messageInput, setMessageInput] = useState('');

  const filtered = mockChats.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const escalatedCount = mockChats.filter(c => c.status === 'escalated').length;
  const openCount = mockChats.filter(c => c.status === 'open').length;

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-400';
      case 'escalated': return 'bg-orange-400 animate-pulse';
      case 'resolved': return 'bg-zinc-600';
      default: return 'bg-zinc-600';
    }
  };

  const messages = activeChat ? getMockMessages(activeChat.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Поддержка и ордер-чаты</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {escalatedCount > 0 && <span className="text-orange-400">{escalatedCount} эскалировано · </span>}
          {openCount} открытых
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(['all', 'support', 'order'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {t === 'all' ? 'Все' : t === 'support' ? '💬 Поддержка' : '📦 Ордер-чаты'}
            </button>
          ))}
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {(['all', 'escalated', 'open', 'resolved'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {s === 'all' ? 'Все' : s === 'escalated' ? '🔥 Эскалация' : s === 'open' ? 'Открытые' : 'Решённые'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat layout */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
        {/* Chat list */}
        <div className={`w-full md:w-80 border-r border-zinc-800 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-zinc-800">
            <p className="text-zinc-500 text-xs font-medium">{filtered.length} чатов</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/30 ${
                  activeChat?.id === chat.id ? 'bg-zinc-800/60' : ''
                } ${chat.status === 'escalated' ? 'border-l-2 border-l-orange-500' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={chat.userAvatar} alt="" className="w-10 h-10 rounded-full" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${getStatusDot(chat.status)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-sm font-medium truncate">{chat.user}</span>
                      {chat.type === 'order' && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-medium">Ордер</span>}
                    </div>
                    <span className="text-zinc-600 text-xs flex-shrink-0">{chat.lastMessageTime}</span>
                  </div>
                  {chat.type === 'order' && chat.secondUser && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-zinc-600 text-xs">↔</span>
                      <span className="text-zinc-500 text-xs">{chat.secondUser}</span>
                      {chat.orderId && <span className="text-zinc-600 text-xs">· {chat.orderId}</span>}
                    </div>
                  )}
                  <p className="text-zinc-500 text-xs truncate mt-0.5">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="inline-block mt-1 w-4 h-4 bg-emerald-500 rounded-full text-[9px] text-white text-center leading-4 font-bold">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className={`flex-1 flex flex-col ${activeChat ? 'flex' : 'hidden md:flex'}`}>
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveChat(null)} className="md:hidden text-zinc-400 hover:text-white p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <img src={activeChat.userAvatar} alt="" className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-white text-sm font-medium">{activeChat.user}</p>
                    {activeChat.type === 'order' && (
                      <p className="text-zinc-500 text-xs">
                        Ордер с {activeChat.secondUser} · {activeChat.orderType} · ${activeChat.orderAmount}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeChat.type === 'order' && (
                    <button className="px-2.5 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-xs font-medium transition-all">
                      Войти в чат ордера
                    </button>
                  )}
                  {activeChat.status !== 'resolved' && (
                    <button className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-all">
                      Решено
                    </button>
                  )}
                </div>
              </div>

              {/* Order info bar */}
              {activeChat.type === 'order' && (
                <div className="px-4 py-2 bg-blue-500/5 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-zinc-500">Ордер: <span className="text-white font-medium">{activeChat.orderId}</span></span>
                    <span className="text-zinc-500">Тип: <span className="text-white">{activeChat.orderType}</span></span>
                    <span className="text-zinc-500">Сумма: <span className="text-emerald-400 font-bold">${activeChat.orderAmount}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <img src={activeChat.userAvatar} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-zinc-400 text-xs">{activeChat.user}</span>
                    </div>
                    <span className="text-zinc-600 text-xs">↔</span>
                    <div className="flex items-center gap-1">
                      <img src={activeChat.secondUserAvatar} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-zinc-400 text-xs">{activeChat.secondUser}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[70%] ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                      <img src={msg.senderAvatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                      <div className={`px-3 py-2 rounded-2xl ${
                        msg.isAdmin
                          ? 'bg-emerald-600 text-white rounded-br-md'
                          : 'bg-zinc-800 text-white rounded-bl-md'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-0.5 ${msg.isAdmin ? 'text-emerald-200' : 'text-zinc-500'}`}>{msg.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-zinc-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Написать от имени модератора..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    onKeyDown={e => { if (e.key === 'Enter' && messageInput.trim()) setMessageInput(''); }}
                  />
                  <button className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
                    ↑
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">💬</span>
                <p className="text-zinc-500 text-sm mt-2">Выберите чат</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportPage;
