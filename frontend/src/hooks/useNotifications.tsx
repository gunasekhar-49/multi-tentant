/**
 * Permission Warning Component + Custom Hooks
 * For action restrictions and permission explanations
 */

import React from 'react';
import styled from 'styled-components';
import { PermissionWarning } from '../types/notifications';
import { notificationTokens } from '../constants/notificationTokens';
import { useNotification } from '../context/NotificationContext';

// ============================================================================
// PERMISSION WARNING COMPONENT
// ============================================================================

const WarningContainer = styled.div`
  display: flex;
  gap: ${notificationTokens.spacing.md};
  padding: ${notificationTokens.spacing.lg};
  background-color: ${notificationTokens.colors.warning.light};
  border-radius: ${notificationTokens.radius.md};
  border-left: 3px solid ${notificationTokens.colors.warning.main};
  animation: slideInUp 300ms ease-out;

  @keyframes slideInUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const IconContainer = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.sm};
  flex: 1;
`;

const Message = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${notificationTokens.colors.warning.dark};
`;

const Details = styled.div`
  font-size: 12px;
  color: ${notificationTokens.colors.warning.dark};
  opacity: 0.8;
  line-height: 1.5;
`;

const Suggestion = styled.div`
  font-size: 12px;
  background-color: rgba(0, 0, 0, 0.05);
  padding: ${notificationTokens.spacing.sm};
  border-radius: ${notificationTokens.radius.sm};
  margin-top: ${notificationTokens.spacing.sm};
  color: ${notificationTokens.colors.warning.dark};
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${notificationTokens.colors.warning.dark};
  text-decoration: underline;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;

  &:hover {
    opacity: 0.8;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${notificationTokens.colors.warning.dark};
  opacity: 0.6;
  transition: opacity 150ms ease-in-out;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
`;

interface PermissionWarningProps {
  warning: PermissionWarning;
  onDismiss: (warningId: string) => void;
}

export const PermissionWarningComponent: React.FC<PermissionWarningProps> = ({
  warning,
  onDismiss,
}) => {
  return (
    <WarningContainer>
      <IconContainer>🔒</IconContainer>

      <Content>
        <Message>{warning.message}</Message>
        <Details>
          Your current role ({warning.userRole}) cannot perform "{warning.action}". 
          This action requires {warning.requiredRole} permission.
        </Details>
        {warning.suggestion && <Suggestion>{warning.suggestion}</Suggestion>}
        {warning.learnMoreUrl && (
          <LinkButton onClick={() => window.open(warning.learnMoreUrl, '_blank')}>
            Learn about permissions →
          </LinkButton>
        )}
      </Content>

      {warning.dismissible && (
        <CloseButton onClick={() => onDismiss(warning.id)} aria-label="Dismiss">
          ✕
        </CloseButton>
      )}
    </WarningContainer>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * useToast - Show temporary messages
 */
export function useToast() {
  const notification = useNotification();

  return {
    success: (message: string, title?: string, duration?: number) => {
      notification.showToast({
        type: 'success',
        message,
        title,
        duration: duration ?? notificationTokens.timing.toastSuccess,
      });
    },

    error: (message: string, title?: string, duration?: number) => {
      notification.showToast({
        type: 'error',
        message,
        title: title ?? 'Error',
        duration: duration ?? notificationTokens.timing.toastError,
      });
    },

    warning: (message: string, title?: string, duration?: number) => {
      notification.showToast({
        type: 'warning',
        message,
        title,
        duration: duration ?? notificationTokens.timing.toastWarning,
      });
    },

    info: (message: string, title?: string, duration?: number) => {
      notification.showToast({
        type: 'info',
        message,
        title,
        duration: duration ?? notificationTokens.timing.toastInfo,
      });
    },

    sticky: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
      notification.showToast({
        type,
        message,
        title,
        duration: undefined, // No auto-dismiss
      });
    },
  };
}

/**
 * useConfirm - Show confirmation modals
 */
export function useConfirm() {
  const notification = useNotification();

  return {
    delete: async (
      itemName: string,
      onConfirm: () => Promise<void> | void
    ): Promise<boolean> => {
      return new Promise(resolve => {
        notification.showConfirmation({
          type: 'delete_record',
          title: `Delete ${itemName}?`,
          message: 'This action cannot be undone.',
          impact: {
            icon: '🗑️',
            title: 'What will be deleted:',
            items: [`${itemName} and all associated data`],
            severity: 'high',
          },
          recovery: {
            available: false,
            instruction: 'Deleted items cannot be recovered from the trash after 30 days.',
          },
          confirmLabel: 'Delete',
          confirmVariant: 'danger',
          onConfirm: async () => {
            await onConfirm();
            resolve(true);
          },
          onCancel: () => resolve(false),
        });
      });
    },

    bulkDelete: async (count: number, onConfirm: () => Promise<void> | void): Promise<boolean> => {
      return new Promise(resolve => {
        notification.showConfirmation({
          type: 'delete_multiple',
          title: `Delete ${count} items?`,
          message: 'This will permanently remove these records.',
          impact: {
            icon: '⚠️',
            title: 'Bulk deletion:',
            items: [
              `${count} records will be permanently deleted`,
              'All linked activities will be archived',
              'Cannot be undone',
            ],
            severity: 'critical',
          },
          confirmLabel: 'Delete all',
          confirmVariant: 'danger',
          requireInput: {
            label: 'Confirm by typing the number of items:',
            placeholder: count.toString(),
            expectedValue: count.toString(),
          },
          onConfirm: async () => {
            await onConfirm();
            resolve(true);
          },
          onCancel: () => resolve(false),
        });
      });
    },

    changeOwner: async (
      currentOwner: string,
      newOwner: string,
      onConfirm: () => Promise<void> | void
    ): Promise<boolean> => {
      return new Promise(resolve => {
        notification.showConfirmation({
          type: 'change_owner',
          title: `Change owner from ${currentOwner}?`,
          message: `Reassign to ${newOwner}?`,
          impact: {
            icon: '👤',
            title: 'What will change:',
            items: [
              `${currentOwner} will lose ownership`,
              `${newOwner} will receive ownership`,
              'History will be preserved',
            ],
            severity: 'medium',
          },
          recovery: {
            available: true,
            instruction: 'You can change ownership again anytime.',
          },
          confirmLabel: 'Change owner',
          onConfirm: async () => {
            await onConfirm();
            resolve(true);
          },
          onCancel: () => resolve(false),
        });
      });
    },

    custom: async (
      config: Parameters<typeof notification.showConfirmation>[0]
    ): Promise<boolean> => {
      return new Promise(resolve => {
        notification.showConfirmation({
          ...config,
          onConfirm: async () => {
            await config.onConfirm();
            resolve(true);
          },
          onCancel: () => {
            config.onCancel?.();
            resolve(false);
          },
        });
      });
    },
  };
}

/**
 * useAlert - Show persistent alerts
 */
export function useAlert() {
  const notification = useNotification();

  return {
    show: (
      title: string,
      message: string,
      severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
      actions?: Array<{ label: string; onClick: () => Promise<void> | void; isPrimary?: boolean }>
    ) => {
      notification.showAlert({
        severity,
        type: 'custom',
        title,
        message,
        isDismissible: true,
        actions,
      });
    },

    trialEnding: (daysRemaining: number) => {
      notification.showAlert({
        severity: 'warning',
        type: 'trial_ending',
        title: `Trial ending in ${daysRemaining} days`,
        message: 'Upgrade now to avoid losing access.',
        isDismissible: true,
        actions: [
          {
            label: 'Upgrade',
            isPrimary: true,
            onClick: () => {
              window.location.href = '/app/billing';
            },
          },
        ],
      });
    },

    paymentFailed: () => {
      notification.showAlert({
        severity: 'critical',
        type: 'payment_failed',
        title: 'Payment failed',
        message: 'We couldn\'t process your payment. Your service may be interrupted.',
        isDismissible: false,
        actions: [
          {
            label: 'Update billing',
            isPrimary: true,
            onClick: () => {
              window.location.href = '/app/settings/billing';
            },
          },
        ],
      });
    },

    integrationDisconnected: (integration: string) => {
      notification.showAlert({
        severity: 'error',
        type: 'integration_disconnected',
        title: `${integration} disconnected`,
        message: 'Reconnect to resume data syncing.',
        isDismissible: true,
        actions: [
          {
            label: 'Reconnect',
            isPrimary: true,
            onClick: () => {
              window.location.href = `/app/settings/integrations/${integration.toLowerCase()}`;
            },
          },
        ],
      });
    },
  };
}

/**
 * useNudge - Show activity nudges
 */
export function useNudge() {
  const notification = useNotification();

  return {
    leadUntouched: (leadId: string, leadName: string, daysInactive: number) => {
      notification.addNudge({
        type: 'lead_untouched',
        title: 'Lead awaiting follow-up',
        message: `"${leadName}" hasn't been touched in ${daysInactive} days`,
        icon: '👤',
        priority: daysInactive > 14 ? 'high' : 'normal',
        recordType: 'lead',
        recordId: leadId,
        recordName: leadName,
        actionUrl: `/app/leads/${leadId}`,
        dismissible: true,
        daysInactive,
      });
    },

    dealStagnating: (dealId: string, dealName: string, daysSinceLastUpdate: number) => {
      notification.addNudge({
        type: 'deal_stagnating',
        title: 'Deal needs attention',
        message: `"${dealName}" has been idle for ${daysSinceLastUpdate} days`,
        icon: '🔄',
        priority: daysSinceLastUpdate > 30 ? 'high' : 'normal',
        recordType: 'deal',
        recordId: dealId,
        recordName: dealName,
        actionUrl: `/app/deals/${dealId}`,
        dismissible: true,
        daysSinceLastUpdate,
      });
    },

    taskOverdue: (taskId: string, taskName: string) => {
      notification.addNudge({
        type: 'task_overdue',
        title: 'Task overdue',
        message: `"${taskName}" is overdue. Complete or reschedule.`,
        icon: '⏰',
        priority: 'urgent',
        recordType: 'task',
        recordId: taskId,
        recordName: taskName,
        actionUrl: `/app/tasks/${taskId}`,
        dismissible: false,
      });
    },
  };
}

