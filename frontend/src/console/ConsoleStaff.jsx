import { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

function getInitials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
}

export default function ConsoleStaff() {
  const { hasPermission } = usePermissions();

  const [staffList, setStaffList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const limit = 50;

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('camp_token');
      const q = new URLSearchParams({ page, limit, status });
      if (search) q.append('search', search);

      const res = await fetch(`${API}/api/users?${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStaffList(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [page, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStaff();
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/bulk/export/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'staff_export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export staff');
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
      setSelectedIds(new Set(staffList.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setStaffList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update role');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating role');
    }
  };

  return (
    <div className="console-fade-in">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">Volunteer & Staff Directory</h1>
          <p className="console-page-subtitle">Manage camp volunteers, team leaders, commanders, and roles ({total} total)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {hasPermission('manage:users') && (
            <>
              <button onClick={handleExport} className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem' }}>
                📥 Export Roster
              </button>
              <button className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem' }}>
                + Add Volunteer
              </button>
            </>
          )}
        </div>
      </div>

      <div className="console-card">
        <div className="console-card-header" style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'center', minWidth: 300 }}>
            <input 
              type="text" 
              placeholder="Search by name, email, or username..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field" 
              style={{ maxWidth: 320, padding: '8px 12px', fontSize: '0.875rem', borderRadius: 9999 }}
            />
            <select 
              value={status} 
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="input-field" 
              style={{ width: 140, padding: '8px 12px', fontSize: '0.875rem', borderRadius: 9999 }}
            >
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
              <option value="all">All Statuses</option>
            </select>
            <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', borderRadius: 9999 }}>Search</button>
          </form>

          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-light)', padding: '6px 12px', borderRadius: 9999 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{selectedIds.size} selected</span>
              <select className="input-field" style={{ padding: '6px 10px', fontSize: '0.75rem', height: 'auto', borderRadius: 9999 }} value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
                <option value="">Bulk Action...</option>
                <option value="assign-role">Assign Role</option>
                <option value="deactivate">Deactivate</option>
                <option value="reset-password">Reset Passwords</option>
              </select>
              <button disabled={!bulkAction} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 9999 }}>Apply</button>
            </div>
          )}
        </div>

        <div className="console-table-container">
          <table className="console-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" onChange={toggleAll} checked={staffList.length > 0 && selectedIds.size === staffList.length} /></th>
                <th>Volunteer / Staff</th>
                <th>System Role</th>
                <th>Department</th>
                <th>Contact Information</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Loading volunteers...</td></tr>
              ) : staffList.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No volunteers found.</td></tr>
              ) : staffList.map((s, idx) => {
                const isSystemAdmin = s.role === 'admin' || s.role === 'Super Admin';
                return (
                  <tr key={s.id} style={{ background: selectedIds.has(s.id) ? 'var(--bg-light)' : 'transparent' }}>
                    <td><input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelection(s.id)} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img 
                          src={s.avatar && s.avatar.startsWith('/') ? s.avatar : `/avatars/character${(idx % 20) + 1}.jpg`} 
                          alt={s.name} 
                          style={{ width: 36, height: 36, borderRadius: 9999, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-light, #E2E8F0)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{s.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select 
                        value={s.role} 
                        onChange={(e) => handleRoleChange(s.id, e.target.value)}
                        className="input-field"
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 9999,
                          border: '1px solid var(--border-light, #CBD5E1)',
                          background: s.role === 'Super Admin' || s.role === 'admin' ? '#FEF2F2' :
                                     s.role === 'Camp Commander' ? '#F0FDF4' :
                                     s.role === 'Dorm Lead' ? '#EFF6FF' :
                                     s.role === 'Platoon Lead' ? '#FEFCE8' : '#F8FAFC',
                          color: s.role === 'Super Admin' || s.role === 'admin' ? '#991B1B' :
                                 s.role === 'Camp Commander' ? '#166534' :
                                 s.role === 'Dorm Lead' ? '#1E40AF' :
                                 s.role === 'Platoon Lead' ? '#854D0E' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Volunteer">Volunteer</option>
                        <option value="Platoon Lead">Platoon Lead</option>
                        <option value="Dorm Lead">Dorm Lead</option>
                        <option value="Camp Commander">Camp Commander</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                    </td>
                    <td style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {s.department || 'General Volunteer'}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>{s.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.phone || '-'}</div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'active' ? 'badge-teal' : 'badge-red'}`} style={{ borderRadius: 9999 }}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-text" style={{ fontSize: '0.8125rem', padding: '4px 8px' }}>Edit</button>
                      {!isSystemAdmin && hasPermission('manage:users') && (
                        <button className="btn btn-text" style={{ fontSize: '0.8125rem', padding: '4px 8px', color: 'var(--red)' }}>Deactivate</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing {staffList.length} of {total} volunteers
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8125rem', borderRadius: 9999 }}>Prev</button>
            <button disabled={staffList.length < limit} onClick={() => setPage(p => p + 1)} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8125rem', borderRadius: 9999 }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
