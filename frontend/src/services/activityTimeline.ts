/**
 * Activity Timeline / Audit Log Service
 * Tracks all CRUD operations on leads, contacts, deals
 * 
 * Features:
 * - Auto-tracking of creates, updates, deletes
 * - Change history with before/after values
 * - User attribution
 * - Timestamp tracking
 * - Filterable by record type, action, date range
 */

export type ActivityAction = 'created' | 'updated' | 'deleted' | 'assigned' | 'commented' | 'exported';
export type ActivityResource = 'lead' | 'contact' | 'deal' | 'task';

export interface ActivityChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface ActivityLog {
  id: string;
  recordId: string;
  recordType: ActivityResource;
  recordName: string;
  action: ActivityAction;
  userId: string;
  userName: string;
  userAvatar?: string;
  changes: ActivityChange[];
  timestamp: number;
  description: string;
  ipAddress?: string;
  tenantId?: string;
}

export interface ActivityFilter {
  recordType?: ActivityResource;
  action?: ActivityAction;
  userId?: string;
  recordId?: string;
  startDate?: number;
  endDate?: number;
  searchTerm?: string;
}

export class ActivityTimelineService {
  private logs: ActivityLog[] = [];
  private nextId: number = 1;

  constructor() {
    this.loadMockData();
  }

  /**
   * Log an activity
   */
  log(activity: Omit<ActivityLog, 'id'>): ActivityLog {
    const newLog: ActivityLog = {
      ...activity,
      id: `activity-${this.nextId++}`,
    };

    this.logs.unshift(newLog); // Add to top (reverse chronological)
    return newLog;
  }

  /**
   * Log a record creation
   */
  logCreated(
    recordId: string,
    recordType: ActivityResource,
    recordName: string,
    userId: string,
    userName: string,
    data?: Record<string, any>
  ): ActivityLog {
    return this.log({
      recordId,
      recordType,
      recordName,
      action: 'created',
      userId,
      userName,
      changes: data
        ? Object.entries(data).map(([field, value]) => ({
            field,
            oldValue: null,
            newValue: value,
          }))
        : [],
      timestamp: Date.now(),
      description: `${userName} created ${recordType} "${recordName}"`,
      tenantId: 'default',
    });
  }

  /**
   * Log a record update
   */
  logUpdated(
    recordId: string,
    recordType: ActivityResource,
    recordName: string,
    userId: string,
    userName: string,
    changes: Record<string, { old: any; new: any }>
  ): ActivityLog {
    const changeList = Object.entries(changes).map(([field, { old: oldValue, new: newValue }]) => ({
      field,
      oldValue,
      newValue,
    }));

    const changedFields = Object.keys(changes).join(', ');

    return this.log({
      recordId,
      recordType,
      recordName,
      action: 'updated',
      userId,
      userName,
      changes: changeList,
      timestamp: Date.now(),
      description: `${userName} updated ${recordType} "${recordName}" (${changedFields})`,
      tenantId: 'default',
    });
  }

  /**
   * Log a record deletion
   */
  logDeleted(
    recordId: string,
    recordType: ActivityResource,
    recordName: string,
    userId: string,
    userName: string
  ): ActivityLog {
    return this.log({
      recordId,
      recordType,
      recordName,
      action: 'deleted',
      userId,
      userName,
      changes: [],
      timestamp: Date.now(),
      description: `${userName} deleted ${recordType} "${recordName}"`,
      tenantId: 'default',
    });
  }

  /**
   * Log a record assignment
   */
  logAssigned(
    recordId: string,
    recordType: ActivityResource,
    recordName: string,
    userId: string,
    userName: string,
    _assignedTo: string,
    assignedToName: string
  ): ActivityLog {
    return this.log({
      recordId,
      recordType,
      recordName,
      action: 'assigned',
      userId,
      userName,
      changes: [
        {
          field: 'assignee',
          oldValue: null,
          newValue: assignedToName,
        },
      ],
      timestamp: Date.now(),
      description: `${userName} assigned ${recordType} "${recordName}" to ${assignedToName}`,
      tenantId: 'default',
    });
  }

