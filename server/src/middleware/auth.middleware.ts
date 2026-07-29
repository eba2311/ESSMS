import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { User } from '../models';
import { ApiError } from './errorHandler';
import { UserRole } from '../types';
import { 
  PermissionCategory, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions 
} from '../config/permissions';
import { AuditLog } from '../models';

// Extend Express Request interface to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    role: UserRole;
  };
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User no longer exists or is inactive');
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      userId: decoded.userId,
      role: user.role, // Use role from DB to avoid stale token issues
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof Error) {
      next(new ApiError(401, error.message));
    } else {
      next(new ApiError(401, 'Authentication failed'));
    }
  }
};

/**
 * Middleware to check if user has required role
 * Basic role-based authorization
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      if (!allowedRoles.includes(req.user.role)) {
        // Log access denial (Req 1.10)
        await AuditLog.create({
          userId: req.user.id,
          activityType: 'ACCESS_DENIED',
          description: `Access denied: User with role ${req.user.role} attempted to access resource requiring roles: ${allowedRoles.join(', ')}`,
          ipAddress: req.ip,
          metadata: {
            requestedPath: req.path,
            requestedMethod: req.method,
            requiredRoles: allowedRoles,
            userRole: req.user.role,
          },
        });

        throw new ApiError(403, `Insufficient permissions. Your role: '${req.user.role}', Allowed: '${allowedRoles.join(', ')}'`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has specific permission
 * Feature-level authorization (Req 1.2)
 */
export const requirePermission = (...permissions: PermissionCategory[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      // Check if user has at least one of the required permissions
      const hasAccess = permissions.some((permission) =>
        hasPermission(req.user!.role, permission)
      );

      if (!hasAccess) {
        // Log access denial (Req 1.10)
        await AuditLog.create({
          userId: req.user.id,
          activityType: 'ACCESS_DENIED',
          description: `Access denied: User with role ${req.user.role} attempted to access resource requiring permissions: ${permissions.join(', ')}`,
          ipAddress: req.ip,
          metadata: {
            requestedPath: req.path,
            requestedMethod: req.method,
            requiredPermissions: permissions,
            userRole: req.user.role,
          },
        });

        throw new ApiError(403, 'Insufficient permissions for this operation');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ANY of the specified permissions
 */
export const requireAnyPermission = (...permissions: PermissionCategory[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const hasAccess = hasAnyPermission(req.user.role, permissions);

      if (!hasAccess) {
        await AuditLog.create({
          userId: req.user.id,
          activityType: 'ACCESS_DENIED',
          description: `Access denied: User requires at least one of: ${permissions.join(', ')}`,
          ipAddress: req.ip,
          metadata: {
            requestedPath: req.path,
            requestedMethod: req.method,
            requiredPermissions: permissions,
            userRole: req.user.role,
          },
        });

        throw new ApiError(403, 'Insufficient permissions for this operation');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ALL of the specified permissions
 */
export const requireAllPermissions = (...permissions: PermissionCategory[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      const hasAccess = hasAllPermissions(req.user.role, permissions);

      if (!hasAccess) {
        await AuditLog.create({
          userId: req.user.id,
          activityType: 'ACCESS_DENIED',
          description: `Access denied: User requires all of: ${permissions.join(', ')}`,
          ipAddress: req.ip,
          metadata: {
            requestedPath: req.path,
            requestedMethod: req.method,
            requiredPermissions: permissions,
            userRole: req.user.role,
          },
        });

        throw new ApiError(403, 'Insufficient permissions for this operation');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check permission in controller/service logic
 * For use outside middleware
 */
export const checkPermission = (
  role: UserRole,
  permission: PermissionCategory
): boolean => {
  return hasPermission(role, permission);
};

// Re-export permission utilities for convenience
export { PermissionCategory, hasPermission, hasAnyPermission, hasAllPermissions } from '../config/permissions';


/**
 * Optional authentication - doesn't throw error if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = {
          id: decoded.id,
          userId: decoded.userId,
          role: user.role, // Use role from DB
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};
