import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { CAMP_DAYS, schedule } from '../data/schedule';
import { staff } from '../data/staff';
import UserMenu from '../components/UserMenu';
import NotificationCentre from '../components/NotificationCentre';
import { IconCalendar, IconBell, IconPlus, IconAlertTriangle } from '@tabler/icons-react';

export default function Programme() {
  const { state, dispatch } = useApp();
  const { hasPermission } = usePermissions();
  const user = state.currentUser;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const defaultDay = CAMP_DAYS.find((d) => d.date === todayStr)?.key || 'wed';

  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [annText, setAnnText] = useState('');
  const [annUrgent, setAnnUrgent] = useState(false);

  const campDay = CAMP_DAYS.find((d) => d.key === selectedDay) || CAMP_DAYS[0];
  const daySchedule = schedule[selectedDay] || [];
  const dayAnnouncements = state.announcements.filter((a) => a.day === selectedDay);

  const canPost = hasPermission('create:announcements');

  // Check if event is happening now
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const isNow = (time, end) => {
    const [sh, sm] = time.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (campDay?.date !== todayStr) return false;
    return nowMinutes >= sh * 60 + sm && nowMinutes < eh * 60 + em;
  };

  const currentEvent = useMemo(() => {
    return daySchedule.find((e) => isNow(e.time, e.end));
  }, [daySchedule, campDay, todayStr, nowMinutes]);

  const handlePost = () => {
    if (!annText.trim()) return;
    const announcement = {
      id: `ann-${Date.now()}`,
      text: annText.trim(),
      author: user.id,
      createdAt: new Date().toISOString(),
      urgent: annUrgent,
      day: selectedDay,
    };
    dispatch({ type: 'ADD_ANNOUNCEMENT', payload: announcement });
    setAnnText('');
    setAnnUrgent(false);
    setShowAnnounceForm(false);
  };

  return (
    <div className="page">
      {/* Home-style Header with bg-programme */}
      <div className="dash-header bg-programme">
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

          <p className="dash-greeting">Schedule & Activity Guide</p>
          <h1 className="dash-name">Programme</h1>

          <div className="dash-day-strip" style={{ marginBottom: 16 }}>
            <span className="dash-day-badge">DAY {campDay.dayNum} OF 5</span>
            <span>{campDay.full} · {daySchedule.length} Events Scheduled</span>
          </div>

          {currentEvent && (
            <div className="now-card">
              <div className="now-card-label">
                <span className="now-dot" />
                HAPPENING NOW
              </div>
              <div className="now-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="now-card-title">{currentEvent.title}</div>
                <div className="now-card-time">{currentEvent.time} – {currentEvent.end}</div>
              </div>
              <div className="now-card-meta">{currentEvent.location} · {currentEvent.groups === 'all' ? 'All Groups' : 'By Group'}</div>
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {/* Day Selector */}
        <div className="day-selector">
          {CAMP_DAYS.map((d) => (
            <button
              key={d.key}
              className={`day-btn ${selectedDay === d.key ? 'active' : ''}`}
              onClick={() => setSelectedDay(d.key)}
            >
              {d.label}
              <span className="day-btn-date">{d.date.slice(8)}/{d.date.slice(5, 7)}</span>
            </button>
          ))}
        </div>

        {/* Announcements Section Header */}
        <div className="section-header" style={{ marginTop: 20 }}>
          <span className="section-title">Announcements</span>
          {canPost && (
            <button
              className="btn btn-sm btn-orange"
              onClick={() => setShowAnnounceForm(!showAnnounceForm)}
              style={{ padding: '8px 16px', fontSize: '0.8125rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <IconPlus size={16} /> Announce
            </button>
          )}
        </div>

        {/* Announce Form Card */}
        {showAnnounceForm && (
          <div className="card" style={{ marginBottom: 16, animation: 'fadeInUp 0.3s ease', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Announcement Text</label>
              <textarea
                value={annText}
                onChange={(e) => setAnnText(e.target.value)}
                placeholder="Write your announcement message..."
                style={{ minHeight: 90, borderRadius: 10, border: '1px solid var(--border)', padding: 12 }}
              />
            </div>
            <div className="toggle-row" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconBell size={18} color="var(--orange)" /> Mark as Urgent Alert
              </span>
              <button
                type="button"
                className={`toggle ${annUrgent ? 'on' : ''}`}
                onClick={() => setAnnUrgent(!annUrgent)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-sm btn-primary" onClick={handlePost} style={{ flex: 1, padding: '10px 16px', borderRadius: 8 }}>
                Publish Announcement
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => { setShowAnnounceForm(false); setAnnText(''); setAnnUrgent(false); }}
                style={{ border: '1.5px solid var(--border)', padding: '10px 16px', borderRadius: 8 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {dayAnnouncements.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {dayAnnouncements.map((ann) => {
              const author = staff.find((s) => s.id === ann.author);
              const annTime = new Date(ann.createdAt);
              const annTimeStr = annTime.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
              return (
                <div key={ann.id} className={`announcement-card ${ann.urgent ? 'urgent' : ''}`} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {ann.urgent && <span className="badge badge-urgent" style={{ background: '#FEF2F2', color: '#DC2626', fontWeight: 700 }}>URGENT</span>}
                      <span className="font-semibold text-sm" style={{ fontWeight: 600 }}>{author?.name || 'Admin'}</span>
                    </div>
                    <span className="text-xs text-muted">{annTimeStr}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{ann.text}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule Timeline Header */}
        <div className="section-header" style={{ marginTop: 24 }}>
          <span className="section-title">Day Schedule Timeline</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {daySchedule.map((event, i) => {
            const happening = isNow(event.time, event.end);
            return (
              <div key={i} className={`timeline-item ${happening ? 'now' : ''}`} style={{ background: happening ? 'rgba(4, 120, 87, 0.04)' : '#fff', borderRadius: 14, border: happening ? '1.5px solid var(--teal)' : '1px solid var(--border)', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div className="timeline-time" style={{ fontWeight: 700, color: happening ? 'var(--teal)' : 'var(--text)' }}>
                  {event.time}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {event.title}
                    {happening && <span className="timeline-now-badge" style={{ background: 'var(--teal)', color: '#fff', fontSize: '0.6875rem', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>NOW</span>}
                  </div>
                  <div className="timeline-meta" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    📍 {event.location} · {event.groups === 'all' ? 'All Groups' : 'By Group'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
