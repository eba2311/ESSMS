import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config';
import { verifyAccessToken } from '../utils/jwt.util';
import { logger } from '../utils/logger';

let io: Server | null = null;

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
};

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: config.allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyAccessToken(token as string);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.id;
    if (userId) {
      socket.join(`user:${userId}`);
      logger.debug(`Socket connected: user ${userId}`);
    }

    socket.on('disconnect', () => {
      if (userId) {
        logger.debug(`Socket disconnected: user ${userId}`);
      }
    });
  });

  logger.info('🔌 Socket.io initialised');
  return io;
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};
