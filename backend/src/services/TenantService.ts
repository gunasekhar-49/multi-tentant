import { v4 as uuidv4 } from 'uuid';
import { Tenant, User, Role } from '../models';
import logger from '../utils/logger';

export interface CreateTenantPayload {
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

export class TenantService {
  async createTenant(payload: CreateTenantPayload): Promise<Tenant> {
    try {
      // Check if slug already exists
      const existing = await Tenant.query().where('slug', payload.slug).first();
      if (existing) {
        throw new Error('Slug already in use');
      }

      const tenantId = uuidv4();

      // Create tenant
      const tenant = await Tenant.query().insert({
        id: tenantId,
        slug: payload.slug,
        name: payload.name,
        plan: payload.plan,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      });

      // Create default roles
      await this.createDefaultRoles(tenantId);

      logger.info('Tenant created', {
        tenantId: tenant.id,
        slug: payload.slug,
        plan: payload.plan,
      });

      return tenant;
    } catch (error) {
      logger.error('Failed to create tenant', { error, payload });
      throw error;
    }
  }

  private async createDefaultRoles(tenantId: string): Promise<void> {
    const defaultRoles = [
      {
        id: uuidv4(),
        tenantId,
        name: 'Tenant Admin',
        description: 'Full access to tenant',
        permissions: ['*'],
        isSystem: true,
      },
      {
        id: uuidv4(),
        tenantId,
        name: 'Manager',
        description: 'Can manage team and reports',
        permissions: ['leads:*', 'contacts:*', 'deals:*', 'tasks:*', 'reports:read'],
        isSystem: true,
      },
      {
        id: uuidv4(),
        tenantId,
        name: 'Sales User',
        description: 'Can manage sales pipeline',
        permissions: ['leads:*', 'contacts:*', 'deals:*', 'tasks:*', 'activities:*'],
        isSystem: true,
      },
      {
        id: uuidv4(),
        tenantId,
        name: 'Support User',
        description: 'Can manage support tickets',
        permissions: ['contacts:read', 'tickets:*', 'activities:*'],
        isSystem: true,
      },
      {
        id: uuidv4(),
        tenantId,
        name: 'Read Only',
        description: 'View only access',
        permissions: ['leads:read', 'contacts:read', 'deals:read', 'accounts:read'],
        isSystem: true,
      },
    ];

    await Role.query().insert(defaultRoles);
  }

  async getTenant(tenantId: string): Promise<Tenant | undefined> {
    return Tenant.query()
      .findById(tenantId)
      .withGraphFetched('[users, roles]');
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    return Tenant.query()
      .where('slug', slug)
      .first()
      .withGraphFetched('[users, roles]');
  }

  async updateTenant(
    tenantId: string,
    updates: Partial<Tenant>,
    updatedBy: string
  ): Promise<Tenant> {
    try {
      const tenant = await Tenant.query()
        .findById(tenantId)
        .patch({
          ...updates,
          updatedAt: new Date(),
          updatedBy,
        });

      logger.info('Tenant updated', {
        tenantId,
        updatedBy,
        changes: Object.keys(updates),
      });

      return tenant;
    } catch (error) {
      logger.error('Failed to update tenant', { error });
      throw error;
    }
  }

  async getUserCount(tenantId: string): Promise<number> {
    return User.query()
      .where('tenantId', tenantId)
      .where('status', 'active')
      .resultSize();
  }

  async suspendTenant(tenantId: string, reason?: string): Promise<void> {
    try {
      await Tenant.query()
        .findById(tenantId)
        .patch({
          status: 'suspended',
          updatedAt: new Date(),
          updatedBy: 'system',
        });

      logger.warn('Tenant suspended', {
        tenantId,
        reason,
      });
    } catch (error) {
      logger.error('Failed to suspend tenant', { error });
      throw error;
    }
  }

  async getRoles(tenantId: string): Promise<Role[]> {
    return Role.query().where('tenantId', tenantId);
  }

  async getAdminRole(tenantId: string): Promise<Role | undefined> {
    return Role.query()
      .where('tenantId', tenantId)
      .where('name', 'Tenant Admin')
      .first();
  }
}

export default new TenantService();
