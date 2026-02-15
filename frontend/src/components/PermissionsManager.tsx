import React, { useState } from 'react';
import styled from 'styled-components';
import {
  User,
  UserRole,
  mockUsers,
  Permission,
  currentUser,
  ROLE_PERMISSIONS,
} from '../services/permissions';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
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

const CurrentUserSection = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 18px;
  }

  .details h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .details p {
    margin: 4px 0 0 0;
    font-size: 13px;
    opacity: 0.9;
  }
`;

const RoleBadge = styled.span<{ role: UserRole }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.role) {
      case 'admin':
        return 'rgba(239, 68, 68, 0.2)';
      case 'manager':
        return 'rgba(59, 130, 246, 0.2)';
      default:
        return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.role) {
      case 'admin':
        return '#dc2626';
      case 'manager':
        return '#2563eb';
      default:
        return '#374151';
    }
  }};
`;

const PermissionMatrixContainer = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 24px;
`;

const MatrixHeader = styled.div`
  background: #f9fafb;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const MatrixTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead th {
    background: #f3f4f6;
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e5e7eb;
  }

  tbody td {
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 13px;
  }

  tbody tr:hover {
    background: #fafbfc;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const ResourceCell = styled.td`
  font-weight: 600;
  color: #1a1a1a;
  width: 120px;
`;

const ActionCell = styled.td`
  color: #4b5563;
`;

const ScopeCell = styled.td`
  font-weight: 500;
`;

const ScopeBadge = styled.span<{ scope: 'own' | 'team' | 'all' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${props => {
    switch (props.scope) {
      case 'own':
        return '#fef3c7';
      case 'team':
        return '#dbeafe';
      case 'all':
        return '#dcfce7';
    }
  }};
  color: ${props => {
    switch (props.scope) {
      case 'own':
        return '#92400e';
      case 'team':
        return '#1e40af';
      case 'all':
        return '#166534';
    }
  }};
`;

const UserListHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const UserCard = styled.div<{ isSelected: boolean }>`
  background: white;
  border: 2px solid ${props => (props.isSelected ? '#667eea' : '#e5e7eb')};
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 6px rgba(102, 126, 234, 0.1);
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .name {
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 4px;
  }

  .email {
    font-size: 12px;
    color: #666;
  }

  .role {
    margin-top: 12px;
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

export const PermissionsManager: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User>(currentUser);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const countPermissions = (role: UserRole): number => {
    return ROLE_PERMISSIONS[role].length;
  };

  const getPermissionsByResource = (
    role: UserRole,
    resource: string
  ): Permission[] => {
    return ROLE_PERMISSIONS[role].filter(p => p.resource === resource as any);
  };

  const resources = ['leads', 'contacts', 'deals', 'tasks', 'workflows', 'settings'];

  return (
    <Container>
      <Header>
        <h1>🔒 Permissions & Access Control</h1>
        <p>Row-level security with user, manager, and admin roles</p>
      </Header>

      <StatsGrid>
        <StatCard>
          <div className="label">Total Users</div>
          <div className="value">{mockUsers.length}</div>
        </StatCard>
        <StatCard>
          <div className="label">User Permissions</div>
          <div className="value">{countPermissions('user')}</div>
        </StatCard>
        <StatCard>
          <div className="label">Manager Permissions</div>
          <div className="value">{countPermissions('manager')}</div>
        </StatCard>
        <StatCard>
          <div className="label">Admin Permissions</div>
          <div className="value">{countPermissions('admin')}</div>
        </StatCard>
      </StatsGrid>

      <CurrentUserSection>
        <UserInfo>
          <div className="avatar">{getInitials(selectedUser.name)}</div>
          <div className="details">
            <h3>{selectedUser.name}</h3>
            <p>{selectedUser.email}</p>
          </div>
        </UserInfo>
        <RoleBadge role={selectedUser.role}>{selectedUser.role}</RoleBadge>
      </CurrentUserSection>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: '#1a1a1a' }}>
          Select User to View Permissions
        </h3>
        <UserListHeader>
          {mockUsers.map(user => (
            <UserCard
              key={user.id}
              isSelected={selectedUser.id === user.id}
              onClick={() => setSelectedUser(user)}
            >
              <div className="avatar">{getInitials(user.name)}</div>
              <div className="name">{user.name}</div>
              <div className="email">{user.email}</div>
              <div className="role">
                <RoleBadge role={user.role}>{user.role}</RoleBadge>
              </div>
            </UserCard>
          ))}
        </UserListHeader>
      </div>

      <PermissionMatrixContainer>
        <MatrixHeader>
          <h2>
            {selectedUser.name}'s Permissions - {selectedUser.role} Role
          </h2>
        </MatrixHeader>
        <MatrixTable>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Action</th>
              <th>Scope</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {resources.map(resource => {
              const resourcePerms = getPermissionsByResource(
                selectedUser.role,
                resource
              );

              if (resourcePerms.length === 0) {
                return (
                  <tr key={`${resource}-none`}>
                    <ResourceCell>{resource}</ResourceCell>
                    <ActionCell colSpan={3}>No permissions</ActionCell>
                  </tr>
                );
              }

              return resourcePerms.map((perm, idx) => (
                <tr key={`${resource}-${perm.action}`}>
                  {idx === 0 && (
                    <ResourceCell rowSpan={resourcePerms.length}>
                      {perm.resource}
                    </ResourceCell>
                  )}
                  <ActionCell>{perm.action}</ActionCell>
                  <ScopeCell>
                    <ScopeBadge scope={perm.scope}>
                      {perm.scope === 'own'
                        ? 'Own Records'
                        : perm.scope === 'team'
                          ? 'Team Records'
                          : 'All Records'}
                    </ScopeBadge>
                  </ScopeCell>
                  <ActionCell>
                    {getPermissionDescription(perm.scope)}
                  </ActionCell>
                </tr>
              ));
            })}
          </tbody>
        </MatrixTable>
      </PermissionMatrixContainer>

      <PermissionMatrixContainer>
        <MatrixHeader>
          <h2>How Row-Level Security Works</h2>
        </MatrixHeader>
        <div style={{ padding: '20px', fontSize: '13px', lineHeight: '1.6' }}>
          <p>
            <strong>Own Scope:</strong> User can only view and modify records they
            own (ownerId matches userId)
          </p>
          <p>
            <strong>Team Scope:</strong> Manager can view and modify records owned
            by team members (teamId matches, or userId matches)
          </p>
          <p>
            <strong>All Scope:</strong> Admin can view and modify all records in
            the system
          </p>
          <p>
            <strong>Implementation:</strong> Data is filtered on load using{' '}
            <code>filterData()</code> and <code>canAccessRecord()</code> methods
          </p>
        </div>
      </PermissionMatrixContainer>
    </Container>
  );
};

function getPermissionDescription(scope: 'own' | 'team' | 'all'): string {
  const descriptions = {
    own: 'User can access their own records',
    team: 'Manager can access team records',
    all: 'Admin can access all records',
  };
  return descriptions[scope];
}
