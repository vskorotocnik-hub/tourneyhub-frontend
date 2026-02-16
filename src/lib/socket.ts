import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] connect error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function joinTournament(tournamentId: string) {
  socket?.emit('join:tournament', tournamentId);
}

export function leaveTournament(tournamentId: string) {
  socket?.emit('leave:tournament', tournamentId);
}
