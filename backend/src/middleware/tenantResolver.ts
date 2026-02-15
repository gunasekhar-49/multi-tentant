import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
    }
  }
}

export const tenantResolverMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract tenant from multiple sources (priority order):
    // 1. x-tenant-id header
    // 2. subdomain
    // 3. JWT token (decoded later in auth middleware)
    // 4. Query parameter (for webhooks/callbacks)

    let tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId && req.hostname) {
      const subdomain = req.hostname.split('.')[0];
      if (subdomain && !['www', 'api', 'app'].includes(subdomain)) {
        tenantId = subdomain;
      }
    }

    if (!tenantId && req.query.tenantId) {
      tenantId = req.query.tenantId as string;
    }

    if (tenantId) {
      req.tenantId = tenantId;
      logger.debug('Tenant resolved', {
        tenantId,
        method: req.method,
        path: req.path,
      });
    }

    next();
  } catch (error) {
    logger.error('Tenant resolver error', { error });
    res.status(400).json({
      error: 'Invalid tenant context',
      requestId: req.requestId,
    });
  }
};

export default tenantResolverMiddleware;
