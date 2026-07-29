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
  const { canAccessAppScreen, canAccessConsole } = usePermissions();
  const location = useLocation();

  const openIncidents = state.incidents ? state.incidents.filter((i) => i.status !== 'resolved').length : 0;

  const tabs = [
    {
      to: '/app',
      label: 'Home',
      iconOutline: <IconHome size={22} />,
      iconFilled: <IconHomeFilled size={22} />,
      show: canAccessAppScreen('home'),
    },
    {
      to: '/app/rollcall',
      label: 'Roll Call',
      iconOutline: <IconClipboardCheck size={22} />,
      iconFilled: <IconClipboardCheckFilled size={22} />,
      show: canAccessAppScreen('rollcall'),
    },
    {
      to: '/app/programme',
      label: 'Programme',
      iconOutline: <IconCalendarEvent size={22} />,
      iconFilled: <IconCalendarFilled size={22} />,
      show: canAccessAppScreen('programme'),
    },
    {
      to: '/app/incidents',
      label: 'Incidents',
      iconOutline: <IconAlertTriangle size={22} />,
      iconFilled: <IconAlertTriangleFilled size={22} />,
      badge: openIncidents,
      show: canAccessAppScreen('incidents'),
    },
    {
      to: '/app/campers',
      label: 'Campers',
      iconOutline: <IconUsers size={22} />,
      iconFilled: <IconUserFilled size={22} />,
      show: canAccessAppScreen('campers'),
    },
    {
      to: '/console/dashboard',
      label: 'Console',
      iconOutline: <IconLayoutDashboard size={22} />,
      iconFilled: <IconLayoutDashboardFilled size={22} />,
      show: canAccessConsole,
    },
  ].filter((t) => t.show);

  return (
    <nav className="bottom-nav-floating">
      <div className="bottom-nav-track">
        {tabs.map((tab) => {
          const isCurrentActive =
            tab.to === '/app'
              ? location.pathname === '/app' || location.pathname === '/app/'
              : location.pathname.startsWith(tab.to);

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/app'}
              className={() => `nav-item-bubbly ${isCurrentActive ? 'active' : ''}`}
            >
              <span className="nav-icon-wrap">
                {isCurrentActive ? tab.iconFilled : tab.iconOutline}
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
