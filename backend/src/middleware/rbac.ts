import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'export' | 'share' | 'admin';
}

type UserRole = 'super_admin' | 'tenant_admin' | 'manager' | 'sales_user' | 'support_user' | 'api_client' | 'read_only';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    { resource: '*', action: 'read' },
    { resource: '*', action: 'write' },
    { resource: '*', action: 'delete' },
    { resource: '*', action: 'export' },
    { resource: '*', action: 'share' },
    { resource: '*', action: 'admin' },
  ],
  tenant_admin: [
    { resource: '*', action: 'read' },
    { resource: '*', action: 'write' },
    { resource: '*', action: 'delete' },
    { resource: '*', action: 'export' },
    { resource: '*', action: 'share' },
    { resource: 'settings', action: 'admin' },
    { resource: 'users', action: 'admin' },
    { resource: 'roles', action: 'admin' },
  ],
  manager: [
    { resource: 'leads', action: 'read' },
    { resource: 'leads', action: 'write' },
    { resource: 'contacts', action: 'read' },
    { resource: 'contacts', action: 'write' },
    { resource: 'accounts', action: 'read' },
    { resource: 'accounts', action: 'write' },
    { resource: 'deals', action: 'read' },
    { resource: 'deals', action: 'write' },
    { resource: 'tasks', action: 'read' },
    { resource: 'tasks', action: 'write' },
    { resource: 'reports', action: 'read' },
    { resource: 'activities', action: 'read' },
  ],
  sales_user: [
    { resource: 'leads', action: 'read' },
    { resource: 'leads', action: 'write' },
    { resource: 'contacts', action: 'read' },
    { resource: 'contacts', action: 'write' },
    { resource: 'accounts', action: 'read' },
    { resource: 'deals', action: 'read' },
    { resource: 'deals', action: 'write' },
    { resource: 'tasks', action: 'read' },
    { resource: 'tasks', action: 'write' },
    { resource: 'activities', action: 'read' },
  ],
  support_user: [
    { resource: 'contacts', action: 'read' },
    { resource: 'contacts', action: 'write' },
    { resource: 'tickets', action: 'read' },
    { resource: 'tickets', action: 'write' },
    { resource: 'activities', action: 'read' },
  ],
  api_client: [
    { resource: 'leads', action: 'read' },
    { resource: 'leads', action: 'write' },
    { resource: 'contacts', action: 'read' },
    { resource: 'contacts', action: 'write' },
    { resource: 'accounts', action: 'read' },
  ],
  read_only: [
    { resource: 'leads', action: 'read' },
    { resource: 'contacts', action: 'read' },
    { resource: 'accounts', action: 'read' },
    { resource: 'deals', action: 'read' },
    { resource: 'reports', action: 'read' },
  ],
};

export const rbacMiddleware = (
  requiredResource?: string,
  requiredAction?: 'read' | 'write' | 'delete' | 'export' | 'share' | 'admin'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Skip RBAC check for unauthenticated requests
      if (!req.user) {
        return next();
      }

      // If no specific permission required, just continue
      if (!requiredResource || !requiredAction) {
        return next();
      }

      const userRole = req.user.role as UserRole;
      const permissions = ROLE_PERMISSIONS[userRole];

      if (!permissions) {
        logger.warn('Unknown user role', {
          requestId: req.requestId,
          role: userRole,
        });
        return res.status(403).json({
          error: 'Insufficient permissions',
          requestId: req.requestId,
        });
      }

      // Check if user has required permission
      const hasPermission = permissions.some(
        (p) =>
          (p.resource === '*' || p.resource === requiredResource) &&
          p.action === requiredAction
      );

      if (!hasPermission) {
        logger.warn('Permission denied', {
          requestId: req.requestId,
          userId: req.user.userId,
          resource: requiredResource,
          action: requiredAction,
          role: userRole,
        });

        return res.status(403).json({
          error: 'Insufficient permissions',
          requestId: req.requestId,
        });
      }

      next();
    } catch (error) {
      logger.error('RBAC middleware error', { error });
      res.status(500).json({
        error: 'Authorization error',
        requestId: req.requestId,
      });
    }
  };
};

export const authorize = (resource: string, action: 'read' | 'write' | 'delete' | 'export' | 'share' | 'admin') => {
  return rbacMiddleware(resource, action);
};

export default rbacMiddleware;
