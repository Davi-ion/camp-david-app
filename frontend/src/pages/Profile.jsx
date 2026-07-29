import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { schedule, CAMP_DAYS } from '../data/schedule';
import UserMenu from '../components/UserMenu';
import NotificationCentre from '../components/NotificationCentre';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

export default function Profile() {
  const { state } = useApp();
  const user = state.currentUser;

  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Determine current day from schedule.js
  const now = new Date();
  const currentCampDay = CAMP_DAYS.find(d => {
    const cd = new Date(d.date);
    return cd.getDate() === now.getDate() && cd.getMonth() === now.getMonth();
  }) || CAMP_DAYS[0];

  const todaySessions = schedule[currentCampDay.key] || [];

  useEffect(() => {
    fetchDrills();
  }, []);

  const fetchDrills = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      // Fetch drills assigned to me for today
      const res = await fetch(`${API}/api/drills?staffId=${user.id}&date=${currentCampDay.date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrills(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklist = async (drillId, itemId, currentStatus) => {
    try {
      const token = localStorage.getItem('camp_token');
      await fetch(`${API}/api/drills/checklist/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      // Optimistically update
      setDrills(prev => prev.map(d => {
        if (d.id === drillId) {
          return {
            ...d,
            checklist: d.checklist.map(c => c.id === itemId ? { ...c, isCompleted: !currentStatus } : c)
          };
        }
        return d;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const updateDrillStatus = async (drillId, status) => {
    try {
      const token = localStorage.getItem('camp_token');
      await fetch(`${API}/api/drills/${drillId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      setDrills(prev => prev.map(d => d.id === drillId ? { ...d, status } : d));
    } catch (err) {
      console.error(err);
    }
  };

  // Merge timeline
  const timeline = [];
  todaySessions.forEach(s => {
    timeline.push({ type: 'session', time: s.time, title: s.title, location: s.location });
  });
  drills.forEach(d => {
    timeline.push({ type: 'drill', time: d.startTime, title: d.name, drill: d });
  });
  // Sort chronologically
  timeline.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="page">
      {/* Sticky Header */}
      <div className="sticky-top-desktop">
        <div className="dash-header" style={{ paddingBottom: 16 }}>
          <div className="container">
            <div className="dash-header-top">
              <div className="dash-brand">
                <div className="dash-logo" style={{ background: 'transparent' }}>
                  <img src="/logo-white.png" alt="Camp David Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                Camp David 2026
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <NotificationCentre lightMode={false} />
                <UserMenu lightMode={true} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <img 
                src={user?.avatar && (user.avatar.startsWith('/') || user.avatar.startsWith('http')) ? user.avatar : '/avatars/character1.jpg'} 
                alt={user?.name || 'Profile Avatar'} 
                style={{ width: 52, height: 52, borderRadius: 9999, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.8)' }}
              />
              <div>
                <p className="dash-greeting" style={{ margin: 0 }}>Staff Profile & Assignments</p>
                <h1 className="dash-name" style={{ margin: 0, fontSize: '1.375rem' }}>{user?.name || 'Staff Member'}</h1>
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                  {user?.roleName || user?.role} • {user?.department || 'Staff'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 16 }}>

      <div style={{ display: 'grid', gap: 24 }}>
        
        {/* Daily Timeline */}
        <div>
          <h3 style={{ marginBottom: 16 }}>Today's Timeline</h3>
          <div className="card" style={{ padding: '20px 20px 20px 40px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 24, top: 20, bottom: 20, width: 2, background: 'var(--border)' }}></div>
            {timeline.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nothing scheduled for today.</p>
            ) : timeline.map((item, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: i === timeline.length - 1 ? 0 : 20 }}>
                <div style={{
                  position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%',
                  background: item.type === 'drill' ? 'var(--blue)' : 'var(--teal)', border: '2px solid #fff'
                }}></div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {item.time}
                </div>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                {item.type === 'session' && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>📍 {item.location}</div>
                )}
                {item.type === 'drill' && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--blue)' }}>📋 Camp Drill Assignment</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* My Camp Drills Detailed */}
        <div>
          <h3 style={{ marginBottom: 16 }}>My Camp Drills</h3>
          {loading ? (
            <p>Loading drills...</p>
          ) : drills.length === 0 ? (
            <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
              No camp drills assigned to you today.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {drills.map(d => (
                <div key={d.id} className="card" style={{ borderLeft: `4px solid ${d.status === 'completed' ? 'var(--teal)' : d.status === 'in_progress' ? 'var(--amber)' : 'var(--blue)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0' }}>{d.name}</h4>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        🕒 {d.startTime} {d.endTime ? `- ${d.endTime}` : ''} {d.venue && `• 📍 ${d.venue}`}
                      </div>
                    </div>
                    <span className="badge" style={{
                      background: d.status === 'completed' ? '#F0FDF4' : d.status === 'in_progress' ? '#FFFBEB' : '#EFF6FF',
                      color: d.status === 'completed' ? 'var(--teal)' : d.status === 'in_progress' ? 'var(--amber)' : 'var(--blue)'
                    }}>
                      {d.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {d.instructions && (
                    <p style={{ fontSize: '0.875rem', marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 6 }}>
                      {d.instructions}
                    </p>
                  )}

                  {d.checklist?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Checklist</div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {d.checklist.map(c => (
                          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={c.isCompleted} 
                              onChange={() => toggleChecklist(d.id, c.id, c.isCompleted)} 
                              style={{ width: 16, height: 16, accentColor: 'var(--teal)' }}
                            />
                            <span style={{ textDecoration: c.isCompleted ? 'line-through' : 'none', color: c.isCompleted ? 'var(--text-muted)' : 'var(--text)' }}>
                              {c.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8 }}>
                    {d.status === 'upcoming' && (
                      <button className="btn btn-outline btn-sm" onClick={() => updateDrillStatus(d.id, 'in_progress')}>Start Drill</button>
                    )}
                    {d.status === 'in_progress' && (
                      <button className="btn btn-primary btn-sm" onClick={() => updateDrillStatus(d.id, 'completed')}>Mark Complete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        </div>
      </div>
    </div>
  );
}
