import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminCompetitions() {
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'quiz', start_time: '', end_time: '', prize_description: '' });

  useEffect(() => {
    api.get('/competitions').then(r => { setComps(r.data.competitions); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/competitions', form);
      setShowForm(false);
      setForm({ title: '', description: '', type: 'quiz', start_time: '', end_time: '', prize_description: '' });
      const r = await api.get('/competitions');
      setComps(r.data.competitions);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/competitions/${id}`, { status });
    const r = await api.get('/competitions');
    setComps(r.data.competitions);
  };

  const deleteComp = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/competitions/${id}`);
    setComps(comps.filter(c => c.id !== id));
  };

  const statusColors = { upcoming: '#3B82F6', live: '#22C55E', completed: '#A855F7', cancelled: '#EF4444' };

  return (
    <div className="page container">
      <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
        <h1 className="heading-xl">🏅 Competitions</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>➕ New Competition</button>
      </div>

      {showForm && (
        <form className="card animate-slide-up" onSubmit={create} style={{ marginBottom: 24 }}>
          <h3 className="heading-md" style={{ marginBottom: 16 }}>Create Competition</h3>
          <div className="grid-2 gap-md">
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="quiz">Quiz</option><option value="recitation">Recitation</option><option value="hadith">Hadith</option><option value="general">General</option>
              </select></div>
            <div className="form-group"><label className="form-label">Start Time</label><input type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">End Time</label><input type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Prize Description</label><input className="form-input" value={form.prize_description} onChange={e => setForm({...form, prize_description: e.target.value})} placeholder="e.g., Gift card, Islamic book..." /></div>
          <div className="flex gap-md">
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Start</th><th>Participants</th><th>Actions</th></tr></thead>
            <tbody>
              {comps.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong></td>
                  <td>{c.type}</td>
                  <td><span className="badge" style={{ background: `${statusColors[c.status]}22`, color: statusColors[c.status] }}>{c.status}</span></td>
                  <td className="text-sm">{new Date(c.start_time).toLocaleString()}</td>
                  <td>{c.participant_count}</td>
                  <td>
                    <div className="flex gap-sm">
                      {c.status === 'upcoming' && <button className="btn btn-sm btn-primary" onClick={() => updateStatus(c.id, 'live')}>▶ Start</button>}
                      {c.status === 'live' && <button className="btn btn-sm btn-accent" onClick={() => updateStatus(c.id, 'completed')}>✓ End</button>}
                      <button className="btn btn-sm btn-danger" onClick={() => deleteComp(c.id)}>🗑️</button>
                    </div>
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
