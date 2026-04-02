import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminWeekly() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const r = await api.get('/weekly-topics');
      setTopics(r.data.topics);
    } catch { }
    setLoading(false);
  };

  const deleteTopic = async (id) => {
    if (!confirm('Delete this weekly topic and all its quizzes?')) return;
    await api.delete(`/weekly-topics/${id}`);
    setTopics(topics.filter(t => t.id !== id));
  };

  const generateQuiz = async (id, type) => {
    try {
      const r = await api.post(`/weekly-topics/${id}/generate-quiz`, {
        quiz_type: type,
        time_limit_minutes: type === 'live_final' ? 15 : 0
      });
      alert(`✅ ${r.data.message}`);
      load();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to generate quiz'));
    }
  };

  const typeIcons = { quran: '📖', hadith: '📚', custom: '✏️' };
  const audienceColors = { kids: '#FF6B6B', adults: '#3B82F6', all: '#22C55E' };
  const difficultyColors = { beginner: '#22C55E', intermediate: '#F59E0B', advanced: '#EF4444' };

  return (
    <div className="page container">
      <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="heading-xl">📚 Weekly Topics</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>Assign weekly Quran/Hadith content and auto-generate quizzes</p>
        </div>
        <Link to="/admin/weekly/new" className="btn btn-primary btn-lg">➕ New Topic</Link>
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : topics.length === 0 ? (
        <div className="text-center" style={{ padding: 80 }}>
          <span style={{ fontSize: '4rem' }}>📚</span>
          <h3 className="heading-md" style={{ marginTop: 16 }}>No Weekly Topics Yet</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>Create your first weekly learning assignment</p>
          <Link to="/admin/weekly/new" className="btn btn-primary" style={{ marginTop: 16 }}>Create Topic</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {topics.map((t, i) => {
            const isActive = new Date(t.week_end) >= new Date();
            return (
              <div key={t.id} className="weekly-topic-card animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="wt-header">
                  <div className="flex items-center gap-md">
                    <span className="wt-type-icon">{typeIcons[t.content_type]}</span>
                    <div>
                      <h3 className="heading-sm">{t.title}</h3>
                      <p className="text-sm text-muted">{t.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span className="badge" style={{ background: isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: isActive ? '#22C55E' : '#EF4444' }}>
                      {isActive ? '✅ Active' : '⏹ Ended'}
                    </span>
                  </div>
                </div>

                <div className="wt-meta">
                  <span className="badge" style={{ background: `${audienceColors[t.target_audience]}15`, color: audienceColors[t.target_audience] }}>
                    👥 {t.target_audience}
                  </span>
                  <span className="badge" style={{ background: `${difficultyColors[t.difficulty]}15`, color: difficultyColors[t.difficulty] }}>
                    📊 {t.difficulty}
                  </span>
                  <span className="text-sm text-muted">📅 {new Date(t.week_start).toLocaleDateString()} → {new Date(t.week_end).toLocaleDateString()}</span>
                  <span className="text-sm text-muted">📝 {t.quiz_count} quiz(es)</span>
                </div>

                <div className="wt-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => generateQuiz(t.id, 'practice')}>🎮 Practice Quiz</button>
                  <button className="btn btn-sm btn-accent" onClick={() => generateQuiz(t.id, 'live_final')}>🔴 Live Final Quiz</button>
                  <Link to={`/admin/weekly/edit/${t.id}`} className="btn btn-sm btn-outline">✏️ Edit</Link>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteTopic(t.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .weekly-topic-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          transition: var(--transition);
        }
        .weekly-topic-card:hover { border-color: var(--primary); }
        .wt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .wt-type-icon { font-size: 2rem; line-height: 1; }
        .wt-meta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 16px; }
        .wt-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        @media (max-width: 768px) {
          .wt-header { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </div>
  );
}
