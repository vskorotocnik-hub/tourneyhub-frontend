import { apiFetch } from './base';

export interface SupportMessageItem {
  id: string;
  userId: string;
  content: string;
  isFromUser: boolean;
  isSystem: boolean;
  adminId: string | null;
  createdAt: string;
  user: { id: string; username: string; avatar: string | null };
}

export const supportApi = {
  getMessages: () =>
    apiFetch<{ messages: SupportMessageItem[] }>('/api/support/messages'),

  sendMessage: (content: string) =>
    apiFetch<SupportMessageItem>('/api/support/messages', { method: 'POST', body: { content } }),
};
