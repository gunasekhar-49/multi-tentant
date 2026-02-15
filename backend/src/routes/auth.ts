import { Router, Request, Response } from 'express';
import { validateLogin, validateRegister, handleValidationErrors } from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimiter';
import identityService from '../services/IdentityService';
import tenantService from '../services/TenantService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { requireAuth, requireTenant } from '../middleware/auth';

const router = Router();

// Register new tenant
router.post('/register', validateRegister, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, company } = req.body;

    // Create tenant
    const tenant = await tenantService.createTenant({
      name: company || `${firstName}'s Company`,
      slug: email.split('@')[0].toLowerCase(),
      plan: 'free',
      adminEmail: email,
      adminPassword: password,
      adminFirstName: firstName,
      adminLastName: lastName,
    });

    // Get admin role
    const adminRole = await tenantService.getAdminRole(tenant.id);
    if (!adminRole) {
      throw new Error('Admin role not created');
    }

    // Create admin user
    const user = await identityService.createUser({
      tenantId: tenant.id,
      email,
      password,
      firstName,
      lastName,
      roleId: adminRole.id,
    });

    const tokens = identityService.generateTokens({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: 'tenant_admin',
    });

    res.status(201).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
        },
        tokens,
      },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Registration failed', { error });
    res.status(400).json({
      error: error.message || 'Registration failed',
      requestId: req.requestId,
    });
  }
});

// Login
router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password, tenantId } = req.body;

      if (!tenantId) {
        throw new AppError(400, 'Tenant ID is required');
      }

      const { user, tokens } = await identityService.authenticateUser({
        email,
        password,
        tenantId,
      });

      res.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          tokens,
        },
        requestId: req.requestId,
      });
    } catch (error: any) {
      logger.error('Login failed', { error });
      res.status(401).json({
        error: error.message || 'Login failed',
        requestId: req.requestId,
      });
    }
  }
);

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'Refresh token is required');
    }

    const accessToken = await identityService.refreshAccessToken(refreshToken);

    res.json({
      data: { accessToken },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Token refresh failed', { error });
    res.status(401).json({
      error: 'Invalid refresh token',
      requestId: req.requestId,
    });
  }
});

// Logout
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user) {
      await identityService.revokeToken(req.user.userId);
    }

    res.json({
      data: { message: 'Logged out successfully' },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Logout failed', { error });
    res.status(500).json({
      error: 'Logout failed',
      requestId: req.requestId,
    });
  }
});

// Get current user
router.get('/me', requireAuth, requireTenant, (req: Request, res: Response) => {
  try {
    res.json({
      data: {
        user: req.user,
        tenantId: req.tenantId,
      },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to get current user', { error });
    res.status(500).json({
      error: 'Failed to get current user',
      requestId: req.requestId,
    });
  }
});

export default router;
