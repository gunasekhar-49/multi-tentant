/**
 * Connection Status Indicator & Activity Nudges
 * Real-time badge + Intelligent productivity nudges
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { ConnectionStatus } from '../../types/notifications';
import { ActivityNudge } from '../../types/notifications';
import { notificationTokens } from "../../constants/notificationTokens";

// ============================================================================
// CONNECTION STATUS BADGE
// ============================================================================

const StatusBadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${notificationTokens.spacing.sm};
  padding: 6px 10px;
  border-radius: ${notificationTokens.radius.full};
  font-size: 12px;
  font-weight: 600;
  background-color: ${notificationTokens.colors.neutral[100]};
`;

const StatusIndicator = styled.div<{ status: ConnectionStatus }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'connected':
        return notificationTokens.colors.success.main;
      case 'reconnecting':
        return notificationTokens.colors.warning.main;
      case 'offline':
        return notificationTokens.colors.error.main;
    }
  }};
  animation: ${props => (props.status === 'reconnecting' ? 'pulse' : 'none')} 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const StatusText = styled.span<{ status: ConnectionStatus }>`
  color: ${props => {
    switch (props.status) {
      case 'connected':
        return notificationTokens.colors.success.dark;
      case 'reconnecting':
        return notificationTokens.colors.warning.dark;
      case 'offline':
        return notificationTokens.colors.error.dark;
    }
  }};
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  background-color: ${notificationTokens.colors.neutral[900]};
  color: white;
  font-size: 11px;
  border-radius: ${notificationTokens.radius.sm};
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease-in-out;
  z-index: 1000;
`;

const BadgeWrapper = styled.div`
  position: relative;

  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  lastConnectedAt?: Date;
  nextRetryAt?: Date;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  status,
  lastConnectedAt,
  nextRetryAt,
}) => {
  const getStatusLabel = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'offline':
        return 'Offline';
    }
  };

  const getTooltipText = () => {
    if (status === 'reconnecting' && nextRetryAt) {
      const seconds = Math.ceil((nextRetryAt.getTime() - Date.now()) / 1000);
      return `Retrying in ${seconds}s`;
    }
    if (lastConnectedAt) {
      return `Last connected: ${lastConnectedAt.toLocaleTimeString()}`;
    }
    return '';
  };

  return (
    <BadgeWrapper>
      <StatusBadgeContainer>
        <StatusIndicator status={status} />
        <StatusText status={status}>{getStatusLabel()}</StatusText>
      </StatusBadgeContainer>
      {getTooltipText() && <Tooltip>{getTooltipText()}</Tooltip>}
    </BadgeWrapper>
  );
};

// ============================================================================
// ACTIVITY NUDGES PANEL
// ============================================================================

const NudgesContainer = styled.div`
  position: fixed;
  bottom: ${notificationTokens.spacing.lg};
  left: ${notificationTokens.spacing.lg};
  width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.md};
  z-index: ${notificationTokens.zIndex.notification};
`;

const NudgeCard = styled.div<{ priority: string; isClosing?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.sm};
  padding: ${notificationTokens.spacing.md};
  background-color: white;
  border-radius: ${notificationTokens.radius.md};
  box-shadow: ${notificationTokens.shadows.md};
  border-left: 3px solid ${props => {
    switch (props.priority) {
      case 'urgent':
        return notificationTokens.colors.error.main;
      case 'high':
        return notificationTokens.colors.warning.main;
      default:
        return notificationTokens.colors.info.main;
    }
  }};
  animation: ${props => (props.isClosing ? 'slideOutLeft' : 'slideInLeft')} 300ms ease-out forwards;

  @keyframes slideInLeft {
    from {
      transform: translateX(-40px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-40px);
      opacity: 0;
    }
  }
`;

const NudgeIcon = styled.div`
  font-size: 16px;
`;

const NudgeTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${notificationTokens.colors.neutral[900]};
`;

const NudgeMessage = styled.div`
  font-size: 12px;
  color: ${notificationTokens.colors.neutral[600]};
  line-height: 1.4;
`;

const NudgeMetadata = styled.div`
  font-size: 11px;
  color: ${notificationTokens.colors.neutral[400]};
  margin-top: ${notificationTokens.spacing.sm};
`;

const NudgeActions = styled.div`
  display: flex;
  gap: ${notificationTokens.spacing.sm};
  margin-top: ${notificationTokens.spacing.md};
`;

const NudgeButton = styled.button<{ isPrimary?: boolean }>`
  flex: 1;
  padding: 6px 10px;
  border: none;
  border-radius: ${notificationTokens.radius.sm};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease-in-out;

  ${props =>
    props.isPrimary
      ? `
    background-color: ${notificationTokens.colors.info.main};
    color: white;

    &:hover {
      background-color: ${notificationTokens.colors.info.dark};
    }
  `
      : `
    background-color: ${notificationTokens.colors.neutral[100]};
    color: ${notificationTokens.colors.neutral[600]};

    &:hover {
      background-color: ${notificationTokens.colors.neutral[200]};
    }
  `}
`;

const nudgeIcons = {
  lead_untouched: '👤',
  deal_stagnating: '🔄',
  task_overdue: '⏰',
  follow_up_due: '📞',
  meeting_starting: '📅',
  high_value_deal: '💰',
  sla_at_risk: '⚠️',
};

// Nudge message templates (available for future use)
/*
const nudgeMessages = {
  lead_untouched: (daysInactive: number) =>
    `This lead hasn't been touched in ${daysInactive} days. Time to follow up?`,
  deal_stagnating: (daysSinceLastUpdate: number) =>
    `No updates on this deal for ${daysSinceLastUpdate} days. Check in with the customer.`,
  task_overdue: () => 'This task is overdue. Complete or reschedule it.',
  follow_up_due: () => 'A follow-up is due. Reach out to stay on track.',
  meeting_starting: () => 'Your meeting starts in 15 minutes.',
  high_value_deal: () => 'High-value deal requiring attention.',
  sla_at_risk: () => 'SLA is at risk for this ticket.',
};
*/

