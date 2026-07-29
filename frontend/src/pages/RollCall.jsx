import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { CAMP_DAYS } from '../data/schedule';
import { sessions } from '../data/sessions';
import UserMenu from '../components/UserMenu';
import NotificationCentre from '../components/NotificationCentre';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { 
  IconClipboardCheck, 
  IconCheck, 
  IconX, 
  IconMinus, 
  IconSearch, 
  IconSunrise, 
  IconMoon, 
  IconLogout, 
  IconRotateClockwise, 
  IconFilter, 
  IconBed,
  IconUserCheck,
  IconAlertCircle
} from '@tabler/icons-react';

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function RollCall() {
  const { state, dispatch } = useApp();
  const { isAdmin } = usePermissions();
  const user = state.currentUser;

  // Default day to Wednesday or current matching day
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const defaultDay = CAMP_DAYS.find((d) => d.date === todayStr)?.key || 'wed';

  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selectedSession, setSelectedSession] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | present | absent | excused
  const [platoonFilter, setPlatoonFilter] = useState('all');
  const [dormFilter, setDormFilter] = useState('all');
  const [departureGrouping, setDepartureGrouping] = useState('platoon');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Active day and sessions
  const campDay = CAMP_DAYS.find((d) => d.key === selectedDay) || CAMP_DAYS[0];
  const daySessions = sessions[selectedDay] || [];

  // Auto-select first session when day changes
  const activeSession = selectedSession || (daySessions[0]?.key || null);
  const sessionKey = activeSession ? `${selectedDay}-${activeSession}` : null;
  const activeSessionObj = daySessions.find((s) => s.key === activeSession);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedDay, selectedSession, search, statusFilter, platoonFilter, dormFilter]);

  // Attendance data map for the current session
  const sessionData = useMemo(() => {
    return sessionKey ? (state.attendance[sessionKey] || {}) : {};
  }, [sessionKey, state.attendance]);

  // Scoped camper list based on user role & assigned platoon/dorm
  const scopedCampers = useMemo(() => {
    let list = state.campers;
    if (!isAdmin) {
      // Counselors/leads see campers matching their platoon or dorm
      const userPlatoon = user?.platoon?.name || user?.group;
      const userDorm = user?.dorm?.name;
      list = list.filter((c) => {
        const matchesPlatoon = userPlatoon && (c.platoon?.name === userPlatoon || c.group === userPlatoon);
        const matchesDorm = userDorm && c.dorm?.name === userDorm;
        return matchesPlatoon || matchesDorm;
      });
    }
    return list;
  }, [state.campers, user, isAdmin]);

  // Filtered campers for search and filters
  const filteredCampers = useMemo(() => {
    let list = scopedCampers;

    // Platoon filter
    if (platoonFilter !== 'all') {
      list = list.filter((c) => c.platoon?.id === platoonFilter || c.platoon?.name === platoonFilter);
    }

    // Dorm filter
    if (dormFilter !== 'all') {
      list = list.filter((c) => c.dorm?.id === dormFilter || c.dorm?.name === dormFilter);
    }

    // Search query (name, reg number, bed number)
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => 
        c.name.toLowerCase().includes(q) ||
        (c.registrationNumber && c.registrationNumber.toLowerCase().includes(q)) ||
        (c.bedNumber && c.bedNumber.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((c) => {
        const st = sessionData[c.id] || 'pending';
        return st === statusFilter;
      });
    }

    return list;
  }, [scopedCampers, platoonFilter, dormFilter, search, statusFilter, sessionData]);

  // Summary counts for current session across all scoped campers
  const summary = useMemo(() => {
    const counts = { total: scopedCampers.length, present: 0, absent: 0, excused: 0, pending: 0 };
    scopedCampers.forEach((c) => {
      const st = sessionData[c.id];
      if (st === 'present') counts.present++;
      else if (st === 'absent') counts.absent++;
      else if (st === 'excused') counts.excused++;
      else counts.pending++;
    });
    return counts;
  }, [scopedCampers, sessionData]);

  // Percent complete
  const percentComplete = summary.total > 0 
    ? Math.round(((summary.present + summary.absent + summary.excused) / summary.total) * 100)
    : 0;

  // Paginated slice
  const paginatedCampers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCampers.slice(start, start + pageSize);
  }, [filteredCampers, page, pageSize]);

  // Group paginated campers by Platoon or Dorm
  const groupedCampers = useMemo(() => {
    const groups = {};

    let strategy = 'platoon';
    if (sessionKey) {
      if (sessionKey === 'wed-arrival') strategy = 'platoon';
      else if (sessionKey === 'sun-departure') strategy = departureGrouping;
      else if (sessionKey.includes('lights_out') || sessionKey.includes('morning')) strategy = 'dorm';
    }

    paginatedCampers.forEach((c) => {
      let groupKey = 'Unassigned';
      if (strategy === 'dorm') {
        groupKey = c.dorm?.name ? `Dorm ${c.dorm.name}` : 'Unassigned Dorm';
      } else {
        groupKey = c.platoon?.name ? `${c.platoon.name} Platoon` : (c.group || 'Unassigned Platoon');
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(c);
    });

    return groups;
  }, [paginatedCampers, sessionKey, departureGrouping]);

  // Handlers
  const handleMark = (camperId, status) => {
    if (!sessionKey) return;
    const current = sessionData[camperId];
    dispatch({
      type: 'SET_ATTENDANCE',
      payload: {
        sessionKey,
        camperId,
        status: current === status ? null : status,
      },
    });
  };

  const handleBulk = (status) => {
    if (!sessionKey) return;
    dispatch({
      type: 'BULK_ATTENDANCE',
      payload: {
        sessionKey,
        camperIds: filteredCampers.map((c) => c.id),
        status,
      },
    });
  };

  const getSessionIcon = (key) => {
    if (key === 'arrival') return <IconUserCheck size={16} />;
    if (key === 'morning') return <IconSunrise size={16} />;
    if (key === 'lights_out') return <IconMoon size={16} />;
    if (key === 'departure') return <IconLogout size={16} />;
    return <IconClock size={16} />;
  };

  // List of unique platoons and dorms for filters
  const platoonOptions = useMemo(() => {
    const map = new Map();
    state.campers.forEach(c => {
      if (c.platoon?.id && c.platoon?.name) {
        map.set(c.platoon.id, { id: c.platoon.id, name: c.platoon.name, emoji: c.platoon.emoji || '🏴' });
      }
    });
    return Array.from(map.values());
  }, [state.campers]);

  const dormOptions = useMemo(() => {
    const map = new Map();
    state.campers.forEach(c => {
      if (c.dorm?.id && c.dorm?.name) {
        map.set(c.dorm.id, { id: c.dorm.id, name: c.dorm.name, gender: c.dorm.gender });
      }
    });
    return Array.from(map.values());
  }, [state.campers]);

  return (
    <div className="page">
      {/* Header */}
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

          <p className="dash-greeting">Daily Check-In & Roll Call</p>
          <h1 className="dash-name">Attendance</h1>

          <div className="dash-day-strip" style={{ marginBottom: 16 }}>
            <span className="dash-day-badge">DAY {campDay.dayNum} OF 5</span>
            <span>{campDay.full} · {activeSessionObj?.label || 'Active Check-in'}</span>
          </div>

          {/* Attendance Progress Card */}
          <div className="now-card">
            <div className="now-card-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <span className="now-dot" />
                {activeSessionObj?.label || 'SESSION'} ROLL CALL ({percentComplete}% DONE)
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                {summary.present + summary.absent + summary.excused} / {summary.total} Checked
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: `${percentComplete}%`, height: '100%', background: '#4ADE80', transition: 'width 0.3s ease' }} />
            </div>

            {/* Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
              <div 
                onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
                style={{ textAlign: 'center', padding: '8px 4px', background: statusFilter === 'present' ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer', border: statusFilter === 'present' ? '1px solid #4ADE80' : 'none' }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ADE80' }}>{summary.present}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Present</div>
              </div>
              <div 
                onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
                style={{ textAlign: 'center', padding: '8px 4px', background: statusFilter === 'absent' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer', border: statusFilter === 'absent' ? '1px solid #F87171' : 'none' }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F87171' }}>{summary.absent}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Absent</div>
              </div>
              <div 
                onClick={() => setStatusFilter(statusFilter === 'excused' ? 'all' : 'excused')}
                style={{ textAlign: 'center', padding: '8px 4px', background: statusFilter === 'excused' ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer', border: statusFilter === 'excused' ? '1px solid #FBBF24' : 'none' }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FBBF24' }}>{summary.excused}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Excused</div>
              </div>
              <div 
                onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                style={{ textAlign: 'center', padding: '8px 4px', background: statusFilter === 'pending' ? 'rgba(229,231,235,0.25)' : 'rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer', border: statusFilter === 'pending' ? '1px solid #E5E7EB' : 'none' }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#E5E7EB' }}>{summary.pending}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {/* 1. Day Selector Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CAMP_DAYS.map((d) => {
            const isActive = selectedDay === d.key;
            return (
              <button
                key={d.key}
                onClick={() => { setSelectedDay(d.key); setSelectedSession(null); }}
                style={{
                  flex: 1,
                  minWidth: 64,
                  padding: '8px 12px',
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
                  boxShadow: isActive ? '0 4px 12px rgba(15, 118, 110, 0.2)' : 'none',
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

        {/* 2. Session Selector */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
          {daySessions.map((s) => {
            const isActive = activeSession === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSelectedSession(s.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: isActive ? '1.5px solid var(--teal, #0F766E)' : '1px solid var(--border, #E2E8F0)',
                  background: isActive ? '#F0FDF4' : '#FFFFFF',
                  color: isActive ? 'var(--teal, #0F766E)' : 'var(--text-secondary, #475569)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8125rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                {getSessionIcon(s.key)}
                {s.label} ({s.time})
              </button>
            );
          })}
        </div>

        {/* 3. Search and Filters */}
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <IconSearch size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search campers by name, reg # or bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 40, width: '100%', fontSize: '0.875rem', borderRadius: 9999 }}
            />
          </div>

          {/* Platoon Filter */}
          {platoonOptions.length > 0 && (
            <select
              value={platoonFilter}
              onChange={(e) => setPlatoonFilter(e.target.value)}
              className="input-field"
              style={{ width: 140, fontSize: '0.8125rem', borderRadius: 9999 }}
            >
              <option value="all">All Platoons</option>
              {platoonOptions.map(p => (
                <option key={p.id} value={p.name}>{p.emoji} {p.name}</option>
              ))}
            </select>
          )}

          {/* Dorm Filter */}
          {dormOptions.length > 0 && (
            <select
              value={dormFilter}
              onChange={(e) => setDormFilter(e.target.value)}
              className="input-field"
              style={{ width: 130, fontSize: '0.8125rem', borderRadius: 9999 }}
            >
              <option value="all">All Dorms</option>
              {dormOptions.map(d => (
                <option key={d.id} value={d.name}>🏢 {d.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* 4. Quick Bulk Actions */}
        {sessionKey && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => handleBulk('present')} 
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 9999 }}
            >
              <IconCheck size={16} color="#10B981" /> Mark All Present
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleBulk('absent')}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 9999, color: '#EF4444' }}
            >
              <IconX size={16} color="#EF4444" /> Mark All Absent
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleBulk(null)}
              style={{ padding: '8px 16px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 9999 }}
              title="Reset All"
            >
              <IconRotateClockwise size={16} /> Reset
            </button>
          </div>
        )}

        {/* 5. Camper Roster List (Unified seamless table/list without card gaps) */}
        {filteredCampers.length === 0 ? (
          <EmptyState 
            icon={<IconClipboardCheck size={48} color="var(--teal)" />}
            title="No campers match criteria"
            description="Try clearing search queries or switching filters."
          />
        ) : (
          <div style={{ marginTop: 18, background: '#fff', borderRadius: 16, border: '1px solid var(--border, #E2E8F0)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--border, #E2E8F0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Camper Roster ({filteredCampers.length})
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94A3B8)' }}>
                Page {page} of {Math.ceil(filteredCampers.length / pageSize)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {paginatedCampers.map((camper, idx) => {
                const status = sessionData[camper.id] || null;
                const isLast = idx === paginatedCampers.length - 1;
                return (
                  <div 
                    key={camper.id} 
                    style={{ 
                      padding: '12px 16px', 
                      borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                      background: status === 'present' ? 'rgba(240, 253, 244, 0.4)' :
                                 status === 'absent' ? 'rgba(254, 242, 242, 0.4)' :
                                 status === 'excused' ? 'rgba(254, 243, 199, 0.4)' : '#FFFFFF', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <div className="avatar avatar-sm" style={{
                        background: status === 'present' ? '#10B981' :
                                   status === 'absent' ? '#EF4444' :
                                   status === 'excused' ? '#F59E0B' : '#64748B',
                        color: '#fff',
                        fontWeight: 700,
                        flexShrink: 0,
                        borderRadius: 9999
                      }}>
                        {getInitials(camper.name)}
                      </div>
                      <div className="camper-info" style={{ minWidth: 0 }}>
                        <div className="camper-name" style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {camper.name}
                          {camper.medicalNotes && <span className="medical-flag" title={`Medical: ${camper.medicalNotes}`} style={{ marginLeft: 6 }}>⚕️</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span>{camper.registrationNumber}</span>
                          {camper.platoon?.name && <span>· {camper.platoon.emoji || '🏴'} {camper.platoon.name}</span>}
                          {camper.dorm?.name && <span>· 🏢 {camper.dorm.name}</span>}
                          {camper.bedNumber && <span>· Bed {camper.bedNumber}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Status Toggles */}
                    <div className="status-buttons" style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        className={`status-btn ${status === 'present' ? 'present' : ''}`}
                        onClick={() => handleMark(camper.id, 'present')}
                        title="Mark Present"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9999,
                          border: '1px solid var(--border)',
                          background: status === 'present' ? '#10B981' : '#F8FAFC',
                          color: status === 'present' ? '#FFFFFF' : '#64748B',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: status === 'present' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <IconCheck size={18} />
                      </button>
                      <button
                        className={`status-btn ${status === 'absent' ? 'absent' : ''}`}
                        onClick={() => handleMark(camper.id, 'absent')}
                        title="Mark Absent"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9999,
                          border: '1px solid var(--border)',
                          background: status === 'absent' ? '#EF4444' : '#F8FAFC',
                          color: status === 'absent' ? '#FFFFFF' : '#64748B',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: status === 'absent' ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <IconX size={18} />
                      </button>
                      <button
                        className={`status-btn ${status === 'excused' ? 'excused' : ''}`}
                        onClick={() => handleMark(camper.id, 'excused')}
                        title="Mark Excused"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9999,
                          border: '1px solid var(--border)',
                          background: status === 'excused' ? '#F59E0B' : '#F8FAFC',
                          color: status === 'excused' ? '#FFFFFF' : '#64748B',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: status === 'excused' ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <IconMinus size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Pagination Controller */}
        {filteredCampers.length > 0 && (
          <div style={{ marginTop: 16, marginBottom: 30 }}>
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
