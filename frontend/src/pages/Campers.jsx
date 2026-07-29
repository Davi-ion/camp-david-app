import { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { GROUPS } from '../data/campers';
import UserMenu from '../components/UserMenu';
import NotificationCentre from '../components/NotificationCentre';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { IconSearch, IconChevronDown, IconUsers, IconFileImport, IconPhone } from '@tabler/icons-react';

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Campers() {
  const { state, dispatch } = useApp();
  const { canEdit } = usePermissions();
  const user = state.currentUser;

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [platoonFilter, setPlatoonFilter] = useState('all');
  const [dormFilter, setDormFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileRef = useRef();

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [search, groupFilter, platoonFilter, dormFilter]);

  // List of unique platoons and dorms
  const platoonOptions = useMemo(() => {
    const map = new Map();
    state.campers.forEach(c => {
      if (c.platoon?.name) {
        map.set(c.platoon.name, { id: c.platoon.id || c.platoon.name, name: c.platoon.name, emoji: c.platoon.emoji || '🏴' });
      }
    });
    return Array.from(map.values());
  }, [state.campers]);

  const dormOptions = useMemo(() => {
    const map = new Map();
    state.campers.forEach(c => {
      if (c.dorm?.name) {
        map.set(c.dorm.name, { id: c.dorm.id || c.dorm.name, name: c.dorm.name, gender: c.dorm.gender });
      }
    });
    return Array.from(map.values());
  }, [state.campers]);

  // Filter campers
  const filteredCampers = useMemo(() => {
    let list = state.campers;

    // Role filter scope
    if (user?.role !== 'admin' && user?.role !== 'Super Admin') {
      const uPlatoon = user?.platoon?.name || user?.group;
      if (uPlatoon) {
        list = list.filter((c) => c.platoon?.name === uPlatoon || c.group === uPlatoon);
      }
    }

    if (platoonFilter !== 'all') {
      list = list.filter((c) => c.platoon?.name === platoonFilter || c.platoon?.id === platoonFilter || c.group === platoonFilter);
    }

    if (dormFilter !== 'all') {
      list = list.filter((c) => c.dorm?.name === dormFilter || c.dorm?.id === dormFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || (c.registrationNumber && c.registrationNumber.toLowerCase().includes(q)));
    }

    return list;
  }, [state.campers, user, platoonFilter, dormFilter, search]);

  // Paginated campers slice
  const paginatedCampers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCampers.slice(start, start + pageSize);
  }, [filteredCampers, page, pageSize]);

  // Group campers
  const groupedCampers = useMemo(() => {
    const groups = {};
    paginatedCampers.forEach((c) => {
      if (!groups[c.group]) groups[c.group] = [];
      groups[c.group].push(c);
    });
    return groups;
  }, [paginatedCampers]);

  const medicalCount = useMemo(() => {
    return filteredCampers.filter((c) => c.medicalNotes).length;
  }, [filteredCampers]);

  // CSV Import
  const handleCSVImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length < 2) {
          setImportResult({ success: false, message: 'CSV file appears empty' });
          return;
        }

        const newCampers = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 3) continue;

          const [name, group, age, medicalNotes = '', emergencyContact = ''] = cols;
          const groupId = group.toLowerCase();

          if (!GROUPS.find((g) => g.id === groupId)) continue;

          const contactParts = emergencyContact.split('/').map((p) => p.trim());
          newCampers.push({
            id: `c-imp-${Date.now()}-${i}`,
            name,
            group: groupId,
            age: parseInt(age) || 0,
            medicalNotes: medicalNotes || '',
            emergencyContact: {
              name: contactParts[0] || '',
              phone: contactParts[1] || '',
            },
          });
        }

        if (newCampers.length > 0) {
          dispatch({ type: 'ADD_CAMPERS', payload: newCampers });
          setImportResult({ success: true, message: `Successfully imported ${newCampers.length} campers` });
        } else {
          setImportResult({ success: false, message: 'No valid campers found in file' });
        }
      } catch (err) {
        setImportResult({ success: false, message: 'Error parsing CSV file' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="page">
      {/* Home-style Header with bg-campers */}
      <div className="dash-header bg-campers">
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

          <p className="dash-greeting">Directory & Profiles</p>
          <h1 className="dash-name">Campers</h1>

          <div className="dash-day-strip" style={{ marginBottom: 16 }}>
            <span className="dash-day-badge">{filteredCampers.length} CAMPERS REGISTERED</span>
            <span>Medical Alerts & Contacts</span>
          </div>

          {/* Quick Glass Summary Card */}
          <div className="now-card">
            <div className="now-card-label">
              <span className="now-dot" />
              DIRECTORY SUMMARY
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ADE80' }}>{filteredCampers.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Active Campers</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FBBF24' }}>{medicalCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Medical Alerts</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60A5FA' }}>{platoonOptions.length || 16}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Platoons / Groups</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 260, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', padding: '4px 16px', display: 'flex', alignItems: 'center' }}>
            <IconSearch size={20} color="var(--text-muted)" style={{ marginRight: 10 }} />
            <input
              type="text"
              placeholder="Search campers by name or reg #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', padding: '12px 0', fontSize: '0.9375rem' }}
            />
          </div>

          {/* Platoon Filter */}
          {platoonOptions.length > 0 && (
            <select
              value={platoonFilter}
              onChange={(e) => setPlatoonFilter(e.target.value)}
              className="input-field"
              style={{ width: 150, height: 46, borderRadius: 12, fontSize: '0.875rem', background: '#fff' }}
            >
              <option value="all">All Platoons</option>
              {platoonOptions.map(p => (
                <option key={p.name} value={p.name}>{p.emoji} {p.name}</option>
              ))}
            </select>
          )}

          {/* Dorm Filter */}
          {dormOptions.length > 0 && (
            <select
              value={dormFilter}
              onChange={(e) => setDormFilter(e.target.value)}
              className="input-field"
              style={{ width: 140, height: 46, borderRadius: 12, fontSize: '0.875rem', background: '#fff' }}
            >
              <option value="all">All Dorms</option>
              {dormOptions.map(d => (
                <option key={d.name} value={d.name}>🏢 {d.name}</option>
              ))}
            </select>
          )}
        </div>



        {/* CSV Import (Admin only) */}
        {canEdit && (
          <div style={{ marginTop: 16 }}>
            <button
              className="btn btn-sm btn-outline btn-full"
              onClick={() => setShowImport(!showImport)}
              style={{ padding: '10px 16px', borderRadius: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <IconFileImport size={18} /> Import Campers from CSV
            </button>

            {showImport && (
              <div className="card" style={{ marginTop: 12, animation: 'fadeInUp 0.3s ease', borderRadius: 14, border: '1px solid var(--border)' }}>
                <p className="text-sm text-muted" style={{ marginBottom: 10 }}>
                  Required CSV headers: Name, Group, Age, Medical Notes, Emergency Contact (Name / Phone)
                </p>
                <div
                  className="import-area"
                  onClick={() => fileRef.current?.click()}
                  style={{ borderRadius: 12, padding: 24 }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📄</div>
                  <p className="text-sm font-medium">Click to upload CSV file</p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileRef}
                  style={{ display: 'none' }}
                  onChange={handleCSVImport}
                />
                {importResult && (
                  <p style={{
                    marginTop: 10,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: importResult.success ? 'var(--teal)' : 'var(--red)',
                  }}>
                    {importResult.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Camper count text */}
        <p className="text-sm text-muted" style={{ marginTop: 18, marginBottom: 12, fontWeight: 500 }}>
          Showing {filteredCampers.length} camper{filteredCampers.length !== 1 ? 's' : ''}
        </p>

        {/* Camper List (Unified Roll Call style with avatars) */}
        {filteredCampers.length === 0 ? (
          <EmptyState 
            icon={<IconUsers size={48} color="var(--teal)" />}
            title="No campers found"
            description="Try adjusting your search query or group filter."
          />
        ) : (
          <div style={{ marginTop: 18, background: '#fff', borderRadius: 16, border: '1px solid var(--border, #E2E8F0)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--border, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Camper Directory ({filteredCampers.length})
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94A3B8)' }}>
                Page {page} of {Math.ceil(filteredCampers.length / pageSize)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {paginatedCampers.map((camper, idx) => {
                const isExpanded = expandedId === camper.id;
                const isLast = idx === paginatedCampers.length - 1;
                const avatarSrc = camper.photo && (camper.photo.startsWith('/') || camper.photo.startsWith('http')) 
                  ? camper.photo 
                  : `/avatars/character${(idx % 20) + 1}.jpg`;

                return (
                  <div 
                    key={camper.id} 
                    style={{ 
                      borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                      background: '#FFFFFF', 
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : camper.id)}
                      style={{
                        padding: '12px 16px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <img 
                          src={avatarSrc} 
                          alt={camper.name} 
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 9999,
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '2px solid #E2E8F0',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                          }}
                        />
                        <div className="camper-info" style={{ minWidth: 0 }}>
                          <div className="camper-name" style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {camper.name}
                            {camper.medicalNotes && <span className="medical-flag" title={`Medical: ${camper.medicalNotes}`} style={{ marginLeft: 6 }}>⚕️</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                            {camper.registrationNumber && <span>{camper.registrationNumber}</span>}
                            {camper.age && <span>· Age {camper.age}</span>}
                            {camper.platoon?.name ? (
                              <span>· {camper.platoon.emoji || '🏴'} {camper.platoon.name}</span>
                            ) : camper.group ? (
                              <span>· {camper.group}</span>
                            ) : null}
                            {camper.dorm?.name && <span>· 🏢 {camper.dorm.name}</span>}
                            {camper.bedNumber && <span>· Bed {camper.bedNumber}</span>}
                          </div>
                        </div>
                      </div>

                      <IconChevronDown
                        size={18}
                        color="var(--text-muted)"
                        style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
                      />
                    </div>

                    {/* Expanded Details Card */}
                    {isExpanded && (
                      <div style={{ padding: '0 16px 16px 68px', borderTop: '1px solid #F1F5F9', paddingTop: 12, background: '#FAFAFA' }}>
                        {camper.medicalNotes && (
                          <div className="medical-block" style={{ marginBottom: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 10, padding: 12, fontSize: '0.8125rem' }}>
                            <strong>⚕ Medical Notes:</strong> {camper.medicalNotes}
                          </div>
                        )}
                        {camper.registrationNumber && (
                          <div className="profile-detail" style={{ marginBottom: 6, fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span className="profile-label" style={{ color: 'var(--text-muted)' }}>Registration Number</span>
                            <span style={{ fontWeight: 600 }}>{camper.registrationNumber}</span>
                          </div>
                        )}
                        <div className="profile-detail" style={{ marginBottom: 6, fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span className="profile-label" style={{ color: 'var(--text-muted)' }}>Age</span>
                          <span style={{ fontWeight: 600 }}>{camper.age} years old</span>
                        </div>
                        {(camper.platoon?.name || camper.group) && (
                          <div className="profile-detail" style={{ marginBottom: 6, fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span className="profile-label" style={{ color: 'var(--text-muted)' }}>Platoon</span>
                            <span style={{ fontWeight: 600 }}>{camper.platoon?.emoji || '🏴'} {camper.platoon?.name || camper.group}</span>
                          </div>
                        )}
                        {camper.dorm?.name && (
                          <div className="profile-detail" style={{ marginBottom: 6, fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span className="profile-label" style={{ color: 'var(--text-muted)' }}>Dorm & Bed</span>
                            <span style={{ fontWeight: 600 }}>🏢 {camper.dorm.name} {camper.bedNumber ? `(Bed ${camper.bedNumber})` : ''}</span>
                          </div>
                        )}
                        {camper.emergencyContact && (camper.emergencyContact.name || camper.emergencyContact.phone) && (
                          <div className="profile-detail" style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className="profile-label" style={{ color: 'var(--text-muted)' }}>Emergency Contact</span>
                            <span style={{ textAlign: 'right', fontWeight: 600 }}>
                              {camper.emergencyContact.name}
                              {camper.emergencyContact.phone && (
                                <>
                                  <br />
                                  <a href={`tel:${camper.emergencyContact.phone}`} style={{ color: 'var(--teal)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, textDecoration: 'none' }}>
                                    <IconPhone size={14} /> {camper.emergencyContact.phone}
                                  </a>
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination Controller */}
        {filteredCampers.length > 0 && (
          <div style={{ marginTop: 20, marginBottom: 30 }}>
            <Pagination
              currentPage={page}
              totalItems={filteredCampers.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