interface SingleNudgeProps {
  nudge: ActivityNudge;
  onDismiss: (nudgeId: string) => void;
}

const SingleNudge: React.FC<SingleNudgeProps> = ({ nudge, onDismiss }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => onDismiss(nudge.id), 300);
  };

  const handleView = () => {
    window.location.href = nudge.actionUrl;
  };

  return (
    <NudgeCard priority={nudge.priority} isClosing={isClosing}>
      <NudgeIcon>{nudgeIcons[nudge.type] || '💡'}</NudgeIcon>
      <NudgeTitle>{nudge.title}</NudgeTitle>
      <NudgeMessage>{nudge.message}</NudgeMessage>
      {(nudge.daysInactive || nudge.daysSinceLastUpdate) && (
        <NudgeMetadata>
          Record: {nudge.recordName}
        </NudgeMetadata>
      )}

      <NudgeActions>
        <NudgeButton isPrimary onClick={handleView}>
          View
        </NudgeButton>
        {nudge.dismissible && (
          <NudgeButton onClick={handleDismiss}>
            Dismiss
          </NudgeButton>
        )}
      </NudgeActions>
    </NudgeCard>
  );
};

interface ActivityNudgesProps {
  nudges: ActivityNudge[];
  onDismiss: (nudgeId: string) => void;
}

export const ActivityNudges: React.FC<ActivityNudgesProps> = ({ nudges, onDismiss }) => {
  if (nudges.length === 0) return null;

  return (
    <NudgesContainer>
      {nudges.map(nudge => (
        <SingleNudge key={nudge.id} nudge={nudge} onDismiss={onDismiss} />
      ))}
    </NudgesContainer>
  );
};

// ============================================================================
// NUDGE FACTORY FUNCTIONS (Easy creation)
// ============================================================================

