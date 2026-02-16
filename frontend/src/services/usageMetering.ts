export interface UsageMetric {
  id: string;
  tenantId: string;
  metric: 'leads' | 'contacts' | 'deals' | 'tasks' | 'api_calls' | 'storage_gb' | 'webhooks' | 'bulk_actions';
  value: number;
  timestamp: Date;
  periodStart: Date;
  periodEnd: Date;
}

export interface TenantQuota {
  tenantId: string;
  plan: 'free' | 'startup' | 'growth' | 'enterprise';
  quotas: {
    maxLeads: number;
    maxContacts: number;
    maxDeals: number;
    maxApiCallsPerDay: number;
    maxStorageGb: number;
    maxWebhooks: number;
    maxBulkActionsPerMonth: number;
    maxTeamMembers: number;
  };
  usage: {
    leads: number;
    contacts: number;
    deals: number;
    apiCallsToday: number;
    storageGb: number;
    webhooks: number;
    bulkActionsThisMonth: number;
    teamMembers: number;
  };
  overage: {
    leadsOverage: number;
    apiCallsOverage: number;
    storageOverage: number;
  };
}

export interface BillingCycle {
  tenantId: string;
  cycleStart: Date;
  cycleEnd: Date;
  estimatedCost: number;
  basePrice: number;
  overageCharges: number;
  discounts: number;
  status: 'active' | 'pending' | 'paid' | 'overdue';
}

export interface UsageAlert {
  id: string;
  tenantId: string;
  type: 'quota_reached' | 'quota_exceeded' | 'unusual_activity' | 'approaching_limit';
  metric: string;
  currentValue: number;
  limit: number;
  createdAt: Date;
  acknowledged: boolean;
  severity: 'info' | 'warning' | 'critical';
}

class UsageMeteringService {
  private metrics: Map<string, UsageMetric[]> = new Map();
  private quotas: Map<string, TenantQuota> = new Map();
  private alerts: Map<string, UsageAlert[]> = new Map();
  private billingCycles: Map<string, BillingCycle> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Sample tenant quotas
    const mockQuotas: TenantQuota[] = [
      {
        tenantId: 'tenant-1',
        plan: 'growth',
        quotas: {
          maxLeads: 10000,
          maxContacts: 5000,
          maxDeals: 1000,
          maxApiCallsPerDay: 100000,
          maxStorageGb: 100,
          maxWebhooks: 20,
          maxBulkActionsPerMonth: 500,
          maxTeamMembers: 50,
        },
        usage: {
          leads: 2450,
          contacts: 1850,
          deals: 280,
          apiCallsToday: 15432,
          storageGb: 42.5,
          webhooks: 3,
          bulkActionsThisMonth: 120,
          teamMembers: 12,
        },
        overage: {
          leadsOverage: 0,
          apiCallsOverage: 0,
          storageOverage: 0,
        },
      },
      {
        tenantId: 'tenant-2',
        plan: 'startup',
        quotas: {
          maxLeads: 1000,
          maxContacts: 500,
          maxDeals: 100,
          maxApiCallsPerDay: 10000,
          maxStorageGb: 10,
          maxWebhooks: 5,
          maxBulkActionsPerMonth: 50,
          maxTeamMembers: 5,
        },
        usage: {
          leads: 850,
          contacts: 420,
          deals: 45,
          apiCallsToday: 2100,
          storageGb: 8.2,
          webhooks: 2,
          bulkActionsThisMonth: 8,
          teamMembers: 3,
        },
        overage: {
          leadsOverage: 0,
          apiCallsOverage: 0,
          storageOverage: 0,
        },
      },
      {
        tenantId: 'tenant-3',
        plan: 'enterprise',
        quotas: {
          maxLeads: 1000000,
          maxContacts: 500000,
          maxDeals: 100000,
          maxApiCallsPerDay: 10000000,
          maxStorageGb: 1000,
          maxWebhooks: 100,
          maxBulkActionsPerMonth: 10000,
          maxTeamMembers: 500,
        },
        usage: {
          leads: 45000,
          contacts: 32000,
          deals: 8500,
          apiCallsToday: 1250000,
          storageGb: 350,
          webhooks: 25,
          bulkActionsThisMonth: 1200,
          teamMembers: 85,
        },
        overage: {
          leadsOverage: 0,
          apiCallsOverage: 0,
          storageOverage: 0,
        },
      },
    ];

