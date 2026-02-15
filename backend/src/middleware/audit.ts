import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface AuditLog {
  id: string;
  requestId: string;
  tenantId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode: number;
  changes?: {
    before: any;
    after: any;
  };
  timestamp: Date;
  ip: string;
  userAgent: string;
}

// In production, this would write to a dedicated audit table
const auditLogs: AuditLog[] = [];

export const auditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Capture response send to log after response is sent
  const originalSend = res.send;

  res.send = function (data: any) {
    // Only audit write operations
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && req.user) {
      const auditLog: AuditLog = {
        id: `audit_${Date.now()}`,
        requestId: req.requestId,
        tenantId: req.tenantId,
        userId: req.user?.userId,
        action: req.method,
        resource: req.path.split('/')[1],
        resourceId: req.params.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        timestamp: new Date(),
        ip: req.ip || '',
        userAgent: req.get('user-agent') || '',
      };

      // Extract changes from body (before/after would need ORM support)
      if (req.body) {
        auditLog.changes = {
          before: req.body.before,
          after: req.body.after || req.body,
        };
      }

      auditLogs.push(auditLog);

      // Log audit event
      logger.info('Audit event', {
        ...auditLog,
        changes: auditLog.changes ? 'present' : 'none',
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

export const getAuditLogs = (filter?: {
  tenantId?: string;
  userId?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}): AuditLog[] => {
  let logs = auditLogs;

  if (filter?.tenantId) {
    logs = logs.filter((log) => log.tenantId === filter.tenantId);
  }

  if (filter?.userId) {
    logs = logs.filter((log) => log.userId === filter.userId);
  }

  if (filter?.resource) {
    logs = logs.filter((log) => log.resource === filter.resource);
  }

  if (filter?.startDate) {
    logs = logs.filter((log) => log.timestamp >= filter.startDate!);
  }

  if (filter?.endDate) {
    logs = logs.filter((log) => log.timestamp <= filter.endDate!);
  }

  return logs;
};

export default auditMiddleware;
