import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', teacher_name: '', description: '', platform: 'zoom', meeting_link: '', scheduled_at: '', duration_minutes: 60 });

  useEffect(() => {
    api.get('/classes').then(r => { setClasses(r.data.classes); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/classes', form);
    setShowForm(false);
    setForm({ title: '', teacher_name: '', description: '', platform: 'zoom', meeting_link: '', scheduled_at: '', duration_minutes: 60 });
    const r = await api.get('/classes');
    setClasses(r.data.classes);
  };

  const deleteClass = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/classes/${id}`);
    setClasses(classes.filter(c => c.id !== id));
  };

  const platformIcons = { google_meet: '📹', zoom: '💻', teams: '👥', other: '🔗' };

  return (
    <div className="page container">
      <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
        <h1 className="heading-xl">🎓 Live Classes</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>➕ Schedule Class</button>
      </div>

      {showForm && (
        <form className="card animate-slide-up" onSubmit={create} style={{ marginBottom: 24 }}>
          <h3 className="heading-md" style={{ marginBottom: 16 }}>Schedule New Class</h3>
          <div className="grid-2 gap-md">
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Teacher Name</label><input className="form-input" value={form.teacher_name} onChange={e => setForm({...form, teacher_name: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Platform</label>
              <select className="form-select" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                <option value="google_meet">Google Meet</option><option value="zoom">Zoom</option><option value="teams">Microsoft Teams</option><option value="other">Other</option>
              </select></div>
            <div className="form-group"><label className="form-label">Meeting Link</label><input className="form-input" value={form.meeting_link} onChange={e => setForm({...form, meeting_link: e.target.value})} placeholder="https://..." required /></div>
            <div className="form-group"><label className="form-label">Date & Time</label><input type="datetime-local" className="form-input" value={form.scheduled_at} onChange={e => setForm({...form, scheduled_at: e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Duration (min)</label><input type="number" className="form-input" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: parseInt(e.target.value)})} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="flex gap-md">
            <button type="submit" className="btn btn-primary">Schedule</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Class</th><th>Teacher</th><th>Platform</th><th>Date</th><th>Duration</th><th>Actions</th></tr></thead>
            <tbody>
              {classes.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong></td>
                  <td>{c.teacher_name}</td>
                  <td>{platformIcons[c.platform]} {c.platform}</td>
                  <td className="text-sm">{new Date(c.scheduled_at).toLocaleString()}</td>
                  <td>{c.duration_minutes}m</td>
                  <td>
                    <div className="flex gap-sm">
                      <a href={c.meeting_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">🔗 Link</a>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteClass(c.id)}>🗑️</button>
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
