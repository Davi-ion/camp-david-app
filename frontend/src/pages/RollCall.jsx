import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { CAMP_DAYS } from '../data/schedule';
import { sessions } from '../data/sessions';
import UserMenu from '../components/UserMenu';
import NotificationCentre from '../components/NotificationCentre';
import EmptyState from '../components/EmptyState';
import { IconClipboardCheck, IconCheck, IconX, IconMinus } from '@tabler/icons-react';

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function RollCall() {
  const { state, dispatch } = useApp();
  const { hasPermission } = usePermissions();
  const user = state.currentUser;
  const isAdmin = hasPermission('manage:users') || hasPermission('all');

  // Find current camp day or default
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const defaultDay = CAMP_DAYS.find((d) => d.date === todayStr)?.key || 'wed';

  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selectedSession, setSelectedSession] = useState(null);
  const [groupFilter, setGroupFilter] = useState('all');
  const [departureGrouping, setDepartureGrouping] = useState('platoon');

  const campDay = CAMP_DAYS.find((d) => d.key === selectedDay) || CAMP_DAYS[0];
  const daySessions = sessions[selectedDay] || [];

  // Auto-select first session
  const activeSession = selectedSession || (daySessions[0]?.key || null);
  const sessionKey = activeSession ? `${selectedDay}-${activeSession}` : null;
  const activeSessionObj = daySessions.find((s) => s.key === activeSession);

  // Filter campers by role
  const visibleCampers = useMemo(() => {
    let list = state.campers;
    if (!isAdmin) {
      list = list.filter((c) => c.platoon?.name === user?.platoon?.name || c.platoonId === user?.platoonId);
    } else if (groupFilter !== 'all') {
      list = list.filter((c) => c.platoon?.id === groupFilter || c.dorm?.id === groupFilter);
    }
    return list;
  }, [state.campers, user, groupFilter, isAdmin]);

  // Group campers by team or dorm based on Smart Grouping Engine
  const groupedCampers = useMemo(() => {
    const groups = {};
    
    // Determine grouping strategy based on sessionKey
    let strategy = 'platoon';
    if (sessionKey) {
      if (sessionKey === 'wed-arrival') strategy = 'platoon';
      else if (sessionKey === 'sun-departure') strategy = departureGrouping;
      else strategy = 'dorm'; // all other morning / lights_out sessions are by dorm
    }
    
    visibleCampers.forEach((c) => {
      let groupKey = 'Unassigned';
      if (strategy === 'dorm') {
        groupKey = c.dorm?.name || 'Unassigned Dorm';
      } else {
        groupKey = c.platoon?.name || c.group || 'Unassigned Platoon';
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(c);
    });
    return groups;
  }, [visibleCampers, sessionKey, departureGrouping]);

  // Attendance for current session
  const sessionData = sessionKey ? (state.attendance[sessionKey] || {}) : {};

  // Summary counts
  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, excused: 0, pending: 0 };
    visibleCampers.forEach((c) => {
      const status = sessionData[c.id];
      if (status) counts[status]++;
      else counts.pending++;
    });
    return counts;
  }, [visibleCampers, sessionData]);

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
        camperIds: visibleCampers.map((c) => c.id),
        status,
      },
    });
  };

  return (
    <div className="page">
      {/* Home-style Header with bg-rollcall */}
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

          <p className="dash-greeting">Attendance Tracking & Verification</p>
          <h1 className="dash-name">Roll Call</h1>

          <div className="dash-day-strip" style={{ marginBottom: 16 }}>
            <span className="dash-day-badge">DAY {campDay.dayNum} OF 5</span>
            <span>{campDay.full} · {activeSessionObj?.label || 'Session Active'}</span>
          </div>

          {/* Attendance Summary Glass Card */}
          <div className="now-card">
            <div className="now-card-label">
              <span className="now-dot" />
              ATTENDANCE SUMMARY
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ADE80' }}>{summary.present}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Present</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F87171' }}>{summary.absent}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Absent</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FBBF24' }}>{summary.excused}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Excused</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#E5E7EB' }}>{summary.pending}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {/* Day Selector */}
        <div className="day-selector">
          {CAMP_DAYS.map((d) => (
            <button
              key={d.key}
              className={`day-btn ${selectedDay === d.key ? 'active' : ''}`}
              onClick={() => { setSelectedDay(d.key); setSelectedSession(null); }}
            >
              {d.label}
              <span className="day-btn-date">{d.date.slice(8)}/{d.date.slice(5, 7)}</span>
            </button>
          ))}
        </div>

        {/* Session Selector */}
        <div className="session-selector" style={{ marginTop: 14 }}>
          {daySessions.map((s) => (
            <button
              key={s.key}
              className={`session-btn ${activeSession === s.key ? 'active' : ''}`}
              onClick={() => setSelectedSession(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Group Filter (Admin only) */}
        {isAdmin && (
          <div className="filter-tabs" style={{ marginTop: 14 }}>
            <button
              className={`filter-tab ${groupFilter === 'all' ? 'active' : ''}`}
              onClick={() => setGroupFilter('all')}
            >
              All
            </button>
            {Array.from(new Set(state.campers.map(c => c.platoon?.id).filter(Boolean))).map(id => {
              const platoon = state.campers.find(c => c.platoon?.id === id)?.platoon;
              return (
                <button
                  key={id}
                  className={`filter-tab ${groupFilter === id ? 'active' : ''}`}
                  onClick={() => setGroupFilter(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {platoon.emoji || '🏴'} {platoon.name}
                </button>
              );
            })}
            <div style={{ width: '1px', background: 'var(--border)', margin: '0 8px' }} />
            {Array.from(new Set(state.campers.map(c => c.dorm?.id).filter(Boolean))).map(id => {
              const dorm = state.campers.find(c => c.dorm?.id === id)?.dorm;
              return (
                <button
                  key={id}
                  className={`filter-tab ${groupFilter === id ? 'active' : ''}`}
                  onClick={() => setGroupFilter(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  🏢 {dorm.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Departure Grouping Toggle */}
        {sessionKey === 'sun-departure' && isAdmin && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Grouping Strategy:</span>
            <div className="filter-tabs" style={{ margin: 0 }}>
              <button 
                className={`filter-tab ${departureGrouping === 'platoon' ? 'active' : ''}`}
                onClick={() => setDepartureGrouping('platoon')}
              >
                By Platoon
              </button>
              <button 
                className={`filter-tab ${departureGrouping === 'dorm' ? 'active' : ''}`}
                onClick={() => setDepartureGrouping('dorm')}
              >
                By Dorm
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {sessionKey && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-sm btn-outline" onClick={() => handleBulk('present')} style={{ flex: 1, padding: '10px 16px', borderRadius: 10, fontWeight: 600 }}>
              ✓ Mark All Present
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => handleBulk('absent')}
              style={{ flex: 1, border: '1.5px solid var(--border)', padding: '10px 16px', borderRadius: 10, fontWeight: 600 }}
            >
              ✗ Mark All Absent
            </button>
          </div>
        )}

        {/* Camper List */}
        {!sessionKey ? (
          <EmptyState 
            icon={<IconClipboardCheck size={48} color="var(--teal)" />}
            title="Ready for Roll Call"
            description="Select a session above to begin taking attendance."
          />
        ) : (
          <div style={{ marginTop: 20 }}>
            {Object.entries(groupedCampers).map(([groupName, camperList]) => {
              const firstCamper = camperList[0];
              let emoji = '🛡️';
              if (firstCamper) {
                if (firstCamper.platoon?.name === groupName) emoji = firstCamper.platoon.emoji || '🏴';
                else if (firstCamper.dorm?.name === groupName) emoji = '🏢';
              }
              return (
                <div key={groupName} style={{ marginBottom: 20 }}>
                  <div className="group-header" style={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '0.02em', marginBottom: 10 }}>
                    {emoji} {groupName} ({camperList.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {camperList.map((camper) => {
                      const status = sessionData[camper.id] || null;
                      return (
                        <div key={camper.id} className="camper-row" style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                          <div className="avatar avatar-sm" style={{
                            background: status === 'present' ? 'var(--teal)' :
                                       status === 'absent' ? 'var(--red)' :
                                       status === 'excused' ? 'var(--amber)' : 'var(--border)',
                            color: '#fff',
                            fontWeight: 700
                          }}>
                            {getInitials(camper.name)}
                          </div>
                          <div className="camper-info">
                            <div className="camper-name" style={{ fontWeight: 600, color: 'var(--text)' }}>
                              {camper.name}
                              {camper.medicalNotes && <span className="medical-flag" title="Medical Notes Present">⚕️</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {sessionKey?.includes('lights_out') || sessionKey?.includes('morning') ? 
                                (camper.bedNumber ? `Bed: ${camper.bedNumber}` : 'No bed assigned') : 
                                (camper.platoon?.name || camper.group)}
                            </div>
                          </div>
                          <div className="status-buttons">
                            <button
                              className={`status-btn ${status === 'present' ? 'present' : ''}`}
                              onClick={() => handleMark(camper.id, 'present')}
                              title="Present"
                            >
                              <IconCheck size={16} />
                            </button>
                            <button
                              className={`status-btn ${status === 'absent' ? 'absent' : ''}`}
                              onClick={() => handleMark(camper.id, 'absent')}
                              title="Absent"
                            >
                              <IconX size={16} />
                            </button>
                            <button
                              className={`status-btn ${status === 'excused' ? 'excused' : ''}`}
                              onClick={() => handleMark(camper.id, 'excused')}
                              title="Excused"
                            >
                              <IconMinus size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
