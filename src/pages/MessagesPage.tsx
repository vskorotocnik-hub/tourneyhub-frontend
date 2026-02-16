import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tournamentApi, supportApi, type TournamentChatItem } from '../lib/api';
import type { Chat } from '../types';

type ChatFilter = 'all' | 'active' | 'completed';

const defaultSupportChat: Chat = {
  id: 'support',
  type: 'support',
  title: 'Поддержка',
  subtitle: 'Есть вопрос? Напишите нам — поможем!',
  image: '🎧',
  lastMessage: 'Мы на связи — задайте вопрос',
  lastMessageTime: new Date(),
  unreadCount: 0,
};

function apiChatToChat(c: TournamentChatItem): Chat {
  return {
    id: `t-${c.tournamentId}`,
    type: 'tournament',
    title: `TDM ${c.teamMode === 'SOLO' ? '1 на 1' : '2 на 2'} • ${c.bet} UC`,
    subtitle: c.opponents.length > 0
      ? `vs ${c.opponents.map(o => o.username).join(', ')}`
      : 'Ожидание соперника...',
    lastMessage: c.lastMessage?.content || 'Турнир создан',
    lastMessageTime: new Date(c.lastMessage?.createdAt || c.createdAt),
    unreadCount: c.unreadCount || 0,
    tournamentId: c.tournamentId,
    matchResult: c.status === 'COMPLETED' ? (c.result === 'win' ? 'win' : c.result === 'loss' ? 'lose' : 'win') : c.status === 'DISPUTED' ? 'dispute' : null,
    isResultSubmitted: c.status === 'COMPLETED' || c.status === 'DISPUTED',
    tournamentStatus: c.status,
  };
}

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournamentChats, setTournamentChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChatFilter>('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    let retryTimeout: ReturnType<typeof setTimeout>;
    tournamentApi.myChats()
      .then(res => setTournamentChats(res.chats.map(apiChatToChat)))
      .catch(() => {
        retryTimeout = setTimeout(() => {
          tournamentApi.myChats()
            .then(res => setTournamentChats(res.chats.map(apiChatToChat)))
            .catch(() => {});
        }, 2000);
      })
      .finally(() => setLoading(false));
    return () => clearTimeout(retryTimeout);
  }, [user]);

  // Filter chats based on tab
  const filteredTournamentChats = tournamentChats.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'active') return !c.isResultSubmitted;
    return c.isResultSubmitted; // completed
  });

  const [supportChat, setSupportChat] = useState<Chat>(defaultSupportChat);

  // Load last support message for preview
  useEffect(() => {
    if (!user) return;
    supportApi.getMessages().then(data => {
      if (data.messages.length > 0) {
        const last = data.messages[data.messages.length - 1];
        setSupportChat(prev => ({
          ...prev,
          lastMessage: last.content,
          lastMessageTime: new Date(last.createdAt),
        }));
      }
    }).catch(() => {});
  }, [user]);

  const allChats = [supportChat, ...filteredTournamentChats];
  const totalUnread = tournamentChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date);
    }
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date);
  };

  const getStatusBadge = (c: Chat) => {
    if (c.type === 'support') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Онлайн</span>;
    if (c.matchResult === 'win') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green">Победа</span>;
    if (c.matchResult === 'lose') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Поражение</span>;
    if (c.matchResult === 'dispute') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Спор</span>;
    if (!c.isResultSubmitted) return <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">В процессе</span>;
    return null;
  };

  const filters: { id: ChatFilter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'active', label: 'Активные' },
    { id: 'completed', label: 'Завершённые' },
  ];

  /* ====== FILTER TABS ====== */
  const filterTabs = (
    <div className="flex gap-1.5 px-4 py-2">
      {filters.map(f => (
        <button
          key={f.id}
          onClick={() => setFilter(f.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
            filter === f.id
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-white/50 hover:text-white/70 hover:bg-white/10'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  /* ====== CHAT LIST (shared mobile + desktop sidebar) ====== */
  const chatListItems = (
    <>
      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/40 text-sm">Загрузка...</p>
        </div>
      ) : allChats.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">💬</p>
          <p className="text-white/40 text-sm">Нет чатов</p>
          <p className="text-white/30 text-xs mt-1">Чаты появятся после начала турнира</p>
        </div>
      ) : (
        allChats.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/messages/${c.id}`)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors active:bg-white/10 text-left border-b border-white/5"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              {c.type === 'support' ? (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-lg">
                  🎧
                </div>
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">
                  🎮
                </div>
              )}
              {(c.unreadCount || 0) > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {c.unreadCount! > 99 ? '99+' : c.unreadCount}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-sm font-semibold truncate ${(c.unreadCount || 0) > 0 ? 'text-white' : 'text-white/80'}`}>{c.title}</span>
                  {getStatusBadge(c)}
                </div>
                <span className="text-xs text-white/40 shrink-0">{formatTime(c.lastMessageTime)}</span>
              </div>
              <p className="text-xs text-white/40 mt-0.5">{c.subtitle}</p>
              <p className={`text-xs mt-0.5 truncate ${(c.unreadCount || 0) > 0 ? 'text-white/80 font-medium' : 'text-white/50'}`}>{c.lastMessage}</p>
            </div>
          </button>
        ))
      )}
    </>
  );

  return (
    <>
      {/* ===== DESKTOP: Telegram-style two-panel ===== */}
      <div className="hidden md:flex fixed inset-0 top-14 bottom-[57px] z-30">
        {/* Left — Chat List */}
        <div className="w-[340px] lg:w-[380px] shrink-0 bg-dark-300/95 backdrop-blur-lg border-r border-white/10 flex flex-col">
          <div className="shrink-0 px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Сообщения</h2>
              {totalUnread > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
          </div>
          {filterTabs}
          <div className="flex-1 overflow-y-auto min-h-0">
            {chatListItems}
          </div>
        </div>

        {/* Right — Placeholder */}
        <div className="flex-1 bg-dark-400/50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-white/50 text-lg">Выберите чат</p>
            <p className="text-white/30 text-sm mt-1">Нажмите на чат слева для начала общения</p>
          </div>
        </div>
      </div>

      {/* ===== MOBILE: Full-screen chat list ===== */}
      <div className="md:hidden fixed inset-0 top-14 z-30 bg-dark-300 flex flex-col" style={{ bottom: '62px' }}>
        <div className="shrink-0 px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">Сообщения</h1>
            {totalUnread > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
        </div>
        {filterTabs}
        <div className="flex-1 overflow-y-auto min-h-0">
          {chatListItems}
        </div>
      </div>
    </>
  );
};

export default MessagesPage;
