import { memo } from 'react';
import type { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string;
}

const MessageBubble = memo(({ message, currentUserId }: MessageBubbleProps) => {
  const isMe = currentUserId ? message.senderId === currentUserId : message.senderId === 'me';
  const isSystem = message.type === 'system';
  const isAdmin = message.type === 'admin';
  const isSupport = message.type === 'support';

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 max-w-[85%]">
          <p className="text-xs text-white/80 text-center whitespace-pre-line">{message.content}</p>
          <p className="text-xs text-white/40 text-center mt-1">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    );
  }

  if (isAdmin || message.isRule) {
    return (
      <div className="flex justify-start my-2">
        <div className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 backdrop-blur-sm 
                      rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%] border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">👑</span>
            <span className="text-xs font-semibold text-yellow-400">Администратор</span>
          </div>
          <p className="text-sm text-white whitespace-pre-line">{message.content}</p>
          <p className="text-xs text-yellow-400/40 mt-2">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    );
  }

  if (isSupport) {
    return (
      <div className="flex justify-start my-2">
        <div className="flex gap-2 max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 
                        flex items-center justify-center text-sm shrink-0">
            🎧
          </div>
          <div className="bg-dark-200/80 backdrop-blur-sm rounded-2xl rounded-tl-md px-4 py-2 
                        border border-emerald-500/30">
            <p className="text-xs font-semibold text-emerald-400 mb-1">{message.senderName}</p>
            <p className="text-sm text-white">{message.content}</p>
            <p className="text-xs text-white/40 mt-1">{formatTime(message.timestamp)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isMe) {
    return (
      <div className="flex justify-end my-2">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 
                      rounded-2xl rounded-tr-md px-4 py-2 max-w-[75%]">
          {message.imageUrl && (
            <img src={message.imageUrl} alt="" className="rounded-lg max-w-full max-h-60 mb-1.5 cursor-pointer" 
                 onClick={() => window.open(message.imageUrl, '_blank')} />
          )}
          {message.content && <p className="text-sm text-white">{message.content}</p>}
          <p className="text-xs text-white/60 mt-1 text-right">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start my-2">
      <div className="flex gap-2 max-w-[75%]">
        {message.senderAvatar && (
          <img 
            src={message.senderAvatar} 
            alt={message.senderName}
            className="w-8 h-8 rounded-full border border-white/20 shrink-0"
          />
        )}
        <div className="bg-dark-200/80 backdrop-blur-sm rounded-2xl rounded-tl-md px-4 py-2 
                      border border-white/10">
          <p className="text-xs font-semibold text-white/70 mb-1">{message.senderName}</p>
          {message.imageUrl && (
            <img src={message.imageUrl} alt="" className="rounded-lg max-w-full max-h-60 mb-1.5 cursor-pointer" 
                 onClick={() => window.open(message.imageUrl, '_blank')} />
          )}
          {message.content && <p className="text-sm text-white">{message.content}</p>}
          <p className="text-xs text-white/40 mt-1">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
