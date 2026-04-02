import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LiveClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ topic: '', preferred_time: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/classes?upcoming_only=true');
        setClasses(res.data.classes);
      } catch {}
      if (user) {
        try {
          const res = await api.get('/classes/requests/my');
          setMyRequests(res.data.requests);
        } catch {}
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.topic) return;
    setSubmitting(true);
    try {
      await api.post('/classes/request', requestForm);
      setSuccessMsg('Request submitted successfully! Admin will review it shortly.');
      setShowRequestForm(false);
      setRequestForm({ topic: '', preferred_time: '', message: '' });
      const res = await api.get('/classes/requests/my');
      setMyRequests(res.data.requests);
    } catch { setSuccessMsg('Failed to submit request.'); }
    setSubmitting(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const platformIcons = { google_meet: '📹', zoom: '💻', teams: '👥', other: '🔗' };
  const platformNames = { google_meet: 'Google Meet', zoom: 'Zoom', teams: 'Microsoft Teams', other: 'Other' };
  const statusColors = { pending: '#F59E0B', approved: '#22C55E', rejected: '#EF4444' };

  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return 'Starting Soon!';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `In ${days}d ${hours}h`;
    const mins = Math.floor((diff % 3600000) / 60000);
    return `In ${hours}h ${mins}m`;
  };

  return (
    <div className="page container">
      <div className="text-center animate-slide-up" style={{ marginBottom: 48 }}>
        <h1 className="heading-xl">🎓 Free Live Quran Classes</h1>
        <p className="text-muted" style={{ maxWidth: 600, margin: '12px auto' }}>
          Join live Quran teaching sessions for free! Classes are conducted via Google Meet, Zoom, or Microsoft Teams.
        </p>
        {user && (
          <button className="btn btn-primary" style={{ marginTop: 16 }}
            onClick={() => setShowRequestForm(!showRequestForm)}>
            📩 {showRequestForm ? 'Cancel' : 'Request Live Class'}
          </button>
        )}
      </div>

      {successMsg && (
        <div className="lc-success animate-slide-up">{successMsg}</div>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <div className="lc-request-form animate-slide-up">
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>📩 Request a Live Class</h3>
          <form onSubmit={submitRequest}>
            <div className="form-group">
              <label>Topic / Subject *</label>
              <select className="form-input" value={requestForm.topic} onChange={e => setRequestForm({ ...requestForm, topic: e.target.value })} required>
                <option value="">Select a topic</option>
                <option value="Quran Recitation">Quran Recitation (Tajweed)</option>
                <option value="Quran Translation">Quran Translation</option>
                <option value="Hadith Study">Hadith Study</option>
                <option value="Arabic Language">Arabic Language</option>
                <option value="Islamic History">Islamic History</option>
                <option value="Fiqh (Islamic Jurisprudence)">Fiqh (Islamic Jurisprudence)</option>
                <option value="Du'a & Adhkar">Du'a & Adhkar</option>
                <option value="Prayer (Salah) Guide">Prayer (Salah) Guide</option>
                <option value="Kids Islamic Education">Kids Islamic Education</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Preferred Time</label>
              <input type="text" className="form-input" placeholder="e.g., Weekday evenings, Saturday morning"
                value={requestForm.preferred_time} onChange={e => setRequestForm({ ...requestForm, preferred_time: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Additional Message</label>
              <textarea className="form-input" rows="3" placeholder="Any specific requirements or questions..."
                value={requestForm.message} onChange={e => setRequestForm({ ...requestForm, message: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '⏳ Submitting...' : '📨 Submit Request'}
            </button>
          </form>
        </div>
      )}

      {/* My Requests */}
      {myRequests.length > 0 && (
        <div className="lc-my-requests animate-fade-in">
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>📋 My Requests</h3>
          <div className="lc-requests-grid">
            {myRequests.map(r => (
              <div key={r.id} className="lc-request-card" style={{ borderLeftColor: statusColors[r.status] }}>
                <div className="lc-req-top">
                  <span className="lc-req-topic">{r.topic}</span>
                  <span className="lc-req-status" style={{ color: statusColors[r.status], background: `${statusColors[r.status]}22` }}>
                    {r.status === 'pending' ? '⏳' : r.status === 'approved' ? '✅' : '❌'} {r.status}
                  </span>
                </div>
                {r.preferred_time && <p className="text-sm text-muted">🕐 {r.preferred_time}</p>}
                {r.message && <p className="text-sm text-muted">{r.message}</p>}
                {r.admin_response && (
                  <div className="lc-req-response">
                    <strong>Admin:</strong> {r.admin_response}
                  </div>
                )}
                {r.status === 'approved' && r.meeting_link && (
                  <div style={{ marginTop: 8 }}>
                    <p className="text-sm"><strong>📅 Schedule:</strong> {r.schedule_time ? new Date(r.schedule_time).toLocaleString() : 'TBD'}</p>
                    <a href={r.meeting_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                      🔗 Join Meeting
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loader"><div className="spinner"></div></div>
      ) : classes.length === 0 ? (
        <div className="text-center" style={{ padding: 80 }}>
          <span style={{ fontSize: '4rem' }}>🎓</span>
          <h3 className="heading-md" style={{ marginTop: 16 }}>No Upcoming Classes</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>Request a class above or check back soon!</p>
        </div>
      ) : (
        <div className="grid-2 gap-lg">
          {classes.map((c, i) => (
            <div key={c.id} className="card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <span className="badge badge-primary">{platformIcons[c.platform]} {platformNames[c.platform]}</span>
                <span className="badge badge-accent">{getCountdown(c.scheduled_at)}</span>
              </div>
              <h3 className="heading-sm" style={{ marginBottom: 8 }}>{c.title}</h3>
              <p className="text-muted text-sm" style={{ marginBottom: 16 }}>{c.description}</p>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted">
                  <div>👨‍🏫 {c.teacher_name}</div>
                  <div>📅 {new Date(c.scheduled_at).toLocaleString()}</div>
                  <div>⏱️ {c.duration_minutes} minutes</div>
                </div>
                <a href={c.meeting_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  🔗 Join Class
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .lc-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #22C55E; padding: 12px 20px; border-radius: var(--radius-md); text-align: center; font-weight: 600; margin-bottom: 24px; }
        .lc-request-form { max-width: 600px; margin: 0 auto 32px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 24px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.9rem; }
        .form-input { width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text); font-size: 0.9rem; }
        .form-input:focus { border-color: var(--primary); outline: none; }
        .lc-my-requests { margin-bottom: 32px; }
        .lc-requests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .lc-request-card { background: var(--surface); border: 1px solid var(--border); border-left: 4px solid; border-radius: var(--radius-lg); padding: 16px; }
        .lc-req-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .lc-req-topic { font-weight: 700; font-size: 0.95rem; }
        .lc-req-status { padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .lc-req-response { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px; margin-top: 8px; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
