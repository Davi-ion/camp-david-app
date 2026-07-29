export const ROLES = {
  ADMIN: 'ADMIN',
  CAMP_COMMANDER: 'CAMP_COMMANDER',
  DORM_LEAD: 'DORM_LEAD',
  PLATOON_LEAD: 'PLATOON_LEAD',
  VOLUNTEER: 'VOLUNTEER',
};

/**
 * Normalizes backend user role string or permissions into canonical system role.
 */
export function getCanonicalRole(user) {
  if (!user) return ROLES.VOLUNTEER;

  const roleStr = (user.roleName || user.role || '').toLowerCase();
  const permissions = user.permissions || [];

  // 1. Admin
  if (
    roleStr === 'admin' ||
    roleStr.includes('super admin') ||
    roleStr.includes('operations admin') ||
    roleStr.includes('camp director') ||
    roleStr.includes('executive') ||
    permissions.includes('all') ||
    permissions.includes('manage:users')
  ) {
    return ROLES.ADMIN;
  }

  // 2. Camp Commander
  if (roleStr.includes('commander') || roleStr.includes('camp_commander')) {
    return ROLES.CAMP_COMMANDER;
  }

  // 3. Dorm Lead
  if (roleStr.includes('dorm') || roleStr.includes('lqf') || roleStr.includes('lqm')) {
    return ROLES.DORM_LEAD;
  }

  // 4. Platoon Lead
  if (roleStr.includes('platoon') || roleStr.includes('group')) {
    return ROLES.PLATOON_LEAD;
  }

  // 5. Default / Volunteer
  return ROLES.VOLUNTEER;
}
