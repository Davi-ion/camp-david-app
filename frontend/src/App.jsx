import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { usePermissions } from './hooks/usePermissions';
import BottomNav from './components/BottomNav';

// Staff Portal pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import RollCall from './pages/RollCall';
import Programme from './pages/Programme';
import Incidents from './pages/Incidents';
import Campers from './pages/Campers';
import Profile from './pages/Profile';

// Admin Console
import ConsoleLayout from './console/ConsoleLayout';
import ConsoleDashboard from './console/ConsoleDashboard';
import ConsoleIncidents from './console/ConsoleIncidents';
import ConsoleCampers from './console/ConsoleCampers';
import ConsolePlatoons from './console/ConsolePlatoons';
import ConsoleDorms from './console/ConsoleDorms';
import ConsoleStaff from './console/ConsoleStaff';
import ConsoleProgramme from './console/ConsoleProgramme';
import ConsoleAttendance from './console/ConsoleAttendance';
import ConsoleAnnouncements from './console/ConsoleAnnouncements';
import ConsoleReports from './console/ConsoleReports';
import ConsoleSettings from './console/ConsoleSettings';
import ConsoleActivity from './console/ConsoleActivity';
import { ConsoleAuditLog } from './console/ConsoleAdminPages';

// ─── Smart Root Redirect ──────────────────────────────────────────────────────
// Sends console-eligible users (Admin, Commander) to /console, others to /app
function SmartRedirect() {
  const { state } = useApp();
  const { canAccessConsole } = usePermissions();
  if (!state.currentUser) return <Navigate to="/login" replace />;
  return <Navigate to={canAccessConsole ? '/console' : '/app'} replace />;
}

// ─── Staff Portal Layout ──────────────────────────────────────────────────────
function StaffPortalLayout() {
  const { state } = useApp();
  if (!state.currentUser) return <Navigate to="/login" replace />;
  return (
    <>
      <div style={{ paddingBottom: 68 }}>
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}

// ─── Staff Portal Route Guard ──────────────────────────────────────────────────
function AppRouteGuard({ screen }) {
  const { canAccessAppScreen } = usePermissions();
  if (!canAccessAppScreen(screen)) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: 100 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted, #666)', marginTop: 8 }}>
          Your role does not have access to this feature.
        </p>
      </div>
    );
  }
  return <Outlet />;
}

// ─── Management Console Route Guard ─────────────────────────────────────────────
function ConsoleRouteGuard({ screen }) {
  const { canAccessConsole, canAccessConsoleScreen } = usePermissions();
  
  if (!canAccessConsole || !canAccessConsoleScreen(screen)) {
    return (
      <div className="console-card" style={{ textAlign: 'center', margin: '40px auto', maxWidth: 500, padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Console Access Denied</h2>
        <p style={{ color: 'var(--text-muted, #64748B)', marginTop: 8, fontSize: '0.875rem' }}>
          You do not have permission to access this management module.
        </p>
      </div>
    );
  }
  return <Outlet />;
}

// ─── Main App Component ────────────────────────────────────────────────────────
import ReportIncidentModal from './components/ReportIncidentModal';

function App() {
  return (
    <BrowserRouter>
      <ReportIncidentModal />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Root redirect — smart based on permissions */}
        <Route path="/" element={<SmartRedirect />} />

        {/* ── Staff Portal (/app/*) ─────────────────────────────────── */}
        <Route path="/app" element={<StaffPortalLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />

          <Route element={<AppRouteGuard screen="rollcall" />}>
            <Route path="rollcall" element={<RollCall />} />
          </Route>

          <Route element={<AppRouteGuard screen="programme" />}>
            <Route path="programme" element={<Programme />} />
          </Route>

          <Route element={<AppRouteGuard screen="incidents" />}>
            <Route path="incidents" element={<Incidents />} />
          </Route>

          <Route element={<AppRouteGuard screen="campers" />}>
            <Route path="campers" element={<Campers />} />
          </Route>
        </Route>

        {/* ── Admin Console (/console/*) ───────────────────────────── */}
        <Route path="/console" element={<ConsoleLayout />}>
          <Route index element={<Navigate to="/console/dashboard" replace />} />

          {/* Commander & Admin Screens (9) */}
          <Route element={<ConsoleRouteGuard screen="dashboard" />}>
            <Route path="dashboard" element={<ConsoleDashboard />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="campers" />}>
            <Route path="campers" element={<ConsoleCampers />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="platoons" />}>
            <Route path="platoons" element={<ConsolePlatoons />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="dorms" />}>
            <Route path="dorms" element={<ConsoleDorms />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="attendance" />}>
            <Route path="attendance" element={<ConsoleAttendance />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="incidents" />}>
            <Route path="incidents" element={<ConsoleIncidents />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="programme" />}>
            <Route path="programme" element={<ConsoleProgramme />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="announcements" />}>
            <Route path="announcements" element={<ConsoleAnnouncements />} />
          </Route>

          {/* Admin Only Screens (6) */}
          <Route element={<ConsoleRouteGuard screen="activity" />}>
            <Route path="activity" element={<ConsoleActivity />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="staff" />}>
            <Route path="staff" element={<ConsoleStaff />} />
            <Route path="volunteers" element={<ConsoleStaff />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="reports" />}>
            <Route path="reports" element={<ConsoleReports />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="audit" />}>
            <Route path="audit" element={<ConsoleActivity />} />
          </Route>
          <Route element={<ConsoleRouteGuard screen="settings" />}>
            <Route path="settings" element={<ConsoleSettings />} />
          </Route>
        </Route>

        {/* Legacy /admin route — redirect console users to /console */}
        <Route path="/admin/*" element={<Navigate to="/console" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
