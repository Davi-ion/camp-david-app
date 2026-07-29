import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { IconUser, IconLayoutDashboard, IconLogout } from '@tabler/icons-react';

function getInitials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
}

export default function UserMenu({ lightMode = false }) {
  const { state, dispatch } = useApp();
  const { canAccessConsole } = usePermissions();
  const navigate = useNavigate();
  const user = state.currentUser;
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isConsoleUser = canAccessConsole;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Profile Dropdown */}
      <div className="profile-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', display: 'flex', alignItems: 'center'
          }}
        >
          <img
            src={user?.avatar && (user.avatar.startsWith('/') || user.avatar.startsWith('http')) ? user.avatar : '/avatars/character1.jpg'}
            alt={user?.name || 'User'}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9999,
              objectFit: 'cover',
              border: lightMode ? '2px solid rgba(255,255,255,0.8)' : '2px solid var(--teal)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease',
              transform: dropdownOpen ? 'scale(0.95)' : 'scale(1)'
            }}
          />
        </button>

        {dropdownOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{user.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</p>
              <span className="badge badge-teal" style={{ marginTop: 8 }}>{user.roleName || user.role}</span>
            </div>

            <div className="dropdown-divider" />

            <Link to="/app/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconUser size={16} /> My Profile
            </Link>

            {isConsoleUser && (
              <Link to="/console/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconLayoutDashboard size={16} /> Management Console
              </Link>
            )}

            <div className="dropdown-divider" />

            <button
              onClick={handleLogout}
              className="dropdown-item"
              style={{ width: '100%', textAlign: 'left', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <IconLogout size={16} /> Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
