import { useState, useCallback, useMemo } from 'react';
import { PermissionService, User, mockUsers } from '../services/permissions';

// Custom hook for permissions
export const usePermissions = () => {
  // Default to first mock user (can be connected to real auth)
  const [currentUser] = useState<User>(mockUsers[2]); // Admin
  const permissionService = useMemo(
    () => new PermissionService(currentUser),
    [currentUser]
  );

  return {
    can: useCallback(
      (resource: any, action: any) =>
        permissionService.can(resource, action),
      [permissionService]
    ),
    getScope: useCallback(
      (resource: any, action: any) =>
        permissionService.getScope(resource, action),
      [permissionService]
    ),
    filterData: useCallback(
      (resource: any, data: any) =>
        permissionService.filterData(resource, data),
      [permissionService]
    ),
    canAccessRecord: useCallback(
      (resource: any, record: any) =>
        permissionService.canAccessRecord(resource, record),
      [permissionService]
    ),
    hasRole: useCallback(
      (...roles: any) => permissionService.hasRole(...roles),
      [permissionService]
    ),
    getCurrentUser: useCallback(
      () => permissionService.getCurrentUser(),
      [permissionService]
    ),
    getPermissionError: useCallback(
      (resource: any, action: any) =>
        permissionService.getPermissionError(resource, action),
      [permissionService]
    ),
  };
};
