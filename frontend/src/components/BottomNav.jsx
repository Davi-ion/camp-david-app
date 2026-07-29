import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import {
  IconHome,
  IconHomeFilled,
  IconClipboardCheck,
  IconClipboardCheckFilled,
  IconCalendarEvent,
  IconCalendarFilled,
  IconAlertTriangle,
  IconAlertTriangleFilled,
  IconUsers,
  IconUserFilled,
  IconLayoutDashboard,
  IconLayoutDashboardFilled,
} from '@tabler/icons-react';

export default function BottomNav() {
  const { state } = useApp();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  const openIncidents = state.incidents ? state.incidents.filter((i) => i.status !== 'resolved').length : 0;

  const tabs = [
    {
      to: '/app',
      label: 'Home',
      iconOutline: <IconHome size={22} />,
      iconFilled: <IconHomeFilled size={22} />,
      show: true,
    },
    {
      to: '/app/rollcall',
      label: 'Roll Call',
      iconOutline: <IconClipboardCheck size={22} />,
      iconFilled: <IconClipboardCheckFilled size={22} />,
      show: hasPermission('take:attendance'),
    },
    {
      to: '/app/programme',
      label: 'Programme',
      iconOutline: <IconCalendarEvent size={22} />,
      iconFilled: <IconCalendarFilled size={22} />,
      show: hasPermission('view:schedule'),
    },
    {
      to: '/app/incidents',
      label: 'Incidents',
      iconOutline: <IconAlertTriangle size={22} />,
      iconFilled: <IconAlertTriangleFilled size={22} />,
      badge: openIncidents,
      show: hasPermission('view:incidents'),
    },
    {
      to: '/app/campers',
      label: 'Campers',
      iconOutline: <IconUsers size={22} />,
      iconFilled: <IconUserFilled size={22} />,
      show: hasPermission('view:campers'),
    },
    {
      to: '/console',
      label: 'Console',
      iconOutline: <IconLayoutDashboard size={22} />,
      iconFilled: <IconLayoutDashboardFilled size={22} />,
      show: true,
    },
  ].filter((t) => t.show);

  return (
    <nav className="bottom-nav-floating">
      <div className="bottom-nav-track">
        {tabs.map((tab) => {
          const isActive =
            tab.to === '/app'
              ? location.pathname === '/app'
              : location.pathname.startsWith(tab.to);

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`nav-item-bubbly ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon-wrap">
                {isActive ? tab.iconFilled : tab.iconOutline}
                {tab.badge > 0 && <span className="nav-badge-bubbly">{tab.badge}</span>}
              </span>
              <span className="nav-label-bubbly">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
