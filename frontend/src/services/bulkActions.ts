export type BulkActionType = 'assign' | 'delete' | 'tag' | 'export';
export type BulkResourceType = 'lead' | 'contact' | 'deal';

export interface BulkAction {
  id: string;
  type: BulkActionType;
  resourceType: BulkResourceType;
  recordIds: string[];
  userId: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  error?: string;
  metadata: {
    assignToUserId?: string;
    tags?: string[];
    exportFormat?: 'csv' | 'json' | 'excel';
    [key: string]: any;
  };
}

export interface BulkActionHistory {
  id: string;
  action: BulkAction;
  beforeState: any[];
  afterState: any[];
  undoable: boolean;
  undoedAt?: Date;
}

export interface BulkActionResult {
  success: boolean;
  message: string;
  processed: number;
  failed: number;
  failedRecordIds: string[];
  errors: { recordId: string; error: string }[];
  undoToken?: string;
}

class BulkActionsService {
  private actions: Map<string, BulkAction> = new Map();
  private history: Map<string, BulkActionHistory> = new Map();
  private undoStack: Map<string, any[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Pre-load some recent bulk actions
    const mockActions: BulkAction[] = [
      {
        id: 'bulk-1',
        type: 'assign',
        resourceType: 'lead',
        recordIds: ['lead-1', 'lead-2', 'lead-3'],
        userId: 'user-1',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'completed',
        progress: 100,
        totalRecords: 3,
        processedRecords: 3,
        failedRecords: 0,
        metadata: { assignToUserId: 'user-2' },
      },
      {
        id: 'bulk-2',
        type: 'tag',
        resourceType: 'contact',
        recordIds: ['contact-1', 'contact-2', 'contact-3', 'contact-4'],
        userId: 'user-1',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        status: 'completed',
        progress: 100,
        totalRecords: 4,
        processedRecords: 4,
        failedRecords: 0,
        metadata: { tags: ['important', 'vip'] },
      },
      {
        id: 'bulk-3',
        type: 'export',
        resourceType: 'lead',
        recordIds: Array.from({ length: 150 }, (_, i) => `lead-${i + 1}`),
        userId: 'user-1',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        status: 'completed',
        progress: 100,
        totalRecords: 150,
        processedRecords: 150,
        failedRecords: 0,
        metadata: { exportFormat: 'csv' },
      },
      {
        id: 'bulk-4',
        type: 'delete',
        resourceType: 'contact',
        recordIds: ['contact-10', 'contact-11'],
        userId: 'user-2',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'completed',
        progress: 100,
        totalRecords: 2,
        processedRecords: 2,
        failedRecords: 0,
        metadata: {},
      },
    ];

    mockActions.forEach(action => {
      this.actions.set(action.id, action);
    });
  }

  /**
   * Execute a bulk action on records
   */
  async executeBulkAction(
    type: BulkActionType,
    resourceType: BulkResourceType,
    recordIds: string[],
    userId: string,
    metadata: BulkAction['metadata'] = {}
  ): Promise<BulkActionResult> {
    const actionId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const action: BulkAction = {
      id: actionId,
      type,
      resourceType,
      recordIds,
      userId,
      createdAt: new Date(),
      status: 'pending',
      progress: 0,
      totalRecords: recordIds.length,
      processedRecords: 0,
      failedRecords: 0,
      metadata,
    };

    this.actions.set(actionId, action);

    // Simulate async processing
    return this.processAction(actionId, recordIds, type, metadata);
  }