    mockQuotas.forEach(quota => {
      this.quotas.set(quota.tenantId, quota);

      // Generate mock metrics
      const metrics: UsageMetric[] = [];
      const now = new Date();

      const metricTypes: Array<'leads' | 'contacts' | 'deals' | 'api_calls' | 'storage_gb' | 'webhooks' | 'bulk_actions'> = [
        'leads',
        'contacts',
        'deals',
        'api_calls',
      ];

      for (let i = 0; i < 30; i++) {
        metricTypes.forEach(metric => {
          let value = 0;
          if (metric === 'leads') value = quota.usage.leads;
          else if (metric === 'contacts') value = quota.usage.contacts;
          else if (metric === 'deals') value = quota.usage.deals;
          else if (metric === 'api_calls') value = Math.floor(Math.random() * 50000);

          metrics.push({
            id: `metric-${quota.tenantId}-${metric}-${i}`,
            tenantId: quota.tenantId,
            metric: metric as any,
            value: Math.max(0, value + (Math.random() - 0.5) * 100),
            timestamp: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
            periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
            periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          });
        });
      }

      this.metrics.set(quota.tenantId, metrics);

      // Generate mock alerts
      const alerts: UsageAlert[] = [];
      if (quota.usage.leads > quota.quotas.maxLeads * 0.8) {
        alerts.push({
          id: `alert-${quota.tenantId}-leads`,
          tenantId: quota.tenantId,
          type: 'approaching_limit',
          metric: 'leads',
          currentValue: quota.usage.leads,
          limit: quota.quotas.maxLeads,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          acknowledged: false,
          severity: 'warning',
        });
      }

      this.alerts.set(quota.tenantId, alerts);
    });

