import { Navigate, Outlet, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { useState } from 'react';
import { IconShieldLock, IconArrowLeft } from '@tabler/icons-react';
import ConsoleSidebar from './ConsoleSidebar';
import ConsoleTopNav from './ConsoleTopNav';
import './console.css';

// Roles/permissions that can access the management console
const CONSOLE_PERMISSIONS = ['manage:users', 'manage:roles', 'view:audit', 'all'];

function hasConsoleAccess(user, permissions = [], isAdmin = false) {
  if (!user) return false;
  if (isAdmin) return true;
  if (
    user.role === 'admin' ||
    user.role === 'Super Admin' ||
    user.roleName === 'Super Admin' ||
    user.roleName === 'Operations Admin' ||
    user.roleName === 'Camp Director'
  ) {
    return true;
  }
  return CONSOLE_PERMISSIONS.some((p) => permissions.includes(p));
}

function AccessDenied() {
  return (
    <div className="console-denied">
      <div className="console-denied-card">
        <div className="console-denied-icon-wrap">
          <IconShieldLock size={36} stroke={1.8} />
        </div>
        <h2 className="console-denied-title">Access Denied</h2>
        <p className="console-denied-subtitle">
          You do not have the required permissions to access the Management Console.
        </p>
        <Link to="/app" className="console-denied-btn">
          <IconArrowLeft size={18} />
          <span>Return to Staff Portal</span>
        </Link>
      </div>
    </div>
  );
}

export default function ConsoleLayout() {
  const { state } = useApp();
  const { permissions, isAdmin } = usePermissions();

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Must be authenticated
  if (!state.currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Must have console access
  if (!hasConsoleAccess(state.currentUser, permissions, isAdmin)) {
    return <AccessDenied />;
  }

  return (
    <div className="console-root">
      {/* Mobile overlay */}
      <div 
        className={`console-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />
      <ConsoleSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="console-main">
        <ConsoleTopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="console-content console-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
