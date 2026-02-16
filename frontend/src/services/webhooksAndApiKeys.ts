export type WebhookEvent = 'lead.created' | 'lead.updated' | 'contact.created' | 'deal.created' | 'deal.updated' | 'bulk_action.completed' | 'job.completed';

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  successCount: number;
  failureCount: number;
  headers?: { [key: string]: string };
  secret: string; // HMAC secret for verification
  retryPolicy: {
    maxRetries: number;
    delaySeconds: number;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string; // visible part (e.g., "sk_live_abc123...")
  keySecret: string; // full key (never shown again)
  tenantId: string;
  userId: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  scopes: ApiKeyScope[];
  active: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export enum ApiKeyScope {
  READ_LEADS = 'leads:read',
  WRITE_LEADS = 'leads:write',
  READ_CONTACTS = 'contacts:read',
  WRITE_CONTACTS = 'contacts:write',
  READ_DEALS = 'deals:read',
  WRITE_DEALS = 'deals:write',
  READ_WEBHOOKS = 'webhooks:read',
  WRITE_WEBHOOKS = 'webhooks:write',
  ADMIN = 'admin:full',
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  status: 'success' | 'failed' | 'pending';
  statusCode?: number;
  timestamp: Date;
  payload: any;
  response?: string;
  retryCount: number;
  nextRetryAt?: Date;
}

export interface WebhookDeliveryStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  averageResponseTime: number; // ms
}

class WebhooksAndApiKeysService {
  private webhooks: Map<string, WebhookEndpoint> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private webhookLogs: Map<string, WebhookLog[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Sample webhook endpoints
    const mockWebhooks: WebhookEndpoint[] = [
      {
        id: 'webhook-1',
        name: 'Lead Notifications',
        url: 'https://example.com/webhooks/leads',
        events: ['lead.created', 'lead.updated'],
        active: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastTriggeredAt: new Date(Date.now() - 60 * 60 * 1000),
        successCount: 1250,
        failureCount: 3,
        secret: 'whsec_1234567890abcdef1234567890abcdef',
        retryPolicy: { maxRetries: 3, delaySeconds: 5 },
      },
      {
        id: 'webhook-2',
        name: 'Deal Updates to Slack',
        url: 'https://hooks.slack.com/services/T1234/B1234/XXXX',
        events: ['deal.created', 'deal.updated'],
        active: true,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        successCount: 450,
        failureCount: 1,
        secret: 'whsec_abcdef1234567890abcdef1234567890',
        retryPolicy: { maxRetries: 5, delaySeconds: 10 },
      },
      {
        id: 'webhook-3',
        name: 'Bulk Action Notifications',
        url: 'https://example.com/webhooks/bulk-actions',
        events: ['bulk_action.completed'],
        active: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        successCount: 50,
        failureCount: 0,
        secret: 'whsec_xyz789xyz789xyz789xyz789xyz789',
        retryPolicy: { maxRetries: 3, delaySeconds: 5 },
      },
    ];

    mockWebhooks.forEach(wh => {
      this.webhooks.set(wh.id, wh);
      this.webhookLogs.set(wh.id, this.generateMockLogs(wh.id));
    });

    // Sample API keys (mock data - not real secrets)
    const mockKeys: ApiKey[] = [
      {
        id: 'apikey-1',
        name: 'Production Integration',
        keyPrefix: 'mock_live_abc123def456',
        keySecret: 'mock_live_abc123def456ghi789jkl012mno345pqr678',
        tenantId: 'tenant-1',
        userId: 'user-1',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(Date.now() - 10 * 60 * 1000),
        scopes: [
          ApiKeyScope.READ_LEADS,
          ApiKeyScope.WRITE_LEADS,
          ApiKeyScope.READ_DEALS,
          ApiKeyScope.WRITE_DEALS,
        ],
        active: true,
        rateLimit: { requestsPerMinute: 1000, requestsPerDay: 50000 },
      },
      {
        id: 'apikey-2',
        name: 'Zapier Connection',
        keyPrefix: 'mock_test_xyz789abc123',
        keySecret: 'mock_test_xyz789abc123def456ghi789jkl012mno345',
        tenantId: 'tenant-1',
        userId: 'user-1',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        scopes: [
          ApiKeyScope.READ_LEADS,
          ApiKeyScope.WRITE_LEADS,
          ApiKeyScope.READ_CONTACTS,
        ],
        active: true,
        rateLimit: { requestsPerMinute: 100, requestsPerDay: 5000 },
      },
      {
        id: 'apikey-3',
        name: 'Old Integration (Disabled)',
        keyPrefix: 'mock_live_old123old456',
        keySecret: 'mock_live_old123old456old789old012old345old678',
        tenantId: 'tenant-1',
        userId: 'user-2',
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        scopes: [ApiKeyScope.READ_LEADS],
        active: false,
        rateLimit: { requestsPerMinute: 100, requestsPerDay: 5000 },
      },
    ];

    mockKeys.forEach(key => {
      this.apiKeys.set(key.id, key);
    });
  }

  /**
   * Create a webhook endpoint
   */
  createWebhook(
    name: string,
    url: string,
    events: WebhookEvent[],
    _tenantId: string
  ): WebhookEndpoint {
    const id = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const secret = `whsec_${Math.random().toString(36).substr(2, 32)}`;

    const webhook: WebhookEndpoint = {
      id,
      name,
      url,
      events,
      active: true,
      createdAt: new Date(),
      successCount: 0,
      failureCount: 0,
      secret,
      retryPolicy: { maxRetries: 3, delaySeconds: 5 },
    };

    this.webhooks.set(id, webhook);
    this.webhookLogs.set(id, []);
    return webhook;
  }

