import { Router, Request, Response } from 'express';
import { requireAuth, requireTenant } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Deal } from '../models';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(requireAuth, requireTenant);

// GET all deals
router.get('/', authorize('deals', 'read'), async (req: Request, res: Response) => {
  try {
    const { stage, assignedTo, search, limit = 20, offset = 0 } = req.query;

    let query = Deal.query().where('tenantId', req.tenantId!);

    if (stage) {
      query = query.where('stage', stage);
    }

    if (assignedTo) {
      query = query.where('assignedTo', assignedTo);
    }

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    const total = await query.clone().resultSize();

    const deals = await query
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy('createdAt', 'desc');

    res.json({
      data: {
        deals,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total,
        },
      },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to fetch deals', { error });
    res.status(500).json({
      error: 'Failed to fetch deals',
      requestId: req.requestId,
    });
  }
});

// CREATE deal
router.post('/', authorize('deals', 'write'), async (req: Request, res: Response) => {
  try {
    const deal = await Deal.query().insert({
      id: uuidv4(),
      tenantId: req.tenantId!,
      name: req.body.name,
      accountId: req.body.accountId,
      value: req.body.value,
      currency: req.body.currency || 'USD',
      stage: req.body.stage,
      probability: req.body.probability,
      expectedCloseDate: req.body.expectedCloseDate,
      assignedTo: req.body.assignedTo,
      notes: req.body.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user!.userId,
      updatedBy: req.user!.userId,
    });

    res.status(201).json({
      data: { deal },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to create deal', { error });
    res.status(400).json({
      error: error.message || 'Failed to create deal',
      requestId: req.requestId,
    });
  }
});

// GET deal by ID
router.get('/:id', authorize('deals', 'read'), async (req: Request, res: Response) => {
  try {
    const deal = await Deal.query()
      .where('tenantId', req.tenantId!)
      .findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found',
        requestId: req.requestId,
      });
    }

    res.json({
      data: { deal },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to fetch deal', { error });
    res.status(500).json({
      error: 'Failed to fetch deal',
      requestId: req.requestId,
    });
  }
});

// UPDATE deal
router.patch('/:id', authorize('deals', 'write'), async (req: Request, res: Response) => {
  try {
    const deal = await Deal.query()
      .where('tenantId', req.tenantId!)
      .findById(req.params.id)
      .patch({
        ...req.body,
        updatedAt: new Date(),
        updatedBy: req.user!.userId,
      });

    res.json({
      data: { deal },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to update deal', { error });
    res.status(500).json({
      error: 'Failed to update deal',
      requestId: req.requestId,
    });
  }
});

// DELETE deal
router.delete('/:id', authorize('deals', 'delete'), async (req: Request, res: Response) => {
  try {
    await Deal.query()
      .where('tenantId', req.tenantId!)
      .deleteById(req.params.id);

    res.json({
      data: { message: 'Deal deleted' },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to delete deal', { error });
    res.status(500).json({
      error: 'Failed to delete deal',
      requestId: req.requestId,
    });
  }
});

export default router;
