import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MessageBubble from '../components/MessageBubble';
import { chats, chatMessages, tournamentInfos } from '../data/chats';
import type { Chat } from '../types';

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);

  const chat = chats.find(c => c.id === chatId);
  const messages = chatId ? chatMessages[chatId] || [] : [];
  const messagesLength = messages.length;
  const tournamentInfo = chatId && chatId !== 'support' ? tournamentInfos[chatId] : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesLength]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    console.log('Sending message:', inputValue);
    setInputValue('');
  }, [inputValue]);

  const handleResult = useCallback((result: 'win' | 'lose' | 'dispute') => {
    console.log('Match result:', result);
    setShowResultModal(false);
  }, []);

  const sortedChats = [...chats].sort((a, b) => {
    if (a.type === 'support') return -1;
    if (b.type === 'support') return 1;
    return (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0);
  });

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
    if (c.type === 'support') return null;
    if (c.matchResult === 'win') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green">Победа</span>;
    if (c.matchResult === 'lose') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Поражение</span>;
    if (c.matchResult === 'dispute') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Спор</span>;
    return <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">В процессе</span>;
  };

  const isTournament = chat?.type === 'tournament';
  const canSubmitResult = isTournament && !chat?.isResultSubmitted;

  /* ====== CHAT PANEL (reused for both mobile and desktop) ====== */
  const chatPanel = chat ? (
    <div className="flex flex-col h-full">
      {/* Chat Header — sticky */}
      <div className="shrink-0 bg-dark-300/95 backdrop-blur-lg border-b border-white/10 z-10">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/messages')}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center md:hidden"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-white truncate">{chat.title}</h1>
              <p className="text-xs text-white/50">{chat.subtitle}</p>
            </div>

            {isTournament && tournamentInfo && (
              <div className="text-right">
                <p className="text-sm font-bold text-accent-green">{tournamentInfo.prize} {tournamentInfo.currency}</p>
                <p className="text-xs text-white/50">{tournamentInfo.format}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {/* Tournament Rules Banner */}
        {isTournament && (
          <div className="mb-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 p-3">
            <p className="text-xs font-semibold text-white mb-1.5">⚠️ Правила матча</p>
            <ul className="text-xs text-white/70 space-y-1">
              <li>• Сыграйте матч <span className="text-yellow-400 font-medium">в течение 1 часа</span> после создания чата</li>
              <li>• Если оба игрока договорились на другое время — это ок ✓</li>
              <li>• После матча оба указывают результат</li>
              <li>• <span className="text-red-400">Отменить бой нельзя</span> — ставка заморожена</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Tournament Actions */}
      {canSubmitResult && (
        <div className="shrink-0 px-4 py-2 bg-dark-300/80 backdrop-blur-sm border-t border-white/10">
          <button
            onClick={() => setShowResultModal(true)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 
                     text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            📊 Указать результат
          </button>
        </div>
      )}

      {/* Input — sticky bottom */}
      <div className="shrink-0 px-4 py-3 bg-dark-300/95 backdrop-blur-lg border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Написать сообщение..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5
                     text-sm text-white placeholder-white/40 outline-none
                     focus:border-purple-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 
                     text-white font-medium disabled:opacity-50 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">💬</p>
        <p className="text-white/50">Выберите чат</p>
      </div>
    </div>
  );

  /* ====== CHAT LIST SIDEBAR (desktop only) ====== */
  const chatListSidebar = (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="shrink-0 px-4 py-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white">Сообщения</h2>
        <p className="text-xs text-white/50">Турниры, ордера, поддержка</p>
      </div>

      {/* Chat List — scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sortedChats.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/messages/${c.id}`)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5
              ${c.id === chatId ? 'bg-white/10' : ''}`}
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
              {c.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {c.unreadCount}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-semibold text-white truncate">{c.title}</span>
                  {getStatusBadge(c)}
                </div>
                <span className="text-xs text-white/40 shrink-0">{formatTime(c.lastMessageTime)}</span>
              </div>
              <p className="text-xs text-white/40 mt-0.5">{c.subtitle}</p>
              <p className="text-xs text-white/60 mt-0.5 truncate">{c.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* ===== DESKTOP / LARGE TABLET: Telegram-style two-panel ===== */}
      <div className="hidden md:flex fixed inset-0 top-14 bottom-[57px] z-30">
        {/* Left — Chat List */}
        <div className="w-[340px] lg:w-[380px] shrink-0 bg-dark-300/95 backdrop-blur-lg border-r border-white/10 flex flex-col">
          {chatListSidebar}
        </div>

        {/* Right — Active Chat */}
        <div className="flex-1 bg-dark-400/50 flex flex-col min-w-0">
          {chatPanel}
        </div>
      </div>

      {/* ===== MOBILE: Full-screen chat ===== */}
      <div className="md:hidden fixed inset-0 top-14 z-30 bg-dark-300 flex flex-col" style={{ bottom: '62px' }}>
        {chatPanel}
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-200 rounded-2xl border border-white/20 p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white text-center mb-2">Результат матча</h3>
            <p className="text-xs text-white/50 text-center mb-6">Выберите результат вашего матча</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleResult('win')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-green to-emerald-500 
                         text-white font-semibold hover:opacity-90 transition-opacity"
              >
                🏆 Я выиграл
              </button>
              <button
                onClick={() => handleResult('lose')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 
                         text-white font-semibold hover:opacity-90 transition-opacity"
              >
                😔 Я проиграл
              </button>
              <button
                onClick={() => handleResult('dispute')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 
                         text-white font-semibold hover:opacity-90 transition-opacity"
              >
                ⚠️ Спор
              </button>
            </div>

            <button
              onClick={() => setShowResultModal(false)}
              className="w-full mt-4 py-2 text-white/50 text-sm hover:text-white/70 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPage;
