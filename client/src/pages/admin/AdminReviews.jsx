import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reviews').then(r => { setReviews(r.data.reviews); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const approve = async (id, val) => {
    await api.put(`/reviews/${id}/approve`, { is_approved: val });
    const r = await api.get('/reviews');
    setReviews(r.data.reviews);
  };

  const deleteReview = async (id) => {
    await api.delete(`/reviews/${id}`);
    setReviews(reviews.filter(r => r.id !== id));
  };

  return (
    <div className="page container">
      <h1 className="heading-xl" style={{ marginBottom: 24 }}>⭐ Review Moderation</h1>

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map(r => (
            <div key={r.id} className="card" style={{ borderLeft: r.is_approved ? '3px solid var(--success)' : '3px solid var(--warning)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                <div className="flex items-center gap-md">
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {r.user_name?.charAt(0)}
                  </div>
                  <div>
                    <strong>{r.user_name}</strong>
                    <div className="text-xs text-muted">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  <span>{'⭐'.repeat(r.rating)}</span>
                  <span className={`badge ${r.is_approved ? 'badge-success' : 'badge-warning'}`}>
                    {r.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
              <p className="text-muted" style={{ margin: '12px 0', lineHeight: 1.6 }}>{r.content}</p>
              <div className="flex gap-sm">
                {!r.is_approved && <button className="btn btn-sm btn-primary" onClick={() => approve(r.id, true)}>✅ Approve</button>}
                {r.is_approved && <button className="btn btn-sm btn-outline" onClick={() => approve(r.id, false)}>↩ Unapprove</button>}
                <button className="btn btn-sm btn-danger" onClick={() => deleteReview(r.id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-center text-muted" style={{ padding: 40 }}>No reviews yet</p>}
        </div>
      )}
    </div>
  );
}
