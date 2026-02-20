import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { classicApi, type ClassicChatListItem, type ClassicMessageItem } from '../lib/api';

type TabFilter = 'chats' | 'active' | 'history';

const statusLabels: Record<string, string> = {
  REGISTRATION: '📝 Регистрация',
  IN_PROGRESS: '⚔️ Идёт',
  COMPLETED: '✅ Завершён',
  CANCELLED: '❌ Отменён',
};

const modeLabels: Record<string, string> = {
  SOLO: 'Solo',
  DUO: 'Duo',
  SQUAD: 'Squad',
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date);
};

const ClassicChatsPage = () => {
  const { regId } = useParams<{ regId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState<TabFilter>('chats');
  const [chats, setChats] = useState<ClassicChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat view state
  const [messages, setMessages] = useState<ClassicMessageItem[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active registrations for "active" tab
  const [activeRegs, setActiveRegs] = useState<any[]>([]);
  const [historyRegs, setHistoryRegs] = useState<any[]>([]);

  const loadChats = useCallback(() => {
    if (!user) return;
    classicApi.myChats()
      .then(res => setChats(res.chats))
      .catch(() => {});
  }, [user]);

  // Refresh chats periodically
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(loadChats, 30000);
    return () => clearInterval(iv);
  }, [loadChats, user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      classicApi.myChats().catch(() => ({ chats: [] })),
      classicApi.myActive().catch(() => ({ registrations: [] })),
      classicApi.myHistory().catch(() => ({ registrations: [] })),
    ]).then(([chatRes, activeRes, histRes]) => {
      setChats(chatRes.chats);
      setActiveRegs(activeRes.registrations);
      setHistoryRegs(histRes.registrations);
    }).finally(() => setLoading(false));
  }, [user]);

  // Load messages when regId changes
  useEffect(() => {
    if (!regId) { setMessages([]); return; }
    setMsgLoading(true);
    classicApi.getMessages(regId)
      .then(res => setMessages(res.messages))
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));
  }, [regId]);

  // Polling for messages
  useEffect(() => {
    if (!regId) return;
    const iv = setInterval(() => {
      classicApi.getMessages(regId)
        .then(res => setMessages(res.messages))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(iv);
  }, [regId]);

  // Auto-scroll
  const msgLen = messages.length;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgLen]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !regId || sending) return;
    const text = inputValue.trim();
    setInputValue('');
    setSending(true);
    try {
      const msg = await classicApi.sendMessage(regId, text);
      setMessages(prev => [...prev, msg]);
    } catch { /* ignore */ }
    setSending(false);
  }, [inputValue, regId, sending]);

  const selectedChat = chats.find(c => c.registrationId === regId);

  // ─── CHAT LIST ───
  const chatList = (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="shrink-0 flex gap-1.5 px-4 py-2 border-b border-white/10">
        {([
          { id: 'chats' as const, label: '💬 Чаты' },
          { id: 'active' as const, label: '🎮 Активные' },
          { id: 'history' as const, label: '📜 История' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-white/50 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Загрузка...</p>
          </div>
        ) : tab === 'chats' ? (
          chats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-white/40 text-sm">Нет чатов</p>
              <p className="text-white/30 text-xs mt-1">Зарегистрируйтесь на Classic турнир</p>
            </div>
          ) : (
            chats.map(c => (
              <button
                key={c.registrationId}
                onClick={() => navigate(`/classic-chats/${c.registrationId}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 ${
                  regId === c.registrationId ? 'bg-purple-500/10' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-lg">
                    🏆
                  </div>
                  {(c.unreadCount || 0) > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {c.tournament.title || c.tournament.map}
                    </span>
                    <span className="text-xs text-white/40 shrink-0">
                      {c.lastMessage ? formatTime(c.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {modeLabels[c.tournament.mode] || c.tournament.mode} • {statusLabels[c.tournament.status] || c.tournament.status}
                  </p>
                  {c.lastMessage && (
                    <p className={`text-xs mt-0.5 truncate ${(c.unreadCount || 0) > 0 ? 'text-white/80 font-medium' : 'text-white/50'}`}>
                      {c.lastMessage.isAdmin ? '🛡️ Админ: ' : ''}{c.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))
          )
        ) : tab === 'active' ? (
          activeRegs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🎮</p>
              <p className="text-white/40 text-sm">Нет активных турниров</p>
            </div>
          ) : (
            activeRegs.map((r: any) => (
              <button
                key={r.id}
                onClick={() => navigate(`/classic-chats/${r.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-lg shrink-0">
                  🎮
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.tournament?.title || r.tournament?.map || 'Турнир'}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {modeLabels[r.tournament?.mode] || ''} • {statusLabels[r.tournament?.status] || r.tournament?.status}
                  </p>
                  <p className="text-xs text-yellow-400/80 mt-0.5">Взнос: {r.tournament?.entryFee} UC • Приз: {r.tournament?.prizePool} UC</p>
                </div>
              </button>
            ))
          )
        ) : (
          historyRegs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📜</p>
              <p className="text-white/40 text-sm">История пуста</p>
            </div>
          ) : (
            historyRegs.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-white/5"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0 ${
                  r.place && r.place <= 3
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                    : r.tournament?.status === 'CANCELLED'
                    ? 'bg-gradient-to-br from-zinc-600 to-zinc-700'
                    : 'bg-gradient-to-br from-zinc-700 to-zinc-800'
                }`}>
                  {r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : r.tournament?.status === 'CANCELLED' ? '❌' : '🏁'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.tournament?.title || r.tournament?.map || 'Турнир'}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {modeLabels[r.tournament?.mode] || ''} • {statusLabels[r.tournament?.status] || ''}
                  </p>
                  {r.place && (
                    <p className="text-xs text-yellow-400 mt-0.5">Место: {r.place} • Приз: {r.prizeAmount} UC</p>
                  )}
                  {r.tournament?.status === 'CANCELLED' && (
                    <p className="text-xs text-zinc-500 mt-0.5">Турнир отменён (возврат {r.tournament?.entryFee} UC)</p>
                  )}
                </div>
                <span className="text-xs text-white/30 shrink-0">{formatTime(r.createdAt)}</span>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );

  // ─── CHAT PANEL ───
  const chatPanel = regId ? (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 bg-dark-300/95 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/classic-chats')}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center md:hidden"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-white truncate">
              {selectedChat?.tournament.title || selectedChat?.tournament.map || 'Чат'}
            </h1>
            <p className="text-xs text-white/50">
              {selectedChat ? `${modeLabels[selectedChat.tournament.mode] || ''} • Чат с администрацией` : 'Чат с администрацией'}
            </p>
          </div>
          {selectedChat && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              selectedChat.tournament.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
              selectedChat.tournament.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
              selectedChat.tournament.status === 'REGISTRATION' ? 'bg-blue-500/20 text-blue-400' :
              'bg-white/10 text-white/50'
            }`}>
              {statusLabels[selectedChat.tournament.status] || selectedChat.tournament.status}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {msgLoading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-white/40 text-sm">Пока нет сообщений</p>
            <p className="text-white/30 text-xs mt-1">Напишите сообщение администратору</p>
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.userId === user?.id && !m.isAdmin && !m.isSystem;
            const isAdmin = m.isAdmin;
            const isSystem = m.isSystem;

            if (isSystem) {
              return (
                <div key={m.id} className="flex justify-center my-2">
                  <span className="bg-white/5 rounded-full px-3 py-1 text-xs text-white/50">{m.content}</span>
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                  isMe
                    ? 'bg-purple-600 text-white rounded-br-md'
                    : isAdmin
                    ? 'bg-amber-600/20 border border-amber-500/30 text-white rounded-bl-md'
                    : 'bg-white/10 text-white rounded-bl-md'
                }`}>
                  {isAdmin && (
                    <p className="text-[10px] text-amber-400 font-semibold mb-0.5">🛡️ Администратор</p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-white/30'}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 py-2.5 bg-dark-300/95 backdrop-blur-lg border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Написать сообщение..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                     text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold
                     hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {sending ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-5xl mb-4">🏆</p>
        <p className="text-white/50 text-lg">Classic турниры</p>
        <p className="text-white/30 text-sm mt-1">Выберите чат слева</p>
      </div>
    </div>
  );

  return (
    <>
      {/* ===== DESKTOP: Two-panel layout ===== */}
      <div className="hidden md:flex fixed inset-0 top-14 bottom-[57px] z-30">
        {/* Left — List */}
        <div className="w-[340px] lg:w-[380px] shrink-0 bg-dark-300/95 backdrop-blur-lg border-r border-white/10 flex flex-col">
          <div className="shrink-0 px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Classic турниры</h2>
            </div>
          </div>
          {chatList}
        </div>
        {/* Right — Chat */}
        <div className="flex-1 bg-dark-400/50 flex flex-col">
          {chatPanel}
        </div>
      </div>

      {/* ===== MOBILE: Full-screen ===== */}
      <div className="md:hidden fixed inset-0 top-14 z-30 bg-dark-300 flex flex-col" style={{ bottom: '62px' }}>
        {regId ? (
          chatPanel
        ) : (
          <>
            <div className="shrink-0 px-4 py-3 border-b border-white/10">
              <h1 className="text-lg font-bold text-white">Classic турниры</h1>
            </div>
            {chatList}
          </>
        )}
      </div>
    </>
  );
};

export default ClassicChatsPage;
