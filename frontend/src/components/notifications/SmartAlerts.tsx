/**
 * Smart Alerts Component
 * Persistent banners for critical issues
 * Trial ending, payment failed, integration disconnected, etc.
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { SmartAlert } from '../../types/notifications';
import { notificationTokens } from "../../constants/notificationTokens";

interface SmartAlertsProps {
  alerts: SmartAlert[];
  onDismiss: (alertId: string) => void;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const AlertsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.md};
  padding: ${notificationTokens.spacing.lg};
  animation: slideDown 300ms ease-out;

  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const AlertContainer = styled.div<{ severity: string; isClosing?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${notificationTokens.spacing.md};
  padding: ${notificationTokens.spacing.lg};
  border-radius: ${notificationTokens.radius.lg};
  background-color: ${props => {
    switch (props.severity) {
      case 'critical':
        return notificationTokens.colors.error.light;
      case 'error':
        return notificationTokens.colors.error.light;
      case 'warning':
        return notificationTokens.colors.warning.light;
      default:
        return notificationTokens.colors.info.light;
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.severity) {
      case 'critical':
        return notificationTokens.colors.error.main;
      case 'error':
        return notificationTokens.colors.error.main;
      case 'warning':
        return notificationTokens.colors.warning.main;
      default:
        return notificationTokens.colors.info.main;
    }
  }};
  animation: ${props => (props.isClosing ? 'slideUp' : 'slideDown')} 200ms ease-out forwards;

  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-20px);
      opacity: 0;
    }
  }
`;

const IconContainer = styled.div<{ severity: string }>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.sm};
`;

const Title = styled.div<{ severity: string }>`
  font-size: 14px;
  font-weight: 700;
  color: ${props => {
    switch (props.severity) {
      case 'critical':
        return notificationTokens.colors.error.dark;
      case 'error':
        return notificationTokens.colors.error.dark;
      case 'warning':
        return notificationTokens.colors.warning.dark;
      default:
        return notificationTokens.colors.info.dark;
    }
  }};
`;

const Message = styled.div<{ severity: string }>`
  font-size: 13px;
  color: ${props => {
    switch (props.severity) {
      case 'critical':
        return notificationTokens.colors.error.dark;
      case 'error':
        return notificationTokens.colors.error.dark;
      case 'warning':
        return notificationTokens.colors.warning.dark;
      default:
        return notificationTokens.colors.info.dark;
    }
  }};
  line-height: 1.5;
`;

const Description = styled.div<{ severity: string }>`
  font-size: 12px;
  color: ${props => {
    switch (props.severity) {
      case 'critical':
        return notificationTokens.colors.error.dark;
      case 'error':
        return notificationTokens.colors.error.dark;
      case 'warning':
        return notificationTokens.colors.warning.dark;
      default:
        return notificationTokens.colors.info.dark;
    }
  }};
  opacity: 0.8;
  margin-top: ${notificationTokens.spacing.sm};
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: ${notificationTokens.spacing.md};
  flex-wrap: wrap;
  margin-top: ${notificationTokens.spacing.md};
`;

const ActionButton = styled.button<{ isPrimary?: boolean; severity?: string }>`
  padding: 8px 16px;
  border: none;
  border-radius: ${notificationTokens.radius.md};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  display: flex;
  align-items: center;
  gap: ${notificationTokens.spacing.sm};

  ${props => {
    if (props.isPrimary) {
      const color = (() => {
        switch (props.severity) {
          case 'critical':
          case 'error':
            return notificationTokens.colors.error.main;
          case 'warning':
            return notificationTokens.colors.warning.main;
          default:
            return notificationTokens.colors.info.main;
        }
      })();

      return `
        background-color: ${color};
        color: white;

        &:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${color}40;
        }
      `;
    } else {
      return `
        background-color: transparent;
        color: ${notificationTokens.colors.neutral[600]};
        border: 1px solid ${notificationTokens.colors.neutral[300]};

        &:hover:not(:disabled) {
          background-color: ${notificationTokens.colors.neutral[100]};
        }
      `;
    }
  }};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button<{ severity: string }>`
  background: none;
  border: none;
  padding: ${notificationTokens.spacing.sm};
  cursor: pointer;
  color: ${props => {
    switch (props.severity) {
      case 'critical':
        return notificationTokens.colors.error.dark;
      case 'error':
        return notificationTokens.colors.error.dark;
      case 'warning':
        return notificationTokens.colors.warning.dark;
      default:
        return notificationTokens.colors.info.dark;
    }
  }};
  opacity: 0.6;
  transition: opacity 150ms ease-in-out;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
`;

const Spinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 400ms linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ============================================================================
// ICONS
// ============================================================================

const alertIcons = {
  trial_ending: '⏱️',
  payment_failed: '💳',
  integration_disconnected: '🔌',
  sync_error: '⚠️',
  custom: 'ℹ️',
};

// ============================================================================
// SINGLE ALERT COMPONENT
// ============================================================================

interface SingleAlertProps {
  alert: SmartAlert;
  onDismiss: (alertId: string) => void;
}

const SingleAlert: React.FC<SingleAlertProps> = ({ alert, onDismiss }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [actionStates, setActionStates] = useState<Record<number, boolean>>({});

  // Auto-dismiss if configured
  useEffect(() => {
    if (alert.autoDismissAfter) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => onDismiss(alert.id), 200);
      }, alert.autoDismissAfter);

      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  const handleActionClick = async (index: number) => {
    const action = alert.actions?.[index];
    if (!action) return;

    setActionStates(prev => ({ ...prev, [index]: true }));

    try {
      await action.onClick();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionStates(prev => ({ ...prev, [index]: false }));
    }
  };

  const icon = alertIcons[alert.type] || alertIcons.custom;

  return (
    <AlertContainer
      severity={alert.severity}
      isClosing={isClosing}
      role="alert"
      aria-live="polite"
    >
      <IconContainer severity={alert.severity}>{icon}</IconContainer>

      <Content>
        <Title severity={alert.severity}>{alert.title}</Title>
        <Message severity={alert.severity}>{alert.message}</Message>
        {alert.description && <Description severity={alert.severity}>{alert.description}</Description>}

        {alert.actions && alert.actions.length > 0 && (
          <ActionsContainer>
            {alert.actions.map((action, idx) => (
              <ActionButton
                key={idx}
                isPrimary={action.isPrimary}
                severity={alert.severity}
                onClick={() => handleActionClick(idx)}
                disabled={actionStates[idx]}
              >
                {actionStates[idx] && <Spinner />}
                {action.label}
              </ActionButton>
            ))}
          </ActionsContainer>
        )}
      </Content>

      {alert.isDismissible && (
        <CloseButton
          severity={alert.severity}
          onClick={() => {
            setIsClosing(true);
            setTimeout(() => onDismiss(alert.id), 200);
          }}
          aria-label="Close alert"
        >
          ✕
        </CloseButton>
      )}
    </AlertContainer>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SmartAlerts: React.FC<SmartAlertsProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <AlertsContainer>
      {alerts.map(alert => (
        <SingleAlert key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </AlertsContainer>
  );
};

// ============================================================================
// PRESET ALERT CREATORS (For easy use in components)
// ============================================================================

export const createTrialEndingAlert = (): Omit<SmartAlert, 'id'> => ({
  severity: 'warning',
  type: 'trial_ending',
  title: 'Trial ending soon',
  message: 'Your free trial expires in 7 days',
  description: 'Upgrade now to avoid losing access to your data.',
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

export const createPaymentFailedAlert = (): Omit<SmartAlert, 'id'> => ({
  severity: 'critical',
  type: 'payment_failed',
  title: 'Payment failed',
  message: 'We couldn\'t process your payment',
  description: 'Update your billing information to continue using the service.',
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

export const createIntegrationDisconnectedAlert = (
  integration: string
): Omit<SmartAlert, 'id'> => ({
  severity: 'error',
  type: 'integration_disconnected',
  title: `${integration} disconnected`,
  message: `Your ${integration} integration has been disconnected`,
  description: 'Reconnect to resume syncing data.',
  isDismissible: true,
  actions: [
    {
      label: 'Reconnect',
      isPrimary: true,
      onClick: () => {
        window.location.href = `/app/settings/integrations/${integration}`;
      },
    },
  ],
});

export const createSyncErrorAlert = (): Omit<SmartAlert, 'id'> => ({
  severity: 'error',
  type: 'sync_error',
  title: 'Sync failed',
  message: 'Failed to sync data from connected services',
  isDismissible: true,
  actions: [
    {
      label: 'View details',
      onClick: () => {
        window.location.href = '/app/settings/integrations';
      },
    },
    {
      label: 'Retry',
      isPrimary: true,
      onClick: async () => {
        // Trigger sync retry
      },
    },
  ],
});
