import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import logger from '../utils/logger';

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      token?: string;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Allow unauthenticated requests to proceed (checked at route level)
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
      req.user = decoded;
      req.token = token;

      // Verify tenant match if tenant is already resolved
      if (req.tenantId && req.tenantId !== decoded.tenantId) {
        logger.warn('Tenant mismatch detected', {
          requestId: req.requestId,
          tokenTenant: decoded.tenantId,
          resolvedTenant: req.tenantId,
        });
        return res.status(403).json({
          error: 'Tenant mismatch',
          requestId: req.requestId,
        });
      }

      // Update tenant context from token if not already set
      if (!req.tenantId) {
        req.tenantId = decoded.tenantId;
      }

      logger.debug('User authenticated', {
        requestId: req.requestId,
        userId: decoded.userId,
        tenantId: decoded.tenantId,
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          requestId: req.requestId,
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          requestId: req.requestId,
        });
      }
      throw error;
    }

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({
      error: 'Authentication error',
      requestId: req.requestId,
    });
  }
};

// Middleware to require authentication
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      requestId: req.requestId,
    });
  }
  next();
};

// Middleware to require tenant context
export const requireTenant = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.tenantId) {
    return res.status(400).json({
      error: 'Tenant context required',
      requestId: req.requestId,
    });
  }
  next();
};

export default authMiddleware;
