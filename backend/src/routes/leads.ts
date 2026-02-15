import { Router, Request, Response } from 'express';
import { requireAuth, requireTenant } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateLead, handleValidationErrors } from '../middleware/validation';
import crmService from '../services/CRMService';
import activityService from '../services/ActivityService';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Middleware to ensure auth and tenant context
router.use(requireAuth, requireTenant);

// GET all leads
router.get('/', authorize('leads', 'read'), async (req: Request, res: Response) => {
  try {
    const { status, assignedTo, source, company, search, limit = 20, offset = 0 } = req.query;

    const { leads, total } = await crmService.getLeads(req.tenantId!, {
      status: status as string,
      assignedTo: assignedTo as string,
      source: source as string,
      company: company as string,
      search: search as string,
    });

    res.json({
      data: {
        leads,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total,
        },
      },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to fetch leads', { error });
    res.status(500).json({
      error: 'Failed to fetch leads',
      requestId: req.requestId,
    });
  }
});

// CREATE lead
router.post(
  '/',
  authorize('leads', 'write'),
  validateLead,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const lead = await crmService.createLead(
        {
          tenantId: req.tenantId!,
          ...req.body,
        },
        req.user!.userId
      );

      // Log activity
      await activityService.logActivity(
        {
          tenantId: req.tenantId!,
          type: 'note',
          subject: 'Lead created',
          description: `New lead created: ${lead.firstName} ${lead.lastName}`,
          relatedTo: { type: 'lead', id: lead.id },
        },
        req.user!.userId
      );

      res.status(201).json({
        data: { lead },
        requestId: req.requestId,
      });
    } catch (error: any) {
      logger.error('Failed to create lead', { error });
      res.status(400).json({
        error: error.message || 'Failed to create lead',
        requestId: req.requestId,
      });
    }
  }
);

// GET lead by ID
router.get('/:id', authorize('leads', 'read'), async (req: Request, res: Response) => {
  try {
    const lead = await crmService.getLeadById(req.tenantId!, req.params.id);

    if (!lead) {
      throw new AppError(404, 'Lead not found');
    }

    const { activities } = await activityService.getActivities(req.tenantId!, {
      relatedToType: 'lead',
      relatedToId: lead.id,
      limit: 10,
    });

    res.json({
      data: {
        lead,
        activities,
      },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to fetch lead', { error });
    const status = error.statusCode || 500;
    res.status(status).json({
      error: error.message || 'Failed to fetch lead',
      requestId: req.requestId,
    });
  }
});

// UPDATE lead
router.patch(
  '/:id',
  authorize('leads', 'write'),
  async (req: Request, res: Response) => {
    try {
      const lead = await crmService.updateLead(
        req.tenantId!,
        req.params.id,
        req.body,
        req.user!.userId
      );

      res.json({
        data: { lead },
        requestId: req.requestId,
      });
    } catch (error: any) {
      logger.error('Failed to update lead', { error });
      res.status(400).json({
        error: error.message || 'Failed to update lead',
        requestId: req.requestId,
      });
    }
  }
);

// DELETE lead
router.delete('/:id', authorize('leads', 'delete'), async (req: Request, res: Response) => {
  try {
    await crmService.deleteLead(req.tenantId!, req.params.id, req.user!.userId);

    res.json({
      data: { message: 'Lead deleted' },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to delete lead', { error });
    res.status(500).json({
      error: 'Failed to delete lead',
      requestId: req.requestId,
    });
  }
});

// BULK IMPORT leads
router.post(
  '/import/bulk',
  authorize('leads', 'write'),
  async (req: Request, res: Response) => {
    try {
      const { leads } = req.body;

      if (!Array.isArray(leads)) {
        throw new AppError(400, 'Leads must be an array');
      }

      const result = await crmService.bulkImportLeads(
        req.tenantId!,
        leads,
        req.user!.userId
      );

      res.json({
        data: {
          result,
          message: `Imported ${result.successful} leads, ${result.failed} failed`,
        },
        requestId: req.requestId,
      });
    } catch (error: any) {
      logger.error('Bulk import failed', { error });
      res.status(400).json({
        error: error.message || 'Bulk import failed',
        requestId: req.requestId,
      });
    }
  }
);

// EXPORT leads
router.get(
  '/export/csv',
  authorize('leads', 'export'),
  async (req: Request, res: Response) => {
    try {
      const { status, assignedTo, source } = req.query;

      const data = await crmService.exportLeads(req.tenantId!, {
        status,
        assignedTo,
        source,
      });

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((h) => JSON.stringify(row[h] || '')).join(',')
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
      res.send(csv);
    } catch (error: any) {
      logger.error('Export failed', { error });
      res.status(500).json({
        error: 'Export failed',
        requestId: req.requestId,
      });
    }
  }
);

export default router;
