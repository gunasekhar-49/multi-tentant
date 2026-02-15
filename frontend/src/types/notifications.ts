/**
 * Comprehensive notification & alert type system
 * Enterprise SaaS CRM - Notification Machinery
 */

// ============================================================================
// 1. NOTIFICATION CENTER (Bell icon notifications)
// ============================================================================

export type NotificationType =
  | 'task_assigned'
  | 'deal_moved'
  | 'lead_created'
  | 'mention'
  | 'sla_breach'
  | 'billing_event'
  | 'automation_triggered'
  | 'import_complete'
  | 'assignment'
  | 'permission_denied'
  | 'custom';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationCategory =
  | 'crm'
  | 'billing'
  | 'system'
  | 'team'
  | 'automation'
  | 'mentions';

export interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  description?: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
  expiresAt?: Date; // Auto-archive after this date
  
  // Deep linking
  actionUrl?: string; // /app/leads/123 or /app/deals/456
  actionLabel?: string; // "View", "Open Deal", etc.
  
  // Quick actions in notification
  quickActions?: QuickAction[];
  
  // Who triggered this
  triggeredBy?: {
    userId: string;
    userName: string;
    userAvatar?: string;
  };
  
  // Metadata for filtering/grouping
  metadata?: {
    recordType?: 'lead' | 'contact' | 'deal' | 'account' | 'task' | 'ticket';
    recordId?: string;
    recordName?: string;
    fieldChanged?: string;
    oldValue?: any;
    newValue?: any;
  };
  
  // Grouping (thread notifications together)
  groupId?: string; // Group related notifications
  groupCount?: number; // How many in this group
}

export interface QuickAction {
  id: string;
  label: string;
  action: 'view' | 'accept' | 'reassign' | 'approve' | 'reject' | 'custom';
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: string;
  payload?: Record<string, any>;
}

export interface NotificationFilter {
  type?: NotificationType[];
  category?: NotificationCategory[];
  priority?: NotificationPriority[];
  isRead?: boolean;
  isArchived?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface NotificationPreferences {
  userId: string;
  tenantId: string;
  
  // Enable/disable by category
  categories: Record<NotificationCategory, {
    enabled: boolean;
    inAppAlert: boolean;
    emailAlert: boolean;
    pushAlert: boolean;
  }>;
  
  // Digest settings
  digestFrequency: 'instant' | 'hourly' | 'daily' | 'weekly' | 'never';
  digestTime?: string; // "09:00" for daily/weekly
  
  // Muted categories
  mutedCategories: NotificationCategory[];
  
  // Quiet hours
  quietHours?: {
    enabled: boolean;
    startTime: string; // "17:00"
    endTime: string;   // "09:00"
  };
  
  // Webhooks for integrations
  webhooks?: {
    url: string;
    events: NotificationType[];
    enabled: boolean;
  }[];
  
  // Priority alerts always notify
  priorityAlwaysNotify: boolean;
}

// ============================================================================
// 2. TOAST MESSAGES (Non-blocking corner popups)
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  position?: ToastPosition;
  duration?: number; // Auto-dismiss after (ms), null = sticky
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  icon?: string;
}

// ============================================================================
// 3. CONFIRMATION MODALS (Destructive actions)
// ============================================================================

export type ConfirmationType =
  | 'delete_record'
  | 'delete_multiple'
  | 'change_owner'
  | 'bulk_update'
  | 'cancel_subscription'
  | 'disconnect_integration'
  | 'close_deal'
  | 'reassign_team'
  | 'custom';

export interface ConfirmationModal {
  id: string;
  type: ConfirmationType;
  title: string;
  message: string;
  description?: string;
  
  // Impact preview
  impact?: {
    icon: string;
    title: string;
    items: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // Recovery/undo info
  recovery?: {
    available: boolean;
    window?: number; // minutes user has to undo
    instruction: string;
  };
  
  // Confirmation input (for critical actions)
  requireInput?: {
    label: string;
    placeholder: string;
    expectedValue: string;
  };
  
  // Actions
  confirmLabel: string;
  confirmVariant?: 'danger' | 'warning' | 'default';
  cancelLabel?: string;
  
  // Callbacks
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  
  // Loading state
  isLoading?: boolean;
  loadingLabel?: string;
}

// ============================================================================
// 4. SMART ALERTS (Persistent banners)
// ============================================================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SmartAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  description?: string;
  
  // Auto-dismiss or persistent
  isDismissible: boolean;
  autoDismissAfter?: number; // ms
  
  // Actions to resolve
  actions?: {
    label: string;
    onClick: () => Promise<void> | void;
    isPrimary?: boolean;
    isLoading?: boolean;
  }[];
  
  // Examples: trial ending, payment failed, sync disconnected
  type: 'trial_ending' | 'payment_failed' | 'integration_disconnected' | 'sync_error' | 'custom';
  
  // Metadata
  metadata?: Record<string, any>;
}

// ============================================================================
// 5. ASSIGNMENT POPUPS (Instant assignment notifications)
// ============================================================================

