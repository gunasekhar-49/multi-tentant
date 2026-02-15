import { Router, Request, Response } from 'express';
import { requireAuth, requireTenant } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Contact } from '../models';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(requireAuth, requireTenant);

// GET all contacts
router.get('/', authorize('contacts', 'read'), async (req: Request, res: Response) => {
  try {
    const { accountId, search, limit = 20, offset = 0 } = req.query;

    let query = Contact.query().where('tenantId', req.tenantId!);

    if (accountId) {
      query = query.where('accountId', accountId);
    }

    if (search) {
      query = query.where((qb) => {
        qb.where('firstName', 'ilike', `%${search}%`)
          .orWhere('lastName', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
      });
    }

    const total = await query.clone().resultSize();

    const contacts = await query
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy('createdAt', 'desc');

    res.json({
      data: {
        contacts,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total,
        },
      },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to fetch contacts', { error });
    res.status(500).json({
      error: 'Failed to fetch contacts',
      requestId: req.requestId,
    });
  }
});

// CREATE contact
router.post('/', authorize('contacts', 'write'), async (req: Request, res: Response) => {
  try {
    const contact = await Contact.query().insert({
      id: uuidv4(),
      tenantId: req.tenantId!,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      title: req.body.title,
      company: req.body.company,
      accountId: req.body.accountId,
      notes: req.body.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user!.userId,
      updatedBy: req.user!.userId,
    });

    res.status(201).json({
      data: { contact },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to create contact', { error });
    res.status(400).json({
      error: error.message || 'Failed to create contact',
      requestId: req.requestId,
    });
  }
});

// GET contact by ID
router.get('/:id', authorize('contacts', 'read'), async (req: Request, res: Response) => {
  try {
    const contact = await Contact.query()
      .where('tenantId', req.tenantId!)
      .findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        error: 'Contact not found',
        requestId: req.requestId,
      });
    }

    res.json({
      data: { contact },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to fetch contact', { error });
    res.status(500).json({
      error: 'Failed to fetch contact',
      requestId: req.requestId,
    });
  }
});

// UPDATE contact
router.patch('/:id', authorize('contacts', 'write'), async (req: Request, res: Response) => {
  try {
    const contact = await Contact.query()
      .where('tenantId', req.tenantId!)
      .findById(req.params.id)
      .patch({
        ...req.body,
        updatedAt: new Date(),
        updatedBy: req.user!.userId,
      });

    res.json({
      data: { contact },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to update contact', { error });
    res.status(500).json({
      error: 'Failed to update contact',
      requestId: req.requestId,
    });
  }
});

// DELETE contact
router.delete('/:id', authorize('contacts', 'delete'), async (req: Request, res: Response) => {
  try {
    await Contact.query()
      .where('tenantId', req.tenantId!)
      .deleteById(req.params.id);

    res.json({
      data: { message: 'Contact deleted' },
      requestId: req.requestId,
    });
  } catch (error: any) {
    logger.error('Failed to delete contact', { error });
    res.status(500).json({
      error: 'Failed to delete contact',
      requestId: req.requestId,
    });
  }
});

export default router;