/**
 * useJob - Track background jobs
 */
export function useJob() {
  const notification = useNotification();

  return {
    track: (title: string, type: 'bulk_import' | 'bulk_export' | 'custom', total: number) => {
      const jobId = Math.random().toString(36).substr(2, 9);

      notification.trackJob({
        type,
        status: 'processing',
        title,
        progress: {
          current: 0,
          total,
          percentage: 0,
        },
      });

      return {
        jobId,
        updateProgress: (current: number) => {
          notification.updateJobProgress(jobId, {
            current,
            total,
            percentage: Math.round((current / total) * 100),
          });
        },
        complete: (successCount: number, failureCount: number, errors?: any[]) => {
          notification.completeJob(jobId, {
            successCount,
            failureCount,
            errors,
          });
        },
        fail: (error: string) => {
          notification.failJob(jobId, error);
        },
      };
    },
  };
}

/**
 * useMention - Handle @mentions
 */
export function useMention() {
  const notification = useNotification();

  return {
    notify: (
      _username: string,
      contextType: 'note' | 'comment' | 'email',
      contextUrl: string,
      mentionedBy: string
    ) => {
      notification.addNotification({
        type: 'mention',
        category: 'mentions',
        priority: 'high',
        title: `${mentionedBy} mentioned you`,
        message: `in a ${contextType}`,
        actionUrl: contextUrl,
        actionLabel: 'View',
        isRead: false,
        isArchived: false,
        tenantId: '', // Set by provider
        userId: '', // Set by provider
      });
    },
  };
}

/**
 * usePermissionWarning - Show permission errors
 */
export function usePermissionWarning() {
  const notification = useNotification();

  return {
    show: (
      action: string,
      _userRole: string,
      _requiredRole: string,
      _suggestion?: string
    ) => {
      const warningId = Math.random().toString(36).substr(2, 9);

      // Show as toast notification
      notification.showToast({
        type: 'warning',
        title: 'Action restricted',
        message: `You need higher permissions to ${action}`,
        duration: notificationTokens.timing.toastWarning,
      });

      return warningId;
    },
  };
}