export const createLeadUntouchedNudge = (
  leadId: string,
  leadName: string,
  daysInactive: number
): Omit<ActivityNudge, 'id'> => ({
  type: 'lead_untouched',
  title: 'Lead awaiting follow-up',
  message: `"${leadName}" hasn't been touched in ${daysInactive} days`,
  icon: nudgeIcons.lead_untouched,
  priority: daysInactive > 14 ? 'high' : 'normal',
  recordType: 'lead',
  recordId: leadId,
  recordName: leadName,
  actionUrl: `/app/leads/${leadId}`,
  dismissible: true,
  daysInactive,
});

export const createDealStagnatingNudge = (
  dealId: string,
  dealName: string,
  daysSinceLastUpdate: number
): Omit<ActivityNudge, 'id'> => ({
  type: 'deal_stagnating',
  title: 'Deal needs attention',
  message: `"${dealName}" has stagnated for ${daysSinceLastUpdate} days`,
  icon: nudgeIcons.deal_stagnating,
  priority: daysSinceLastUpdate > 30 ? 'high' : 'normal',
  recordType: 'deal',
  recordId: dealId,
  recordName: dealName,
  actionUrl: `/app/deals/${dealId}`,
  dismissible: true,
  daysSinceLastUpdate,
});

export const createTaskOverdueNudge = (
  taskId: string,
  taskName: string
): Omit<ActivityNudge, 'id'> => ({
  type: 'task_overdue',
  title: 'Task overdue',
  message: `"${taskName}" is overdue. Complete or reschedule.`,
  icon: nudgeIcons.task_overdue,
  priority: 'urgent',
  recordType: 'task',
  recordId: taskId,
  recordName: taskName,
  actionUrl: `/app/tasks/${taskId}`,
  dismissible: false,
});

export const createFollowUpDueNudge = (
  recordType: 'lead' | 'deal' | 'contact',
  recordId: string,
  recordName: string
): Omit<ActivityNudge, 'id'> => ({
  type: 'follow_up_due',
  title: 'Follow-up due',
  message: `Time to follow up with "${recordName}"`,
  icon: nudgeIcons.follow_up_due,
  priority: 'normal',
  recordType: recordType as any,
  recordId,
  recordName,
  actionUrl: `/app/${recordType}s/${recordId}`,
  dismissible: true,
});

export const createMeetingStartingNudge = (
  meetingName: string
): Omit<ActivityNudge, 'id'> => ({
  type: 'meeting_starting',
  title: 'Upcoming meeting',
  message: `"${meetingName}" starts in 15 minutes`,
  icon: nudgeIcons.meeting_starting,
  priority: 'high',
  recordType: 'task',
  recordId: '',
  recordName: meetingName,
  actionUrl: '/app/calendar',
  dismissible: true,
});

export const createHighValueDealNudge = (
  dealId: string,
  dealName: string,
  dealValue: number
): Omit<ActivityNudge, 'id'> => ({
  type: 'high_value_deal',
  title: 'High-value deal',
  message: `"${dealName}" (${dealValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}) needs your attention`,
  icon: nudgeIcons.high_value_deal,
  priority: 'high',
  recordType: 'deal',
  recordId: dealId,
  recordName: dealName,
  actionUrl: `/app/deals/${dealId}`,
  dismissible: true,
});

export const createSLAAtRiskNudge = (
  ticketId: string,
  ticketName: string,
  hoursRemaining: number
): Omit<ActivityNudge, 'id'> => ({
  type: 'sla_at_risk',
  title: 'SLA at risk',
  message: `"${ticketName}" SLA violation in ${hoursRemaining} hours`,
  icon: nudgeIcons.sla_at_risk,
  priority: hoursRemaining < 2 ? 'urgent' : 'high',
  recordType: 'ticket',
  recordId: ticketId,
  recordName: ticketName,
  actionUrl: `/app/tickets/${ticketId}`,
  dismissible: false,
});
