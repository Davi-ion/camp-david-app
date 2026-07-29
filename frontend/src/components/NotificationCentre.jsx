import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { IconBell } from '@tabler/icons-react';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

export default function NotificationCentre({ lightMode }) {
  const { state } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (state.currentUser) {
      fetchNotifications();
    }
  }, [state.currentUser]);

  useEffect(() => {
    if (!state.currentUser) return;
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [state.currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/notifications?staffId=${state.currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(data);
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      await fetch(`${API}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ staffId: state.currentUser.id })
      });
      fetchNotifications();
    } catch (err) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
          padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: lightMode ? 'var(--text)' : '#fff'
        }}
      >
        <IconBell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4, background: 'var(--red)', color: '#fff',
            fontSize: '0.625rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: 10,
            border: '2px solid var(--bg-dark)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 350, maxHeight: 400,
          background: 'var(--bg)', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 999, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '0.8125rem', cursor: 'pointer' }}>
                Mark all as read
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
