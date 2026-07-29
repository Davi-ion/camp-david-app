import { useState, useEffect, useMemo } from 'react';
import { CAMP_DAYS, schedule as defaultSchedule } from '../data/schedule';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconCalendarEvent, 
  IconClock, 
  IconMapPin, 
  IconCheck, 
  IconX,
  IconRefresh
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

function formatTime12(timeStr) {
  if (!timeStr) return '-';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${(m || 0).toString().padStart(2, '0')} ${ampm}`;
}

export default function ConsoleProgramme() {
  const [selectedDay, setSelectedDay] = useState(CAMP_DAYS[0].key);
  const [dbSessions, setDbSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    day: 'wed',
    title: '',
    time: '08:00',
    end: '09:00',
    location: 'Main Auditorium',
    type: 'General',
    speaker: '',
    description: '',
    requiresAttendance: false,
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
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
      console.error('Failed to fetch program sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Combine DB sessions with fallback default schedule if DB is empty
  const daySessions = useMemo(() => {
    const fromDb = dbSessions.filter(s => s.day === selectedDay);
    if (fromDb.length > 0) return fromDb;
    return defaultSchedule[selectedDay] || [];
  }, [dbSessions, selectedDay]);

  const handleOpenAddModal = () => {
    setEditingSession(null);
    setFormData({
      day: selectedDay,
      title: '',
      time: '08:00',
      end: '09:00',
      location: 'Main Auditorium',
      type: 'General',
      speaker: '',
      description: '',
      requiresAttendance: false,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (session) => {
    setEditingSession(session);
    setFormData({
      day: session.day || selectedDay,
      title: session.title || '',
      time: session.time || '08:00',
      end: session.end || '09:00',
      location: session.location || '',
      type: session.type || 'General',
      speaker: session.speaker || '',
      description: session.description || '',
      requiresAttendance: Boolean(session.requiresAttendance),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const token = localStorage.getItem('camp_token');
      const payload = { ...formData };

      let res;
      if (editingSession && editingSession.id) {
        res = await fetch(`${API}/api/program-sessions/${editingSession.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API}/api/program-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowModal(false);
        fetchSessions();
      } else {
        alert('Failed to save session. Please try again.');
      }
    } catch (err) {
      console.error('Error saving program session:', err);
      alert('Network error while saving session.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/program-sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  return (
    <div className="console-fade-in">
      {/* Header */}
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconCalendarEvent size={28} color="var(--primary)" /> Programme Schedule Manager
          </h1>
          <p className="console-page-subtitle">Add, edit, and organize daily camp sessions and activity timelines</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={fetchSessions} 
            className="btn btn-secondary" 
            style={{ padding: '8px 14px', borderRadius: 9999, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconRefresh size={16} /> Refresh
          </button>
          <button 
            onClick={handleOpenAddModal} 
            className="btn btn-primary" 
            style={{ padding: '8px 18px', borderRadius: 9999, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <IconPlus size={18} /> Add Session
          </button>
        </div>
      </div>

      {/* Day Selector Strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {CAMP_DAYS.map(day => (
          <button
            key={day.key}
            onClick={() => setSelectedDay(day.key)}
            style={{
              padding: '12px 24px', 
              borderRadius: 14, 
              border: selectedDay === day.key ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: selectedDay === day.key ? 'var(--primary)' : '#FFFFFF',
              color: selectedDay === day.key ? '#FFFFFF' : 'var(--text)',
              cursor: 'pointer', 
              flexShrink: 0, 
              textAlign: 'left',
              boxShadow: selectedDay === day.key ? '0 4px 12px rgba(27, 120, 101, 0.2)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: selectedDay === day.key ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>
              Day {day.dayNum}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{day.full.split(',')[0]}</div>
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="console-card">
        <div className="console-card-header" style={{ padding: '14px 20px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            Showing {daySessions.length} sessions for {CAMP_DAYS.find(d => d.key === selectedDay)?.full}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Database Synced
          </div>
        </div>

        <div className="console-table-container">
          <table className="console-table">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Time</th>
                <th>Session Details</th>
                <th>Location</th>
                <th>Category</th>
                <th>Requires Roll Call</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {daySessions.map((session, idx) => (
                <tr key={session.id || session.key || idx}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconClock size={16} />
                      {formatTime12(session.time)} - {formatTime12(session.end)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9375rem' }}>{session.title}</div>
                    {session.speaker && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Speaker: <strong>{session.speaker}</strong>
                      </div>
                    )}
                    {session.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {session.description}
                      </div>
                    )}
                  </td>
                  <td>
                    {session.location ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem' }}>
                        <IconMapPin size={14} style={{ opacity: 0.7 }} /> {session.location}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600 }}>
                      {session.type || 'General'}
                    </span>
                  </td>
                  <td>
                    {session.requiresAttendance ? (
                      <span className="badge" style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                        <IconCheck size={13} /> Yes
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                      <button 
                        onClick={() => handleOpenEditModal(session)} 
                        title="Edit Session"
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          padding: 4, 
                          cursor: 'pointer', 
                          color: 'var(--primary, #0F766E)', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          opacity: 0.85,
                          transition: 'opacity 0.15s ease'
                        }}
                      >
                        <IconEdit size={18} />
                      </button>
                      {session.id && (
                        <button 
                          onClick={() => handleDelete(session.id)} 
                          title="Delete Session"
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            padding: 4, 
                            cursor: 'pointer', 
                            color: '#EF4444', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            opacity: 0.85,
                            transition: 'opacity 0.15s ease'
                          }}
                        >
                          <IconTrash size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {daySessions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No sessions scheduled for this day yet. Click "+ Add Session" above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Session Modal */}
      {showModal && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(4px)', 
            zIndex: 1000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 20 
          }}
        >
          <div 
            style={{ 
              background: '#FFFFFF', 
              borderRadius: 20, 
              maxWidth: 540, 
              width: '100%', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)', 
              overflow: 'hidden',
              animation: 'fadeInUp 0.25s ease'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', background: 'var(--primary)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                {editingSession ? 'Edit Programme Session' : 'Add New Programme Session'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 4 }}
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Camp Day</label>
                  <select 
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                    required
                  >
                    {CAMP_DAYS.map(d => (
                      <option key={d.key} value={d.key}>{d.full}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Session Type / Category</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value="General">General</option>
                    <option value="Roll Call">Roll Call</option>
                    <option value="Worship">Worship / Session</option>
                    <option value="Meal">Meal / Break</option>
                    <option value="Activity">Activity / Sports</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Keynote">Keynote</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Session Title *</label>
                <input 
                  type="text"
                  placeholder="e.g. Morning Devotion & General Assembly"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Start Time (24h) *</label>
                  <input 
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                    required
                  />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>End Time (24h) *</label>
                  <input 
                    type="time"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Location / Venue</label>
                  <input 
                    type="text"
                    placeholder="e.g. Main Auditorium"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Speaker / Facilitator</label>
                  <input 
                    type="text"
                    placeholder="e.g. Pastor David / Admin"
                    value={formData.speaker}
                    onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="input-label" style={{ fontSize: '0.75rem', marginBottom: 4 }}>Description / Notes</label>
                <textarea 
                  placeholder="Optional details or session guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px', minHeight: 70 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <input 
                  type="checkbox"
                  id="reqAtt"
                  checked={formData.requiresAttendance}
                  onChange={(e) => setFormData({ ...formData, requiresAttendance: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="reqAtt" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                  Requires Roll Call Attendance Logging
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: 9999, fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', borderRadius: 9999, fontWeight: 700 }}
                >
                  {editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
