import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { savedViewsService, SavedView, ViewType } from '../services/savedViews';

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
    margin: 0 0 8px 0;
  }

  p {
    color: #666;
    font-size: 14px;
    margin: 0;
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

const Tabs = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 12px 20px;
  background: none;
  border: none;
  color: ${props => props.active ? '#667eea' : '#6b7280'};
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  border-bottom: ${props => props.active ? '2px solid #667eea' : 'none'};
  margin-bottom: -2px;

  &:hover {
    color: #667eea;
  }
`;

const ViewsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const ViewCard = styled.div<{ isDefault?: boolean }>`
  background: white;
  border: ${props => props.isDefault ? '2px solid #667eea' : '1px solid #e5e7eb'};
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
  position: relative;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: #667eea;
  }
`;

const ViewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ViewName = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
`;

const PinButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const ViewDescription = styled.p`
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
`;

const FiltersList = styled.div`
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 12px;
`;

const FilterItem = styled.div`
  color: #4b5563;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }

  .field {
    font-weight: 600;
    color: #1a1a1a;
  }
`;

const Badge = styled.span<{ type?: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: #f0f9ff;
  color: #0369a1;
  margin-right: 8px;
`;

const DefaultBadge = styled(Badge)`
  background: #fef3c7;
  color: #92400e;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  flex: 1;
  padding: 8px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #5568d3;
  }
`;

const SecondaryButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;

  &:hover {
    background: #e5e7eb;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;

  p {
    margin: 0 0 16px 0;
    font-size: 14px;
  }
`;

export const SavedViewsManager: React.FC = () => {
  const [selectedType, setSelectedType] = useState<ViewType>('lead');
  const [views, setViews] = useState<SavedView[]>([]);
  const [stats, setStats] = useState({ total: 0, pinned: 0, byType: { lead: 0, contact: 0, deal: 0 } });

  // Mock user - in real app would come from auth
  const userId = 'user-1';

  useEffect(() => {
    loadViews();
  }, [selectedType]);

  const loadViews = () => {
    const typeViews = savedViewsService.getViewsByType(userId, selectedType);
    setViews(typeViews);

    const viewStats = savedViewsService.getStats(userId);
    setStats(viewStats);
  };

  const handleTogglePin = (viewId: string) => {
    savedViewsService.togglePin(viewId);
    loadViews();
  };

  const handleSetDefault = (viewId: string) => {
    savedViewsService.setAsDefault(userId, viewId, selectedType);
    loadViews();
  };

  const handleDeleteView = (viewId: string) => {
    if (window.confirm('Delete this view?')) {
      savedViewsService.deleteView(viewId);
      loadViews();
    }
  };

  const getFilterDescription = (field: string, value: any): string => {
    if (Array.isArray(value)) {
      return `${field} in [${value.join(', ')}]`;
    }
    return `${field} = ${value}`;
  };

  return (
    <Container>
      <Header>
        <h1>🎯 Saved Views & Smart Filters</h1>
        <p>Create and manage custom views for quick access to your data</p>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="label">Total Views</div>
          <div className="value">{stats.total}</div>
        </StatCard>
        <StatCard>
          <div className="label">Pinned Views</div>
          <div className="value">{stats.pinned}</div>
        </StatCard>
        <StatCard>
          <div className="label">Lead Views</div>
          <div className="value">{stats.byType.lead}</div>
        </StatCard>
        <StatCard>
          <div className="label">Deal Views</div>
          <div className="value">{stats.byType.deal}</div>
        </StatCard>
      </StatsGrid>

      <Tabs>
        <TabButton active={selectedType === 'lead'} onClick={() => setSelectedType('lead')}>
          Leads
        </TabButton>
        <TabButton active={selectedType === 'contact'} onClick={() => setSelectedType('contact')}>
          Contacts
        </TabButton>
        <TabButton active={selectedType === 'deal'} onClick={() => setSelectedType('deal')}>
          Deals
        </TabButton>
      </Tabs>

      {views.length === 0 ? (
        <EmptyState>
          <p>No saved views for {selectedType}s yet</p>
          <p style={{ fontSize: '12px' }}>Create custom views to quickly filter and access your data</p>
        </EmptyState>
      ) : (
        <ViewsGrid>
          {views.map(view => (
            <ViewCard key={view.id} isDefault={view.isDefault}>
              <ViewHeader>
                <ViewName>{view.name}</ViewName>
                <PinButton onClick={() => handleTogglePin(view.id)} title="Pin/Unpin">
                  {view.isPinned ? '📌' : '📍'}
                </PinButton>
              </ViewHeader>

              <ViewDescription>{view.description}</ViewDescription>

              {view.filters.length > 0 && (
                <FiltersList>
                  {view.filters.map(filter => (
                    <FilterItem key={filter.id}>
                      <span className="field">{filter.field}</span> {filter.operator}{' '}
                      {getFilterDescription(filter.field, filter.value)}
                    </FilterItem>
                  ))}
                </FiltersList>
              )}

              <div style={{ marginBottom: '12px' }}>
                {view.isDefault && <DefaultBadge>Default</DefaultBadge>}
                {view.isPublic && <Badge type="public">Public</Badge>}
                <Badge type="logic">{view.logic}</Badge>
              </div>

              <Actions>
                {!view.isDefault && (
                  <Button onClick={() => handleSetDefault(view.id)}>Set Default</Button>
                )}
                <SecondaryButton onClick={() => handleDeleteView(view.id)}>Delete</SecondaryButton>
              </Actions>
            </ViewCard>
          ))}
        </ViewsGrid>
      )}
    </Container>
  );
};
