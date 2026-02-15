import { Activity } from '../models';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export interface CreateActivityPayload {
  tenantId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task_completed';
  subject?: string;
  description?: string;
  duration?: number;
  result?: string;
  relatedTo?: {
    type: 'lead' | 'contact' | 'deal' | 'account';
    id: string;
  };
  participants?: string[];
}

export class ActivityService {
  async logActivity(
    payload: CreateActivityPayload,
    createdBy: string
  ): Promise<Activity> {
    try {
      const activity = await Activity.query().insert({
        id: uuidv4(),
        tenantId: payload.tenantId,
        type: payload.type,
        subject: payload.subject,
        description: payload.description,
        duration: payload.duration,
        result: payload.result,
        relatedTo: payload.relatedTo,
        participants: payload.participants,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        updatedBy: createdBy,
      });

      logger.info('Activity logged', {
        activityId: activity.id,
        tenantId: payload.tenantId,
        type: payload.type,
        createdBy,
      });

      return activity;
    } catch (error) {
      logger.error('Failed to log activity', { error });
      throw error;
    }
  }

  async getActivities(
    tenantId: string,
    filters?: {
      type?: string;
      relatedToType?: string;
      relatedToId?: string;
      createdBy?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ activities: Activity[]; total: number }> {
    try {
      let query = Activity.query().where('tenantId', tenantId);

      if (filters?.type) query = query.where('type', filters.type);
      if (filters?.createdBy) query = query.where('createdBy', filters.createdBy);
      if (filters?.relatedToType && filters?.relatedToId) {
        query = query.whereRaw(
          `"relatedTo"->>'type' = ? AND "relatedTo"->>'id' = ?`,
          [filters.relatedToType, filters.relatedToId]
        );
      }

      const total = await query.clone().resultSize();

      if (filters?.limit) {
        query = query.limit(filters.limit);
        if (filters.offset) query = query.offset(filters.offset);
      }

      const activities = await query.orderBy('createdAt', 'desc');

      return { activities, total };
    } catch (error) {
      logger.error('Failed to fetch activities', { error });
      throw error;
    }
  }

  async getRelatedActivities(
    tenantId: string,
    relatedToType: 'lead' | 'contact' | 'deal' | 'account',
    relatedToId: string
  ): Promise<Activity[]> {
    return Activity.query()
      .where('tenantId', tenantId)
      .whereRaw(`"relatedTo"->>'type' = ? AND "relatedTo"->>'id' = ?`, [
        relatedToType,
        relatedToId,
      ])
      .orderBy('createdAt', 'desc');
  }

  async getTimeline(
    tenantId: string,
    limit: number = 50
  ): Promise<Activity[]> {
    return Activity.query()
      .where('tenantId', tenantId)
      .orderBy('createdAt', 'desc')
      .limit(limit);
  }
}

export default new ActivityService();
