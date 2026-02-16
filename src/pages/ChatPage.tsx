import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MessageBubble from '../components/MessageBubble';
import type { Chat, ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import { tournamentApi, supportApi, type TournamentChatItem, type TournamentDetail, type Dispute, type SupportMessageItem } from '../lib/api';
import { getSocket, joinTournament, leaveTournament } from '../lib/socket';

const defaultSupportChat: Chat = {
  id: 'support', type: 'support', title: 'Поддержка',
  subtitle: 'Есть вопрос? Напишите нам — поможем!',
  image: '🎧', lastMessage: 'Мы на связи — задайте вопрос',
  lastMessageTime: new Date(), unreadCount: 0,
};

type ChatFilter = 'all' | 'active' | 'completed';

function apiToChat(c: TournamentChatItem): Chat {
  return {
    id: `t-${c.tournamentId}`, type: 'tournament',
    title: `TDM ${c.teamMode === 'SOLO' ? '1 на 1' : '2 на 2'} • ${c.bet} UC`,
    subtitle: c.opponents.length > 0 ? `vs ${c.opponents.map(o => o.username).join(', ')}` : 'Ожидание соперника...',
    lastMessage: c.lastMessage?.content || 'Турнир создан',
    lastMessageTime: new Date(c.lastMessage?.createdAt || c.createdAt),
    unreadCount: c.unreadCount || 0, tournamentId: c.tournamentId,
    matchResult: c.status === 'COMPLETED' ? (c.result === 'win' ? 'win' : c.result === 'loss' ? 'lose' : 'win') : c.status === 'DISPUTED' ? 'dispute' : null,
    isResultSubmitted: c.status === 'COMPLETED' || c.status === 'DISPUTED',
    tournamentStatus: c.status,
  };
}

const ChatPage = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [sidebarChats, setSidebarChats] = useState<Chat[]>([defaultSupportChat]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tournamentDetail, setTournamentDetail] = useState<TournamentDetail | null>(null);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [resultError, setResultError] = useState('');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeVideoUrl, setDisputeVideoUrl] = useState('');
  const [disputeResponse, setDisputeResponse] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeError, setDisputeError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');
  const [showRulesExpanded, setShowRulesExpanded] = useState(false);

  const isRealTournament = chatId?.startsWith('t-');
  const realTournamentId = isRealTournament ? chatId!.substring(2) : null;

  // Helper: map API message to ChatMessage
  const mapMsg = useCallback((m: import('../lib/api').TournamentMessage, cId: string): ChatMessage => ({
    id: m.id, chatId: cId, content: m.content,
    type: (m.isAdmin ? 'admin' : m.isSystem ? 'system' : 'user') as ChatMessage['type'],
    senderId: m.isSystem ? 'system' : m.user.id,
    senderName: m.isAdmin ? 'Администратор' : m.isSystem ? 'Система' : m.user.username,
    senderAvatar: m.isSystem ? undefined : (m.user.avatar || undefined),
    imageUrl: m.imageUrl || undefined,
    timestamp: new Date(m.createdAt),
  }), []);

  // Load sidebar chats from API — reload on user change and chatId change
  const loadSidebarChats = useCallback(() => {
    if (!user) return;
    tournamentApi.myChats()
      .then(res => setSidebarChats([defaultSupportChat, ...res.chats.map(apiToChat)]))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    loadSidebarChats();
  }, [loadSidebarChats, chatId]);

  // Real-time: refresh sidebar when tournaments change
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => loadSidebarChats();
    socket.on('tournaments:list_changed', refresh);
    socket.on('unread:update', refresh);
    return () => {
      socket.off('tournaments:list_changed', refresh);
      socket.off('unread:update', refresh);
    };
  }, [loadSidebarChats]);

  // Issue 7 fix: Clear messages immediately when switching chats to prevent flash
  useEffect(() => {
    setMessages([]);
    setTournamentDetail(null);
    setDisputes([]);
  }, [chatId]);

  // Load messages
  useEffect(() => {
    if (!chatId) return;
    if (isRealTournament && realTournamentId) {
      tournamentApi.getMessages(realTournamentId).then(data => {
        setMessages(data.messages.map(m => mapMsg(m, chatId)));
      }).catch(() => setMessages([]));
    } else if (chatId === 'support') {
      supportApi.getMessages().then(data => {
        setMessages(data.messages.map((m: SupportMessageItem): ChatMessage => ({
          id: m.id, chatId: 'support', content: m.content,
          type: m.isSystem ? 'system' : m.isFromUser ? 'user' : 'support',
          senderId: m.isFromUser ? m.user.id : 'support',
          senderName: m.isFromUser ? m.user.username : 'Поддержка',
          senderAvatar: m.isFromUser ? (m.user.avatar || undefined) : undefined,
          timestamp: new Date(m.createdAt),
        })));
      }).catch(() => setMessages([]));
    } else {
      setMessages([]);
    }
  }, [chatId, isRealTournament, realTournamentId, mapMsg]);

  // Load tournament detail + disputes + mark as read + clear unread in sidebar
  useEffect(() => {
    if (!isRealTournament || !realTournamentId) return;
    tournamentApi.get(realTournamentId).then(setTournamentDetail).catch(() => {});
    tournamentApi.getDisputes(realTournamentId).then(d => setDisputes(d.disputes)).catch(() => {});
    // Mark as read + immediately clear unread count in sidebar
    tournamentApi.markRead(realTournamentId).then(() => {
      setSidebarChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
    }).catch(() => {});
  }, [isRealTournament, realTournamentId, chatId]);

  // Socket.IO: join room + listen for real-time messages
  useEffect(() => {
    if (!isRealTournament || !realTournamentId) return;
    const socket = getSocket();

    if (socket) {
      joinTournament(realTournamentId);

      const handleNewMessage = (data: { tournamentId: string; message: any }) => {
        if (data.tournamentId === realTournamentId && data.message) {
          setMessages(prev => {
            // Deduplicate by id
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, mapMsg(data.message, chatId!)];
          });
          // Mark as read immediately since chat is open
          tournamentApi.markRead(realTournamentId).catch(() => {});
        }
      };

      const handleTournamentUpdate = () => {
        // Refresh tournament detail, messages, and disputes on any update
        tournamentApi.get(realTournamentId).then(setTournamentDetail).catch(() => {});
        tournamentApi.getMessages(realTournamentId).then(data => {
          setMessages(data.messages.map(m => mapMsg(m, chatId!)));
        }).catch(() => {});
        tournamentApi.getDisputes(realTournamentId).then(d => setDisputes(d.disputes)).catch(() => {});
      };

      socket.on('chat:message', handleNewMessage);
      socket.on('tournament:update', handleTournamentUpdate);

      return () => {
        leaveTournament(realTournamentId);
        socket.off('chat:message', handleNewMessage);
        socket.off('tournament:update', handleTournamentUpdate);
      };
    }
  }, [isRealTournament, realTournamentId, chatId, mapMsg]);

  // Fallback polling (longer interval when socket is connected)
  useEffect(() => {
    if (!isRealTournament || !realTournamentId) return;
    const socket = getSocket();
    const interval = socket?.connected ? 30000 : 8000;
    const iv = setInterval(() => {
      tournamentApi.getMessages(realTournamentId).then(data => {
        setMessages(data.messages.map(m => mapMsg(m, chatId!)));
        tournamentApi.markRead(realTournamentId).catch(() => {});
      }).catch(() => {});
      tournamentApi.get(realTournamentId).then(setTournamentDetail).catch(() => {});
      tournamentApi.getDisputes(realTournamentId).then(d => setDisputes(d.disputes)).catch(() => {});
    }, interval);
    return () => clearInterval(iv);
  }, [isRealTournament, realTournamentId, chatId, mapMsg]);

  const chat = sidebarChats.find(c => c.id === chatId);
  const messagesLength = messages.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesLength]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    if (isRealTournament && realTournamentId) {
      const text = inputValue.trim();
      setInputValue('');
      tournamentApi.sendMessage(realTournamentId, text).then(m => {
        setMessages(prev => [...prev, {
          id: m.id, chatId: chatId!, content: m.content,
          type: 'user' as const,
          senderId: m.user.id, senderName: m.user.username,
          senderAvatar: m.user.avatar || undefined,
          timestamp: new Date(m.createdAt),
        }]);
      }).catch(() => {});
    } else if (chatId === 'support') {
      const text = inputValue.trim();
      setInputValue('');
      // Optimistic UI: show message immediately
      const tempId = `temp-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: tempId, chatId: 'support', content: text,
        type: 'user', senderId: user?.id || 'me',
        senderName: user?.username || 'Я', timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
      // Persist to backend
      supportApi.sendMessage(text).then(m => {
        // Replace temp message with real one
        setMessages(prev => prev.map(msg => msg.id === tempId ? {
          id: m.id, chatId: 'support', content: m.content,
          type: 'user' as const, senderId: m.user.id,
          senderName: m.user.username, timestamp: new Date(m.createdAt),
        } : msg));
      }).catch(() => {});
    } else {
      setInputValue('');
    }
  }, [inputValue, isRealTournament, realTournamentId, chatId, user]);

  // Determine active match where USER's team is playing (important for 4-team tournaments with 2 simultaneous matches)
  const userTeamId = tournamentDetail?.userTeamId;
  const activeMatch = tournamentDetail?.matches.find(m =>
    (m.status === 'ACTIVE' || m.status === 'DISPUTED') &&
    userTeamId &&
    (m.teamA?.id === userTeamId || m.teamB?.id === userTeamId)
  );
  const canSubmitApiResult = !!activeMatch && !!userTeamId && (tournamentDetail?.status === 'IN_PROGRESS' || tournamentDetail?.status === 'DISPUTED');

  // Fix 2: 60-second cooldown after match starts
  const [resultCooldown, setResultCooldown] = useState(0);
  useEffect(() => {
    if (!tournamentDetail?.startedAt) return;
    const startedAt = new Date(tournamentDetail.startedAt).getTime();
    const calc = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setResultCooldown(Math.max(0, 60 - elapsed));
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [tournamentDetail?.startedAt]);

  // Track whether user already submitted result
  const userAlreadySubmitted = (() => {
    if (!activeMatch || !userTeamId) return false;
    if (activeMatch.teamA?.id === userTeamId) return !!activeMatch.teamAResult;
    if (activeMatch.teamB?.id === userTeamId) return !!activeMatch.teamBResult;
    return false;
  })();

  const refreshAll = useCallback(async () => {
    if (!realTournamentId || !chatId) return;
    const [detail, msgData, dispData] = await Promise.all([
      tournamentApi.get(realTournamentId),
      tournamentApi.getMessages(realTournamentId),
      tournamentApi.getDisputes(realTournamentId),
    ]);
    setTournamentDetail(detail);
    setMessages(msgData.messages.map(m => mapMsg(m, chatId)));
    setDisputes(dispData.disputes);
  }, [realTournamentId, chatId, mapMsg]);

  const handleSubmitWinner = useCallback(async (winnerId: string) => {
    if (!realTournamentId || !activeMatch || submittingResult) return;
    setSubmittingResult(true);
    setResultError('');
    try {
      await tournamentApi.submitResult(realTournamentId, activeMatch.id, winnerId);
      setShowResultModal(false);
      await refreshAll();
    } catch (e: any) {
      setResultError(e?.message || 'Ошибка отправки результата');
    } finally {
      setSubmittingResult(false);
    }
  }, [realTournamentId, activeMatch, submittingResult, refreshAll]);

  // Dispute handlers
  const openDispute = disputes.find(d => d.status === 'OPEN');
  const myOpenDispute = openDispute && user ? openDispute.reporterId === user.id ? openDispute : null : null;
  const otherOpenDispute = openDispute && user ? openDispute.reporterId !== user.id ? openDispute : null : null;

  const [disputeTargetTeamId, setDisputeTargetTeamId] = useState('');

  const handleFileDispute = useCallback(async () => {
    if (!realTournamentId || !disputeReason.trim() || disputeLoading) return;
    // For >2 teams, require target
    if (tournamentDetail && tournamentDetail.teamCount > 2 && !disputeTargetTeamId) {
      setDisputeError('Выберите, на кого подаёте жалобу');
      return;
    }
    setDisputeLoading(true);
    setDisputeError('');
    try {
      await tournamentApi.fileDispute(
        realTournamentId,
        disputeReason.trim(),
        disputeVideoUrl.trim() || undefined,
        disputeTargetTeamId || undefined
      );
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeVideoUrl('');
      setDisputeTargetTeamId('');
      await refreshAll();
    } catch (e: any) {
      setDisputeError(e?.message || 'Ошибка подачи жалобы');
    } finally {
      setDisputeLoading(false);
    }
  }, [realTournamentId, disputeReason, disputeLoading, refreshAll, disputeTargetTeamId, tournamentDetail]);

  const handleCancelDispute = useCallback(async () => {
    if (!realTournamentId || !myOpenDispute || disputeLoading) return;
    setDisputeLoading(true);
    try {
      await tournamentApi.cancelDispute(realTournamentId, myOpenDispute.id);
      await refreshAll();
    } catch { /* ignore */ } finally {
      setDisputeLoading(false);
    }
  }, [realTournamentId, myOpenDispute, disputeLoading, refreshAll]);

  const handleRespondDispute = useCallback(async () => {
    if (!realTournamentId || !otherOpenDispute || !disputeResponse.trim() || disputeLoading) return;
    setDisputeLoading(true);
    setDisputeError('');
    try {
      await tournamentApi.respondToDispute(realTournamentId, otherOpenDispute.id, disputeResponse.trim());
      setDisputeResponse('');
      await refreshAll();
    } catch (e: any) {
      setDisputeError(e?.message || 'Ошибка отправки ответа');
    } finally {
      setDisputeLoading(false);
    }
  }, [realTournamentId, otherOpenDispute, disputeResponse, disputeLoading, refreshAll]);


  // Image upload handler — show preview first, send on confirm
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sendingImage, setSendingImage] = useState(false);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !realTournamentId) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('Максимум 5 МБ'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [realTournamentId]);

  const [imageError, setImageError] = useState('');

  const handleSendImage = useCallback(async () => {
    if (!pendingImage || !realTournamentId || sendingImage) return;
    setSendingImage(true);
    setImageError('');
    try {
      await tournamentApi.sendImageMessage(realTournamentId, pendingImage);
      setPendingImage(null);
      await refreshAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка отправки фото';
      setImageError(msg);
    }
    setSendingImage(false);
  }, [pendingImage, realTournamentId, sendingImage, refreshAll]);

  const handleCancelImage = useCallback(() => {
    setPendingImage(null);
  }, []);

  const sortedChats = [...sidebarChats].sort((a, b) => {
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
    if (c.type === 'support') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Онлайн</span>;
    if (c.matchResult === 'win') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green">Победа</span>;
    if (c.matchResult === 'lose') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Поражение</span>;
    if (c.matchResult === 'dispute') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Спор</span>;
    return <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">В процессе</span>;
  };

  const isTournament = chat?.type === 'tournament';

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

            <div 
              className="flex-1 min-w-0 cursor-pointer" 
              onClick={() => isTournament && realTournamentId && navigate(`/game/pubg-mobile?tournament=${realTournamentId}`)}
            >
              <h1 className="text-base font-semibold text-white truncate">{chat.title}</h1>
              <p className="text-xs text-white/50">{chat.subtitle}</p>
              {isTournament && <p className="text-[10px] text-purple-400/70 mt-0.5">Нажмите для перехода к турниру →</p>}
              {chat.type === 'support' && <p className="text-[10px] text-emerald-400/70 mt-0.5">● Онлайн</p>}
            </div>

            {isTournament && tournamentDetail && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                tournamentDetail.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
                tournamentDetail.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                tournamentDetail.status === 'SEARCHING' ? 'bg-blue-500/20 text-blue-400' :
                tournamentDetail.status === 'DISPUTED' ? 'bg-red-500/20 text-red-400' :
                'bg-white/10 text-white/50'
              }`}>
                {tournamentDetail.status === 'IN_PROGRESS' ? '⚔️ Идёт' :
                 tournamentDetail.status === 'COMPLETED' ? '✅ Завершён' :
                 tournamentDetail.status === 'SEARCHING' ? '🔍 Поиск' :
                 tournamentDetail.status === 'DISPUTED' ? '⚠️ Спор' : tournamentDetail.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {/* Tournament Bracket */}
        {isTournament && tournamentDetail && tournamentDetail.matches.length > 0 && (
          <div className="mb-3 bg-dark-200/80 rounded-xl border border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white">⚔️ Сетка матчей</p>
              <div className="flex gap-3">
                <span className="text-[10px] text-white/40">Ставка: <span className="text-yellow-400 font-medium">{tournamentDetail.bet} UC</span></span>
                <span className="text-[10px] text-white/40">Приз: <span className="text-emerald-400 font-medium">{tournamentDetail.prizePool} UC</span></span>
              </div>
            </div>
            <div className="space-y-2">
              {tournamentDetail.matches.map((match) => {
                const teamAName = match.teamA?.players.map(p => p.user.username).join(', ') || '—';
                const teamBName = match.teamB?.players.map(p => p.user.username).join(', ') || '—';
                const isPlaying = match.status === 'ACTIVE';
                const isDisputed = match.status === 'DISPUTED';
                const isDone = match.status === 'COMPLETED';
                const winnerIsA = match.winnerId && match.teamA && match.winnerId === match.teamA.id;
                const winnerIsB = match.winnerId && match.teamB && match.winnerId === match.teamB.id;
                const isMyMatch = userTeamId && (match.teamA?.id === userTeamId || match.teamB?.id === userTeamId);
                const totalTeams = tournamentDetail.teamCount;
                const roundLabel = totalTeams === 2 ? '🏆 Финал'
                  : totalTeams === 3 ? (match.round === 1 ? 'Раунд 1' : '🏆 Финал')
                  : (match.round === 1 ? `Полуфинал ${match.matchOrder}` : '🏆 Финал');
                const statusIcon = isDone ? '✅' : isPlaying ? '⚔️' : isDisputed ? '⚠️' : '⏳';
                return (
                  <div key={match.id} className={`rounded-lg px-3 py-2 text-xs ${
                    isMyMatch && (isPlaying || isDisputed) ? 'bg-purple-500/15 border-2 border-purple-500/30' :
                    isPlaying ? 'bg-yellow-500/10 border border-yellow-500/20' :
                    isDisputed ? 'bg-red-500/10 border border-red-500/20' :
                    isDone ? 'bg-emerald-500/5 border border-emerald-500/10' :
                    'bg-white/5 border border-white/5 opacity-50'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/50 font-medium">{roundLabel}</span>
                      <span className="text-[10px]">{statusIcon}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex-1 truncate ${winnerIsA ? 'text-emerald-400 font-semibold' : match.teamA?.id === userTeamId ? 'text-purple-300 font-medium' : 'text-white'}`}>
                        {match.teamA?.id === userTeamId ? `👤 ${teamAName}` : teamAName}
                      </span>
                      <span className="text-white/30 shrink-0 text-[10px] font-bold">VS</span>
                      <span className={`flex-1 truncate text-right ${winnerIsB ? 'text-emerald-400 font-semibold' : match.teamB?.id === userTeamId ? 'text-purple-300 font-medium' : 'text-white'}`}>
                        {match.teamB?.id === userTeamId ? `${teamBName} 👤` : teamBName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dispute Banner */}
        {isTournament && openDispute && (
          <div className="mb-3 bg-red-500/10 rounded-xl border border-red-500/30 p-3">
            <p className="text-xs font-semibold text-red-400 mb-1.5">⚠️ Жалоба подана</p>
            <p className="text-xs text-white/70 mb-1"><span className="text-white/50">Причина:</span> {openDispute.reason}</p>
            {openDispute.response && (
              <p className="text-xs text-white/70 mb-1"><span className="text-white/50">Ответ:</span> {openDispute.response}</p>
            )}
            {disputeError && <p className="text-xs text-red-400 mb-1">{disputeError}</p>}

            {/* If I filed this dispute — show cancel button */}
            {myOpenDispute && (
              <button
                onClick={handleCancelDispute}
                disabled={disputeLoading}
                className="mt-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white/70 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {disputeLoading ? '⏳...' : '❌ Отменить жалобу'}
              </button>
            )}

            {/* If other side filed — show respond form */}
            {otherOpenDispute && !otherOpenDispute.response && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-yellow-400">Дайте ваш ответ на жалобу:</p>
                <textarea
                  value={disputeResponse}
                  onChange={e => setDisputeResponse(e.target.value)}
                  placeholder="Ваш ответ / оправдание..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder-white/40 outline-none resize-none"
                  rows={2}
                />
                <button
                  onClick={handleRespondDispute}
                  disabled={disputeLoading || !disputeResponse.trim()}
                  className="px-3 py-1.5 rounded-lg bg-yellow-600/30 border border-yellow-500/30 text-xs text-yellow-400 hover:bg-yellow-600/50 transition-colors disabled:opacity-50"
                >
                  {disputeLoading ? '⏳...' : '📤 Отправить ответ'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tournament Rules Banner — collapsible */}
        {isTournament && (() => {
          const [rulesExpanded, setRulesExpanded] = [showRulesExpanded, setShowRulesExpanded];
          return (
            <div className="mb-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white">📋 Правила матча</p>
                <button onClick={() => setRulesExpanded(!rulesExpanded)} className="text-[10px] text-purple-400 hover:text-purple-300">
                  {rulesExpanded ? 'Свернуть ▲' : 'Подробнее ▼'}
                </button>
              </div>
              <ul className="text-xs text-white/70 space-y-1 mt-1.5">
                <li>• Сыграйте матч <span className="text-yellow-400 font-medium">в течение 1 часа</span></li>
                <li>• После матча оба игрока указывают результат</li>
                <li>• <span className="text-red-400">Отменить бой нельзя</span> — ставка заморожена</li>
                <li>• Если ничья — <span className="text-yellow-400 font-medium">сыграйте ещё раз</span></li>
              </ul>
              {rulesExpanded && (
                <ul className="text-xs text-white/70 space-y-1 mt-1.5 pt-1.5 border-t border-white/10">
                  <li>• Если оба игрока договорились на другое время — это ок ✓</li>
                  <li>• Если результаты не совпадают — открывается спор</li>
                  <li>• В споре отправьте скриншот/видео результата матча</li>
                  <li>• Администратор рассмотрит спор на основе доказательств</li>
                  <li>• Нечестная игра → бан аккаунта и потеря ставки</li>
                  <li>• При 4 командах: полуфиналы идут параллельно, финал — после обоих</li>
                </ul>
              )}
            </div>
          );
        })()}

        {messages
          .filter(m => {
            // Hide old verbose system messages that are no longer generated
            if (m.type === 'system') {
              const c = m.content;
              if (c.includes('вступил в турнир') || c.includes('покинул турнир') || c.includes('Ищем замену')) return false;
            }
            return true;
          })
          .map((message) => (
          <MessageBubble key={message.id} message={message} currentUserId={user?.id} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Tournament Actions — submit result + file dispute (hide when COMPLETED) */}
      {isTournament && tournamentDetail?.status !== 'COMPLETED' && (canSubmitApiResult || (tournamentDetail?.status === 'IN_PROGRESS' && !openDispute)) && (
        <div className="shrink-0 px-4 py-2 bg-dark-300/80 backdrop-blur-sm border-t border-white/10">
          {resultError && <p className="text-xs text-red-400 mb-1 text-center">{resultError}</p>}
          <div className="flex gap-2">
            {canSubmitApiResult && (() => {
              const cooldownActive = resultCooldown > 0;
              const cooldownMins = Math.floor(resultCooldown / 60);
              const cooldownSecs = resultCooldown % 60;
              const cooldownText = `${cooldownMins.toString().padStart(2, '0')}:${cooldownSecs.toString().padStart(2, '0')}`;

              if (!userAlreadySubmitted) {
                return (
                  <button
                    onClick={() => setShowResultModal(true)}
                    disabled={submittingResult || cooldownActive}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 
                             text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submittingResult ? '⏳ Отправка...' : cooldownActive ? `⏳ Можно через ${cooldownText}` : '📊 Указать результат'}
                  </button>
                );
              }
              return (
                <button
                  onClick={() => setShowResultModal(true)}
                  disabled={submittingResult}
                  className="flex-1 py-2.5 rounded-xl bg-yellow-600/20 border border-yellow-500/30 
                           text-yellow-400 text-sm font-semibold hover:bg-yellow-600/30 transition-colors disabled:opacity-50"
                >
                  {submittingResult ? '⏳ Отправка...' : '✏️ Изменить результат'}
                </button>
              );
            })()}
            {!openDispute && (tournamentDetail?.status === 'IN_PROGRESS' || tournamentDetail?.status === 'DISPUTED') && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-4 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 
                         text-red-400 text-sm font-semibold hover:bg-red-600/30 transition-colors"
              >
                ⚠️ Жалоба
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image preview bar */}
      {pendingImage && (
        <div className="shrink-0 px-4 py-2 bg-dark-300/90 border-t border-white/10 flex items-center gap-3">
          <img src={pendingImage} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-white/20" />
          <span className="text-xs text-white/60 flex-1">{imageError ? <span className="text-red-400">{imageError}</span> : 'Фото готово к отправке'}</span>
          <button onClick={handleCancelImage} className="text-xs text-red-400 hover:text-red-300 px-2 py-1">✕ Убрать</button>
          <button
            onClick={handleSendImage}
            disabled={sendingImage}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold disabled:opacity-50"
          >
            {sendingImage ? '⏳...' : '📤 Отправить'}
          </button>
        </div>
      )}

      {/* Input — sticky bottom (or read-only banner if completed) */}
      {isTournament && tournamentDetail?.status === 'COMPLETED' ? (
        <div className="shrink-0 px-4 py-3 bg-dark-300/95 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">🏆 Турнир завершён — чат закрыт</p>
        </div>
      ) : (
        <div className="shrink-0 px-4 py-3 bg-dark-300/95 backdrop-blur-lg border-t border-white/10">
          <div className="flex gap-2">
            {/* Image upload paperclip */}
            {isRealTournament && !pendingImage && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                  title="Прикрепить фото"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
              </>
            )}
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
      )}
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">💬</p>
        <p className="text-white/50">Выберите чат</p>
      </div>
    </div>
  );

  const filteredSidebarChats = sortedChats.filter(c => {
    if (chatFilter === 'all') return true;
    if (c.type === 'support') return true;
    if (chatFilter === 'active') return !c.isResultSubmitted;
    return !!c.isResultSubmitted; // completed
  });

  const filterItems: { id: ChatFilter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'active', label: 'Активные' },
    { id: 'completed', label: 'Завершённые' },
  ];

  /* ====== CHAT LIST SIDEBAR (desktop only) ====== */
  const chatListSidebar = (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="shrink-0 px-4 py-3 border-b border-white/10">
        <h2 className="text-lg font-bold text-white">Сообщения</h2>
      </div>

      {/* Filter Tabs */}
      <div className="shrink-0 flex gap-1.5 px-4 py-2 border-b border-white/5">
        {filterItems.map(f => (
          <button
            key={f.id}
            onClick={() => setChatFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              chatFilter === f.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-white/50 hover:text-white/70 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Chat List — scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredSidebarChats.map((c) => (
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

      {/* Result Modal — select winning team */}
      {showResultModal && activeMatch && tournamentDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-200 rounded-2xl border border-white/20 p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white text-center mb-2">🏆 Кто победил?</h3>
            <p className="text-xs text-white/50 text-center mb-2">Оба игрока должны отправить результат. Если результаты совпадают — автоматически засчитается.</p>
            {resultError && <p className="text-xs text-red-400 text-center mb-3">{resultError}</p>}

            <div className="space-y-3">
              {(() => {
                const myTeam = activeMatch.teamA?.id === userTeamId ? activeMatch.teamA : activeMatch.teamB;
                const opponentTeam = activeMatch.teamA?.id === userTeamId ? activeMatch.teamB : activeMatch.teamA;
                const opponentNames = opponentTeam?.players.map(p => p.user.username).join(', ') || 'Соперник';
                return (
                  <>
                    {myTeam && (
                      <button
                        onClick={() => handleSubmitWinner(myTeam.id)}
                        disabled={submittingResult}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 
                                 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        🏆 Я выиграл
                      </button>
                    )}
                    {opponentTeam && (
                      <button
                        onClick={() => handleSubmitWinner(opponentTeam.id)}
                        disabled={submittingResult}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 
                                 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        😔 {opponentNames} выиграл
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            <button
              onClick={() => { setShowResultModal(false); setResultError(''); }}
              className="w-full mt-4 py-2 text-white/50 text-sm hover:text-white/70 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
      {/* Dispute Filing Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-200 rounded-2xl border border-white/20 p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white text-center mb-2">⚠️ Подать жалобу</h3>
            <p className="text-xs text-white/50 text-center mb-4">Опишите проблему. Другая сторона увидит вашу жалобу и сможет ответить. Администратор рассмотрит спор.</p>
            {disputeError && <p className="text-xs text-red-400 text-center mb-3">{disputeError}</p>}

            {/* Target team selector for >2 teams */}
            {tournamentDetail && tournamentDetail.teamCount > 2 && (
              <div className="mb-3">
                <p className="text-xs text-white/60 mb-2">На кого жалоба?</p>
                <div className="space-y-1.5">
                  {tournamentDetail.teams
                    .filter(t => t.id !== userTeamId)
                    .map(t => (
                      <button
                        key={t.id}
                        onClick={() => setDisputeTargetTeamId(t.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                          disputeTargetTeamId === t.id
                            ? 'bg-red-600/20 border-red-500 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                        }`}
                      >
                        {t.players.map(p => p.user.username).join(', ')}
                        {disputeTargetTeamId === t.id && <span className="float-right text-red-400">✓</span>}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <textarea
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              placeholder="Причина жалобы (мин. 5 символов)..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 outline-none resize-none focus:border-red-500/50 transition-colors"
              rows={3}
            />

            <input
              type="url"
              value={disputeVideoUrl}
              onChange={e => setDisputeVideoUrl(e.target.value)}
              placeholder="🎥 Ссылка на видео (YouTube / Google Drive) — необязательно"
              className="w-full mt-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-blue-500/50 transition-colors"
            />

            <button
              onClick={handleFileDispute}
              disabled={disputeLoading || disputeReason.trim().length < 5}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 
                       text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {disputeLoading ? '⏳ Отправка...' : '📤 Отправить жалобу'}
            </button>

            <button
              onClick={() => { setShowDisputeModal(false); setDisputeError(''); setDisputeReason(''); setDisputeVideoUrl(''); }}
              className="w-full mt-2 py-2 text-white/50 text-sm hover:text-white/70 transition-colors"
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
