import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NotificationCentre from '../components/NotificationCentre';
import {
  IconSearch,
  IconX,
  IconMenu2,
  IconChevronDown,
  IconUser,
  IconLayoutDashboard,
  IconLogout,
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

const BREADCRUMB_LABELS = {
  '/console':              'Dashboard',
  '/console/dashboard':    'Dashboard',
  '/console/users':        'User Management',
  '/console/audit':        'Recent Activity',
  '/console/incidents':    'Incidents',
  '/console/campers':      'Campers',
  '/console/platoons':     'Platoons',
  '/console/attendance':   'Attendance',
  '/console/programme':    'Programme',
  '/console/staff':        'Volunteers',
  '/console/volunteers':   'Volunteers',
  '/console/settings':     'Settings',
  '/console/activity':     'Recent Activity',
  '/console/announcements':'Announcements',
  '/console/reports':      'Reports',
};

function getInitials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
}

// ─── Global Search ────────────────────────────────────────────────
function GlobalSearch() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const ref     = useRef(null);
  const timer   = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResults(data);
    } catch { setResults(null); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 300);
  };

  const handleClear = () => { setQuery(''); setResults(null); setOpen(false); };

  const hasResults = results && (results.campers?.length > 0 || results.staff?.length > 0);

  return (
    <div ref={ref} className="console-search" style={{ position: 'relative' }}>
      <span className="console-search-icon" style={{ display: 'flex', alignItems: 'center' }}>
        <IconSearch size={16} color="var(--text-muted)" />
      </span>
      <input
        type="text"
        className="console-search-input"
        placeholder="Search campers, staff, sessions…"
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        style={{ borderRadius: 9999, paddingLeft: 40 }}
      />
      {query && (
        <button onClick={handleClear} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
          <IconX size={14} />
        </button>
      )}

      {open && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
          minWidth: 340,
        }}>
          {loading && (
            <div style={{ padding: '16px 20px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Searching…</div>
          )}
          {!loading && !hasResults && results && (
            <div style={{ padding: '16px 20px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No results for "{query}"</div>
          )}
          {!loading && hasResults && (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {results.campers?.length > 0 && (
                <div>
                  <div style={{ padding: '8px 16px 4px', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Campers</div>
                  {results.campers.slice(0, 5).map((c) => (
                    <button key={c.id} onClick={() => { navigate('/console/campers'); handleClear(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div className="avatar avatar-sm" style={{ width: 28, height: 28, fontSize: '0.6875rem', background: '#14442C', color: '#fff' }}>{getInitials(c.name)}</div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Age {c.age} · Platoon {c.platoonId || '—'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.staff?.length > 0 && (
                <div>
                  <div style={{ padding: '8px 16px 4px', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Staff</div>
                  {results.staff.slice(0, 5).map((s) => (
                    <button key={s.id} onClick={() => { navigate('/console/staff'); handleClear(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div className="avatar avatar-sm" style={{ width: 28, height: 28, fontSize: '0.6875rem', background: '#F49E82', color: '#0C281B', fontWeight: 700 }}>{getInitials(s.name)}</div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.department || s.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ConsoleTopNav ────────────────────────────────────────────────
export default function ConsoleTopNav({ onMenuClick }) {
  const { state, dispatch } = useApp();
  const [location, setLocation] = useState(window.location.pathname);
  const navigate = useNavigate();
  const user = state.currentUser;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Update breadcrumb on navigation
  useEffect(() => {
    const handler = () => setLocation(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  return (
    <header className="console-topnav">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="console-hamburger" onClick={onMenuClick} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 6 }}>
          <IconMenu2 size={20} />
        </button>
        {/* Breadcrumb */}
        <nav className="console-breadcrumb">
          <Link to="/console/dashboard" className="console-breadcrumb-item">Console</Link>
          {window.location.pathname !== '/console' && window.location.pathname !== '/console/dashboard' && (
            <>
              <span className="console-breadcrumb-sep">/</span>
              <span className="console-breadcrumb-item current">{BREADCRUMB_LABELS[window.location.pathname] || 'Page'}</span>
            </>
          )}
        </nav>
      </div>

      {/* Functional Global Search */}
      <GlobalSearch />

      {/* Actions */}
      <div className="console-topnav-actions">
        <NotificationCentre lightMode={true} />

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button className="console-user-chip" onClick={() => setDropdownOpen(!dropdownOpen)} style={{ borderRadius: 9999, padding: '4px 12px 4px 6px' }}>
            <div className="avatar avatar-sm" style={{ background: '#14442C', color: '#fff', width: 30, height: 30, fontSize: '0.75rem', fontWeight: 700 }}>
              {getInitials(user?.name)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="console-user-chip-name">{user?.name?.split(' ')[0] || 'Admin'}</div>
              <div className="console-user-chip-role" style={{ color: '#F49E82', fontWeight: 600 }}>{user?.roleName || user?.role}</div>
            </div>
            <IconChevronDown size={14} color="var(--text-muted)" style={{ marginLeft: 4 }} />
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu" style={{ right: 0, top: 'calc(100% + 8px)', width: 230, borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}>
              <div className="dropdown-header" style={{ padding: '14px 18px' }}>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>{user?.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email}</p>
                <span className="badge" style={{ marginTop: 8, background: '#FDF2EE', color: '#A34526', fontWeight: 700 }}>{user?.roleName || user?.role}</span>
              </div>
              <div className="dropdown-divider" />
              <Link to="/app/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconUser size={16} color="var(--teal)" />
                <span>My Profile</span>
              </Link>
              <Link to="/app" className="dropdown-item" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconLayoutDashboard size={16} color="var(--orange)" />
                <span>Staff Portal</span>
              </Link>
              <div className="dropdown-divider" />
              <button onClick={handleLogout} className="dropdown-item" style={{ width: '100%', textAlign: 'left', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconLogout size={16} color="var(--red)" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
