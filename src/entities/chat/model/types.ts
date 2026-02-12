/**
 * Chat entity types
 */

export type ChatType = 'tournament' | 'support';
export type MessageType = 'user' | 'admin' | 'system' | 'support';
export type MatchResult = 'win' | 'lose' | 'dispute' | null;

export interface ChatMessage {
  id: string;
  chatId: string;
  type: MessageType;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRule?: boolean;
}

export interface Chat {
  id: string;
  type: ChatType;
  title: string;
  subtitle?: string;
  image?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  participants?: number;
  tournamentId?: string;
  gameId?: string;
  matchResult?: MatchResult;
  isResultSubmitted?: boolean;
}
