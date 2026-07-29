import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Pagination from '../components/Pagination';
import { 
  IconUserPlus, 
  IconDownload, 
  IconSearch, 
  IconPencil, 
  IconTrash, 
  IconCheck
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

export default function ConsoleCampers() {
  const { state } = useApp();
  const [campers, setCampers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platoonFilter, setPlatoonFilter] = useState('');
  const [dormFilter, setDormFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCamper, setEditingCamper] = useState(null);
  const [modalError, setModalError] = useState('');
  const [formData, setFormData] = useState({
    name: '', age: '', gender: '', ageGroup: '', pickupCenter: '', tshirtSize: '',
    platoonId: '', dormId: '', bedNumber: '', medicalNotes: '', allergies: '',
    guardianName: '', guardianPhone: ''
  });

  const [dorms, setDorms] = useState([]);
  const [platoons, setPlatoons] = useState([]);

  const fetchCampers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('camp_token');
      const q = new URLSearchParams({ page, limit });
      if (search) q.append('search', search);
      if (platoonFilter) q.append('platoonId', platoonFilter);
      if (dormFilter) q.append('dormId', dormFilter);
      const res = await fetch(`${API}/api/campers?${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.campers || []);
      const totalCount = Array.isArray(data) ? data.length : (data.total ?? list.length);
      if (list.length === 0 && state.campers && state.campers.length > 0 && !search && !platoonFilter && !dormFilter) {
        setCampers(state.campers);
        setTotal(state.campers.length);
      } else {
        setCampers(list);
        setTotal(totalCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampers();
    fetchDormsAndPlatoons();
  }, [page, limit, platoonFilter, dormFilter]);

  const fetchDormsAndPlatoons = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      const [dRes, pRes] = await Promise.all([
        fetch(`${API}/api/dorms`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/platoons`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (dRes.ok) setDorms(await dRes.json());
      if (pRes.ok) setPlatoons(await pRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCampers();
  };

  const openModal = (camper = null) => {
    setEditingCamper(camper);
    setModalError('');
    if (camper) {
      setFormData({
        name: camper.name || '',
        age: camper.age ?? '',
        gender: camper.gender || '',
        ageGroup: camper.ageGroup || '',
        pickupCenter: camper.pickupCenter || '',
        tshirtSize: camper.tshirtSize || '',
        platoonId: camper.platoonId || '',
        dormId: camper.dormId || '',
        bedNumber: camper.bedNumber || '',
        medicalNotes: camper.medicalNotes || '',
        allergies: camper.allergies || '',
        guardianName: camper.guardianName || '',
        guardianPhone: camper.guardianPhone || ''
      });
    } else {
      setFormData({
        name: '', age: '', gender: '', ageGroup: '', pickupCenter: '', tshirtSize: '',
        platoonId: '', dormId: '', bedNumber: '', medicalNotes: '', allergies: '',
        guardianName: '', guardianPhone: ''
      });
    }
    setModalOpen(true);
  };

  const saveCamper = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const token = localStorage.getItem('camp_token');
      const url = editingCamper ? `${API}/api/campers/${editingCamper.id}` : `${API}/api/campers`;
      const method = editingCamper ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        age: formData.age ? Number(formData.age) : null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setModalOpen(false);
        fetchCampers();
      } else {
        const data = await res.json();
        setModalError(data.error || 'Failed to save camper');
      }
    } catch (err) {
      console.error(err);
      setModalError('An unexpected error occurred.');
    }
  };

  const deleteCamper = async (id) => {
    if (!confirm('Are you sure you want to delete this camper record?')) return;
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/campers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchCampers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/bulk/export/campers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campers_export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export campers');
    }
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(campers.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="console-fade-in console-campers-page">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">Campers</h1>
          <p className="console-page-subtitle">Manage all registered campers ({total} total)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExport} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconDownload size={18} /> Export
          </button>
          <button onClick={() => openModal()} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconUserPlus size={18} /> Add Camper
          </button>
        </div>
      </div>

      <div className="console-card">
        <div className="console-card-header" style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flex: 1, alignItems: 'center', flexWrap: 'wrap', minWidth: 300 }}>
            <input 
              type="text" 
              placeholder="Search by name, reg #, pick up, or age group..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field" 
              style={{ maxWidth: 280, padding: '8px 12px', fontSize: '0.875rem' }}
            />

            {/* Platoon Filter */}
            <select 
              value={platoonFilter} 
              onChange={e => { setPlatoonFilter(e.target.value); setPage(1); }}
              className="input-field" 
              style={{ width: 140, padding: '8px 12px', fontSize: '0.875rem' }}
            >
              <option value="">All Platoons</option>
              {platoons.map(p => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>

            {/* Dorm Filter */}
            <select 
              value={dormFilter} 
              onChange={e => { setDormFilter(e.target.value); setPage(1); }}
              className="input-field" 
              style={{ width: 130, padding: '8px 12px', fontSize: '0.875rem' }}
            >
              <option value="">All Dorms</option>
              {dorms.map(d => (
                <option key={d.id} value={d.id}>🏢 {d.name}</option>
              ))}
            </select>

            <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconSearch size={16} /> Search
            </button>
          </form>

          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-light)', padding: '6px 12px', borderRadius: 6 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{selectedIds.size} selected</span>
              <select className="input-field" style={{ padding: '6px 10px', fontSize: '0.75rem', height: 'auto' }} value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
                <option value="">Bulk Action...</option>
                <option value="assign-platoon">Assign Platoon</option>
              </select>
              <button disabled={!bulkAction} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <IconCheck size={14} /> Apply
              </button>
            </div>
          )}
        </div>

        <div className="console-table-container">
          <table className="console-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" onChange={toggleAll} checked={campers.length > 0 && selectedIds.size === campers.length} /></th>
                <th>Reg #</th>
                <th>Name & Age</th>
                <th>Age Group</th>
                <th>Pick Up Center</th>
                <th>Platoon</th>
                <th>Dorm</th>
                <th>T-Shirt</th>
                <th>Medical Notes</th>
                <th>Guardian Info</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: '30px' }}>Loading...</td></tr>
              ) : campers.length === 0 ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: '30px' }}>No campers found.</td></tr>
              ) : campers.map((c, idx) => (
                <tr key={c.id} style={{ background: selectedIds.has(c.id) ? 'var(--bg-light)' : 'transparent' }}>
                  <td><input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelection(c.id)} /></td>
                  <td style={{ fontWeight: 500 }}>{c.registrationNumber || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img 
                        src={c.avatar || c.photo || `/avatars/character${(idx % 20) + 1}.jpg`} 
                        alt={c.name} 
                        style={{ width: 34, height: 34, borderRadius: 9999, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-light, #E2E8F0)' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `/avatars/character${(idx % 20) + 1}.jpg`;
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {[c.gender, c.age ? `${c.age} yrs` : null].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{c.ageGroup || '-'}</td>
                  <td>{c.pickupCenter || '-'}</td>
                  <td>
                    {c.platoon ? (
                      <span className="badge" style={{ background: (c.platoon.colorHex || '#1B7865') + '20', color: c.platoon.colorHex || '#1B7865' }}>
                        {c.platoon.emoji} {c.platoon.name}
                      </span>
                    ) : <span className="badge">Unassigned</span>}
                  </td>
                  <td>
                    {c.dorm ? (
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{c.dorm.name}</div>
                        {c.bedNumber && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bed {c.bedNumber}</div>}
                      </div>
                    ) : '-'}
                  </td>
                  <td>{c.tshirtSize || '-'}</td>
                  <td>
                    {c.medicalNotes ? (
                      <span className="badge badge-orange" title={c.medicalNotes}>Has Medical Notes</span>
                    ) : '-'}
                  </td>
                  <td>
                    {c.guardianName ? (
                      <div>
                        <div style={{ fontSize: '0.8125rem' }}>{c.guardianName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.guardianPhone}</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        onClick={() => openModal(c)} 
                        style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted, #64748B)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s ease' }}
                        title="Edit Camper"
                        aria-label="Edit Camper"
                      >
                        <IconPencil size={18} />
                      </button>
                      <button 
                        onClick={() => deleteCamper(c.id)} 
                        style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s ease' }}
                        title="Delete Camper"
                        aria-label="Delete Camper"
                      >
                        <IconTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controller */}
        <Pagination 
          currentPage={page}
          totalItems={total}
          pageSize={limit}
          onPageChange={setPage}
          onPageSizeChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {modalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, overflowY: 'auto' }}>
          <div className="console-card" style={{ width: 540, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="console-card-header">
              <span className="console-card-title">{editingCamper ? 'Edit Camper' : 'Add Camper'}</span>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="console-card-body">
              {modalError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{modalError}</div>}
              <form onSubmit={saveCamper} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="input-label">Full Name *</label>
                  <input required className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="input-label">Age</label>
                    <input type="number" className="input-field" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="e.g. 13" />
                  </div>
                  <div>
                    <label className="input-label">Gender</label>
                    <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">T-Shirt Size</label>
                    <input className="input-field" value={formData.tshirtSize} onChange={e => setFormData({ ...formData, tshirtSize: e.target.value })} placeholder="XS, S, M, L, XL" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="input-label">Age Group</label>
                    <input className="input-field" value={formData.ageGroup} onChange={e => setFormData({ ...formData, ageGroup: e.target.value })} placeholder="e.g. Y, J, Teen" />
                  </div>
                  <div>
                    <label className="input-label">Pick Up Center</label>
                    <input className="input-field" value={formData.pickupCenter} onChange={e => setFormData({ ...formData, pickupCenter: e.target.value })} placeholder="e.g. Mainland, Island" />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="input-label">Platoon</label>
                    <select className="input-field" value={formData.platoonId} onChange={e => setFormData({ ...formData, platoonId: e.target.value })}>
                      <option value="">None</option>
                      {platoons.map(p => (
                        <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Dorm</label>
                    <select className="input-field" value={formData.dormId} onChange={e => setFormData({ ...formData, dormId: e.target.value })}>
                      <option value="">None</option>
                      {dorms.filter(d => !formData.gender || d.gender.toLowerCase() === formData.gender.toLowerCase()).map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.gender})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="input-label">Bed Number</label>
                  <input className="input-field" value={formData.bedNumber} onChange={e => setFormData({ ...formData, bedNumber: e.target.value })} placeholder="e.g. 12A" />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <label className="input-label">Medical Notes</label>
                  <textarea className="input-field" rows="2" value={formData.medicalNotes} onChange={e => setFormData({ ...formData, medicalNotes: e.target.value })}></textarea>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="input-label">Guardian Name</label>
                    <input className="input-field" value={formData.guardianName} onChange={e => setFormData({ ...formData, guardianName: e.target.value })} />
                  </div>
                  <div>
                    <label className="input-label">Guardian Phone</label>
                    <input className="input-field" value={formData.guardianPhone} onChange={e => setFormData({ ...formData, guardianPhone: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingCamper ? 'Save Changes' : 'Add Camper'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
