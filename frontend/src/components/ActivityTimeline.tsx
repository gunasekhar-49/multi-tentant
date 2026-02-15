import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { activityTimeline, ActivityLog, ActivityFilter } from '../services/activityTimeline';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 8px;
  }

  p {
    color: #666;
    font-size: 14px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;

  .label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .value {
    font-size: 24px;
    font-weight: 700;
    color: #667eea;
  }
`;

const FilterBar = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  align-items: center;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;

  &:hover {
    border-color: #667eea;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const ClearButton = styled.button`
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const TimelineContainer = styled.div`
  position: relative;
  padding-left: 40px;

  &::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  }
`;

const TimelineItem = styled.div`
  margin-bottom: 24px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: -35px;
    top: 3px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    border: 3px solid #667eea;
  }
`;

const ActivityCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #667eea;
  }
`;

const ActivityHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const ActivityInfo = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
`;

const ActivityTime = styled.p`
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #6b7280;
`;

const ActionBadge = styled.span<{ action: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.action) {
      case 'created':
        return '#dcfce7';
      case 'updated':
        return '#dbeafe';
      case 'deleted':
        return '#fee2e2';
      case 'assigned':
        return '#fef3c7';
      case 'commented':
        return '#e9d5ff';
      case 'exported':
        return '#d1d5db';
      default:
        return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.action) {
      case 'created':
        return '#166534';
      case 'updated':
        return '#0c4a6e';
      case 'deleted':
        return '#991b1b';
      case 'assigned':
        return '#92400e';
      case 'commented':
        return '#6b21a8';
      case 'exported':
        return '#374151';
      default:
        return '#4b5563';
    }
  }};
`;

const ResourceBadge = styled.span<{ resource: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: #f0f9ff;
  color: #0369a1;
`;

const ChangesList = styled.div`
  background: #f9fafb;
  border-left: 3px solid #667eea;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
  font-size: 12px;
`;

const ChangeItem = styled.div`
  margin-bottom: 8px;
  color: #374151;

  .field {
    font-weight: 600;
    color: #1a1a1a;
  }

  .old-value {
    color: #991b1b;
    text-decoration: line-through;
  }

  .new-value {
    color: #166534;
    font-weight: 600;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;

  p {
    margin: 0;
  }
`;

export const ActivityTimeline: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>({});
  const [stats, setStats] = useState({ totalLogs: 0, byAction: {} as any, byResource: {} as any, activeUsers: 0 });

  useEffect(() => {
    const allActivities = activityTimeline.getActivity(filter);
    setActivities(allActivities);

    const activityStats = activityTimeline.getStats();
    setStats(activityStats);
  }, [filter]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  const handleFilterChange = (key: keyof ActivityFilter, value: any) => {
    setFilter({ ...filter, [key]: value || undefined });
  };

  const handleClearFilters = () => {
    setFilter({});
  };

  return (
    <Container>
      <Header>
        <h1>📋 Activity Timeline</h1>
        <p>Complete audit log of all changes across your CRM</p>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="label">Total Activities</div>
          <div className="value">{stats.totalLogs}</div>
        </StatCard>
        <StatCard>
          <div className="label">Active Users</div>
          <div className="value">{stats.activeUsers}</div>
        </StatCard>
        <StatCard>
          <div className="label">Records Updated</div>
          <div className="value">{stats.byAction.updated || 0}</div>
        </StatCard>
        <StatCard>
          <div className="label">Records Created</div>
          <div className="value">{stats.byAction.created || 0}</div>
        </StatCard>
      </StatsGrid>

      <FilterBar>
        <FilterSelect
          value={filter.recordType || ''}
          onChange={e => handleFilterChange('recordType', e.target.value)}
        >
          <option value="">All Resources</option>
          <option value="lead">Leads</option>
          <option value="contact">Contacts</option>
          <option value="deal">Deals</option>
          <option value="task">Tasks</option>
        </FilterSelect>

        <FilterSelect
          value={filter.action || ''}
          onChange={e => handleFilterChange('action', e.target.value)}
        >
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="assigned">Assigned</option>
          <option value="commented">Commented</option>
        </FilterSelect>

        <FilterInput
          type="text"
          placeholder="Search activity..."
          onChange={e => handleFilterChange('searchTerm', e.target.value)}
        />

        <ClearButton onClick={handleClearFilters}>Clear Filters</ClearButton>
      </FilterBar>

      {activities.length === 0 ? (
        <EmptyState>
          <p>No activities found</p>
        </EmptyState>
      ) : (
        <TimelineContainer>
          {activities.map(activity => (
            <TimelineItem key={activity.id}>
              <ActivityCard>
                <ActivityHeader>
                  <Avatar>{getInitials(activity.userName)}</Avatar>
                  <ActivityInfo>
                    <ActivityTitle>{activity.description}</ActivityTitle>
                    <ActivityTime>{formatTime(activity.timestamp)}</ActivityTime>
                  </ActivityInfo>
                  <ActionBadge action={activity.action}>{activity.action}</ActionBadge>
                  <ResourceBadge resource={activity.recordType}>{activity.recordType}</ResourceBadge>
                </ActivityHeader>

                {activity.changes.length > 0 && (
                  <ChangesList>
                    {activity.changes.map((change, idx) => (
                      <ChangeItem key={idx}>
                        <span className="field">{change.field}:</span>{' '}
                        {change.oldValue !== null && (
                          <>
                            <span className="old-value">{String(change.oldValue)}</span> →{' '}
                          </>
                        )}
                        <span className="new-value">{String(change.newValue)}</span>
                      </ChangeItem>
                    ))}
                  </ChangesList>
                )}
              </ActivityCard>
            </TimelineItem>
          ))}
        </TimelineContainer>
      )}
    </Container>
  );
};