  /**
   * Process bulk action with simulated progress
   */
  private async processAction(
    actionId: string,
    recordIds: string[],
    type: BulkActionType,
    _metadata: BulkAction['metadata']
  ): Promise<BulkActionResult> {
    const action = this.actions.get(actionId)!;
    action.status = 'processing';

    const errors: { recordId: string; error: string }[] = [];
    const failedRecordIds: string[] = [];

    // Simulate batch processing
    for (let i = 0; i < recordIds.length; i++) {
      const recordId = recordIds[i];

      // Simulate 95% success rate
      if (Math.random() > 0.95) {
        errors.push({
          recordId,
          error: 'Record not found or permission denied',
        });
        failedRecordIds.push(recordId);
        action.failedRecords++;
      } else {
        action.processedRecords++;
      }

      action.progress = Math.round(((i + 1) / recordIds.length) * 100);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    action.status = 'completed';
    action.progress = 100;

    // Store undo data
    this.undoStack.set(actionId, recordIds);

    const result: BulkActionResult = {
      success: errors.length === 0,
      message:
        errors.length === 0
          ? `Successfully ${type}d ${action.processedRecords} records`
          : `${type} completed with ${errors.length} error(s)`,
      processed: action.processedRecords,
      failed: action.failedRecords,
      failedRecordIds,
      errors,
      undoToken: errors.length === 0 ? actionId : undefined,
    };

    return result;
  }

  /**
   * Get all bulk actions for a user
   */
  getUserActions(userId: string): BulkAction[] {
    return Array.from(this.actions.values())
      .filter(action => action.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get bulk action by ID
   */
  getAction(actionId: string): BulkAction | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Get action statistics
   */
  getStats(userId: string) {
    const userActions = this.getUserActions(userId);

    return {
      totalActions: userActions.length,
      completedActions: userActions.filter(a => a.status === 'completed').length,
      processingActions: userActions.filter(a => a.status === 'processing').length,
      failedActions: userActions.filter(a => a.status === 'failed').length,
      totalRecordsProcessed: userActions.reduce((sum, a) => sum + a.processedRecords, 0),
      totalRecordsFailed: userActions.reduce((sum, a) => sum + a.failedRecords, 0),
      actionsByType: {
        assign: userActions.filter(a => a.type === 'assign').length,
        delete: userActions.filter(a => a.type === 'delete').length,
        tag: userActions.filter(a => a.type === 'tag').length,
        export: userActions.filter(a => a.type === 'export').length,
      },
    };
  }

  /**
   * Undo a bulk action (if possible)
   */
  async undoAction(actionId: string): Promise<boolean> {
    const action = this.actions.get(actionId);
    if (!action || !this.undoStack.has(actionId)) {
      return false;
    }

    action.status = 'completed'; // Mark as undone
    this.undoStack.delete(actionId);
    return true;
  }

  /**
   * Cancel a processing action
   */
  cancelAction(actionId: string): boolean {
    const action = this.actions.get(actionId);
    if (!action || action.status !== 'processing') {
      return false;
    }

    action.status = 'failed';
    action.error = 'Cancelled by user';
    return true;
  }

  /**
   * Export bulk action records as CSV
   */
  exportAsCSV(recordIds: string[], resourceType: string): string {
    const headers = this.getResourceHeaders(resourceType);
    const rows = recordIds.map(id => {
      return headers.map(() => `Mock data for ${id}`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export bulk action records as JSON
   */
  exportAsJSON(recordIds: string[], resourceType: string): string {
    return JSON.stringify(
      recordIds.map(id => ({
        id,
        resourceType,
        exportedAt: new Date().toISOString(),
        data: { mockData: true },
      })),
      null,
      2
    );
  }

  /**
   * Get resource headers for export
   */
  private getResourceHeaders(resourceType: string): string[] {
    const headers: { [key: string]: string[] } = {
      lead: ['ID', 'Name', 'Email', 'Company', 'Status', 'Value', 'Owner', 'Created'],
      contact: ['ID', 'Name', 'Email', 'Company', 'Title', 'Phone', 'Owner', 'Created'],
      deal: ['ID', 'Name', 'Value', 'Stage', 'Owner', 'Expected Close', 'Created'],
    };

    return headers[resourceType] || headers.lead;
  }

  /**
   * Get action history
   */
  getActionHistory(userId: string): BulkActionHistory[] {
    return Array.from(this.history.values())
      .filter(h => h.action.userId === userId)
      .sort((a, b) => b.action.createdAt.getTime() - a.action.createdAt.getTime());
  }

  /**
   * Track resource changes for undo/redo
   */
  recordHistory(
    action: BulkAction,
    beforeState: any[],
    afterState: any[]
  ): void {
    const historyId = `hist-${action.id}`;
    this.history.set(historyId, {
      id: historyId,
      action,
      beforeState,
      afterState,
      undoable: action.status === 'completed',
    });
  }
}

export const bulkActionsService = new BulkActionsService();
