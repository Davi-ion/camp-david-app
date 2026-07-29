import { NavLink, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  IconLayoutDashboard,
  IconActivity,
  IconUsers,
  IconFlag,
  IconBuilding,
  IconClipboardCheck,
  IconAlertTriangle,
  IconCalendarEvent,
  IconTarget,
  IconSpeakerphone,
  IconUser,
  IconUsersGroup,
  IconKey,
  IconUpload,
  IconChartBar,
  IconFileText,
  IconSettings,
} from '@tabler/icons-react';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/console',          label: 'Dashboard',    icon: <IconLayoutDashboard size={18} />, exact: true },
      { to: '/console/activity', label: 'Activity Feed', icon: <IconActivity size={18} /> },
    ],
  },
  {
    label: 'Camp Operations',
    items: [
      { to: '/console/campers',     label: 'Campers',     icon: <IconUsers size={18} />, badgeKey: 'totalCampers' },
      { to: '/console/platoons',    label: 'Platoons',    icon: <IconFlag size={18} /> },
      { to: '/console/dorms',       label: 'Dorms',       icon: <IconBuilding size={18} /> },
      { to: '/console/attendance',  label: 'Attendance',  icon: <IconClipboardCheck size={18} /> },
      { to: '/console/incidents',   label: 'Incidents',   icon: <IconAlertTriangle size={18} />, badgeKey: 'openIncidents' },
      { to: '/console/programme',   label: 'Programme',   icon: <IconCalendarEvent size={18} /> },
      { to: '/console/drills',      label: 'Camp Drills', icon: <IconTarget size={18} /> },
      { to: '/console/announcements', label: 'Announcements', icon: <IconSpeakerphone size={18} /> },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/console/staff',    label: 'Staff',              icon: <IconUser size={18} /> },
      { to: '/console/users',    label: 'User Management',    icon: <IconUsersGroup size={18} /> },
      { to: '/console/roles',    label: 'Roles & Permissions', icon: <IconKey size={18} /> },
      { to: '/console/import',   label: 'Bulk Import',        icon: <IconUpload size={18} /> },
      { to: '/console/reports',  label: 'Reports',            icon: <IconChartBar size={18} /> },
      { to: '/console/audit',    label: 'Audit Logs',         icon: <IconFileText size={18} /> },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/console/settings', label: 'Settings', icon: <IconSettings size={18} /> },
    ],
  },
];

export default function ConsoleSidebar({ isOpen, onClose }) {
  const { state } = useApp();
  const location = useLocation();

  const openIncidents = state.incidents?.filter(i => i.status !== 'resolved').length || 0;
  const totalCampers  = state.campers?.length || 0;

  const getBadge = (key) => {
    if (key === 'openIncidents') return openIncidents > 0 ? openIncidents : null;
    if (key === 'totalCampers')  return totalCampers  > 0 ? totalCampers  : null;
    return null;
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside className={`console-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div className="console-brand">
        <div className="console-brand-logo">
          <img src="/logo-white.png" alt="Camp David Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <div className="console-brand-name">Camp David</div>
          <div className="console-brand-sub">Management Console</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="console-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="console-nav-section">
            <span className="console-nav-section-label">{section.label}</span>
            {section.items.map((item) => {
              const badge  = item.badgeKey ? getBadge(item.badgeKey) : null;
              const active = isActive(item);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`console-nav-item ${active ? 'active' : ''}`}
                >
                  <span className="console-nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </span>
                  <span className="console-nav-label">{item.label}</span>
                  {badge !== null && (
                    <span className={`console-nav-badge ${item.badgeKey === 'openIncidents' ? 'badge-red' : ''}`}>
                      {badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Back to Staff Portal */}
      <div className="console-sidebar-footer">
        <Link to="/app" className="console-portal-link">
          <IconUser size={16} style={{ marginRight: 6 }} />
          Return to Staff Portal
        </Link>
      </div>
    </aside>
  );
}
