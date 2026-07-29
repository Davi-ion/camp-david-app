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
   * Path identifiers: 'dashboard', 'activity', 'campers', 'platoons', 'dorms',
   * 'attendance', 'incidents', 'programme', 'drills', 'announcements',
   * 'staff', 'users', 'reports', 'audit', 'settings'
   */
  const canAccessConsoleScreen = (screenKey) => {
    if (isAdmin) return true;
    if (isCommander) {
      const allowedCommanderScreens = [
        'dashboard',
        'campers',
        'platoons',
        'dorms',
        'attendance',
        'incidents',
        'programme',
        'drills',
        'announcements',
      ];
      return allowedCommanderScreens.includes(screenKey);
    }
    return false;
  };

  // Legacy permission checks compatibility
  const hasPermission = (permission) => {
    if (isAdmin || permissions.includes('all')) return true;
    if (permission === 'take:attendance') return canAccessAppScreen('rollcall');
    if (permission === 'view:campers') return canAccessAppScreen('campers');
    if (permission === 'manage:users') return isAdmin;
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