    // Generate billing cycles
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    mockQuotas.forEach(quota => {
      const basePrice =
        quota.plan === 'free' ? 0 : quota.plan === 'startup' ? 99 : quota.plan === 'growth' ? 299 : 999;

      this.billingCycles.set(quota.tenantId, {
        tenantId: quota.tenantId,
        cycleStart,
        cycleEnd,
        basePrice,
        overageCharges: Math.random() * 500,
        discounts: Math.random() * 50,
        estimatedCost: basePrice + Math.random() * 500 - Math.random() * 50,
        status: 'active',
      });
    });
  }

  /**
   * Get tenant quota
   */
  getQuota(tenantId: string): TenantQuota | undefined {
    return this.quotas.get(tenantId);
  }

  /**
   * Update usage metric
   */
  recordUsage(tenantId: string, metric: string, value: number): void {
    if (!this.metrics.has(tenantId)) {
      this.metrics.set(tenantId, []);
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.metrics.get(tenantId)!.push({
      id: `metric-${tenantId}-${metric}-${Date.now()}`,
      tenantId,
      metric: metric as any,
      value,
      timestamp: now,
      periodStart,
      periodEnd,
    });

    // Check quotas after recording usage
    this.checkQuotaViolations(tenantId);
  }

  /**
   * Get usage metrics for a tenant
   */
  getMetrics(tenantId: string, metric?: string): UsageMetric[] {
    const allMetrics = this.metrics.get(tenantId) || [];

    if (metric) {
      return allMetrics.filter(m => m.metric === metric);
    }

    return allMetrics;
  }

  /**
   * Check and create alerts for quota violations
   */
  private checkQuotaViolations(tenantId: string): void {
    const quota = this.quotas.get(tenantId);
    if (!quota) return;

    const alerts = this.alerts.get(tenantId) || [];

    // Check leads quota
    if (quota.usage.leads > quota.quotas.maxLeads * 0.8) {
      const existingAlert = alerts.find(a => a.metric === 'leads');
      if (!existingAlert) {
        alerts.push({
          id: `alert-${tenantId}-leads-${Date.now()}`,
          tenantId,
          type: quota.usage.leads > quota.quotas.maxLeads ? 'quota_exceeded' : 'approaching_limit',
          metric: 'leads',
          currentValue: quota.usage.leads,
          limit: quota.quotas.maxLeads,
          createdAt: new Date(),
          acknowledged: false,
          severity: quota.usage.leads > quota.quotas.maxLeads ? 'critical' : 'warning',
        });
      }
    }

    // Check API calls quota
    if (quota.usage.apiCallsToday > quota.quotas.maxApiCallsPerDay * 0.9) {
      const existingAlert = alerts.find(a => a.metric === 'api_calls');
      if (!existingAlert) {
        alerts.push({
          id: `alert-${tenantId}-api-${Date.now()}`,
          tenantId,
          type: quota.usage.apiCallsToday > quota.quotas.maxApiCallsPerDay ? 'quota_exceeded' : 'approaching_limit',
          metric: 'api_calls',
          currentValue: quota.usage.apiCallsToday,
          limit: quota.quotas.maxApiCallsPerDay,
          createdAt: new Date(),
          acknowledged: false,
          severity: quota.usage.apiCallsToday > quota.quotas.maxApiCallsPerDay ? 'critical' : 'warning',
        });
      }
    }

    this.alerts.set(tenantId, alerts);
  }

  /**
   * Get alerts for a tenant
   */
  getAlerts(tenantId: string, unacknowledgedOnly: boolean = false): UsageAlert[] {
    let alerts = this.alerts.get(tenantId) || [];

    if (unacknowledgedOnly) {
      alerts = alerts.filter(a => !a.acknowledged);
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    for (const alerts of this.alerts.values()) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        return true;
      }
    }
    return false;
  }

  /**
   * Get billing cycle
   */
  getBillingCycle(tenantId: string): BillingCycle | undefined {
    return this.billingCycles.get(tenantId);
  }

  /**
   * Calculate overage charges
   */
  calculateOverages(tenantId: string): { leadOverage: number; apiOverage: number; storageOverage: number } {
    const quota = this.quotas.get(tenantId);
    if (!quota) return { leadOverage: 0, apiOverage: 0, storageOverage: 0 };

    // Pricing: $0.10 per lead, $0.05 per 1000 API calls, $0.50 per GB
    const leadOverage = Math.max(0, quota.usage.leads - quota.quotas.maxLeads) * 0.1;
    const apiOverage = Math.max(0, quota.usage.apiCallsToday - quota.quotas.maxApiCallsPerDay) * 0.00005;
    const storageOverage = Math.max(0, quota.usage.storageGb - quota.quotas.maxStorageGb) * 0.5;

    return { leadOverage, apiOverage, storageOverage };
  }

  /**
   * Get usage summary
   */
  getUsageSummary(tenantId: string) {
    const quota = this.quotas.get(tenantId);
    if (!quota) return null;

    const metrics = this.metrics.get(tenantId) || [];
    const overages = this.calculateOverages(tenantId);

    return {
      plan: quota.plan,
      quotas: quota.quotas,
      usage: quota.usage,
      percentageUsed: {
        leads: (quota.usage.leads / quota.quotas.maxLeads) * 100,
        contacts: (quota.usage.contacts / quota.quotas.maxContacts) * 100,
        deals: (quota.usage.deals / quota.quotas.maxDeals) * 100,
        apiCalls: (quota.usage.apiCallsToday / quota.quotas.maxApiCallsPerDay) * 100,
        storage: (quota.usage.storageGb / quota.quotas.maxStorageGb) * 100,
      },
      overages,
      totalOverageCharges: overages.leadOverage + overages.apiOverage + overages.storageOverage,
      metricsCount: metrics.length,
    };
  }

  /**
   * Upgrade tenant plan
   */
  upgradePlan(tenantId: string, newPlan: 'free' | 'startup' | 'growth' | 'enterprise'): boolean {
    const quota = this.quotas.get(tenantId);
    if (!quota) return false;

    const planQuotas = {
      free: {
        maxLeads: 100,
        maxContacts: 50,
        maxDeals: 10,
        maxApiCallsPerDay: 1000,
        maxStorageGb: 1,
        maxWebhooks: 1,
        maxBulkActionsPerMonth: 10,
        maxTeamMembers: 1,
      },
      startup: {
        maxLeads: 1000,
        maxContacts: 500,
        maxDeals: 100,
        maxApiCallsPerDay: 10000,
        maxStorageGb: 10,
        maxWebhooks: 5,
        maxBulkActionsPerMonth: 50,
        maxTeamMembers: 5,
      },
      growth: {
        maxLeads: 10000,
        maxContacts: 5000,
        maxDeals: 1000,
        maxApiCallsPerDay: 100000,
        maxStorageGb: 100,
        maxWebhooks: 20,
        maxBulkActionsPerMonth: 500,
        maxTeamMembers: 50,
      },
      enterprise: {
        maxLeads: 1000000,
        maxContacts: 500000,
        maxDeals: 100000,
        maxApiCallsPerDay: 10000000,
        maxStorageGb: 1000,
        maxWebhooks: 100,
        maxBulkActionsPerMonth: 10000,
        maxTeamMembers: 500,
      },
    };

    quota.plan = newPlan;
    quota.quotas = planQuotas[newPlan];
    return true;
  }
}

export const usageMeteringService = new UsageMeteringService();
