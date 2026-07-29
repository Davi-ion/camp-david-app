import { useApp } from '../context/AppContext';

export function usePermissions() {
  const { state } = useApp();
  const permissions = state.currentUser?.permissions || [];
  const user = state.currentUser;

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'Super Admin' ||
    user?.roleName === 'Super Admin' ||
    user?.roleName === 'Operations Admin' ||
    user?.roleName === 'Camp Director' ||
    permissions.includes('all') ||
    permissions.includes('manage:users');

  const hasPermission = (permission) => {
    if (isAdmin || permissions.includes('all')) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...required) => {
    if (isAdmin || permissions.includes('all')) return true;
    return required.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (...required) => {
    if (isAdmin || permissions.includes('all')) return true;
    return required.every((p) => permissions.includes(p));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  };
}
