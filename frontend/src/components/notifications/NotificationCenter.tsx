/**
 * Notification Center Component
 * Bell icon in top bar
 * Unread counter, filter tabs, time grouping, deep links, mark read
 */

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Notification, NotificationCategory, NotificationPriority } from '../../types/notifications';
import { notificationTokens } from "../../constants/notificationTokens";

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onArchive: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const BellButton = styled.button<{ hasUnread: boolean }>`
  position: relative;
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  font-size: 20px;
  color: ${notificationTokens.colors.neutral[600]};
  transition: color 150ms ease-in-out;

  &:hover {
    color: ${notificationTokens.colors.neutral[900]};
  }

  ${props =>
    props.hasUnread &&
    `
    color: ${notificationTokens.colors.info.main};
    animation: ${notificationTokens.animations.pulse.duration} ${notificationTokens.animations.pulse.easing} infinite;
  `}
`;

const UnreadBadge = styled.div<{ count: number }>`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background-color: ${notificationTokens.colors.error.main};
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: ${notificationTokens.radius.full};
  border: 2px solid white;
  animation: ${notificationTokens.animations.badgePulse.duration} ${notificationTokens.animations.badgePulse.easing} infinite;
`;

const PanelOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${notificationTokens.colors.neutral[900]}99;
  opacity: ${props => (props.isOpen ? 1 : 0)};
  visibility: ${props => (props.isOpen ? 'visible' : 'hidden')};
  transition: opacity 200ms ease-in-out, visibility 200ms ease-in-out;
  z-index: ${notificationTokens.zIndex.notification - 1};
`;

const PanelContainer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 60px;
  right: 20px;
  width: ${notificationTokens.notificationCenter.maxWidth};
  max-height: ${notificationTokens.notificationCenter.maxHeight};
  background-color: ${notificationTokens.notificationCenter.backgroundColor};
  border-radius: ${notificationTokens.radius.lg};
  box-shadow: ${notificationTokens.shadows.modal};
  display: flex;
  flex-direction: column;
  opacity: ${props => (props.isOpen ? 1 : 0)};
  transform: ${props => (props.isOpen ? 'scale(1)' : 'scale(0.95)')};
  pointer-events: ${props => (props.isOpen ? 'auto' : 'none')};
  transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
  z-index: ${notificationTokens.zIndex.notification};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${notificationTokens.spacing.md} ${notificationTokens.spacing.lg};
  border-bottom: 1px solid ${notificationTokens.colors.neutral[200]};
  flex-shrink: 0;
`;

const PanelTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: ${notificationTokens.colors.neutral[900]};
  margin: 0;
