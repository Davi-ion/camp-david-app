import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CAMP_DAYS, schedule } from '../data/schedule';
import { sessions as sessionData } from '../data/sessions';
import Pagination from '../components/Pagination';
import { 
  IconSearch, 
  IconFilter, 
  IconPrinter, 
  IconCheck, 
  IconX, 
  IconMinus, 
  IconClock,
  IconSunrise,
  IconMoon,
  IconUserCheck,
  IconLogout,
  IconUsers,
  IconBed,
  IconChecklist
} from '@tabler/icons-react';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

function getInitials(name) {
  if (!name) return 'C';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ConsoleAttendance() {
  const { state } = useApp();
  const [selectedDay, setSelectedDay] = useState(CAMP_DAYS[0].key);
  const [selectedPlatoon, setSelectedPlatoon] = useState('all');
  const [selectedDorm, setSelectedDorm] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedSessionType, setSelectedSessionType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | present | absent | excused | pending
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  const [dorms, setDorms] = useState([]);
  const [platoons, setPlatoons] = useState([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDay, selectedPlatoon, selectedDorm, selectedGender, selectedSessionType, statusFilter, search]);

  useEffect(() => {
    fetchDormsAndPlatoons();
  }, []);

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
      console.error('Failed to load dorms and platoons:', err);
    }
  };

  const daySessions = sessionData[selectedDay] || schedule[selectedDay] || [];
  
  const displaySessions = useMemo(() => {
    if (selectedSessionType === 'all') return daySessions;
    return daySessions.filter(s => s.key === selectedSessionType);
  }, [daySessions, selectedSessionType]);

  const getAttendanceStatus = (camperId, sessionKey) => {
    const fullKey = `${selectedDay}-${sessionKey}`;
    const sessionAtt = state.attendance[fullKey];
    if (!sessionAtt) return null;
    return sessionAtt[camperId]; // 'present', 'late', 'absent', 'excused'
  };

  // Base list of campers matching platoon, dorm, gender, search
  const campers = useMemo(() => {
    return state.campers.filter(c => {
      if (selectedPlatoon !== 'all' && c.platoonId !== selectedPlatoon && c.group !== selectedPlatoon && c.platoon?.name !== selectedPlatoon) return false;
      if (selectedDorm !== 'all' && c.dormId !== selectedDorm && c.dorm?.name !== selectedDorm) return false;
      if (selectedGender !== 'all' && c.gender?.toLowerCase() !== selectedGender.toLowerCase()) return false;
      
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesReg = c.registrationNumber && c.registrationNumber.toLowerCase().includes(q);
        const matchesBed = c.bedNumber && c.bedNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesReg && !matchesBed) return false;
      }

      return true;
    });
  }, [state.campers, selectedPlatoon, selectedDorm, selectedGender, search]);

  // Target session for filtering status counts
  const activeTargetSessionKey = selectedSessionType !== 'all' ? selectedSessionType : (displaySessions[0]?.key || 'morning');

  // Summary counts for current session across all matching campers
  const summary = useMemo(() => {
    const counts = { total: campers.length, present: 0, absent: 0, excused: 0, pending: 0 };
    campers.forEach((c) => {
      const st = getAttendanceStatus(c.id, activeTargetSessionKey);
      if (st === 'present' || st === 'late') counts.present++;
      else if (st === 'absent') counts.absent++;
      else if (st === 'excused') counts.excused++;
      else counts.pending++;
    });
    return counts;
  }, [campers, activeTargetSessionKey, selectedDay, state.attendance]);

  const percentComplete = summary.total > 0
    ? Math.round(((summary.present + summary.absent + summary.excused) / summary.total) * 100)
    : 0;

  // Final filtered list including status filter
  const filteredCampers = useMemo(() => {
    if (statusFilter === 'all') return campers;
    return campers.filter(c => {
      const st = getAttendanceStatus(c.id, activeTargetSessionKey) || 'pending';
      if (statusFilter === 'present') return st === 'present' || st === 'late';
      return st === statusFilter;
    });
  }, [campers, statusFilter, activeTargetSessionKey, selectedDay, state.attendance]);

  // Paginated list for current page
  const paginatedCampers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCampers.slice(startIndex, startIndex + pageSize);
  }, [filteredCampers, currentPage, pageSize]);

  const activeDayObj = CAMP_DAYS.find(d => d.key === selectedDay) || CAMP_DAYS[0];
  const activeSessionObj = daySessions.find(s => s.key === activeTargetSessionKey);

  const getSessionIcon = (key) => {
    if (key === 'arrival') return <IconUserCheck size={16} />;
    if (key === 'morning') return <IconSunrise size={16} />;
    if (key === 'lights_out') return <IconMoon size={16} />;
    if (key === 'departure') return <IconLogout size={16} />;
    return <IconClock size={16} />;
  };

  return (
    <div className="console-fade-in">
      {/* Header */}
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconChecklist size={28} color="var(--primary)" /> Attendance & Roll Call Console
          </h1>
          <p className="console-page-subtitle">Real-time attendance monitor & operational reporting across all camp sessions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => window.print()} 
            className="btn btn-secondary hide-on-print" 
            style={{ padding: '8px 16px', borderRadius: 9999, fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconPrinter size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* 1. Day Selector Strip (Roll Call Style) */}
      <div className="console-card hide-on-print" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '0.05em', marginBottom: 10 }}>
          SELECT CAMP DAY
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CAMP_DAYS.map((d) => {
            const isActive = selectedDay === d.key;
            return (
              <button
                key={d.key}
                onClick={() => { setSelectedDay(d.key); setSelectedSessionType('all'); setStatusFilter('all'); }}
                style={{
                  flex: 1,
                  minWidth: 90,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: isActive ? '2px solid var(--orange, #F49E82)' : '1px solid var(--border)',
                  background: isActive ? 'var(--orange, #F49E82)' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  boxShadow: isActive ? '0 4px 14px rgba(244, 158, 130, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{d.label}</span>
                <span style={{ fontSize: '0.75rem', opacity: isActive ? 0.9 : 0.6 }}>
                  {d.date.slice(8)}/{d.date.slice(5, 7)}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Session Selector Pills */}
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '0.05em', marginTop: 16, marginBottom: 10 }}>
          SELECT ROLL CALL SESSION
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => setSelectedSessionType('all')}
            style={{
              padding: '8px 16px',
              borderRadius: 9999,
              border: selectedSessionType === 'all' ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: selectedSessionType === 'all' ? 'rgba(27, 120, 101, 0.1)' : '#FFFFFF',
              color: selectedSessionType === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8125rem',
              transition: 'all 0.15s ease'
            }}
          >
            All Sessions ({daySessions.length})
          </button>
          {daySessions.map((s) => {
            const isActive = selectedSessionType === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSelectedSessionType(s.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: isActive ? 'rgba(27, 120, 101, 0.1)' : '#FFFFFF',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                {getSessionIcon(s.key)}
                <span>{s.label || s.title}</span>
                <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>({s.time})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Summary & Progress Banner (Roll Call Theme) */}
      <div className="console-card hide-on-print" style={{ marginBottom: 20, padding: 20, background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)', color: '#FFFFFF', borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A7F3D0' }}>
              {activeDayObj.full} · {activeSessionObj?.label || 'SESSION'} OVERVIEW
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
              Roll Call Completion: {percentComplete}%
            </div>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, background: 'rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: 9999, backdropFilter: 'blur(4px)' }}>
            {summary.present + summary.absent + summary.excused} of {summary.total} Campers Marked
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 99, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ width: `${percentComplete}%`, height: '100%', background: '#34D399', transition: 'width 0.4s ease' }} />
        </div>

        {/* Status Filter Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 16 }}>
          <div
            onClick={() => setStatusFilter(statusFilter === 'all' ? 'all' : 'all')}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: statusFilter === 'all' ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.12)',
              border: statusFilter === 'all' ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{summary.total}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: 2 }}>All Campers</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: statusFilter === 'present' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.12)',
              border: statusFilter === 'present' ? '2px solid #34D399' : '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#A7F3D0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconCheck size={18} /> {summary.present}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: 2 }}>Present</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: statusFilter === 'absent' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.12)',
              border: statusFilter === 'absent' ? '2px solid #FCA5A5' : '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconX size={18} /> {summary.absent}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: 2 }}>Absent</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'excused' ? 'all' : 'excused')}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: statusFilter === 'excused' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.12)',
              border: statusFilter === 'excused' ? '2px solid #C7D2FE' : '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#C7D2FE', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconMinus size={18} /> {summary.excused}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: 2 }}>Excused</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255, 255, 255, 0.12)',
              border: statusFilter === 'pending' ? '2px solid #FDE68A' : '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FDE68A', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IconClock size={18} /> {summary.pending}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: 2 }}>Pending</div>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="console-card hide-on-print" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
            <IconSearch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search camper, reg #, bed #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 38, width: '100%', fontSize: '0.875rem' }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            
            {/* Status Filter Dropdown */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
                style={{ width: 140, padding: '8px 12px', fontSize: '0.875rem', fontWeight: 600 }}
              >
                <option value="all">All Statuses</option>
                <option value="present">Present (✓)</option>
                <option value="absent">Absent (✗)</option>
                <option value="excused">Excused (~)</option>
                <option value="pending">Pending (Clock)</option>
              </select>
            </div>

            {/* Platoon Filter */}
            <div>
              <select
                value={selectedPlatoon}
                onChange={(e) => setSelectedPlatoon(e.target.value)}
                className="input-field"
                style={{ width: 150, padding: '8px 12px', fontSize: '0.875rem' }}
              >
                <option value="all">All Platoons</option>
                {platoons.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Dorm Filter */}
            <div>
              <select
                value={selectedDorm}
                onChange={(e) => setSelectedDorm(e.target.value)}
                className="input-field"
                style={{ width: 150, padding: '8px 12px', fontSize: '0.875rem' }}
              >
                <option value="all">All Dorms</option>
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.gender})</option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="input-field"
                style={{ width: 120, padding: '8px 12px', fontSize: '0.875rem' }}
              >
                <option value="all">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {(selectedPlatoon !== 'all' || selectedDorm !== 'all' || selectedGender !== 'all' || statusFilter !== 'all' || search) && (
              <button
                onClick={() => {
                  setSelectedPlatoon('all');
                  setSelectedDorm('all');
                  setSelectedGender('all');
                  setStatusFilter('all');
                  setSearch('');
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Main Attendance Table */}
      <div className="console-card">
        <div className="console-card-header" style={{ padding: '14px 20px', background: 'var(--bg-light)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
            Showing {filteredCampers.length} of {campers.length} campers
            {statusFilter !== 'all' && (
              <span className="badge" style={{ marginLeft: 8, textTransform: 'capitalize', background: 'var(--primary)', color: '#FFF' }}>
                Filtered by {statusFilter}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Session: <strong style={{ color: 'var(--text)' }}>{activeSessionObj?.label || 'Session'}</strong>
          </div>
        </div>

        <div className="console-table-container">
          <table className="console-table" style={{ minWidth: 850 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 10, background: 'var(--bg)', borderRight: '1px solid var(--border)', minWidth: 220 }}>
                  Camper Details
                </th>
                <th style={{ background: 'var(--bg)', width: 140 }}>Platoon</th>
                <th style={{ background: 'var(--bg)', width: 140 }}>Dorm</th>
                {displaySessions.map((s) => (
                  <th key={s.key} style={{ textAlign: 'center', background: 'var(--bg)', minWidth: 120 }}>
                    <div style={{ fontWeight: 600 }}>{s.label || s.title}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 400 }}>{s.time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedCampers.length === 0 ? (
                <tr>
                  <td colSpan={3 + displaySessions.length} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    <IconUsers size={36} style={{ strokeWidth: 1.5, opacity: 0.5, marginBottom: 8 }} />
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>No campers found</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: 2 }}>Try adjusting your search or filters above</div>
                  </td>
                </tr>
              ) : (
                paginatedCampers.map((c) => (
                  <tr key={c.id}>
                    {/* Camper Sticky Column */}
                    <td style={{ position: 'sticky', left: 0, zIndex: 5, background: '#FFFFFF', borderRight: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div 
                          style={{ 
                            width: 34, 
                            height: 34, 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #1B7865 0%, #0F766E 100%)', 
                            color: '#FFFFFF', 
                            fontWeight: 700, 
                            fontSize: '0.8125rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>{c.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {c.registrationNumber || c.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Platoon */}
                    <td>
                      {c.platoon ? (
                        <span className="badge" style={{ background: (c.platoon.colorHex || '#1B7865') + '15', color: c.platoon.colorHex || '#1B7865', border: `1px solid ${(c.platoon.colorHex || '#1B7865')}30`, fontWeight: 600 }}>
                          {c.platoon.emoji || '🏴'} {c.platoon.name}
                        </span>
                      ) : (
                        <span className="badge badge-outline" style={{ color: 'var(--text-muted)' }}>{c.group || 'Unassigned'}</span>
                      )}
                    </td>

                    {/* Dorm */}
                    <td>
                      {c.dorm ? (
                        <span className="badge" style={{ background: 'var(--bg-light)', color: 'var(--text)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconBed size={13} style={{ opacity: 0.7 }} />
                          {c.dorm.name} {c.bedNumber ? `(${c.bedNumber})` : ''}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>-</span>
                      )}
                    </td>

                    {/* Session Attendance Status Pills */}
                    {displaySessions.map((s) => {
                      const status = getAttendanceStatus(c.id, s.key);
                      
                      let badgeBg = '#F3F4F6';
                      let badgeColor = '#6B7280';
                      let badgeBorder = '#E5E7EB';
                      let icon = <IconClock size={13} />;
                      let label = 'Pending';

                      if (status === 'present' || status === 'late') {
                        badgeBg = '#D1FAE5';
                        badgeColor = '#065F46';
                        badgeBorder = '#A7F3D0';
                        icon = <IconCheck size={13} />;
                        label = status === 'late' ? 'Late' : 'Present';
                      } else if (status === 'absent') {
                        badgeBg = '#FEE2E2';
                        badgeColor = '#991B1B';
                        badgeBorder = '#FCA5A5';
                        icon = <IconX size={13} />;
                        label = 'Absent';
                      } else if (status === 'excused') {
                        badgeBg = '#E0E7FF';
                        badgeColor = '#3730A3';
                        badgeBorder = '#C7D2FE';
                        icon = <IconMinus size={13} />;
                        label = 'Excused';
                      }

                      return (
                        <td key={s.key} style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 9999,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: badgeBg,
                              color: badgeColor,
                              border: `1px solid ${badgeBorder}`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {icon} {label}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controller */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredCampers.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 15, 25, 50, 100]}
        />
      </div>
    </div>
  );
}
