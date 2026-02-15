import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Idempotency key storage (in production, use Redis with TTL)
const idempotencyMap = new Map<string, { statusCode: number; data: any }>();

export const idempotencyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only apply to write operations
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    return next();
  }

  // Check if we've already processed this request
  const cached = idempotencyMap.get(idempotencyKey);
  if (cached) {
    logger.info('Idempotency: Replaying cached response', {
      requestId: req.requestId,
      idempotencyKey,
    });

    return res.status(cached.statusCode).json(cached.data);
  }

  // Capture response to cache it
  const originalSend = res.send;

  res.send = function (data: any) {
    // Only cache successful responses
    if (res.statusCode < 400) {
      idempotencyMap.set(idempotencyKey, {
        statusCode: res.statusCode,
        data: typeof data === 'string' ? JSON.parse(data) : data,
      });

      // Set TTL (24 hours) - in production, use Redis with expiry
      setTimeout(() => {
        idempotencyMap.delete(idempotencyKey);
      }, 24 * 60 * 60 * 1000);
    }

    return originalSend.call(this, data);
  };

  next();
};

export default idempotencyMiddleware;
