export interface ImpersonationSession {
  id: string;
  impersonatorId: string; // Admin/Support user
  impersonatedUserId: string; // User being impersonated
  tenantId: string;
  startedAt: Date;
  endedAt?: Date;
  reason?: string;
  restrictions: {
    readOnly: boolean;
    cannotDeleteData: boolean;
    cannotExportData: boolean;
    cannotModifySettings: boolean;
    cannotManageUsers: boolean;
  };
  status: 'active' | 'ended' | 'revoked';
}

export interface ImpersonationLog {
  id: string;
  sessionId: string;
  timestamp: Date;
  action: string;
  resourceType: 'lead' | 'contact' | 'deal' | 'task' | 'settings' | 'other';
  resourceId?: string;
  details: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
}

export interface ImpersonationPolicy {
  tenantId: string;
  allowedRoles: string[]; // Which roles can impersonate others
  requireReason: boolean;
  maxSessionDuration: number; // minutes
  auditAllActions: boolean;
  notifyImpersonatedUser: boolean;
  restrictions: {
    blockDeletes: boolean;
    blockExports: boolean;
    blockSettingsChanges: boolean;
    blockUserManagement: boolean;
  };
}

class ImpersonationService {
  private sessions: Map<string, ImpersonationSession> = new Map();
  private logs: Map<string, ImpersonationLog[]> = new Map();
  private policies: Map<string, ImpersonationPolicy> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Sample impersonation sessions
    const mockSessions: ImpersonationSession[] = [
      {
        id: 'imp-session-1',
        impersonatorId: 'admin-1',
        impersonatedUserId: 'user-1',
        tenantId: 'tenant-1',
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        endedAt: new Date(Date.now() - 5 * 60 * 1000),
        reason: 'User reported missing deal records',
        restrictions: {
          readOnly: true,
          cannotDeleteData: false,
          cannotExportData: false,
          cannotModifySettings: false,
          cannotManageUsers: true,
        },
        status: 'ended',
      },
      {
        id: 'imp-session-2',
        impersonatorId: 'support-1',
        impersonatedUserId: 'user-2',
        tenantId: 'tenant-2',
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        reason: 'Troubleshooting contact sync issue',
        restrictions: {
          readOnly: true,
          cannotDeleteData: true,
          cannotExportData: true,
          cannotModifySettings: true,
          cannotManageUsers: true,
        },
        status: 'active',
      },
      {
        id: 'imp-session-3',
        impersonatorId: 'admin-1',
        impersonatedUserId: 'user-3',
        tenantId: 'tenant-1',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        reason: 'Permission verification',
        restrictions: {
          readOnly: true,
          cannotDeleteData: true,
          cannotExportData: false,
          cannotModifySettings: true,
          cannotManageUsers: true,
        },
        status: 'ended',
      },
    ];

    mockSessions.forEach(session => {
      this.sessions.set(session.id, session);
      this.logs.set(session.id, this.generateMockLogs(session.id));
    });

    // Sample policies
    const mockPolicies: ImpersonationPolicy[] = [
      {
        tenantId: 'tenant-1',
        allowedRoles: ['admin', 'support'],
        requireReason: true,
        maxSessionDuration: 120,
        auditAllActions: true,
        notifyImpersonatedUser: true,
        restrictions: {
          blockDeletes: false,
          blockExports: false,
          blockSettingsChanges: false,
          blockUserManagement: true,
        },
      },
      {
        tenantId: 'tenant-2',
        allowedRoles: ['support'],
        requireReason: true,
        maxSessionDuration: 60,
        auditAllActions: true,
        notifyImpersonatedUser: false,
        restrictions: {
          blockDeletes: true,
          blockExports: true,
          blockSettingsChanges: true,
          blockUserManagement: true,
        },
      },
    ];

