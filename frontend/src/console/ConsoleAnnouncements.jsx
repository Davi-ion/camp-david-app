import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePermissions } from '../hooks/usePermissions';
import {
  IconSpeakerphone,
  IconPlus,
  IconAlertTriangle,
  IconPin,
  IconUser,
  IconCalendar,
  IconTarget,
  IconClock,
  IconPencil,
  IconTrash,
  IconX,
  IconSend,
  IconCheck,
  IconBellRinging,
  IconFlame,
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

const CATEGORIES = [
  'General', 'Programme', 'Camp Drill', 'Attendance', 'Medical', 'Security', 
  'Meals', 'Transport', 'Emergency', 'Competition', 'Worship', 'Other'
];

export default function ConsoleAnnouncements() {
  const { hasPermission } = usePermissions();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', body: '', category: 'General', priority: 'normal', 
    status: 'published', isEmergency: false, pinned: false, 
    targetType: 'all', targetId: '', scheduledAt: '', expiryDate: ''
  });

  const [stats, setStats] = useState({});

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.announcements || []);
        setAnnouncements(list);
        
        // Fetch stats for published announcements
        list.forEach(ann => {
          if (ann && ann.id && (ann.status === 'published' || !ann.status)) {
            fetchStats(ann.id);
          }
        });
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (id) => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/announcements/${id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, [id]: data }));
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const saveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('camp_token');
      
      let payload = { ...formData };
      if (payload.isEmergency) {
        payload.priority = 'critical';
        payload.pinned = true;
      }

      const url = payload.id ? `${API}/api/announcements/${payload.id}` : `${API}/api/announcements`;
      const method = payload.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setModalOpen(false);
        fetchAnnouncements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAnn = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const token = localStorage.getItem('camp_token');
      await fetch(`${API}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
    } catch (err) {}
  };

  const togglePin = async (ann) => {
    try {
      const token = localStorage.getItem('camp_token');
      await fetch(`${API}/api/announcements/${ann.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...ann, pinned: !ann.pinned })
      });
      fetchAnnouncements();
    } catch (err) {}
  };

  return (
    <div className="console-fade-in">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">Announcements & Broadcasts</h1>
          <p className="console-page-subtitle">Broadcast messages, emergency alerts, and track delivery statistics.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {hasPermission('create:announcements') && (
            <button 
              onClick={() => {
                setFormData({ 
                  title: '', body: '', category: 'General', priority: 'normal', 
                  status: 'published', isEmergency: false, pinned: false, 
                  targetType: 'all', targetId: '', scheduledAt: '', expiryDate: '' 
                });
                setModalOpen(true);
              }} 
              className="btn btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 9999, fontSize: '0.875rem', fontWeight: 600 }}
            >
              <IconPlus size={18} />
              <span>New Announcement</span>
            </button>
          )}
        </div>
      </div>

      <div className="console-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <IconSpeakerphone size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No announcements found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {announcements.map(ann => {
              const isEmergency = ann.isEmergency || ann.priority === 'critical';
              const statusStr = (ann.status || 'published').toUpperCase();

              return (
                <div key={ann.id} style={{ padding: 24, borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 16, alignItems: 'flex-start', background: isEmergency ? 'rgba(239, 68, 68, 0.04)' : 'transparent' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {isEmergency && (
                        <span className="badge badge-red" style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999 }}>
                          <IconAlertTriangle size={14} /> EMERGENCY
                        </span>
                      )}
                      {ann.pinned && (
                        <span className="badge badge-teal" style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999 }}>
                          <IconPin size={14} /> PINNED
                        </span>
                      )}
                      <span className="badge" style={{ fontSize: '0.6875rem', background: '#F1F5F9', color: '#475569', fontWeight: 600, padding: '3px 10px', borderRadius: 9999 }}>
                        {statusStr}
                      </span>
                      <span className="badge" style={{ fontSize: '0.6875rem', background: '#EEF2FF', color: '#3730A3', fontWeight: 600, padding: '3px 10px', borderRadius: 9999 }}>
                        {ann.category || 'General'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, margin: '6px 0 8px 0', color: 'var(--text)' }}>
                      {ann.title}
                    </h3>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 14px 0', whiteSpace: 'pre-wrap' }}>
                      {ann.body || ann.text}
                    </p>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconUser size={14} /> {ann.authorName || 'Camp Administration'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconCalendar size={14} /> {ann.createdAt ? new Date(ann.createdAt).toLocaleString('en-NG') : 'Just now'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconTarget size={14} /> Target: {(ann.targetType || 'all').toUpperCase()} {ann.targetId ? `(${ann.targetId})` : ''}
                      </span>
                      {ann.scheduledAt && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconClock size={14} /> Scheduled: {new Date(ann.scheduledAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {stats[ann.id] && (
                      <div style={{ display: 'flex', gap: 20, marginTop: 14, padding: '12px 18px', background: 'var(--bg, #F8FAFC)', borderRadius: 12, border: '1px solid var(--border, #E2E8F0)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text)' }}>{stats[ann.id].totalRecipients || 0}</div>
                          Total Recipients
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--teal, #0F766E)' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{stats[ann.id].readCount || 0}</div>
                          Opened
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--amber, #D97706)' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{stats[ann.id].unreadCount || 0}</div>
                          Unread
                        </div>
                      </div>
                    )}
                  </div>

                  {hasPermission('create:announcements') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => { setFormData(ann); setModalOpen(true); }} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconPencil size={14} /> Edit
                      </button>
                      <button onClick={() => togglePin(ann)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconPin size={14} /> {ann.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button onClick={() => deleteAnn(ann.id)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 9999, color: 'var(--red, #EF4444)', borderColor: '#FCA5A5', background: '#FEF2F2', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <IconTrash size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── REDESIGNED NEW / EDIT ANNOUNCEMENT MODAL ───────────────────────── */}
      {modalOpen && createPortal(
        <div 
          className="modal-overlay" 
          style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.70)', 
            backdropFilter: 'blur(8px)', 
            zIndex: 999999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 16 
          }}
        >
          <div 
            style={{ 
              width: 640, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', 
              borderRadius: 24, background: '#FFFFFF', 
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconSpeakerphone size={24} color="#0F766E" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                    {formData.id ? 'Edit Announcement' : 'Create Announcement'}
                  </h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                    Broadcast notifications, emergency alerts & scheduled posts.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalOpen(false)} 
                style={{ 
                  background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '50%', 
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', color: '#64748B', transition: 'all 0.15s ease' 
                }}
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={saveAnnouncement} style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Emergency Switch Banner */}
              <div 
                style={{ 
                  background: formData.isEmergency ? 'linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%)' : '#F8FAFC', 
                  border: formData.isEmergency ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0', 
                  borderRadius: 16, padding: '14px 18px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: formData.isEmergency ? '#EF4444' : '#E2E8F0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconAlertTriangle size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: formData.isEmergency ? '#991B1B' : '#334155', display: 'block' }}>
                      Emergency Broadcast Alert
                    </span>
                    <span style={{ fontSize: '0.75rem', color: formData.isEmergency ? '#B91C1C' : '#64748B' }}>
                      Overrides priority to Critical and pins notice to the top of all feeds.
                    </span>
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isEmergency} 
                    onChange={e => setFormData({ ...formData, isEmergency: e.target.checked })} 
                    style={{ opacity: 0, width: 0, height: 0 }} 
                  />
                  <span 
                    style={{ 
                      position: 'absolute', inset: 0, 
                      backgroundColor: formData.isEmergency ? '#EF4444' : '#CBD5E1', 
                      borderRadius: 9999, transition: '0.2s' 
                    }}
                  />
                  <span 
                    style={{ 
                      position: 'absolute', height: 18, width: 18, left: 3, bottom: 3, 
                      backgroundColor: '#FFFFFF', borderRadius: '50%', 
                      transition: '0.2s', 
                      transform: formData.isEmergency ? 'translateX(20px)' : 'translateX(0)' 
                    }} 
                  />
                </label>
              </div>

              {/* Title Input */}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8125rem', color: '#334155', marginBottom: 6 }}>
                  Title <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input 
                  required 
                  className="input-field" 
                  placeholder="e.g., Morning Assembly Location Change" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  style={{ borderRadius: 12, padding: '10px 14px', fontSize: '0.875rem', border: '1px solid #CBD5E1', width: '100%' }} 
                />
              </div>

              {/* Message Textarea */}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8125rem', color: '#334155', marginBottom: 6 }}>
                  Message Content <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea 
                  required 
                  rows="4" 
                  className="input-field" 
                  placeholder="Write full announcement details for campers and staff..." 
                  value={formData.body} 
                  onChange={e => setFormData({ ...formData, body: e.target.value })} 
                  style={{ borderRadius: 12, padding: '12px 14px', fontSize: '0.875rem', border: '1px solid #CBD5E1', minHeight: 110, width: '100%', resize: 'vertical' }}
                />
              </div>

              {/* Category & Priority Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8125rem', color: '#334155', marginBottom: 6 }}>
                    Category
                  </label>
                  <select 
                    className="input-field" 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    style={{ borderRadius: 12, padding: '10px 14px', fontSize: '0.875rem', border: '1px solid #CBD5E1', width: '100%', background: '#FFFFFF' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8125rem', color: '#334155', marginBottom: 6 }}>
                    Priority Level
                  </label>
                  <select 
                    disabled={formData.isEmergency} 
                    className="input-field" 
                    value={formData.isEmergency ? 'critical' : formData.priority} 
                    onChange={e => setFormData({ ...formData, priority: e.target.value })} 
                    style={{ borderRadius: 12, padding: '10px 14px', fontSize: '0.875rem', border: '1px solid #CBD5E1', width: '100%', background: formData.isEmergency ? '#F1F5F9' : '#FFFFFF' }}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Status & Target Audience Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8125rem', color: '#334155', marginBottom: 6 }}>
                    Publish Status
                  </label>
                  <select 
                    className="input-field" 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value })} 
                    style={{ borderRadius: 12, padding: '10px 14px', fontSize: '0.875rem', border: '1px solid #CBD5E1', width: '100%', background: '#FFFFFF' }}
                  >
                    <option value="published">Publish Immediately</option>
                    <option value="draft">Save as Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8125rem', color: '#334155', marginBottom: 6 }}>
                    Target Audience
                  </label>
                  <select 
                    className="input-field" 
                    value={formData.targetType} 
                    onChange={e => setFormData({ ...formData, targetType: e.target.value })} 
                    style={{ borderRadius: 12, padding: '10px 14px', fontSize: '0.875rem', border: '1px solid #CBD5E1', width: '100%', background: '#FFFFFF' }}
                  >
                    <option value="all">Entire Camp (All Campers & Staff)</option>
                    <option value="staff">All Staff Only</option>
                    <option value="platoon">Specific Platoon</option>
                    <option value="department">Specific Department</option>
                    <option value="role">Specific Role</option>
                    <option value="individual">Specific Person</option>
                  </select>
                </div>
              </div>

              {/* Conditional Target ID Field */}
              {['platoon', 'department', 'role', 'individual'].includes(formData.targetType) && (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8125rem', color: '#334155', marginBottom: 6 }}>
                    Target Identifier <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    required 
                    className="input-field" 
                    placeholder="Enter Platoon Name, Department, or Person ID..." 
                    value={formData.targetId || ''} 
                    onChange={e => setFormData({ ...formData, targetId: e.target.value })} 
                    style={{ borderRadius: 12, padding: '10px 14px', fontSize: '0.875rem', border: '1px solid #CBD5E1', width: '100%' }} 
                  />
                </div>
              )}

              {/* Conditional Scheduled Date/Time */}
              {formData.status === 'scheduled' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8125rem', color: '#334155', marginBottom: 6 }}>
                    Scheduled Release Time <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    value={formData.scheduledAt ? formData.scheduledAt.substring(0, 16) : ''} 
                    onChange={e => setFormData({ ...formData, scheduledAt: new Date(e.target.value).toISOString() })} 
                    required 
                    style={{ borderRadius: 12, padding: '10px 14px', fontSize: '0.875rem', border: '1px solid #CBD5E1', width: '100%' }} 
                  />
                </div>
              )}

              {/* Pin Checkbox Bar */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
                  <input 
                    disabled={formData.isEmergency} 
                    type="checkbox" 
                    checked={formData.isEmergency ? true : formData.pinned} 
                    onChange={e => setFormData({ ...formData, pinned: e.target.checked })} 
                    style={{ width: 18, height: 18, accentColor: '#0F766E' }} 
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <IconPin size={16} color="#0F766E" /> Pin Announcement to Top of Feed
                  </span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="btn btn-secondary" 
                  style={{ padding: '10px 22px', borderRadius: 9999, fontWeight: 600, fontSize: '0.875rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 26px', borderRadius: 9999, fontWeight: 700, fontSize: '0.875rem' }}
                >
                  <IconSend size={18} />
                  <span>{formData.status === 'published' ? 'Publish Now' : 'Save Announcement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
