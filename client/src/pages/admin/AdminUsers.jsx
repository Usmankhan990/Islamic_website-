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

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Location</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td className="text-muted">{u.email}</td>
                  <td><span className="badge" style={{ background: `${roleColors[u.role]}22`, color: roleColors[u.role] }}>{u.role}</span></td>
                  <td className="text-muted">{[u.city, u.country].filter(Boolean).join(', ') || '—'}</td>
                  <td className="text-muted text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
