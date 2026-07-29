import { useState, useEffect } from 'react';
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
  IconEye,
  IconEyeOff,
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

  // Modal
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9999, fontSize: '0.875rem', fontWeight: 600 }}
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
            <IconSpeakerphone size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0, fontWeight: 500 }}>No announcements found.</p>
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

      {modalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="console-card" style={{ width: 620, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div className="console-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
              <span className="console-card-title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {formData.id ? 'Edit Announcement' : 'New Announcement'}
              </span>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }}>
                <IconX size={20} />
              </button>
            </div>
            <div className="console-card-body" style={{ paddingTop: 16 }}>
              <form onSubmit={saveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: 14 }}>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0, color: '#991B1B', fontWeight: 600 }}>
                    <input type="checkbox" checked={formData.isEmergency} onChange={e => setFormData({ ...formData, isEmergency: e.target.checked })} style={{ width: 18, height: 18 }} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <IconAlertTriangle size={18} color="#DC2626" />
                      Emergency Broadcast Alert (Overrides Priority & Pins to Top)
                    </span>
                  </label>
                </div>

                <div>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Title *</label>
                  <input required className="input-field" placeholder="Announcement title..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ borderRadius: 10 }} />
                </div>
                
                <div>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Message *</label>
                  <textarea required rows="4" className="input-field" placeholder="Write full broadcast details..." value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} style={{ borderRadius: 10, minHeight: 100 }}></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Category</label>
                    <select className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ borderRadius: 10 }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Priority</label>
                    <select disabled={formData.isEmergency} className="input-field" value={formData.isEmergency ? 'critical' : formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} style={{ borderRadius: 10 }}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</label>
                    <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ borderRadius: 10 }}>
                      <option value="published">Publish Immediately</option>
                      <option value="draft">Save as Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Target Audience</label>
                    <select className="input-field" value={formData.targetType} onChange={e => setFormData({ ...formData, targetType: e.target.value })} style={{ borderRadius: 10 }}>
                      <option value="all">Entire Camp</option>
                      <option value="staff">All Staff</option>
                      <option value="platoon">Specific Platoon</option>
                      <option value="department">Specific Department</option>
                      <option value="role">Specific Role</option>
                      <option value="individual">Specific Individual</option>
                    </select>
                  </div>
                </div>

                {['platoon', 'department', 'role', 'individual'].includes(formData.targetType) && (
                  <div>
                    <label className="input-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Target ID (e.g. Platoon Name, Dept Name)</label>
                    <input required className="input-field" value={formData.targetId || ''} onChange={e => setFormData({ ...formData, targetId: e.target.value })} style={{ borderRadius: 10 }} />
                  </div>
                )}

                {formData.status === 'scheduled' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="input-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Publish Date/Time</label>
                      <input type="datetime-local" className="input-field" value={formData.scheduledAt ? formData.scheduledAt.substring(0, 16) : ''} onChange={e => setFormData({ ...formData, scheduledAt: new Date(e.target.value).toISOString() })} required style={{ borderRadius: 10 }} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input disabled={formData.isEmergency} type="checkbox" checked={formData.isEmergency ? true : formData.pinned} onChange={e => setFormData({ ...formData, pinned: e.target.checked })} style={{ width: 16, height: 16 }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Pin to Dashboard & Staff Portal</span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary" style={{ padding: '9px 20px', borderRadius: 9999, fontWeight: 600 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '9px 24px', borderRadius: 9999, fontWeight: 600 }}>
                    {formData.status === 'published' ? 'Publish Now' : 'Save Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
