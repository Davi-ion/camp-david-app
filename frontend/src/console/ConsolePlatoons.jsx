import { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import {
  IconFlag,
  IconUsers,
  IconChevronRight,
  IconAlertTriangle,
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

function getInitials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
}

export default function ConsolePlatoons() {
  const { hasPermission } = usePermissions();

  const [platoons, setPlatoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatoon, setSelectedPlatoon] = useState(null);

  const fetchPlatoons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/platoons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPlatoons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatoons();
  }, []);

  return (
    <div className="console-fade-in">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">Platoons</h1>
          <p className="console-page-subtitle">Manage camp groups, assigned leaders and campers</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {hasPermission('manage:users') && (
            <button className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem' }}>
              + New Platoon
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading platoons...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {platoons.map(p => {
            const medCount = p.campers?.filter(c => c.medicalNotes).length || 0;
            const brandColor = p.colorHex || '#14442C';
            const isSelected = selectedPlatoon?.id === p.id;
            
            return (
              <div 
                key={p.id} 
                className={`console-card ${isSelected ? 'active' : ''}`}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  cursor: 'pointer',
                  borderRadius: 16,
                  border: isSelected ? `2px solid ${brandColor}` : '1px solid var(--border)',
                  boxShadow: isSelected ? '0 4px 20px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  background: 'var(--bg-surface, #fff)'
                }}
                onClick={() => setSelectedPlatoon(p)}
              >
                {/* Top Accent Line */}
                <div style={{ background: brandColor, height: 4 }}></div>
                
                {/* Header */}
                <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 12, 
                      background: `${brandColor}15`, 
                      color: brandColor, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {p.emoji || <IconFlag size={22} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text)', letterSpacing: '-0.01em' }}>{p.name}</h2>
                        <span className="badge badge-teal" style={{ fontSize: '0.625rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
                          Platoon
                        </span>
                      </div>
                      {p.description && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Card Body */}
                <div style={{ padding: '0 24px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Leader Info Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-light, #F8FAFC)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                    <img
                      src={p.leader?.avatar && (p.leader.avatar.startsWith('/') || p.leader.avatar.startsWith('http')) ? p.leader.avatar : '/avatars/character1.jpg'}
                      alt={p.leader?.name || 'Leader'}
                      style={{ width: 34, height: 34, borderRadius: 9999, objectFit: 'cover', border: `1.5px solid ${brandColor}`, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Platoon Leader</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.leader?.name || 'No leader assigned'}</div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: '12px 14px', border: '1px solid var(--border-light)', borderRadius: 12, background: '#fff' }}>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Campers</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{p.campers?.length || 0}</div>
                    </div>
                    <div style={{ padding: '12px 14px', border: '1px solid var(--border-light)', borderRadius: 12, background: '#fff' }}>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>Staff Assigned</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{p.staff?.length || 0}</div>
                    </div>
                  </div>

                  {/* Medical Alert Badge if applicable */}
                  {medCount > 0 && (
                    <div style={{ padding: '8px 12px', background: '#FDF2EE', color: '#E86A43', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <IconAlertTriangle size={16} /> {medCount} camper{medCount !== 1 ? 's' : ''} with medical notes
                    </div>
                  )}

                  {/* Open Action Footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: brandColor, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Manage Platoon <IconChevronRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPlatoon && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, overflowY: 'auto' }}>
          <div className="console-card" style={{ width: 800, maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="console-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedPlatoon.colorHex + '10', borderBottom: `2px solid ${selectedPlatoon.colorHex}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '2rem' }}>{selectedPlatoon.emoji}</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{selectedPlatoon.name} Platoon</h2>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Leader: {selectedPlatoon.leader?.name || 'Unassigned'} | Counsellors: {selectedPlatoon.staff?.filter(s => s.roleName === 'Counsellor').length || 0}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPlatoon(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)' }}>✕</button>
            </div>
            
            <div className="console-card-body" style={{ overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Campers</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedPlatoon.campers?.length || 0}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Medical Alerts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--orange)' }}>{selectedPlatoon.campers?.filter(c => c.medicalNotes).length || 0}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dietary Reqs</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedPlatoon.campers?.filter(c => c.dietaryRestrictions).length || 0}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Incidents</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--red)' }}>0</div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.125rem', marginBottom: 12 }}>Camper List</h3>
              <table className="console-table">
                <thead>
                  <tr>
                    <th>Reg #</th>
                    <th>Name</th>
                    <th>Age / Gender</th>
                    <th>Medical Notes</th>
                    <th>Assigned Counsellor</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlatoon.campers?.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>{c.registrationNumber}</td>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td style={{ fontSize: '0.8125rem' }}>{c.age} {c.gender?.charAt(0)}</td>
                      <td>
                        {c.medicalNotes ? <span className="badge badge-orange" title={c.medicalNotes}>Alert</span> : '-'}
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {selectedPlatoon.staff?.find(s => s.id === c.counsellorId)?.name || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                  {(!selectedPlatoon.campers || selectedPlatoon.campers.length === 0) && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>No campers assigned.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