export interface AssignmentNotification {
  id: string;
  recordType: 'lead' | 'deal' | 'task' | 'ticket';
  recordId: string;
  recordName: string;
  assignedBy: {
    userId: string;
    userName: string;
    userAvatar?: string;
  };
  createdAt: Date;
  
  // Quick actions
  actions: 'view' | 'accept' | 'reassign';
}

// ============================================================================
// 6. MENTIONS SYSTEM
// ============================================================================

export interface Mention {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  context: 'note' | 'comment' | 'email';
  contextId: string; // note ID, comment ID, email ID
  contextUrl: string; // Deep link to the note/comment
  mentionedBy: {
    userId: string;
    userName: string;
  };
  timestamp: Date;
  isRead: boolean;
}

// ============================================================================
// 7. ACTIVITY NUDGES (Intelligent productivity pushes)
// ============================================================================

export type NudgeType =
  | 'lead_untouched'
  | 'deal_stagnating'
  | 'task_overdue'
  | 'follow_up_due'
  | 'meeting_starting'
  | 'high_value_deal'
  | 'sla_at_risk';

export interface ActivityNudge {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
  icon: string;
  priority: NotificationPriority;
  recordType: 'lead' | 'deal' | 'task' | 'ticket';
  recordId: string;
  recordName: string;
  actionUrl: string;
  dismissible: boolean;
  dismissedAt?: Date;
  daysInactive?: number; // for untouched leads
  daysSinceLastUpdate?: number; // for stagnating deals
}

// ============================================================================
// 8. BACKGROUND JOB TRACKING
// ============================================================================

export type JobStatus = 'queued' | 'processing' | 'success' | 'failed' | 'cancelled';

export interface BackgroundJob {
  id: string;
  type: 'bulk_import' | 'bulk_export' | 'webhook_sync' | 'email_send' | 'report_generation' | 'custom';
  status: JobStatus;
  title: string;
  description?: string;
  
  // Progress tracking
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  
  // Timeline
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Results
  result?: {
    successCount: number;
    failureCount: number;
    warningCount?: number;
    errors?: JobError[];
  };
  
  // Download results
  downloadUrl?: string;
  downloadFilename?: string;
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface JobError {
  row?: number;
  message: string;
  field?: string;
  value?: any;
  suggestion?: string;
}

// ============================================================================
// 9. PERMISSION WARNINGS
// ============================================================================

export interface PermissionWarning {
  id: string;
  action: string;
  requiredRole: string;
  userRole: string;
  message: string;
  suggestion?: string;
  learnMoreUrl?: string;
  dismissible: boolean;
  timestamp: Date;
}

// ============================================================================
// 10. CONNECTION STATUS
// ============================================================================

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

export interface ConnectionStatusBadge {
  status: ConnectionStatus;
  lastConnectedAt?: Date;
  nextRetryAt?: Date;
  retryCount?: number;
  message?: string;
}

// ============================================================================
// CONTEXT/PROVIDER STATE
// ============================================================================

export interface NotificationContextState {
  // Notifications center
  notifications: Notification[];
  unreadCount: number;
  notificationFilter: NotificationFilter;
  
  // Toasts
  toasts: Toast[];
  
  // Modals
  confirmationModal: ConfirmationModal | null;
  
  // Alerts
  smartAlerts: SmartAlert[];
  
  // Nudges
  nudges: ActivityNudge[];
  
  // Jobs
  backgroundJobs: BackgroundJob[];
  
  // Connection
  connectionStatus: ConnectionStatus;
  
  // Preferences
  preferences: NotificationPreferences | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export interface NotificationContextActions {
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => void;
  filterNotifications: (filter: NotificationFilter) => void;
  
  // Toasts
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (toastId: string) => void;
  clearAllToasts: () => void;
  
  // Confirmations
  showConfirmation: (confirmation: Omit<ConfirmationModal, 'id'>) => void;
  hideConfirmation: () => void;
  
  // Alerts
  showAlert: (alert: Omit<SmartAlert, 'id'>) => void;
  dismissAlert: (alertId: string) => void;
  
  // Nudges
  addNudge: (nudge: Omit<ActivityNudge, 'id'>) => void;
  dismissNudge: (nudgeId: string) => void;
  
  // Jobs
  trackJob: (job: Omit<BackgroundJob, 'id' | 'createdAt'>) => void;
  updateJobProgress: (jobId: string, progress: BackgroundJob['progress']) => void;
  completeJob: (jobId: string, result: BackgroundJob['result']) => void;
  failJob: (jobId: string, error: string) => void;
  
  // Connection
  setConnectionStatus: (status: ConnectionStatus) => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  loadPreferences: () => Promise<void>;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface NotificationHistory {
  total: number;
  read: number;
  unread: number;
  archived: number;
  byType: Record<NotificationType, number>;
  byCategory: Record<NotificationCategory, number>;
}

export interface NotificationStats {
  unreadCount: number;
  unreadByPriority: Record<NotificationPriority, number>;
  unreadByCategory: Record<NotificationCategory, number>;
  oldestUnread?: Date;
  lastNotificationTime?: Date;
}
