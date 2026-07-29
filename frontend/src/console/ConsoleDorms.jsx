import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

function getInitials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
}

export default function ConsoleDorms() {
  const { state } = useApp();
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [dormCampers, setDormCampers] = useState([]);
  
  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [supervisorsModalOpen, setSupervisorsModalOpen] = useState(false);
  
  const [availableCampers, setAvailableCampers] = useState([]);
  const [selectedCamperIds, setSelectedCamperIds] = useState(new Set());
  
  const [camperToMove, setCamperToMove] = useState(null);
  const [newDormId, setNewDormId] = useState('');
  
  const [staff, setStaff] = useState([]);
  const [supervisorIds, setSupervisorIds] = useState({ supervisorId: '', assistantSupervisorId: '' });

  useEffect(() => {
    fetchDorms();
    fetchStaff();
  }, []);

  const fetchDorms = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/dorms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch dorms');
      const data = await res.json();
      setDorms(data);
      if (selectedDorm) {
        setSelectedDorm(data.find(d => d.id === selectedDorm.id) || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStaff(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDormCampers = async (dormId) => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/dorms/${dormId}/campers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch campers');
      const data = await res.json();
      setDormCampers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectDorm = (dorm) => {
    setSelectedDorm(dorm);
    setDormCampers([]);
    loadDormCampers(dorm.id);
  };

  const printRoster = () => {
    window.print();
  };
  
  // --- Assignment Logic ---
  const openAssignModal = async () => {
    setSelectedCamperIds(new Set());
    setAssignModalOpen(true);
    try {
      const token = localStorage.getItem('camp_token');
      // Fetch campers to find available ones matching gender
      const res = await fetch(`${API}/api/campers?limit=1000&status=active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // filter by gender and not already in this dorm
        const available = data.campers.filter(c => 
          c.gender?.toLowerCase() === selectedDorm.gender.toLowerCase() && 
          c.dormId !== selectedDorm.id
        );
        setAvailableCampers(available);
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const toggleCamperSelection = (id) => {
    const newSet = new Set(selectedCamperIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCamperIds(newSet);
  };
  
  const submitAssignments = async () => {
    if (selectedCamperIds.size === 0) return setAssignModalOpen(false);
    try {
      const token = localStorage.getItem('camp_token');
      for (let id of selectedCamperIds) {
        await fetch(`${API}/api/campers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ dormId: selectedDorm.id })
        });
      }
      setAssignModalOpen(false);
      fetchDorms();
      loadDormCampers(selectedDorm.id);
    } catch (err) {
      console.error(err);
      alert('Failed to assign campers');
    }
  };
  
  // --- Remove Logic ---
  const removeCamper = async (camperId) => {
    if (!confirm('Are you sure you want to remove this camper from the dorm?')) return;
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/campers/${camperId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dormId: null })
      });
      if (res.ok) {
        fetchDorms();
        loadDormCampers(selectedDorm.id);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove camper');
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  // --- Move Logic ---
  const openMoveModal = (camper) => {
    setCamperToMove(camper);
    setNewDormId('');
    setMoveModalOpen(true);
  };
  
  const submitMove = async () => {
    if (!newDormId) return;
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/campers/${camperToMove.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dormId: newDormId })
      });
      if (res.ok) {
        setMoveModalOpen(false);
        fetchDorms();
        loadDormCampers(selectedDorm.id);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to move camper');
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  // --- Supervisors Logic ---
  const openSupervisorsModal = () => {
    setSupervisorIds({
      supervisorId: selectedDorm.supervisorId || '',
      assistantSupervisorId: selectedDorm.assistantSupervisorId || ''
    });
    setSupervisorsModalOpen(true);
  };
  
  const submitSupervisors = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/dorms/${selectedDorm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          supervisorId: supervisorIds.supervisorId || null,
          assistantSupervisorId: supervisorIds.assistantSupervisorId || null
        })
      });
      if (res.ok) {
        setSupervisorsModalOpen(false);
        fetchDorms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="console-page">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">Dorm Management</h1>
          <p className="console-page-desc">Manage accommodation, capacity, and assignments.</p>
        </div>
      </div>
      
      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {dorms.map(dorm => {
          const isFemale = dorm.gender?.toLowerCase() === 'female';
          const accentColor = isFemale ? '#EC4899' : '#14442C';
          const isFull = dorm.occupancy >= dorm.capacity;
          const percentage = Math.round((dorm.occupancy / dorm.capacity) * 100) || 0;
          const remaining = dorm.capacity - dorm.occupancy;
          const isSelected = selectedDorm?.id === dorm.id;
          
          return (
            <div 
              key={dorm.id} 
              className={`console-card ${isSelected ? 'active' : ''}`}
              style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', outline: isSelected ? `2px solid ${accentColor}` : undefined }}
              onClick={() => handleSelectDorm(dorm)}
            >
              {/* Top Accent Color Bar */}
              <div style={{ background: accentColor, height: 8 }}></div>
              
              {/* Card Header */}
              <div className="console-card-header" style={{ padding: '20px 24px', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.5rem' }}>{isFemale ? '🏢' : '🛏️'}</span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>{dorm.name}</h2>
                    <span className="badge" style={{ background: isFemale ? '#FCE7F3' : '#E8F5F1', color: isFemale ? '#BE185D' : '#14442C', textTransform: 'capitalize', fontSize: '0.6875rem' }}>
                      {dorm.gender}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {isFemale ? 'Female Accommodation Block' : 'Male Accommodation Block'}
                  </p>
                </div>
                <button className="btn btn-text" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                  {isSelected ? 'Selected' : 'Open Dorm'}
                </button>
              </div>
              
              {/* Card Body */}
              <div className="console-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 0 }}>
                {/* Supervisor Info Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--bg)', borderRadius: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: dorm.supervisor ? accentColor : '#D1D5DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                    {getInitials(dorm.supervisor?.name || 'Unassigned')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Dorm Supervisor</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)' }}>{dorm.supervisor?.name || 'No supervisor assigned'}</div>
                  </div>
                </div>

                {/* Occupancy Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Occupancy</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{dorm.occupancy || 0} / {dorm.capacity}</div>
                  </div>
                  <div style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Available Beds</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: remaining > 0 ? 'var(--teal)' : 'var(--red)' }}>
                      {remaining > 0 ? remaining : 'Full'}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Bed Capacity</span>
                    <span style={{ color: isFull ? 'var(--red)' : accentColor }}>{percentage}% ({dorm.occupancy} / {dorm.capacity})</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--border-light)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(percentage, 100)}%`, height: '100%', background: isFull ? 'var(--red)' : accentColor, borderRadius: 9999, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedDorm && (
        <div className="console-card" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              {selectedDorm.name} Roster
            </h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-sm" onClick={openSupervisorsModal}>
                👤 Assign Supervisors
              </button>
              <button className="btn btn-primary btn-sm" onClick={openAssignModal}>
                + Assign Campers
              </button>
              <button className="btn btn-secondary btn-sm" onClick={printRoster}>
                🖨️ Print
              </button>
            </div>
          </div>

          {dormCampers.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No campers assigned to this dorm yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="console-table">
                <thead>
                  <tr>
                    <th>Camper</th>
                    <th>Bed Number</th>
                    <th>Platoon</th>
                    <th>Medical Notes</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dormCampers.map(camper => (
                    <tr key={camper.id}>
                      <td style={{ fontWeight: 500 }}>
                        {camper.name}
                      </td>
                      <td>{camper.bedNumber || '-'}</td>
                      <td>
                        {camper.platoon ? (
                          <span className="badge badge-outline">
                            {camper.platoon.emoji} {camper.platoon.name}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        {camper.medicalNotes ? (
                          <span style={{ color: 'var(--amber)', fontSize: '0.875rem' }}>⚕️ {camper.medicalNotes}</span>
                        ) : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-text" style={{ fontSize: '0.8125rem', padding: '4px 8px' }} onClick={() => openMoveModal(camper)}>Move</button>
                        <button className="btn btn-text" style={{ fontSize: '0.8125rem', padding: '4px 8px', color: 'var(--red)' }} onClick={() => removeCamper(camper.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Assign Modal */}
      {assignModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="console-card" style={{ width: 500, maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="console-card-header">
              <span className="console-card-title">Assign Campers to {selectedDorm.name}</span>
              <button onClick={() => setAssignModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="console-card-body" style={{ overflowY: 'auto', flex: 1 }}>
              {availableCampers.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No available {selectedDorm.gender} campers found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {availableCampers.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'var(--bg-light)', borderRadius: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedCamperIds.has(c.id)} onChange={() => toggleCamperSelection(c.id)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently: {c.dorm?.name || 'Unassigned'}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setAssignModalOpen(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={submitAssignments} className="btn btn-primary">Assign {selectedCamperIds.size} Campers</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Move Modal */}
      {moveModalOpen && camperToMove && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="console-card" style={{ width: 400, maxWidth: '90%' }}>
            <div className="console-card-header">
              <span className="console-card-title">Move {camperToMove.name}</span>
              <button onClick={() => setMoveModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="console-card-body">
              <label className="input-label">Select New Dorm</label>
              <select className="input-field" value={newDormId} onChange={e => setNewDormId(e.target.value)}>
                <option value="">Select...</option>
                {dorms
                  .filter(d => d.gender.toLowerCase() === selectedDorm.gender.toLowerCase() && d.id !== selectedDorm.id)
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.occupancy}/{d.capacity})</option>
                  ))
                }
              </select>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button onClick={() => setMoveModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={submitMove} disabled={!newDormId} className="btn btn-primary">Move Camper</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Supervisors Modal */}
      {supervisorsModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="console-card" style={{ width: 450, maxWidth: '90%' }}>
            <div className="console-card-header">
              <span className="console-card-title">Assign Supervisors for {selectedDorm.name}</span>
              <button onClick={() => setSupervisorsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="console-card-body">
              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Dorm Supervisor</label>
                <select className="input-field" value={supervisorIds.supervisorId} onChange={e => setSupervisorIds({ ...supervisorIds, supervisorId: e.target.value })}>
                  <option value="">None</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              
              <div>
                <label className="input-label">Assistant Supervisor</label>
                <select className="input-field" value={supervisorIds.assistantSupervisorId} onChange={e => setSupervisorIds({ ...supervisorIds, assistantSupervisorId: e.target.value })}>
                  <option value="">None</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button onClick={() => setSupervisorsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={submitSupervisors} className="btn btn-primary">Save Supervisors</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
