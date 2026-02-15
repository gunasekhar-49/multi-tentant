/**
 * Background Job Tracking & Mentions System
 * Progress tracking for bulk imports/exports + @mention notifications
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BackgroundJob, Mention } from '../../types/notifications';
import { notificationTokens } from "../../constants/notificationTokens";

// ============================================================================
// BACKGROUND JOB TRACKING
// ============================================================================

const JobContainer = styled.div<{ isCompleted?: boolean; hasError?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.md};
  padding: ${notificationTokens.spacing.lg};
  border-radius: ${notificationTokens.radius.md};
  background-color: ${props => {
    if (props.hasError) return notificationTokens.colors.error.light;
    if (props.isCompleted) return notificationTokens.colors.success.light;
    return notificationTokens.colors.info.light;
  }};
  border-left: 3px solid ${props => {
    if (props.hasError) return notificationTokens.colors.error.main;
    if (props.isCompleted) return notificationTokens.colors.success.main;
    return notificationTokens.colors.info.main;
  }};
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

const JobHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${notificationTokens.spacing.md};
`;

const JobTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${notificationTokens.spacing.sm};
  font-weight: 700;
  color: ${notificationTokens.colors.neutral[900]};
`;

const JobIcon = styled.div`
  font-size: 18px;
`;

const StatusBadge = styled.div<{ status: BackgroundJob['status'] }>`
  padding: 4px 8px;
  border-radius: ${notificationTokens.radius.full};
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: ${props => {
    switch (props.status) {
      case 'success':
        return notificationTokens.colors.success.main;
      case 'failed':
        return notificationTokens.colors.error.main;
      case 'processing':
        return notificationTokens.colors.info.main;
      default:
        return notificationTokens.colors.neutral[400];
    }
  }};
  color: white;
`;

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.sm};
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: ${notificationTokens.colors.neutral[700]};
`;

const ProgressPercentage = styled.span`
  font-weight: 600;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  border-radius: ${notificationTokens.radius.full};
  background-color: ${notificationTokens.colors.neutral[300]};
  overflow: hidden;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: linear-gradient(
    90deg,
    ${notificationTokens.colors.info.main},
    ${notificationTokens.colors.info.dark}
  );
  transition: width 300ms ease-out;
  border-radius: ${notificationTokens.radius.full};
`;

const ResultsContainer = styled.div`
  display: flex;
  gap: ${notificationTokens.spacing.md};
  padding: ${notificationTokens.spacing.md};
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: ${notificationTokens.radius.md};
`;

const ResultItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ResultCount = styled.div<{ color: string }>`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.color};
`;

const ResultLabel = styled.div`
  font-size: 11px;
  color: ${notificationTokens.colors.neutral[600]};
  text-transform: uppercase;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: ${notificationTokens.spacing.md};
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 12px;
  border: none;
  border-radius: ${notificationTokens.radius.md};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease-in-out;

  ${props =>
    props.variant === 'primary'
      ? `
    background-color: ${notificationTokens.colors.info.main};
    color: white;

    &:hover {
      background-color: ${notificationTokens.colors.info.dark};
    }
  `
      : `
    background-color: ${notificationTokens.colors.neutral[200]};
    color: ${notificationTokens.colors.neutral[900]};

    &:hover {
      background-color: ${notificationTokens.colors.neutral[300]};
    }
  `}
`;

const ErrorReport = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.spacing.sm};
  margin-top: ${notificationTokens.spacing.md};
  max-height: 200px;
  overflow-y: auto;
  background-color: rgba(0, 0, 0, 0.05);
  padding: ${notificationTokens.spacing.md};
  border-radius: ${notificationTokens.radius.md};
`;

const ErrorItem = styled.div`
  font-size: 11px;
  color: ${notificationTokens.colors.error.dark};
  line-height: 1.4;
  border-left: 2px solid ${notificationTokens.colors.error.main};
  padding-left: ${notificationTokens.spacing.sm};
`;

interface BackgroundJobProps {
  job: BackgroundJob;
  onRetry?: () => void;
  onDownload?: () => void;
}

const jobIcons = {
  bulk_import: '📥',
  bulk_export: '📤',
  webhook_sync: '🔄',
  email_send: '📧',
  report_generation: '📊',
  custom: '⚙️',
};

export const BackgroundJobTracker: React.FC<BackgroundJobProps> = ({ job, onRetry, onDownload }) => {
  const isProcessing = job.status === 'processing' || job.status === 'queued';
  const isCompleted = job.status === 'success';
  const hasError = job.status === 'failed';
  const progress = job.progress?.percentage || 0;

  return (
    <JobContainer isCompleted={isCompleted} hasError={hasError}>
      <JobHeader>
        <JobTitle>
          <JobIcon>{jobIcons[job.type] || jobIcons.custom}</JobIcon>
          <div>{job.title}</div>
        </JobTitle>
        <StatusBadge status={job.status}>{job.status}</StatusBadge>
      </JobHeader>

      {job.description && (
        <div style={{ fontSize: '12px', color: notificationTokens.colors.neutral[600] }}>
          {job.description}
        </div>
      )}

      {isProcessing && job.progress && (
        <ProgressContainer>
          <ProgressLabel>
            <span>Progress</span>
            <ProgressPercentage>{progress}%</ProgressPercentage>
          </ProgressLabel>
          <ProgressBar>
            <ProgressFill percentage={progress} />
          </ProgressBar>
          <div style={{ fontSize: '11px', color: notificationTokens.colors.neutral[500] }}>
            {job.progress.current} of {job.progress.total}
          </div>
        </ProgressContainer>
      )}

      {isCompleted && job.result && (
        <ResultsContainer>
          <ResultItem>
            <ResultCount color={notificationTokens.colors.success.main}>
              {job.result.successCount}
            </ResultCount>
            <ResultLabel>Success</ResultLabel>
          </ResultItem>
          {job.result.failureCount > 0 && (
            <ResultItem>
              <ResultCount color={notificationTokens.colors.error.main}>
                {job.result.failureCount}
              </ResultCount>
              <ResultLabel>Failed</ResultLabel>
            </ResultItem>
          )}
          {job.result.warningCount !== undefined && job.result.warningCount > 0 && (
            <ResultItem>
              <ResultCount color={notificationTokens.colors.warning.main}>
                {job.result.warningCount}
              </ResultCount>
              <ResultLabel>Warnings</ResultLabel>
            </ResultItem>
          )}
        </ResultsContainer>
      )}

      {hasError && job.result?.errors && job.result.errors.length > 0 && (
        <ErrorReport>
          {job.result.errors.slice(0, 5).map((error, idx) => (
            <ErrorItem key={idx}>
              {error.row && `Row ${error.row}: `}
              {error.message}
              {error.suggestion && ` (${error.suggestion})`}
            </ErrorItem>
          ))}
          {job.result.errors.length > 5 && (
            <ErrorItem>... and {job.result.errors.length - 5} more errors</ErrorItem>
          )}
        </ErrorReport>
      )}

      <ActionsContainer>
        {isCompleted && job.downloadUrl && onDownload && (
          <ActionButton variant="primary" onClick={onDownload}>
            Download Results
          </ActionButton>
        )}
        {hasError && onRetry && (
          <ActionButton variant="primary" onClick={onRetry}>
            Retry
          </ActionButton>
        )}
        {isProcessing && (
          <ActionButton disabled>
            Running...
          </ActionButton>
        )}
      </ActionsContainer>
    </JobContainer>
  );
};

// ============================================================================
// MENTIONS SYSTEM
// ============================================================================

const MentionBubble = styled.div`
  display: inline-block;
  padding: 2px 8px;
  background-color: ${notificationTokens.colors.accent.purple}40;
  border-radius: ${notificationTokens.radius.sm};
  color: ${notificationTokens.colors.accent.purple};
  font-weight: 600;
  cursor: pointer;
  transition: background-color 150ms ease-in-out;

  &:hover {
    background-color: ${notificationTokens.colors.accent.purple}60;
  }
`;

const MentionNotificationCard = styled.div`
  display: flex;
  gap: ${notificationTokens.spacing.md};
  padding: ${notificationTokens.spacing.md};
  background-color: ${notificationTokens.colors.info.light};
  border-radius: ${notificationTokens.radius.md};
  border-left: 3px solid ${notificationTokens.colors.accent.purple};
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

const MentionAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${notificationTokens.colors.accent.purple};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
`;

const MentionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const MentionUser = styled.div`
  font-weight: 700;
  color: ${notificationTokens.colors.neutral[900]};
  font-size: 13px;
`;

const MentionText = styled.div`
  font-size: 12px;
  color: ${notificationTokens.colors.neutral[700]};
  line-height: 1.4;
`;

const MentionLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${notificationTokens.colors.info.main};
  text-decoration: underline;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  margin-top: ${notificationTokens.spacing.sm};

  &:hover {
    color: ${notificationTokens.colors.info.dark};
  }
`;

interface MentionNotificationProps {
  mention: Mention;
  onView: () => void;
}

export const MentionNotification: React.FC<MentionNotificationProps> = ({ mention, onView }) => {
  return (
    <MentionNotificationCard>
      <MentionAvatar>
        {mention.mentionedBy.userName.charAt(0).toUpperCase()}
      </MentionAvatar>
      <MentionContent>
        <MentionUser>
          {mention.mentionedBy.userName} mentioned you
        </MentionUser>
        <MentionText>
          In {mention.context === 'note' && 'a note'}
          {mention.context === 'comment' && 'a comment'}
          {mention.context === 'email' && 'an email'}
        </MentionText>
        <MentionLink onClick={onView}>
          View context →
        </MentionLink>
      </MentionContent>
    </MentionNotificationCard>
  );
};

// ============================================================================
// MENTION PARSER (Detect @mentions in text)
// ============================================================================

interface ParsedMention {
  username: string;
  startIndex: number;
  endIndex: number;
}

export function parseMentions(text: string): ParsedMention[] {
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const mentions: ParsedMention[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return mentions;
}

export function renderMentions(text: string, onMentionClick?: (username: string) => void) {
  const mentions = parseMentions(text);

  if (mentions.length === 0) {
    return text;
  }

  let lastIndex = 0;
  const parts = [];

  mentions.forEach((mention, idx) => {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, mention.startIndex));
    }

    // Add mention bubble
    const username = mention.username;
    parts.push(
      <MentionBubble
        key={`mention-${idx}`}
        onClick={() => onMentionClick?.(username)}
      >
        @{username}
      </MentionBubble>
    );

    lastIndex = mention.endIndex;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

// ============================================================================
// MENTION SUGGESTION COMPONENT (For input fields)
// ============================================================================

const SuggestionsList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border-radius: ${notificationTokens.radius.md};
  box-shadow: ${notificationTokens.shadows.lg};
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
`;

const SuggestionItem = styled.button<{ isHovered?: boolean }>`
  width: 100%;
  padding: ${notificationTokens.spacing.md};
  border: none;
  background-color: ${props => (props.isHovered ? notificationTokens.colors.neutral[100] : 'white')};
  text-align: left;
  cursor: pointer;
  transition: background-color 150ms ease-in-out;
  display: flex;
  align-items: center;
  gap: ${notificationTokens.spacing.md};

  &:hover {
    background-color: ${notificationTokens.colors.neutral[100]};
  }
`;

const SuggestionAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${notificationTokens.colors.neutral[300]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
`;

const SuggestionText = styled.div`
  font-size: 13px;
  color: ${notificationTokens.colors.neutral[900]};
`;

interface User {
  id: string;
  name: string;
  email: string;
}

interface MentionSuggestionsProps {
  users: User[];
  query: string;
  onSelect: (user: User) => void;
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  users,
  query,
  onSelect,
}) => {
  const filtered = users.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0 || !query) return null;

  return (
    <SuggestionsList>
      {filtered.slice(0, 5).map(user => (
        <SuggestionItem
          key={user.id}
          onClick={() => onSelect(user)}
        >
          <SuggestionAvatar>
            {user.name.charAt(0).toUpperCase()}
          </SuggestionAvatar>
          <SuggestionText>{user.name}</SuggestionText>
        </SuggestionItem>
      ))}
    </SuggestionsList>
  );
};
