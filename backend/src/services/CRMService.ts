import { v4 as uuidv4 } from 'uuid';
import { Lead } from '../models';
import logger from '../utils/logger';

export interface CreateLeadPayload {
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  source: string;
  score?: number;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface UpdateLeadPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source?: string;
  assignedTo?: string;
  score?: number;
  notes?: string;
  customFields?: Record<string, any>;
}

export class CRMService {
  // LEAD OPERATIONS
  async createLead(payload: CreateLeadPayload, createdBy: string): Promise<Lead> {
    try {
      const lead = await Lead.query().insert({
        id: uuidv4(),
        tenantId: payload.tenantId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        company: payload.company,
        industry: payload.industry,
        source: payload.source,
        status: 'new',
        score: payload.score || 0,
        notes: payload.notes,
        customFields: payload.customFields,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        updatedBy: createdBy,
      });

      logger.info('Lead created', {
        leadId: lead.id,
        tenantId: payload.tenantId,
        createdBy,
      });

      return lead;
    } catch (error) {
      logger.error('Failed to create lead', { error });
      throw error;
    }
  }

  async getLeads(
    tenantId: string,
    filters?: {
      status?: string;
      assignedTo?: string;
      source?: string;
      company?: string;
      search?: string;
    },
    pagination?: { limit?: number; offset?: number }
  ): Promise<{ leads: Lead[]; total: number }> {
    try {
      let query = Lead.query().where('tenantId', tenantId);

      if (filters?.status) query = query.where('status', filters.status);
      if (filters?.assignedTo) query = query.where('assignedTo', filters.assignedTo);
      if (filters?.source) query = query.where('source', filters.source);
      if (filters?.company) query = query.where('company', 'ilike', `%${filters.company}%`);
      if (filters?.search) {
        query = query.where((qb) => {
          qb.where('firstName', 'ilike', `%${filters.search}%`)
            .orWhere('lastName', 'ilike', `%${filters.search}%`)
            .orWhere('email', 'ilike', `%${filters.search}%`)
            .orWhere('company', 'ilike', `%${filters.search}%`);
        });
      }

      const total = await query.clone().resultSize();

      if (pagination?.limit) {
        query = query.limit(pagination.limit);
        if (pagination.offset) query = query.offset(pagination.offset);
      }

      const leads = await query.orderBy('createdAt', 'desc');

      return { leads, total };
    } catch (error) {
      logger.error('Failed to fetch leads', { error });
      throw error;
    }
  }

  async getLeadById(tenantId: string, leadId: string): Promise<Lead | undefined> {
    return Lead.query()
      .where('tenantId', tenantId)
      .findById(leadId);
  }

  async updateLead(
    tenantId: string,
    leadId: string,
    updates: UpdateLeadPayload,
    updatedBy: string
  ): Promise<Lead> {
    try {
      const lead = await Lead.query()
        .where('tenantId', tenantId)
        .findById(leadId)
        .patch({
          ...updates,
          updatedAt: new Date(),
          updatedBy,
        });

      logger.info('Lead updated', {
        leadId,
        tenantId,
        updatedBy,
      });

      return lead;
    } catch (error) {
      logger.error('Failed to update lead', { error });
      throw error;
    }
  }

  async deleteLead(tenantId: string, leadId: string, deletedBy: string): Promise<void> {
    try {
      await Lead.query()
        .where('tenantId', tenantId)
        .deleteById(leadId);

      logger.info('Lead deleted', {
        leadId,
        tenantId,
        deletedBy,
      });
    } catch (error) {
      logger.error('Failed to delete lead', { error });
      throw error;
    }
  }

  async bulkImportLeads(
    tenantId: string,
    leads: CreateLeadPayload[],
    createdBy: string
  ): Promise<{ successful: number; failed: number; errors: any[] }> {
    const results = { successful: 0, failed: 0, errors: [] as any[] };

    try {
      for (const leadData of leads) {
        try {
          await this.createLead(leadData, createdBy);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            lead: leadData,
            error: (error as any).message,
          });
        }
      }

      logger.info('Bulk import completed', {
        tenantId,
        successful: results.successful,
        failed: results.failed,
      });

      return results;
    } catch (error) {
      logger.error('Bulk import failed', { error });
      throw error;
    }
  }

  async exportLeads(
    tenantId: string,
    filters?: any
  ): Promise<any[]> {
    try {
      const { leads } = await this.getLeads(tenantId, filters);
      return leads.map((lead) => ({
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        industry: lead.industry,
        status: lead.status,
        source: lead.source,
        score: lead.score,
        createdAt: lead.createdAt,
      }));
    } catch (error) {
      logger.error('Export failed', { error });
      throw error;
    }
  }
}

export default new CRMService();