  /**
   * Get webhook by ID
   */
  getWebhook(id: string): WebhookEndpoint | undefined {
    return this.webhooks.get(id);
  }

  /**
   * Get all webhooks for a tenant
   */
  getTenantWebhooks(_tenantId: string): WebhookEndpoint[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Update webhook
   */
  updateWebhook(id: string, updates: Partial<WebhookEndpoint>): boolean {
    const webhook = this.webhooks.get(id);
    if (!webhook) return false;

    Object.assign(webhook, updates);
    return true;
  }

  /**
   * Delete webhook
   */
  deleteWebhook(id: string): boolean {
    const deleted = this.webhooks.delete(id);
    if (deleted) {
      this.webhookLogs.delete(id);
    }
    return deleted;
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(id: string): Promise<boolean> {
    const webhook = this.webhooks.get(id);
    if (!webhook) return false;

    const testPayload = {
      event: 'test.event',
      timestamp: new Date(),
      data: { test: true },
    };

    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      webhook.successCount++;
      webhook.lastTriggeredAt = new Date();
    } else {
      webhook.failureCount++;
    }

    this.logWebhookDelivery(id, 'test.event' as any, success ? 'success' : 'failed', testPayload);
    return success;
  }

  /**
   * Get webhook delivery stats
   */
  getWebhookStats(id: string): WebhookDeliveryStats | null {
    const webhook = this.webhooks.get(id);
    if (!webhook) return null;

    const total = webhook.successCount + webhook.failureCount;

    return {
      totalDeliveries: total,
      successfulDeliveries: webhook.successCount,
      failedDeliveries: webhook.failureCount,
      successRate: total > 0 ? (webhook.successCount / total) * 100 : 0,
      averageResponseTime: 250, // mock
    };
  }

  /**
   * Create an API key
   */
  createApiKey(
    name: string,
    tenantId: string,
    userId: string,
    scopes: ApiKeyScope[],
    expiresInDays?: number
  ): ApiKey {
    const id = `apikey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const keySecret = `mock_live_${Math.random().toString(36).substr(2, 40)}`;
    const keyPrefix = keySecret.substr(0, 20) + '...';

    const apiKey: ApiKey = {
      id,
      name,
      keyPrefix,
      keySecret,
      tenantId,
      userId,
      createdAt: new Date(),
      scopes,
      active: true,
      rateLimit: {
        requestsPerMinute: 1000,
        requestsPerDay: 50000,
      },
    };

    if (expiresInDays) {
      apiKey.expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  /**
   * Get API key by ID
   */
  getApiKey(id: string): ApiKey | undefined {
    return this.apiKeys.get(id);
  }

  /**
   * Get tenant API keys
   */
  getTenantApiKeys(tenantId: string): ApiKey[] {
    return Array.from(this.apiKeys.values())
      .filter(key => key.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Revoke API key
   */
  revokeApiKey(id: string): boolean {
    const key = this.apiKeys.get(id);
    if (!key) return false;

    key.active = false;
    return true;
  }

  /**
   * Update API key last used
   */
  recordApiKeyUsage(id: string): boolean {
    const key = this.apiKeys.get(id);
    if (!key) return false;

    key.lastUsedAt = new Date();
    return true;
  }

  /**
   * Get webhook logs
   */
  getWebhookLogs(webhookId: string, limit: number = 50): WebhookLog[] {
    const logs = this.webhookLogs.get(webhookId) || [];
    return logs.slice(-limit);
  }

  /**
   * Log webhook delivery
   */
  private logWebhookDelivery(
    webhookId: string,
    event: WebhookEvent,
    status: 'success' | 'failed' | 'pending',
    payload: any
  ): void {
    if (!this.webhookLogs.has(webhookId)) {
      this.webhookLogs.set(webhookId, []);
    }

    const log: WebhookLog = {
      id: `wh-log-${Date.now()}`,
      webhookId,
      event,
      status,
      statusCode: status === 'success' ? 200 : 400,
      timestamp: new Date(),
      payload,
      retryCount: 0,
    };

    this.webhookLogs.get(webhookId)!.push(log);
  }

  /**
   * Generate mock logs
   */
  private generateMockLogs(webhookId: string): WebhookLog[] {
    const events: WebhookEvent[] = ['lead.created', 'lead.updated'];
    return Array.from({ length: 10 }, (_, i) => ({
      id: `wh-log-${i}`,
      webhookId,
      event: events[Math.floor(Math.random() * events.length)],
      status: Math.random() > 0.05 ? 'success' : 'failed',
      statusCode: Math.random() > 0.05 ? 200 : 400,
      timestamp: new Date(Date.now() - i * 60 * 1000),
      payload: { test: true },
      retryCount: 0,
    }));
  }

  /**
   * Get API key statistics
   */
  getApiKeyStats(tenantId: string) {
    const keys = this.getTenantApiKeys(tenantId);

    return {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.active).length,
      expiredKeys: keys.filter(k => k.expiresAt && new Date() > k.expiresAt).length,
      unusedKeys: keys.filter(k => !k.lastUsedAt).length,
      totalRequests: Math.floor(Math.random() * 100000),
    };
  }
}

export const webhooksAndApiKeysService = new WebhooksAndApiKeysService();
