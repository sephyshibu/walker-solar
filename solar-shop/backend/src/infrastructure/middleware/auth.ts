import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/entities/User';
import { AppError } from '../../shared/errors/AppError';
import { TokenService, TokenPayload } from '../services/TokenService';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = TokenService.verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Access token expired', 401);
      }
      throw new AppError('Invalid token', 401);
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError('Access denied', 403));
      return;
    }

    next();
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = TokenService.verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          role: decoded.role
        };
      } catch {
        // Token invalid, but that's okay for optional auth
      }
    }

    next();
  } catch (error) {
    // Token invalid, but that's okay for optional auth
    next();
  }
};
