import { useState, useEffect } from 'react';
import { IconSearch, IconRefresh, IconActivity } from '@tabler/icons-react';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

export default function ConsoleActivity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/audit?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const filteredLogs = logs.filter(log => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (log.userName && log.userName.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.targetType && log.targetType.toLowerCase().includes(q)) ||
      (log.targetName && log.targetName.toLowerCase().includes(q)) ||
      (log.detail && log.detail.toLowerCase().includes(q))
    );
  });

  const getBadgeStyle = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('SEED')) {
      return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' };
    }
    if (act.includes('DELETE') || act.includes('ARCHIVE') || act.includes('REMOVE')) {
      return { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
    }
    return { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' };
  };

  return (
    <div className="console-fade-in">
      {/* Header */}
      <div className="console-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="console-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconActivity size={28} style={{ color: 'var(--teal, #10B981)' }} />
            Recent Activity
          </h1>
          <p className="console-page-subtitle">
            System-wide activity log of all administrative actions and user events ({total} total)
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}
        >
          <IconRefresh size={16} />
          Refresh
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="console-card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <IconSearch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by user, action, target, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="console-card">
        <div className="console-table-container">
          <table className="console-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading activity feed...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {search ? 'No matching activity records found.' : 'No activity records found.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const time = new Date(log.createdAt);
                  const badgeStyle = getBadgeStyle(log.action);

                  return (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {time.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                        <span style={{ opacity: 0.75 }}>
                          {time.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.userName || 'System'}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            letterSpacing: '0.03em',
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: badgeStyle.border,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        {log.targetType ? (
                          <div>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {log.targetType}
                            </span>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                              {log.targetName || log.targetId || '-'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', maxWidth: 320 }}>
                        {log.detail || '-'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing {filteredLogs.length} of {total} entries
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            >
              Previous
            </button>
            <button
              disabled={logs.length < limit}
              onClick={() => setPage(p => p + 1)}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
