import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (search) params.set('search', search);
      const r = await api.get(`/users?${params}`);
      setUsers(r.data.users);
    } catch { }
    setLoading(false);
  };

  const roleColors = { admin: '#EF4444', teacher: '#3B82F6', parent: '#22C55E', child: '#FBBF24' };

  const isPremium = (u) => u.subscription_type === 'premium' && (!u.subscription_expires || new Date(u.subscription_expires) > new Date());

  // days = null → premium with no expiry; type 'free' removes premium
  const setSubscription = async (u, type, days) => {
    if (type === 'free' && !confirm(`Remove premium from ${u.name}?`)) return;
    try {
      await api.put(`/users/${u.id}/subscription`, { subscription_type: type, days });
      loadUsers();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const pendingRequests = users.filter(u => u.premium_requested_at && !isPremium(u));

  return (
    <div className="page container">
      <h1 className="heading-xl" style={{ marginBottom: 24 }}>👥 Users</h1>
      
      <div className="flex gap-md" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="🔍 Search users..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers()} style={{ flex: 1, minWidth: 200 }} />
        <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="parent">Parent</option>
          <option value="child">Child</option>
        </select>
        <button className="btn btn-primary" onClick={loadUsers}>Search</button>
      </div>

      {pendingRequests.length > 0 && (
        <div className="premium-requests">
          🙋 <strong>{pendingRequests.length}</strong> premium request{pendingRequests.length > 1 ? 's' : ''} waiting: {pendingRequests.map(u => u.name).join(', ')}
        </div>
      )}

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Coins</th><th>👑 Premium</th><th>Location</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td className="text-muted">{u.email}</td>
                  <td><span className="badge" style={{ background: `${roleColors[u.role]}22`, color: roleColors[u.role] }}>{u.role}</span></td>
                  <td>🪙 {u.coins ?? 0}</td>
                  <td>
                    {u.role === 'admin' ? <span className="text-sm text-muted">Always</span> : isPremium(u) ? (
                      <div className="premium-cell">
                        <span className="badge badge-success">👑 Premium{u.subscription_expires ? ` until ${new Date(u.subscription_expires).toLocaleDateString()}` : ''}</span>
                        <button className="btn btn-sm btn-outline" onClick={() => setSubscription(u, 'free')}>Remove</button>
                      </div>
                    ) : (
                      <div className="premium-cell">
                        {u.premium_requested_at && <span className="badge" style={{ background: '#F59E0B22', color: '#F59E0B' }}>🙋 Requested</span>}
                        <select className="form-select premium-select" defaultValue="" onChange={e => { if (e.target.value) setSubscription(u, 'premium', e.target.value === 'forever' ? null : Number(e.target.value)); e.target.value = ''; }}>
                          <option value="">Give premium…</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                          <option value="365">1 year</option>
                          <option value="forever">No expiry</option>
                        </select>
                      </div>
                    )}
                  </td>
                  <td className="text-muted">{[u.city, u.country].filter(Boolean).join(', ') || '—'}</td>
                  <td className="text-muted text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`
        .premium-requests { margin-bottom: 16px; padding: 12px 16px; border-radius: var(--radius-md); background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.35); color: #F59E0B; }
        .premium-cell { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .premium-select { padding: 6px 10px; font-size: 0.8rem; max-width: 150px; }
      `}</style>
    </div>
  );
}