`;

const MarkAllButton = styled.button`
  background: none;
  border: none;
  padding: 4px 8px;
  font-size: 12px;
  color: ${notificationTokens.colors.info.main};
  cursor: pointer;
  font-weight: 600;
  transition: color 150ms ease-in-out;

  &:hover {
    color: ${notificationTokens.colors.info.dark};
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 4px;
  padding: ${notificationTokens.spacing.md};
  border-bottom: 1px solid ${notificationTokens.colors.neutral[200]};
  overflow-x: auto;
  flex-shrink: 0;
`;

const Tab = styled.button<{ isActive: boolean }>`
  background: none;
  border: none;
  padding: 6px 12px;
  border-radius: ${notificationTokens.radius.full};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  color: ${props =>
    props.isActive ? notificationTokens.colors.info.main : notificationTokens.colors.neutral[600]};
  background-color: ${props =>
    props.isActive ? notificationTokens.colors.info.light : 'transparent'};
  transition: all 150ms ease-in-out;

  &:hover {
    background-color: ${props =>
      props.isActive ? notificationTokens.colors.info.light : notificationTokens.colors.neutral[100]};
  }
`;

const NotificationsList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${notificationTokens.colors.neutral[300]};
    border-radius: ${notificationTokens.radius.full};

    &:hover {
      background: ${notificationTokens.colors.neutral[400]};
    }
  }
`;

const TimeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${notificationTokens.notificationCenter.itemMargin};
  padding: ${notificationTokens.spacing.lg} 0;

  &:first-child {
    padding-top: ${notificationTokens.spacing.md};
  }

  &:last-child {
    padding-bottom: ${notificationTokens.spacing.md};
  }
`;

const TimeLabel = styled.div`
  padding: 0 ${notificationTokens.spacing.lg};
  font-size: ${notificationTokens.notificationCenter.timeLabelSize};
  color: ${notificationTokens.notificationCenter.timeLabelColor};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NotificationItem = styled.div<{ isRead: boolean; isPriority: boolean }>`
  display: flex;
  gap: ${notificationTokens.notificationCenter.itemMargin};
  padding: ${notificationTokens.notificationCenter.itemPadding};
  margin: 0 ${notificationTokens.spacing.md};
  border-radius: ${notificationTokens.notificationCenter.itemBorderRadius};
  cursor: pointer;
  transition: background-color 150ms ease-in-out;
  background-color: ${props => (props.isRead ? 'transparent' : notificationTokens.notificationCenter.itemUnreadBg)};
  opacity: ${props => (props.isRead ? notificationTokens.notificationCenter.itemReadOpacity : 1)};

  &:hover {
    background-color: ${notificationTokens.notificationCenter.itemHoverBg};
  }

  ${props =>
    props.isPriority &&
    `
    border-left: 3px solid ${notificationTokens.colors.error.main};
    padding-left: calc(${notificationTokens.notificationCenter.itemPadding} - 3px);
  `}
`;

const UnreadIndicator = styled.div<{ visible: boolean }>`
  width: ${notificationTokens.notificationCenter.unreadDotSize};
  height: ${notificationTokens.notificationCenter.unreadDotSize};
  border-radius: ${notificationTokens.radius.full};
  background-color: ${notificationTokens.notificationCenter.unreadDotColor};
  opacity: ${props => (props.visible ? 1 : 0)};
  flex-shrink: 0;
  margin-top: 4px;
`;

const Avatar = styled.div`
  width: ${notificationTokens.notificationCenter.avatarSize};
  height: ${notificationTokens.notificationCenter.avatarSize};
  border-radius: ${notificationTokens.radius.full};
  background-color: ${notificationTokens.notificationCenter.avatarBg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: ${notificationTokens.colors.neutral[600]};
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const NotificationContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.div`
  font-size: ${notificationTokens.typography.notificationTitle.fontSize};
  font-weight: ${notificationTokens.typography.notificationTitle.fontWeight};
  color: ${notificationTokens.typography.notificationTitle.color};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NotificationMessage = styled.div`
  font-size: ${notificationTokens.typography.notificationMessage.fontSize};
  color: ${notificationTokens.typography.notificationMessage.color};
  line-height: ${notificationTokens.typography.notificationMessage.lineHeight};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NotificationTime = styled.div`
  font-size: ${notificationTokens.typography.notificationTime.fontSize};
  color: ${notificationTokens.typography.notificationTime.color};
  margin-top: 4px;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 150ms ease-in-out;

  ${NotificationItem}:hover & {
    opacity: 1;
  }
`;

const ActionIcon = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${notificationTokens.colors.neutral[400]};
  font-size: 14px;
  transition: color 150ms ease-in-out;

  &:hover {
    color: ${notificationTokens.colors.neutral[600]};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${notificationTokens.spacing['3xl']};
  color: ${notificationTokens.colors.neutral[400]};
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 32px;
  margin-bottom: ${notificationTokens.spacing.md};
`;

// ============================================================================
// TIME GROUPING LOGIC
// ============================================================================

function getTimeGroup(date: Date): string {
  const now = new Date();
  const notificationDate = new Date(date);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const notificationDay = new Date(
    notificationDate.getFullYear(),
    notificationDate.getMonth(),
    notificationDate.getDate()
  );

  if (notificationDay.getTime() === today.getTime()) return 'Today';
  if (notificationDay.getTime() === yesterday.getTime()) return 'Yesterday';
  if (notificationDay > weekAgo) return 'This Week';
  return 'Earlier';
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onArchive,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | NotificationCategory>('all');

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (n.isArchived) return false;
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'unread') return !n.isRead;
      return n.category === selectedFilter;
    });
  }, [notifications, selectedFilter]);

  // Group by time
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Earlier: [],
    };

    filteredNotifications.forEach(notification => {
      const group = getTimeGroup(notification.createdAt);
      groups[group].push(notification);
    });

    return groups;
  }, [filteredNotifications]);

  const categories: NotificationCategory[] = [
    'crm',
    'billing',
    'system',
    'team',
    'automation',
    'mentions',
  ];

  return (
    <>
      <BellButton
        hasUnread={unreadCount > 0}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        🔔
        {unreadCount > 0 && <UnreadBadge count={unreadCount}>{unreadCount > 99 ? '99+' : unreadCount}</UnreadBadge>}
      </BellButton>

      <PanelOverlay isOpen={isOpen} onClick={() => setIsOpen(false)} />

      <PanelContainer isOpen={isOpen}>
        <PanelHeader>
          <PanelTitle>Notifications</PanelTitle>
          <MarkAllButton onClick={onMarkAllAsRead}>Mark all read</MarkAllButton>
        </PanelHeader>

        <TabContainer>
          <Tab
            isActive={selectedFilter === 'all'}
            onClick={() => setSelectedFilter('all')}
          >
            All
          </Tab>
          <Tab
            isActive={selectedFilter === 'unread'}
            onClick={() => setSelectedFilter('unread')}
          >
            Unread ({unreadCount})
          </Tab>
          {categories.map(cat => (
            <Tab
              key={cat}
              isActive={selectedFilter === cat}
              onClick={() => setSelectedFilter(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Tab>
          ))}
        </TabContainer>

        <NotificationsList>
          {filteredNotifications.length === 0 ? (
            <EmptyState>
              <EmptyIcon>✓</EmptyIcon>
              <div>All caught up!</div>
            </EmptyState>
          ) : (
            Object.entries(groupedNotifications).map(([timeGroup, items]) =>
              items.length > 0 ? (
                <TimeSection key={timeGroup}>
                  <TimeLabel>{timeGroup}</TimeLabel>
                  {items.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      isRead={notification.isRead}
                      isPriority={notification.priority === 'urgent' || notification.priority === 'high'}
                      onClick={() => {
                        if (!notification.isRead) {
                          onMarkAsRead(notification.id);
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <UnreadIndicator visible={!notification.isRead} />

                      {notification.triggeredBy?.userAvatar ? (
                        <Avatar>
                          <img src={notification.triggeredBy.userAvatar} alt="" />
                        </Avatar>
                      ) : (
                        <Avatar>{notification.triggeredBy?.userName.charAt(0).toUpperCase()}</Avatar>
                      )}

                      <NotificationContent>
                        <NotificationTitle>{notification.title}</NotificationTitle>
                        <NotificationMessage>{notification.message}</NotificationMessage>
                        <NotificationTime>{formatTime(notification.createdAt)}</NotificationTime>
                      </NotificationContent>

                      <NotificationActions onClick={e => e.stopPropagation()}>
                        {notification.actionUrl && (
                          <ActionIcon
                            title="View"
                            onClick={() => (window.location.href = notification.actionUrl!)}
                          >
                            →
                          </ActionIcon>
                        )}
                        <ActionIcon
                          title="Archive"
                          onClick={() => onArchive(notification.id)}
                        >
                          📦
                        </ActionIcon>
                        <ActionIcon
                          title="Delete"
                          onClick={() => onDelete(notification.id)}
                        >
                          🗑️
                        </ActionIcon>
                      </NotificationActions>
                    </NotificationItem>
                  ))}
                </TimeSection>
              ) : null
            )
          )}
        </NotificationsList>
      </PanelContainer>
    </>
  );
};
