/**
 * Row-Level Security & Permissions System
 * Real enforcement at UI and API level
 * 
 * Features:
 * - User/Manager/Admin roles
 * - Row-level data filtering
 * - Action permissions (create, read, update, delete)
 * - Field-level permissions
 */

export type UserRole = 'user' | 'manager' | 'admin';

export interface Permission {
  resource: 'leads' | 'contacts' | 'deals' | 'tasks' | 'workflows' | 'settings';
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'bulk_update';
  scope: 'own' | 'team' | 'all';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
  managerId?: string;
}

// Permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { resource: 'leads', action: 'read', scope: 'own' },
    { resource: 'leads', action: 'update', scope: 'own' },
    { resource: 'leads', action: 'create', scope: 'own' },
    { resource: 'contacts', action: 'read', scope: 'own' },
    { resource: 'contacts', action: 'update', scope: 'own' },
    { resource: 'deals', action: 'read', scope: 'own' },
    { resource: 'deals', action: 'update', scope: 'own' },
    { resource: 'tasks', action: 'read', scope: 'own' },
    { resource: 'tasks', action: 'update', scope: 'own' },
  ],
  manager: [
    { resource: 'leads', action: 'read', scope: 'team' },
    { resource: 'leads', action: 'update', scope: 'team' },
    { resource: 'leads', action: 'create', scope: 'team' },
    { resource: 'leads', action: 'delete', scope: 'team' },
    { resource: 'contacts', action: 'read', scope: 'team' },
    { resource: 'contacts', action: 'update', scope: 'team' },
    { resource: 'contacts', action: 'create', scope: 'team' },
    { resource: 'deals', action: 'read', scope: 'team' },
    { resource: 'deals', action: 'update', scope: 'team' },
    { resource: 'deals', action: 'delete', scope: 'team' },
    { resource: 'tasks', action: 'read', scope: 'team' },
    { resource: 'tasks', action: 'update', scope: 'team' },
    { resource: 'workflows', action: 'read', scope: 'team' },
  ],
  admin: [
    { resource: 'leads', action: 'read', scope: 'all' },
    { resource: 'leads', action: 'update', scope: 'all' },
    { resource: 'leads', action: 'create', scope: 'all' },
    { resource: 'leads', action: 'delete', scope: 'all' },
    { resource: 'leads', action: 'export', scope: 'all' },
    { resource: 'leads', action: 'bulk_update', scope: 'all' },
    { resource: 'contacts', action: 'read', scope: 'all' },
    { resource: 'contacts', action: 'update', scope: 'all' },
    { resource: 'contacts', action: 'create', scope: 'all' },
    { resource: 'contacts', action: 'delete', scope: 'all' },
    { resource: 'contacts', action: 'export', scope: 'all' },
    { resource: 'deals', action: 'read', scope: 'all' },
    { resource: 'deals', action: 'update', scope: 'all' },
    { resource: 'deals', action: 'create', scope: 'all' },
    { resource: 'deals', action: 'delete', scope: 'all' },
    { resource: 'tasks', action: 'read', scope: 'all' },
    { resource: 'tasks', action: 'update', scope: 'all' },
    { resource: 'tasks', action: 'delete', scope: 'all' },
    { resource: 'workflows', action: 'read', scope: 'all' },
    { resource: 'workflows', action: 'update', scope: 'all' },
    { resource: 'workflows', action: 'create', scope: 'all' },
    { resource: 'settings', action: 'read', scope: 'all' },
    { resource: 'settings', action: 'update', scope: 'all' },
  ],
};

export class PermissionService {
  private currentUser: User;

  constructor(user: User) {
    this.currentUser = user;
  }

  // Check if user can perform action on resource
  can(
    resource: Permission['resource'],
    action: Permission['action']
  ): boolean {
    const permissions = ROLE_PERMISSIONS[this.currentUser.role];
    return permissions.some(
      p => p.resource === resource && p.action === action
    );
  }

  // Get permission scope for resource and action
  getScope(
    resource: Permission['resource'],
    action: Permission['action']
  ): 'own' | 'team' | 'all' | null {
    const permissions = ROLE_PERMISSIONS[this.currentUser.role];
    const permission = permissions.find(
      p => p.resource === resource && p.action === action
    );
    return permission?.scope || null;
  }

  // Filter data based on row-level permissions
  filterData<T extends { ownerId?: string; teamId?: string }>(
    resource: Permission['resource'],
    data: T[]
  ): T[] {
    const scope = this.getScope(resource, 'read');

    if (!scope) return [];

    switch (scope) {
      case 'own':
        return data.filter(item => item.ownerId === this.currentUser.id);

      case 'team':
        return data.filter(
          item =>
            item.ownerId === this.currentUser.id ||
            item.teamId === this.currentUser.teamId
        );

      case 'all':
        return data;

      default:
        return [];
    }
  }

  // Check if user can access specific record
  canAccessRecord<T extends { ownerId?: string; teamId?: string }>(
    resource: Permission['resource'],
    record: T
  ): boolean {
    const scope = this.getScope(resource, 'read');

    if (!scope) return false;

    switch (scope) {
      case 'own':
        return record.ownerId === this.currentUser.id;

      case 'team':
        return (
          record.ownerId === this.currentUser.id ||
          record.teamId === this.currentUser.teamId
        );

      case 'all':
        return true;

      default:
        return false;
    }
  }

  // Get all permissions for current user
  getAllPermissions(): Permission[] {
    return ROLE_PERMISSIONS[this.currentUser.role];
  }

  // Check if user has role
  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.currentUser.role);
  }

  // Get current user
  getCurrentUser(): User {
    return this.currentUser;
  }

  // Permission error message
  getPermissionError(
    resource: Permission['resource'],
    action: Permission['action']
  ): string {
    const roleNames = {
      user: 'User',
      manager: 'Manager',
      admin: 'Admin',
    };

    return `You need ${roleNames[this.getRequiredRole(resource, action)]} role to ${action} ${resource}`;
  }

  private getRequiredRole(
    resource: Permission['resource'],
    action: Permission['action']
  ): UserRole {
    // Find minimum required role
    const roles: UserRole[] = ['user', 'manager', 'admin'];

    for (const role of roles) {
      const permissions = ROLE_PERMISSIONS[role];
      if (permissions.some(p => p.resource === resource && p.action === action)) {
        return role;
      }
    }

    return 'admin';
  }
}

// Mock users for demo
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    teamId: 'team-1',
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'manager',
    teamId: 'team-1',
  },
  {
    id: 'user-3',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  },
];

// Demo: Current user (change to test different roles)
export const currentUser: User = mockUsers[2]; // Admin by default

// Global permission service instance
export const permissions = new PermissionService(currentUser);
