import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { createRequestContext } from '../utils/context';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.requestId = requestId;
  req.startTime = Date.now();

  createRequestContext();

  res.setHeader('x-request-id', requestId);

  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - req.startTime;
    logger.info('HTTP Request', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
    return originalSend.call(this, data);
  };

  next();
};

export default requestIdMiddleware;
