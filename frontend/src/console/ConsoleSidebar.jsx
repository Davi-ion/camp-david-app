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
  IconChartBar,
  IconFileText,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/console/dashboard', label: 'Dashboard',    icon: <IconLayoutDashboard size={18} /> },
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

export default function ConsoleSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
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
    <aside className={`console-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand & Collapse Toggle */}
      <div className="console-brand" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="console-brand-logo">
            <img src="/logo-white.png" alt="Camp David Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!isCollapsed && (
            <div className="console-brand-text">
              <div className="console-brand-name">Camp David</div>
              <div className="console-brand-sub" style={{ color: '#F49E82', fontWeight: 600 }}>Management Console</div>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="console-sidebar-collapse-btn"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.8)',
            borderRadius: '9999px',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          {isCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="console-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="console-nav-section">
            {!isCollapsed && <span className="console-nav-section-label">{section.label}</span>}
            {section.items.map((item) => {
              const badge  = item.badgeKey ? getBadge(item.badgeKey) : null;
              const active = isActive(item);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`console-nav-item ${active ? 'active' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="console-nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="console-nav-label">{item.label}</span>}
                  {!isCollapsed && badge !== null && (
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
        <Link to="/app" className="console-portal-link" title={isCollapsed ? "Return to Staff Portal" : undefined}>
          <IconUser size={16} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span className="console-portal-link-text" style={{ marginLeft: 6 }}>Return to Staff Portal</span>}
        </Link>
      </div>
    </aside>
  );
}
