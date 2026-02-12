import { useNavigate } from 'react-router-dom';
import type { Chat } from '../types';
import { chats } from '../data/chats';

const MessagesPage = () => {
  const navigate = useNavigate();

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  const getStatusBadge = (chat: Chat) => {
    if (chat.type === 'support') return null;
    if (chat.matchResult === 'win') {
      return <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green">Победа</span>;
    }
    if (chat.matchResult === 'lose') {
      return <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Поражение</span>;
    }
    if (chat.matchResult === 'dispute') {
      return <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Спор</span>;
    }
    return <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">В процессе</span>;
  };

  const sortedChats = [...chats].sort((a, b) => {
    if (a.type === 'support') return -1;
    if (b.type === 'support') return 1;
    return (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0);
  });

  const chatListContent = (
    <>
      {sortedChats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => navigate(`/messages/${chat.id}`)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5"
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            {chat.type === 'support' ? (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 
                            flex items-center justify-center text-lg">
                🎧
              </div>
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                            flex items-center justify-center text-lg">
                🎮
              </div>
            )}
            {chat.unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 
                            flex items-center justify-center text-[10px] font-bold text-white">
                {chat.unreadCount}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-semibold text-white truncate">{chat.title}</span>
                {getStatusBadge(chat)}
              </div>
              <span className="text-xs text-white/40 shrink-0">{formatTime(chat.lastMessageTime)}</span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">{chat.subtitle}</p>
            <p className="text-xs text-white/60 mt-0.5 truncate">{chat.lastMessage}</p>
          </div>

          {/* Arrow (mobile only) */}
          <svg className="w-5 h-5 text-white/30 shrink-0 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}

      {chats.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-white/50">Нет активных чатов</p>
          <p className="text-xs text-white/30 mt-1">Чаты появятся когда вы вступите в турнир</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ===== DESKTOP: Telegram-style two-panel ===== */}
      <div className="hidden md:flex fixed inset-0 top-14 bottom-[57px] z-30">
        {/* Left — Chat List */}
        <div className="w-[340px] lg:w-[380px] shrink-0 bg-dark-300/95 backdrop-blur-lg border-r border-white/10 flex flex-col">
          <div className="shrink-0 px-4 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Сообщения</h2>
            <p className="text-xs text-white/50">Турниры, ордера, поддержка</p>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {chatListContent}
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
      <div className="md:hidden min-h-screen pb-20">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Сообщения</h1>
          <p className="text-sm text-white/60">Турниры, ордера, поддержка</p>
        </div>
        <div>
          {chatListContent}
        </div>
      </div>
    </>
  );
};

export default MessagesPage;
