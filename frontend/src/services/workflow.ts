/**
 * Workflow & Automation Engine
 * Event-driven automation system: When X happens → do Y
 * 
 * Features:
 * - Trigger detection (lead_created, deal_stuck, status_changed, inactivity)
 * - Action execution (assign_owner, escalate, create_task, notify)
 * - Rule builder UI
 * - Execution history
 */

export type WorkflowTrigger = 
  | 'lead_created'
  | 'lead_updated'
  | 'deal_stuck'
  | 'status_changed'
  | 'inactivity_detected'
  | 'deal_value_changed'
  | 'stage_changed'
  | 'overdue_task';

export type WorkflowAction = 
  | 'assign_owner'
  | 'escalate_to_manager'
  | 'create_task'
  | 'notify_manager'
  | 'send_email'
  | 'update_field'
  | 'add_tag'
  | 'create_activity';

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty';
  value: any;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: {
    type: WorkflowAction;
    params: Record<string, any>;
  }[];
  createdAt: string;
  createdBy: string;
  executionCount: number;
  lastExecuted?: string;
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredBy: string;
  triggeredAt: string;
  recordId: string;
  recordType: 'lead' | 'deal' | 'contact' | 'task';
  status: 'success' | 'failed' | 'skipped';
  actionsExecuted: number;
  error?: string;
  duration: number;
}

// Workflow Engine Core
export class WorkflowEngine {
  private rules: Map<string, WorkflowRule> = new Map();
  private executionHistory: WorkflowExecution[] = [];

  constructor() {
    this.loadDefaultRules();
  }

  private loadDefaultRules() {
    // Rule 1: Auto-assign new leads
    this.addRule({
      id: 'auto-assign-leads',
      name: 'Auto-assign new leads',
      description: 'Automatically assign leads to available sales rep',
      enabled: true,
      trigger: 'lead_created',
      conditions: [],
      actions: [{
        type: 'assign_owner',
        params: { strategy: 'round_robin' }
      }],
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      executionCount: 0
    });

    // Rule 2: Escalate stuck deals
    this.addRule({
      id: 'escalate-stuck-deals',
      name: 'Escalate stuck deals',
      description: 'Notify manager when deal hasnt moved in 7 days',
      enabled: true,
      trigger: 'inactivity_detected',
      conditions: [
        { field: 'type', operator: 'equals', value: 'deal' },
        { field: 'daysInactive', operator: 'greater_than', value: 7 }
      ],
      actions: [
        { type: 'escalate_to_manager', params: {} },
        { type: 'notify_manager', params: { message: 'Deal requires attention' } }
      ],
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      executionCount: 0
    });

    // Rule 3: Create task on won deal
    this.addRule({
      id: 'won-deal-task',
      name: 'Create onboarding task on won deal',
      description: 'Auto-create onboarding task when deal is won',
      enabled: true,
      trigger: 'status_changed',
      conditions: [
        { field: 'status', operator: 'equals', value: 'won' }
      ],
      actions: [{
        type: 'create_task',
        params: {
          title: 'Begin customer onboarding',
          dueIn: 24,
          priority: 'high'
        }
      }],
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      executionCount: 0
    });

    // Rule 4: Notify on high-value deal
    this.addRule({
      id: 'high-value-alert',
      name: 'Alert on high-value deals',
      description: 'Notify manager when deal value exceeds $50k',
      enabled: true,
      trigger: 'deal_value_changed',
      conditions: [
        { field: 'value', operator: 'greater_than', value: 50000 }
      ],
      actions: [{
        type: 'notify_manager',
        params: { 
          urgency: 'high',
          message: 'High-value deal created'
        }
      }],
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      executionCount: 0
    });
  }

  addRule(rule: WorkflowRule) {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string) {
    this.rules.delete(ruleId);
  }

  enableRule(ruleId: string) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  disableRule(ruleId: string) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  getAllRules(): WorkflowRule[] {
    return Array.from(this.rules.values());
  }

