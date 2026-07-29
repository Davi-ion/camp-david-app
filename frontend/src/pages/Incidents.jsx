import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { usePermissions } from '../hooks/usePermissions';
import { GROUPS } from '../data/campers';
import { staff } from '../data/staff';
import UserMenu from '../components/UserMenu';
import NotificationCentre from '../components/NotificationCentre';
import EmptyState from '../components/EmptyState';
import { IconAlertTriangle, IconPlus, IconCheck, IconShieldCheck, IconAlertCircle } from '@tabler/icons-react';

const INCIDENT_TYPES = [
  { id: 'medical', label: 'Medical', emoji: '⚕️', color: 'var(--red)' },
  { id: 'behavioural', label: 'Behavioural', emoji: '⚠️', color: 'var(--amber)' },
  { id: 'welfare', label: 'Welfare', emoji: '🛡️', color: 'var(--blue)' },
];

const STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
];

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Incidents() {
  const { state, dispatch } = useApp();
  const { hasPermission, isAdmin } = usePermissions();
  const user = state.currentUser;

  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formCamper, setFormCamper] = useState('');
  const [formType, setFormType] = useState('medical');
  const [formDesc, setFormDesc] = useState('');

  // Selectable campers for report form
  const selectableCampers = useMemo(() => {
    if (isAdmin || hasPermission('view:campers')) return state.campers;
    return state.campers.filter((c) => c.group === user?.group);
  }, [state.campers, user, isAdmin, hasPermission]);

  // Filter incidents
  const visibleIncidents = useMemo(() => {
    let list = state.incidents;
    if (!isAdmin && !hasPermission('view:incidents')) {
      list = list.filter((i) => i.reportedBy === user?.id);
    } else if (!isAdmin && hasPermission('view:incidents') && !hasPermission('manage:users')) {
      const groupCamperIds = state.campers.filter((c) => c.group === user?.group).map((c) => c.id);
      list = list.filter((i) => groupCamperIds.includes(i.camperId) || i.reportedBy === user?.id);
    }
    if (statusFilter !== 'all') {
      list = list.filter((i) => i.status === statusFilter);
    }
    return list;
  }, [state.incidents, user, statusFilter, state.campers, isAdmin, hasPermission]);

  const openCount = useMemo(() => {
    return state.incidents.filter((i) => i.status !== 'resolved').length;
  }, [state.incidents]);

  const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

  const handleSubmit = async () => {
    if (!formCamper || !formDesc.trim()) return;
    const payload = {
      title: `${(formType || 'general').toUpperCase()} Incident`,
      description: formDesc.trim(),
      category: formType || 'other',
      severity: 'low',
      camperId: formCamper,
    };

    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        dispatch({ type: 'ADD_INCIDENT', payload: saved });
      } else {
        dispatch({ type: 'ADD_INCIDENT', payload: { ...payload, id: `inc-${Date.now()}`, reportedAt: new Date().toISOString(), status: 'open', reportedBy: user?.id } });
      }
    } catch (err) {
      dispatch({ type: 'ADD_INCIDENT', payload: { ...payload, id: `inc-${Date.now()}`, reportedAt: new Date().toISOString(), status: 'open', reportedBy: user?.id } });
    }

    setFormCamper('');
    setFormType('medical');
    setFormDesc('');
    setShowForm(false);
  };

  const handleStatusChange = async (incidentId, newStatus) => {
    dispatch({ type: 'UPDATE_INCIDENT_STATUS', payload: { id: incidentId, status: newStatus } });
    try {
      const token = localStorage.getItem('camp_token');
      await fetch(`${API}/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed to update incident status on API:', err);
    }
  };

  const canUpdateStatus = hasPermission('resolve:incidents');

  return (
    <div className="page">
      {/* Home-style Header with bg-incidents */}
      <div className="dash-header bg-incidents">
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

          <p className="dash-greeting">Health, Welfare & Safety Log</p>
          <h1 className="dash-name">Incident Tracker</h1>

          <div className="dash-day-strip" style={{ marginBottom: 16 }}>
            <span className="dash-day-badge" style={{ background: openCount > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255,255,255,0.2)' }}>
              {openCount} OPEN INCIDENT{openCount !== 1 ? 'S' : ''}
            </span>
            <span>{state.incidents.length} Total Incidents Logged</span>
          </div>

          {/* Quick Stat Pill Glass Card */}
          <div className="now-card">
            <div className="now-card-label">
              <span className="now-dot" />
              INCIDENT OVERVIEW
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F87171' }}>
                  {state.incidents.filter(i => i.type === 'medical').length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Medical</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FBBF24' }}>
                  {state.incidents.filter(i => i.type === 'behavioural').length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Behavioural</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px 4px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60A5FA' }}>
                  {state.incidents.filter(i => i.type === 'welfare').length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>Welfare</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {/* New Incident Action Button */}
        <button
          className="btn btn-primary btn-full"
          onClick={() => dispatch({ type: 'OPEN_INCIDENT_MODAL' })}
          style={{ marginBottom: 20, padding: '14px 20px', borderRadius: 9999, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9375rem', boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)' }}
        >
          <IconPlus size={20} />
          Report New Incident
        </button>
        {/* Status Filter Tabs */}
        <div className="filter-tabs" style={{ marginBottom: 20 }}>
          {STATUSES.map((s) => (
            <button
              key={s.id}
              className={`filter-tab ${statusFilter === s.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Incidents List */}
        {visibleIncidents.length === 0 ? (
          <EmptyState 
            icon={<IconShieldCheck size={48} color="var(--teal)" />}
            title={statusFilter === 'all' ? 'No incidents reported' : `No ${statusFilter.replace('_', ' ')} incidents`}
            description="All campers are accounted for safely."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {visibleIncidents.map((inc) => {
              const camper = state.campers.find((c) => c.id === inc.camperId);
              const reporter = staff.find((s) => s.id === inc.reportedBy);
              const group = GROUPS.find((g) => g.id === camper?.group);
              const type = INCIDENT_TYPES.find((t) => t.id === inc.type);
              const time = new Date(inc.reportedAt);
              const timeStr = time.toLocaleString('en-NG', {
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              return (
                <div key={inc.id} className="incident-card animate-in" style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                  <div className={`incident-bar ${inc.type}`} />
                  <div className="incident-body" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar avatar-sm" style={{ background: 'var(--teal)', color: '#fff', fontWeight: 700 }}>
                          {getInitials(camper?.name || '?')}
                        </div>
                        <div>
                          <div className="font-semibold" style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 700 }}>{camper?.name || 'Unknown Camper'}</div>
                          <div className="text-xs text-muted" style={{ marginTop: 2 }}>{group?.emoji || '🛡️'} {group?.name} · Reported by {reporter?.name || 'Staff Member'}</div>
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 12 }}>
                      {inc.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge ${type?.id === 'medical' ? 'badge-red' : type?.id === 'behavioural' ? 'badge-amber' : 'badge-blue'}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                          {type?.emoji} {type?.label}
                        </span>
                        <span className={`status-badge status-${inc.status}`}>
                          {inc.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-muted">{timeStr}</span>
                    </div>

                    {/* Status Update Actions */}
                    {canUpdateStatus && inc.status !== 'resolved' && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                        {inc.status === 'open' && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleStatusChange(inc.id, 'in_progress')}
                            style={{ fontSize: '0.8125rem', padding: '8px 14px', borderRadius: 8, fontWeight: 600 }}
                          >
                            Mark In Progress
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleStatusChange(inc.id, 'resolved')}
                          style={{ fontSize: '0.8125rem', padding: '8px 14px', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <IconCheck size={16} /> Resolve Incident
                        </button>
                      </div>
                    )}
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
