import { Router, Request, Response } from 'express';
import { requireAuth, requireTenant } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Account } from '../models';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(requireAuth, requireTenant);

// GET all accounts
router.get('/', authorize('accounts', 'read'), async (req: Request, res: Response) => {
  try {
    const { status, search, limit = 20, offset = 0 } = req.query;

    let query = Account.query().where('tenantId', req.tenantId!);

    if (status) {
      query = query.where('status', status);
    }

    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    const total = await query.clone().resultSize();

    const accounts = await query
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy('createdAt', 'desc');

    res.json({
      data: {
        accounts,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total,
        },
      },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to fetch accounts', { error });
    res.status(500).json({
      error: 'Failed to fetch accounts',
      requestId: req.requestId,
    });
  }
});

// CREATE account
router.post('/', authorize('accounts', 'write'), async (req: Request, res: Response) => {
  try {
    const account = await Account.query().insert({
      id: uuidv4(),
      tenantId: req.tenantId!,
      name: req.body.name,
      industry: req.body.industry,
      website: req.body.website,
      employees: req.body.employees,
      annualRevenue: req.body.annualRevenue,
      status: req.body.status || 'prospect',
      notes: req.body.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user!.userId,
      updatedBy: req.user!.userId,
    });

    res.status(201).json({
      data: { account },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to create account', { error });
    res.status(400).json({
      error: error.message || 'Failed to create account',
      requestId: req.requestId,
    });
  }
});

// GET account by ID
router.get('/:id', authorize('accounts', 'read'), async (req: Request, res: Response) => {
  try {
    const account = await Account.query()
      .where('tenantId', req.tenantId!)
      .findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        requestId: req.requestId,
      });
    }

    res.json({
      data: { account },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to fetch account', { error });
    res.status(500).json({
      error: 'Failed to fetch account',
      requestId: req.requestId,
    });
  }
});

// UPDATE account
router.patch('/:id', authorize('accounts', 'write'), async (req: Request, res: Response) => {
  try {
    const account = await Account.query()
      .where('tenantId', req.tenantId!)
      .findById(req.params.id)
      .patch({
        ...req.body,
        updatedAt: new Date(),
        updatedBy: req.user!.userId,
      });

    res.json({
      data: { account },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to update account', { error });
    res.status(500).json({
      error: 'Failed to update account',
      requestId: req.requestId,
    });
  }
});

// DELETE account
router.delete('/:id', authorize('accounts', 'delete'), async (req: Request, res: Response) => {
  try {
    await Account.query()
      .where('tenantId', req.tenantId!)
      .deleteById(req.params.id);

    res.json({
      data: { message: 'Account deleted' },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to delete account', { error });
    res.status(500).json({
      error: 'Failed to delete account',
      requestId: req.requestId,
    });
  }
});

export default router;
