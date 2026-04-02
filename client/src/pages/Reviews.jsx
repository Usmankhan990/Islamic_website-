import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/reviews').then(r => { setReviews(r.data.reviews); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { content, rating });
      setSubmitted(true);
      setShowForm(false);
      setContent('');
    } catch { }
  };

  return (
    <div className="page container">
      <div className="text-center animate-slide-up" style={{ marginBottom: 48 }}>
        <h1 className="heading-xl">⭐ Reviews & Feedback</h1>
        <p className="text-muted" style={{ maxWidth: 500, margin: '12px auto' }}>
          See what our community says about NoorAcademy
        </p>
        {user && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ marginTop: 16 }}>
            ✍️ Write a Review
          </button>
        )}
      </div>

      {submitted && (
        <div className="card text-center" style={{ marginBottom: 24, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <p style={{ color: 'var(--success)' }}>✅ Thank you! Your review has been submitted for approval.</p>
        </div>
      )}

      {showForm && (
        <div className="card animate-slide-up" style={{ marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
          <h3 className="heading-sm" style={{ marginBottom: 16 }}>Write Your Review</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <div className="flex gap-sm">
                {[1,2,3,4,5].map(n => (
                  <button type="button" key={n} onClick={() => setRating(n)}
                    style={{ fontSize: '1.5rem', background: 'none', cursor: 'pointer', filter: n <= rating ? 'none' : 'grayscale(1) opacity(0.3)' }}>
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Your Review</label>
              <textarea className="form-textarea" value={content} onChange={e => setContent(e.target.value)} placeholder="Share your experience..." required />
            </div>
            <div className="flex gap-md">
              <button type="submit" className="btn btn-primary">Submit Review</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loader"><div className="spinner"></div></div>
      ) : (
        <div className="grid-3 gap-lg">
          {reviews.map((r, i) => (
            <div key={r.id} className="card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center gap-md" style={{ marginBottom: 12 }}>
                <div className="review-avatar">{r.user_name?.charAt(0) || '?'}</div>
                <div>
                  <div className="heading-sm" style={{ fontSize: '0.95rem' }}>{r.user_name}</div>
                  <div className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>{'⭐'.repeat(r.rating)}</div>
              <p className="text-muted" style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{r.content}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="text-center" style={{ gridColumn: '1 / -1', padding: 40 }}>
              <p className="text-muted">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .review-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