  /**
   * Get all activity logs with optional filtering
   */
  getActivity(filter?: ActivityFilter): ActivityLog[] {
    if (!filter) return this.logs;

    return this.logs.filter(log => {
      if (filter.recordType && log.recordType !== filter.recordType) return false;
      if (filter.action && log.action !== filter.action) return false;
      if (filter.userId && log.userId !== filter.userId) return false;
      if (filter.recordId && log.recordId !== filter.recordId) return false;
      if (filter.startDate && log.timestamp < filter.startDate) return false;
      if (filter.endDate && log.timestamp > filter.endDate) return false;
      if (
        filter.searchTerm &&
        !log.description.toLowerCase().includes(filter.searchTerm.toLowerCase()) &&
        !log.recordName.toLowerCase().includes(filter.searchTerm.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get activity for a specific record
   */
  getRecordActivity(recordId: string): ActivityLog[] {
    return this.logs.filter(log => log.recordId === recordId);
  }

  /**
   * Get activity by user
   */
  getUserActivity(userId: string, limit?: number): ActivityLog[] {
    const filtered = this.logs.filter(log => log.userId === userId);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Get activity timeline stats
   */
  getStats(): {
    totalLogs: number;
    byAction: Record<ActivityAction, number>;
    byResource: Record<ActivityResource, number>;
    activeUsers: number;
  } {
    const byAction: Record<ActivityAction, number> = {
      created: 0,
      updated: 0,
      deleted: 0,
      assigned: 0,
      commented: 0,
      exported: 0,
    };

    const byResource: Record<ActivityResource, number> = {
      lead: 0,
      contact: 0,
      deal: 0,
      task: 0,
    };

    const uniqueUsers = new Set<string>();

    this.logs.forEach(log => {
      byAction[log.action]++;
      byResource[log.recordType]++;
      uniqueUsers.add(log.userId);
    });

    return {
      totalLogs: this.logs.length,
      byAction,
      byResource,
      activeUsers: uniqueUsers.size,
    };
  }

  /**
   * Clear all activity logs (for testing)
   */
  clear(): void {
    this.logs = [];
    this.nextId = 1;
  }

  /**
   * Load mock activity data
   */
  private loadMockData(): void {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Mock leads activity
    this.log({
      recordId: '1',
      recordType: 'lead',
      recordName: 'Acme Corp',
      action: 'created',
      userId: 'user-1',
      userName: 'John Doe',
      changes: [
        { field: 'name', oldValue: null, newValue: 'Acme Corp' },
        { field: 'email', oldValue: null, newValue: 'contact@acme.com' },
        { field: 'value', oldValue: null, newValue: 50000 },
      ],
      timestamp: weekAgo,
      description: 'John Doe created lead "Acme Corp"',
      tenantId: 'default',
    });

    this.log({
      recordId: '1',
      recordType: 'lead',
      recordName: 'Acme Corp',
      action: 'updated',
      userId: 'user-2',
      userName: 'Jane Smith',
      changes: [
        { field: 'status', oldValue: 'new', newValue: 'qualified' },
      ],
      timestamp: dayAgo,
      description: 'Jane Smith updated lead "Acme Corp" (status)',
      tenantId: 'default',
    });

    this.log({
      recordId: '1',
      recordType: 'lead',
      recordName: 'Acme Corp',
      action: 'assigned',
      userId: 'user-2',
      userName: 'Jane Smith',
      changes: [
        { field: 'assignee', oldValue: 'John Doe', newValue: 'Jane Smith' },
      ],
      timestamp: now - 2 * 60 * 60 * 1000,
      description: 'Jane Smith assigned lead "Acme Corp" to Jane Smith',
      tenantId: 'default',
    });

    // Mock contacts activity
    this.log({
      recordId: '1',
      recordType: 'contact',
      recordName: 'John Smith',
      action: 'created',
      userId: 'user-1',
      userName: 'John Doe',
      changes: [
        { field: 'name', oldValue: null, newValue: 'John Smith' },
        { field: 'email', oldValue: null, newValue: 'john@example.com' },
        { field: 'title', oldValue: null, newValue: 'CEO' },
      ],
      timestamp: weekAgo + 2 * 24 * 60 * 60 * 1000,
      description: 'John Doe created contact "John Smith"',
      tenantId: 'default',
    });

    this.log({
      recordId: '2',
      recordType: 'contact',
      recordName: 'Jane Doe',
      action: 'created',
      userId: 'user-2',
      userName: 'Jane Smith',
      changes: [
        { field: 'name', oldValue: null, newValue: 'Jane Doe' },
        { field: 'email', oldValue: null, newValue: 'jane@example.com' },
        { field: 'title', oldValue: null, newValue: 'CTO' },
      ],
      timestamp: now - 4 * 60 * 60 * 1000,
      description: 'Jane Smith created contact "Jane Doe"',
      tenantId: 'default',
    });

    // Mock deals activity
    this.log({
      recordId: '1',
      recordType: 'deal',
      recordName: 'Enterprise Deal',
      action: 'created',
      userId: 'user-1',
      userName: 'John Doe',
      changes: [
        { field: 'title', oldValue: null, newValue: 'Enterprise Deal' },
        { field: 'value', oldValue: null, newValue: 150000 },
        { field: 'stage', oldValue: null, newValue: 'proposal' },
      ],
      timestamp: weekAgo + 3 * 24 * 60 * 60 * 1000,
      description: 'John Doe created deal "Enterprise Deal"',
      tenantId: 'default',
    });
  }
}

// Singleton instance
export const activityTimeline = new ActivityTimelineService();
