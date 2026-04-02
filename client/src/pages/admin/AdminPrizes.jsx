import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminPrizes() {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/prizes').then(r => { setPrizes(r.data.prizes); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/prizes/${id}`, { shipping_status: status });
    const r = await api.get('/prizes');
    setPrizes(r.data.prizes);
  };

  const statusColors = { pending: '#F59E0B', processing: '#3B82F6', shipped: '#A855F7', delivered: '#22C55E' };
  const statusIcons = { pending: '⏳', processing: '📦', shipped: '🚚', delivered: '✅' };

  return (
    <div className="page container">
      <h1 className="heading-xl" style={{ marginBottom: 24 }}>🎁 Prize Management</h1>
      <p className="text-muted" style={{ marginBottom: 24 }}>Track and manage gifts for competition winners</p>

      {loading ? <div className="loader"><div className="spinner"></div></div> : prizes.length === 0 ? (
        <div className="text-center" style={{ padding: 60 }}><span style={{ fontSize: '4rem' }}>🎁</span><p className="text-muted" style={{ marginTop: 16 }}>No prizes awarded yet</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Winner</th><th>Prize</th><th>Competition</th><th>Status</th><th>Tracking</th><th>Actions</th></tr></thead>
            <tbody>
              {prizes.map(p => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.user_name}</strong>
                    <div className="text-xs text-muted">{p.user_email}</div>
                  </td>
                  <td>{p.prize_name}</td>
                  <td className="text-muted">{p.competition_title || '—'}</td>
                  <td>
                    <span className="badge" style={{ background: `${statusColors[p.shipping_status]}22`, color: statusColors[p.shipping_status] }}>
                      {statusIcons[p.shipping_status]} {p.shipping_status}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{p.tracking_number || '—'}</td>
                  <td>
                    <select className="form-select" value={p.shipping_status} onChange={e => updateStatus(p.id, e.target.value)} style={{ minWidth: 130, padding: '6px 10px', fontSize: '0.8rem' }}>
                      <option value="pending">⏳ Pending</option>
                      <option value="processing">📦 Processing</option>
                      <option value="shipped">🚚 Shipped</option>
                      <option value="delivered">✅ Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
