import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';

let io: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
  const env = getEnv();
  const allowedOrigins = env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/+$/, ''));

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Auth middleware — extract userId from JWT
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    // Join user's personal room for targeted events
    socket.join(`user:${userId}`);

    // Join tournament rooms
    socket.on('join:tournament', (tournamentId: string) => {
      if (typeof tournamentId === 'string' && tournamentId.length > 0) {
        socket.join(`tournament:${tournamentId}`);
      }
    });

    socket.on('leave:tournament', (tournamentId: string) => {
      if (typeof tournamentId === 'string') {
        socket.leave(`tournament:${tournamentId}`);
      }
    });

    socket.on('disconnect', () => {
      // Cleanup handled automatically by socket.io
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
}

export function getIO(): Server | null {
  return io;
}

// ─── Emit helpers ─────────────────────────────────────────────

/** New message in tournament chat */
export function emitNewMessage(tournamentId: string, message: any) {
  io?.to(`tournament:${tournamentId}`).emit('chat:message', { tournamentId, message });
}

/** Tournament status changed (started, completed, disputed, etc.) */
export function emitTournamentUpdate(tournamentId: string, data: any) {
  io?.to(`tournament:${tournamentId}`).emit('tournament:update', { tournamentId, ...data });
}

/** User balance changed */
export function emitBalanceUpdate(userId: string, balance: number, ucBalance: number) {
  io?.to(`user:${userId}`).emit('balance:update', { balance, ucBalance });
}

/** Tournament found / match started — notify all participants */
export function emitTournamentStarted(tournamentId: string, participantUserIds: string[]) {
  for (const uid of participantUserIds) {
    io?.to(`user:${uid}`).emit('tournament:started', { tournamentId });
  }
  io?.to(`tournament:${tournamentId}`).emit('tournament:update', { tournamentId, status: 'IN_PROGRESS' });
}

/** Unread count changed for a user */
export function emitUnreadUpdate(userId: string) {
  io?.to(`user:${userId}`).emit('unread:update', {});
}

/** Broadcast to ALL connected clients that the tournament list changed (create/join/leave/start/complete) */
export function emitGlobalTournamentChange() {
  io?.emit('tournaments:list_changed', {});
}
