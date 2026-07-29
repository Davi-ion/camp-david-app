import { useApp } from '../context/AppContext';
import { getCanonicalRole, ROLES } from '../utils/roleHelper';

export function usePermissions() {
  const { state } = useApp();
  const user = state.currentUser;
  const permissions = user?.permissions || [];
  const canonicalRole = getCanonicalRole(user);

  const isAdmin = canonicalRole === ROLES.ADMIN;
  const isCommander = canonicalRole === ROLES.CAMP_COMMANDER;
  const isDormLead = canonicalRole === ROLES.DORM_LEAD;
  const isPlatoonLead = canonicalRole === ROLES.PLATOON_LEAD;
  const isVolunteer = canonicalRole === ROLES.VOLUNTEER;

  // Console access is restricted to Admin & Camp Commander
  const canAccessConsole = isAdmin || isCommander;

  /**
   * Check access to Staff Portal (/app/*) screens
   * Path identifiers: 'home', 'profile', 'programme', 'incidents', 'rollcall', 'campers'
   */
  const canAccessAppScreen = (screenKey) => {
    switch (screenKey) {
      case 'rollcall':
        return isAdmin || isCommander || isDormLead;
      case 'campers':
        return isAdmin || isCommander || isDormLead || isPlatoonLead;
      case 'home':
      case 'profile':
      case 'programme':
      case 'incidents':
      default:
        return true;
    }
  };

  /**
   * Check access to Console (/console/*) screens
   */
  const canAccessConsoleScreen = (screenKey) => {
    if (isAdmin) return true;
    if (isCommander) {
      // Hide/restrict Administration (staff, reports, activity, audit) and Settings
      if (['staff', 'reports', 'activity', 'audit', 'settings'].includes(screenKey)) {
        return false;
      }
      return true;
    }
    return false;
  };

  // Legacy permission checks compatibility
  const hasPermission = (permission) => {
    if (isAdmin || isCommander || permissions.includes('all')) return true;
    if (permission === 'take:attendance') return canAccessAppScreen('rollcall');
    if (permission === 'view:campers') return canAccessAppScreen('campers');
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...required) => {
    if (isAdmin || permissions.includes('all')) return true;
    return required.some((p) => hasPermission(p));
  };

  const hasAllPermissions = (...required) => {
    if (isAdmin || permissions.includes('all')) return true;
    return required.every((p) => hasPermission(p));
  };

  return {
    user,
    canonicalRole,
    isAdmin,
    isCommander,
    isDormLead,
    isPlatoonLead,
    isVolunteer,
    canAccessConsole,
    canAccessAppScreen,
    canAccessConsoleScreen,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