    mockPolicies.forEach(policy => {
      this.policies.set(policy.tenantId, policy);
    });
  }

  /**
   * Start impersonation session
   */
  startSession(
    impersonatorId: string,
    impersonatedUserId: string,
    tenantId: string,
    reason?: string
  ): ImpersonationSession | null {
    // Check policy
    const policy = this.policies.get(tenantId);
    if (policy && policy.requireReason && !reason) {
      return null; // Reason is required
    }

    const sessionId = `imp-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const restrictions = policy?.restrictions ? {
      readOnly: policy.restrictions.blockDeletes ? true : false,
      cannotDeleteData: policy.restrictions.blockDeletes,
      cannotExportData: policy.restrictions.blockExports,
      cannotModifySettings: policy.restrictions.blockSettingsChanges,
      cannotManageUsers: policy.restrictions.blockUserManagement,
    } : {
      readOnly: false,
      cannotDeleteData: false,
      cannotExportData: false,
      cannotModifySettings: false,
      cannotManageUsers: true,
    };

    const session: ImpersonationSession = {
      id: sessionId,
      impersonatorId,
      impersonatedUserId,
      tenantId,
      startedAt: new Date(),
      reason,
      restrictions,
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    this.logs.set(sessionId, [
      {
        id: `log-${sessionId}-start`,
        sessionId,
        timestamp: new Date(),
        action: 'Session started',
        resourceType: 'other',
        details: reason ? { before: { reason } } : {},
      },
    ]);

    return session;
  }

  /**
   * Get active session for impersonator
   */
  getActiveSession(impersonatorId: string): ImpersonationSession | undefined {
    return Array.from(this.sessions.values()).find(
      s => s.impersonatorId === impersonatorId && s.status === 'active'
    );
  }

  /**
   * End impersonation session
   */
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return false;
    }

    session.status = 'ended';
    session.endedAt = new Date();

    const logs = this.logs.get(sessionId) || [];
    logs.push({
      id: `log-${sessionId}-end`,
      sessionId,
      timestamp: new Date(),
      action: 'Session ended',
      resourceType: 'other',
      details: {},
    });

    return true;
  }

  /**
   * Revoke session (force end)
   */
  revokeSession(sessionId: string, reason: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'revoked';
    session.endedAt = new Date();

    const logs = this.logs.get(sessionId) || [];
    logs.push({
      id: `log-${sessionId}-revoke`,
      sessionId,
      timestamp: new Date(),
      action: `Session revoked: ${reason}`,
      resourceType: 'other',
      details: { before: { reason } },
    });

    return true;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ImpersonationSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions for a tenant
   */
  getTenantSessions(tenantId: string): ImpersonationSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.tenantId === tenantId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Log action during impersonation
   */
  logAction(
    sessionId: string,
    action: string,
    resourceType: 'lead' | 'contact' | 'deal' | 'task' | 'settings' | 'other',
    resourceId?: string,
    details?: any
  ): void {
    if (!this.logs.has(sessionId)) {
      this.logs.set(sessionId, []);
    }

    const log: ImpersonationLog = {
      id: `log-${sessionId}-${Date.now()}`,
      sessionId,
      timestamp: new Date(),
      action,
      resourceType,
      resourceId,
      details: details || {},
    };

    this.logs.get(sessionId)!.push(log);
  }

  /**
   * Get logs for a session
   */
  getSessionLogs(sessionId: string): ImpersonationLog[] {
    return this.logs.get(sessionId) || [];
  }

  /**
   * Get impersonation history for a user
   */
  getImpersonationHistory(userId: string): ImpersonationSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.impersonatedUserId === userId || s.impersonatorId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Check if action is allowed during impersonation
   */
  isActionAllowed(sessionId: string, action: 'read' | 'create' | 'update' | 'delete' | 'export' | 'settings' | 'manage_users'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return true;

    if (session.restrictions.readOnly && action !== 'read') {
      return false;
    }
    if (session.restrictions.cannotDeleteData && action === 'delete') {
      return false;
    }
    if (session.restrictions.cannotExportData && action === 'export') {
      return false;
    }
    if (session.restrictions.cannotModifySettings && action === 'settings') {
      return false;
    }
    if (session.restrictions.cannotManageUsers && action === 'manage_users') {
      return false;
    }

    return true;
  }

  /**
   * Get session duration
   */
  getSessionDuration(sessionId: string): number | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const endTime = session.endedAt || new Date();
    return Math.round((endTime.getTime() - session.startedAt.getTime()) / 1000 / 60); // minutes
  }

  /**
   * Get tenant impersonation policy
   */
  getPolicy(tenantId: string): ImpersonationPolicy | undefined {
    return this.policies.get(tenantId);
  }

  /**
   * Update tenant impersonation policy
   */
  updatePolicy(tenantId: string, updates: Partial<ImpersonationPolicy>): boolean {
    const policy = this.policies.get(tenantId);
    if (!policy) return false;

    Object.assign(policy, updates);
    return true;
  }

  /**
   * Get impersonation statistics
   */
  getStats(tenantId: string) {
    const sessions = this.getTenantSessions(tenantId);
    const today = new Date().toDateString();

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      sessionsToday: sessions.filter(s => s.startedAt.toDateString() === today).length,
      revokedSessions: sessions.filter(s => s.status === 'revoked').length,
      averageSessionDuration: this.calculateAverageSessionDuration(sessions),
      topImpersonators: this.getTopImpersonators(sessions),
      topImpersonatedUsers: this.getTopImpersonatedUsers(sessions),
    };
  }

  /**
   * Calculate average session duration
   */
  private calculateAverageSessionDuration(sessions: ImpersonationSession[]): number {
    const durations = sessions
      .filter(s => s.endedAt || s.status === 'ended')
      .map(s => {
        const endTime = s.endedAt || new Date();
        return endTime.getTime() - s.startedAt.getTime();
      });

    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000 / 60); // minutes
  }

  /**
   * Get top impersonators
   */
  private getTopImpersonators(sessions: ImpersonationSession[]): Record<string, number> {
    const counts: Record<string, number> = {};

    sessions.forEach(s => {
      counts[s.impersonatorId] = (counts[s.impersonatorId] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get top impersonated users
   */
  private getTopImpersonatedUsers(sessions: ImpersonationSession[]): Record<string, number> {
    const counts: Record<string, number> = {};

    sessions.forEach(s => {
      counts[s.impersonatedUserId] = (counts[s.impersonatedUserId] || 0) + 1;
    });

    return counts;
  }

  /**
   * Generate mock logs
   */
  private generateMockLogs(sessionId: string): ImpersonationLog[] {
    return [
      {
        id: `log-${sessionId}-1`,
        sessionId,
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        action: 'Viewed lead details',
        resourceType: 'lead',
        resourceId: 'lead-123',
        details: {},
      },
      {
        id: `log-${sessionId}-2`,
        sessionId,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        action: 'Viewed contact list',
        resourceType: 'contact',
        details: {},
      },
      {
        id: `log-${sessionId}-3`,
        sessionId,
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        action: 'Filtered by status',
        resourceType: 'deal',
        details: { before: { filter: 'status:won' } },
      },
    ];
  }
}

export const impersonationService = new ImpersonationService();