  getEnabledRules(): WorkflowRule[] {
    return this.getAllRules().filter(r => r.enabled);
  }

  // Execute workflow trigger
  async executeTrigger(
    trigger: WorkflowTrigger,
    context: {
      recordId: string;
      recordType: 'lead' | 'deal' | 'contact' | 'task';
      data: Record<string, any>;
      userId: string;
    }
  ): Promise<WorkflowExecution[]> {
    const executions: WorkflowExecution[] = [];
    const matchingRules = this.getEnabledRules().filter(r => r.trigger === trigger);

    for (const rule of matchingRules) {
      const startTime = Date.now();
      
      // Check conditions
      const conditionsMet = this.evaluateConditions(rule.conditions, context.data);
      
      if (!conditionsMet) {
        executions.push({
          id: `exec-${Date.now()}-${Math.random()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredBy: context.userId,
          triggeredAt: new Date().toISOString(),
          recordId: context.recordId,
          recordType: context.recordType,
          status: 'skipped',
          actionsExecuted: 0,
          duration: Date.now() - startTime
        });
        continue;
      }

      // Execute actions
      let actionsExecuted = 0;
      let error: string | undefined;

      try {
        for (const action of rule.actions) {
          await this.executeAction(action, context);
          actionsExecuted++;
        }

        rule.executionCount++;
        rule.lastExecuted = new Date().toISOString();

        executions.push({
          id: `exec-${Date.now()}-${Math.random()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredBy: context.userId,
          triggeredAt: new Date().toISOString(),
          recordId: context.recordId,
          recordType: context.recordType,
          status: 'success',
          actionsExecuted,
          duration: Date.now() - startTime
        });

      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        executions.push({
          id: `exec-${Date.now()}-${Math.random()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredBy: context.userId,
          triggeredAt: new Date().toISOString(),
          recordId: context.recordId,
          recordType: context.recordType,
          status: 'failed',
          actionsExecuted,
          error,
          duration: Date.now() - startTime
        });
      }
    }

    this.executionHistory.push(...executions);
    return executions;
  }

  private evaluateConditions(conditions: WorkflowCondition[], data: Record<string, any>): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const fieldValue = data[condition.field];

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'is_empty':
          return !fieldValue || fieldValue === '';
        default:
          return false;
      }
    });
  }

  private async executeAction(
    action: { type: WorkflowAction; params: Record<string, any> },
    context: { recordId: string; recordType: string; data: Record<string, any>; userId: string }
  ): Promise<void> {
    console.log(`[Workflow] Executing action: ${action.type}`, action.params);

    switch (action.type) {
      case 'assign_owner':
        // Simulate owner assignment
        console.log(`[Workflow] Assigned owner using strategy: ${action.params.strategy}`);
        break;

      case 'escalate_to_manager':
        console.log(`[Workflow] Escalated to manager for record: ${context.recordId}`);
        break;

      case 'create_task':
        console.log(`[Workflow] Created task: ${action.params.title}`);
        break;

      case 'notify_manager':
        console.log(`[Workflow] Sent notification: ${action.params.message}`);
        break;

      case 'send_email':
        console.log(`[Workflow] Sent email to: ${action.params.to}`);
        break;

      case 'update_field':
        console.log(`[Workflow] Updated field: ${action.params.field} = ${action.params.value}`);
        break;

      case 'add_tag':
        console.log(`[Workflow] Added tag: ${action.params.tag}`);
        break;

      case 'create_activity':
        console.log(`[Workflow] Created activity: ${action.params.type}`);
        break;
    }

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  getExecutionHistory(limit: number = 50): WorkflowExecution[] {
    return this.executionHistory.slice(-limit).reverse();
  }

  getExecutionStats() {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(e => e.status === 'success').length;
    const failed = this.executionHistory.filter(e => e.status === 'failed').length;
    const skipped = this.executionHistory.filter(e => e.status === 'skipped').length;

    return {
      total,
      successful,
      failed,
      skipped,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : '0'
    };
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();
