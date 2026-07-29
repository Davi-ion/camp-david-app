import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { CAMP_DAYS, schedule } from '../data/schedule';
import { staff } from '../data/staff';
import UserMenu from '../components/UserMenu';
import NotificationCentre from '../components/NotificationCentre';
import { 
  IconCalendarEvent, 
  IconBell, 
  IconPlus, 
  IconSunrise,
  IconMoon,
  IconCoffee,
  IconFlame,
  IconTrophy,
  IconChecklist,
  IconClock,
  IconMapPin,
  IconUsers,
  IconSpeakerphone
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

function getInitials(name) {
  if (!name) return 'A';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const getEventIcon = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('breakfast') || t.includes('lunch') || t.includes('dinner') || t.includes('meal') || t.includes('snack')) {
    return <IconCoffee size={18} color="#0F766E" />;
  }
  if (t.includes('devotion') || t.includes('morning') || t.includes('wake')) {
    return <IconSunrise size={18} color="#D97706" />;
  }
  if (t.includes('worship') || t.includes('session') || t.includes('service') || t.includes('keynote') || t.includes('fire')) {
    return <IconFlame size={18} color="#EA580C" />;
  }
  if (t.includes('lights out') || t.includes('sleep') || t.includes('rest')) {
    return <IconMoon size={18} color="#6366F1" />;
  }
  if (t.includes('game') || t.includes('sport') || t.includes('activity') || t.includes('drill')) {
    return <IconTrophy size={18} color="#2563EB" />;
  }
  if (t.includes('roll call') || t.includes('check')) {
    return <IconChecklist size={18} color="#0F766E" />;
  }
  return <IconClock size={18} color="#0F766E" />;
};

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
  const [dbSessions, setDbSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/program-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbSessions(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch programme sessions:', err);
    }
  };

  const campDay = CAMP_DAYS.find((d) => d.key === selectedDay) || CAMP_DAYS[0];
  
  const daySchedule = useMemo(() => {
    const fromDb = (state.programSessions && state.programSessions.length > 0 ? state.programSessions : dbSessions).filter((s) => s.day === selectedDay);
    if (fromDb.length > 0) return fromDb;
    return schedule[selectedDay] || [];
  }, [state.programSessions, dbSessions, selectedDay]);

  const dayAnnouncements = state.announcements.filter((a) => a.day === selectedDay || !a.day);

  const canPost = hasPermission('create:announcements');

  // Check if event is happening now
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const isNow = (time, end) => {
    if (!time || !end) return false;
    const [sh, sm] = time.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (campDay?.date !== todayStr) return false;
    return nowMinutes >= sh * 60 + sm && nowMinutes < eh * 60 + em;
  };

  const currentEvent = useMemo(() => {
    return daySchedule.find((e) => isNow(e.time, e.end));
  }, [daySchedule, campDay, todayStr, nowMinutes]);

  const handlePost = async () => {
    if (!annText.trim()) return;
    const payload = {
      title: annUrgent ? 'URGENT PROGRAMME NOTICE' : 'Programme Announcement',
      body: annText.trim(),
      category: 'General',
      priority: annUrgent ? 'urgent' : 'normal',
      isEmergency: annUrgent,
      authorId: user?.id,
      authorName: user?.name,
    };

    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        dispatch({ type: 'ADD_ANNOUNCEMENT', payload: { ...saved, text: saved.body || annText.trim(), day: selectedDay } });
      } else {
        dispatch({ type: 'ADD_ANNOUNCEMENT', payload: { ...payload, id: `ann-${Date.now()}`, text: annText.trim(), day: selectedDay, createdAt: new Date().toISOString() } });
      }
    } catch (err) {
      dispatch({ type: 'ADD_ANNOUNCEMENT', payload: { ...payload, id: `ann-${Date.now()}`, text: annText.trim(), day: selectedDay, createdAt: new Date().toISOString() } });
    }

    setAnnText('');
    setAnnUrgent(false);
    setShowAnnounceForm(false);
  };

  return (
    <div className="page">
      {/* Header Banner - Matching Roll Call Teal Gradient */}
      <div className="dash-header bg-rollcall">
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div>
              <p className="dash-greeting" style={{ margin: 0 }}>Official Schedule & Events</p>
              <h1 className="dash-name" style={{ margin: 0 }}>Camp Programme</h1>
            </div>
            {canPost && (
              <button 
                onClick={() => setShowAnnounceForm(!showAnnounceForm)}
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 9999,
                  padding: '8px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconPlus size={16} /> Post Announcement
              </button>
            )}
          </div>

          <div className="dash-day-strip" style={{ marginBottom: 16 }}>
            <span className="dash-day-badge">DAY {campDay.dayNum} OF 5</span>
            <span>{campDay.full} · {daySchedule.length} Events Scheduled</span>
          </div>

          {/* Current Event Hero Banner */}
          {currentEvent ? (
            <div className="now-card">
              <div className="now-card-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <span className="now-dot" />
                  HAPPENING NOW
                </span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  {currentEvent.time} – {currentEvent.end}
                </span>
              </div>
              <div className="now-card-header" style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="now-card-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentEvent.title}</div>
              </div>
              <div className="now-card-meta" style={{ marginTop: 6, display: 'flex', gap: 12, opacity: 0.95 }}>
                <span>📍 {currentEvent.location}</span>
                <span>👥 {currentEvent.groups === 'all' ? 'All Campers' : 'By Group'}</span>
              </div>
            </div>
          ) : (
            <div className="now-card" style={{ background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconCalendarEvent size={18} color="#A7F3D0" />
                <span>Next Event Scheduled: {daySchedule[0]?.time || 'TBA'} — {daySchedule[0]?.title || 'See timeline below'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {/* 1. Day Selector Pills (Matching Roll Call UI) */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CAMP_DAYS.map((d) => {
            const isActive = selectedDay === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                style={{
                  flex: 1,
                  minWidth: 85,
                  padding: '10px 14px',
                  borderRadius: 9999,
                  border: isActive ? '2px solid var(--teal, #0F766E)' : '1px solid var(--border, #E2E8F0)',
                  background: isActive ? 'var(--teal, #0F766E)' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : 'var(--text, #0F172A)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  boxShadow: isActive ? '0 4px 12px rgba(15, 118, 110, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{d.label}</span>
                <span style={{ fontSize: '0.6875rem', opacity: isActive ? 0.9 : 0.6 }}>
                  {d.date.slice(8)}/{d.date.slice(5, 7)}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Announce Form Modal Card */}
        {showAnnounceForm && (
          <div className="card" style={{ marginTop: 16, marginBottom: 16, animation: 'fadeInUp 0.3s ease', borderRadius: 16, border: '1.5px solid var(--teal, #0F766E)', boxShadow: '0 8px 24px rgba(15, 118, 110, 0.12)', background: '#FFFFFF', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <IconSpeakerphone size={22} color="var(--teal, #0F766E)" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Post Programme Announcement</h3>
            </div>
            
            <div className="form-group" style={{ marginBottom: 12 }}>
              <textarea
                value={annText}
                onChange={(e) => setAnnText(e.target.value)}
                placeholder="Write message for campers & staff..."
                style={{ minHeight: 90, borderRadius: 10, border: '1px solid var(--border)', padding: 12, width: '100%', fontSize: '0.875rem' }}
              />
            </div>
            <div className="toggle-row" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: annUrgent ? '#DC2626' : 'var(--text-secondary)' }}>
                <IconBell size={18} color={annUrgent ? '#DC2626' : 'var(--text-muted)'} /> Mark as Urgent Broadcast Alert
              </span>
              <button
                type="button"
                className={`toggle ${annUrgent ? 'on' : ''}`}
                onClick={() => setAnnUrgent(!annUrgent)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handlePost} style={{ flex: 1, padding: '10px 16px', borderRadius: 9999, fontWeight: 600 }}>
                Publish Announcement
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowAnnounceForm(false); setAnnText(''); setAnnUrgent(false); }}
                style={{ padding: '10px 18px', borderRadius: 9999, fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 3. Announcements Section */}
        {dayAnnouncements.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <IconSpeakerphone size={20} color="var(--teal, #0F766E)" />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Announcements & Broadcasts</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {dayAnnouncements.map((ann) => {
                const author = staff.find((s) => s.id === ann.author) || { name: ann.authorName || 'Camp Administration' };
                const annTime = new Date(ann.createdAt || Date.now());
                const annTimeStr = annTime.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
                const isUrgent = ann.urgent || ann.isEmergency || ann.priority === 'urgent';

                return (
                  <div 
                    key={ann.id} 
                    style={{ 
                      background: isUrgent ? '#FEF2F2' : '#FFFFFF', 
                      borderRadius: 14, 
                      padding: '14px 18px', 
                      border: isUrgent ? '1.5px solid #FCA5A5' : '1px solid var(--border, #E2E8F0)', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      borderLeft: isUrgent ? '4px solid #EF4444' : '4px solid var(--teal, #0F766E)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isUrgent ? '#EF4444' : 'var(--teal, #0F766E)', color: '#FFF', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getInitials(author.name)}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{author.name}</span>
                        {isUrgent && (
                          <span className="badge" style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999 }}>
                            URGENT ALERT
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{annTimeStr}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: isUrgent ? '#991B1B' : 'var(--text-secondary)', lineHeight: 1.5, margin: 0, paddingLeft: 36 }}>
                      {ann.text || ann.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Timeline Schedule List */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconCalendarEvent size={20} color="var(--teal, #0F766E)" />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Schedule Timeline ({daySchedule.length} Events)</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{campDay.label} · {campDay.full}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
            {daySchedule.map((event, i) => {
              const happening = isNow(event.time, event.end);
              return (
                <div 
                  key={i} 
                  style={{ 
                    background: happening ? 'rgba(15, 118, 110, 0.05)' : '#FFFFFF', 
                    borderRadius: 16, 
                    border: happening ? '2px solid var(--teal, #0F766E)' : '1px solid var(--border, #E2E8F0)', 
                    padding: '16px 20px', 
                    boxShadow: happening ? '0 4px 16px rgba(15, 118, 110, 0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    borderLeft: happening ? '6px solid var(--teal, #0F766E)' : '4px solid var(--border-light, #CBD5E1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Event Category Icon Bubble */}
                  <div 
                    style={{ 
                      width: 42, 
                      height: 42, 
                      borderRadius: 12, 
                      background: happening ? 'rgba(15, 118, 110, 0.15)' : '#F8FAFC', 
                      border: happening ? '1px solid rgba(15, 118, 110, 0.3)' : '1px solid #E2E8F0',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  >
                    {getEventIcon(event.title)}
                  </div>

                  {/* Event Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: happening ? 'var(--teal, #0F766E)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{event.title}</span>
                        {happening && (
                          <span style={{ background: 'var(--teal, #0F766E)', color: '#FFFFFF', fontSize: '0.6875rem', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, letterSpacing: '0.05em' }}>
                            HAPPENING NOW
                          </span>
                        )}
                      </div>
                      
                      {/* Time Badge */}
                      <span 
                        style={{ 
                          fontSize: '0.8125rem', 
                          fontWeight: 700, 
                          color: happening ? '#FFFFFF' : 'var(--teal, #0F766E)', 
                          background: happening ? 'var(--teal, #0F766E)' : '#F0FDF4', 
                          padding: '4px 10px', 
                          borderRadius: 9999,
                          border: happening ? 'none' : '1px solid #BBF7D0'
                        }}
                      >
                        {event.time} {event.end ? `– ${event.end}` : ''}
                      </span>
                    </div>

                    {/* Location & Audience Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <IconMapPin size={15} style={{ opacity: 0.7 }} /> {event.location || 'Camp Grounds'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                        <IconUsers size={15} style={{ opacity: 0.7 }} /> {event.groups === 'all' ? 'All Campers & Staff' : 'By Group'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
