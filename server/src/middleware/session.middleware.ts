import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { config } from '../config';
import { ApiError } from './errorHandler';

// Store for tracking active sessions (in production, use Redis)
const activeSessions = new Map<string, { token: string; lastActivity: Date }>();

/**
 * Middleware to enforce single session per user
 */
export const enforceSingleSession = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      next();
      return;
    }

    const token = req.headers.authorization?.substring(7);
    if (!token) {
      next();
      return;
    }

    const userId = req.user.id;
    const existingSession = activeSessions.get(userId);

    // If user has an existing session with a different token, terminate old session
    if (existingSession && existingSession.token !== token) {
      activeSessions.delete(userId);
    }

    // Register current session
    activeSessions.set(userId, {
      token,
      lastActivity: new Date(),
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check session timeout
 */
export const checkSessionTimeout = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      next();
      return;
    }

    const userId = req.user.id;
    const session = activeSessions.get(userId);

    if (session) {
      const inactiveMinutes =
        (new Date().getTime() - session.lastActivity.getTime()) / 1000 / 60;

      if (inactiveMinutes > config.sessionTimeoutMinutes) {
        // Session expired due to inactivity
        activeSessions.delete(userId);
        throw new ApiError(401, 'Session expired due to inactivity');
      }

      // Update last activity
      session.lastActivity = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate user session
 */
export const terminateSession = (userId: string): void => {
  activeSessions.delete(userId);
};

/**
 * Get active sessions count
 */
export const getActiveSessionsCount = (): number => {
  return activeSessions.size;
};
