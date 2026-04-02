import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function WeeklyLearning() {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/weekly-topics').then(r => r.data.topics).catch(() => []),
      api.get('/weekly-quizzes?active_only=true').then(r => r.data.quizzes).catch(() => []),
    ]).then(([t, q]) => { setTopics(t); setQuizzes(q); setLoading(false); });
  }, []);

  const activeTopics = topics.filter(t => new Date(t.week_end) >= new Date() && t.is_active);
  const pastTopics = topics.filter(t => new Date(t.week_end) < new Date());
  const typeIcons = { quran: '📖', hadith: '📚', custom: '✏️' };

  return (
    <div className="page container">
      <div className="text-center animate-slide-up" style={{ marginBottom: 40 }}>
        <h1 className="heading-xl">📚 Weekly Learning</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>This week's assigned topics and quizzes</p>
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <>
          {/* Active Topics */}
          {activeTopics.length > 0 ? (
            <div style={{ marginBottom: 48 }}>
              <h2 className="heading-md" style={{ marginBottom: 20 }}>🟢 This Week's Topics</h2>
              <div className="grid-2 gap-lg">
                {activeTopics.map((t, i) => {
                  const contentData = typeof t.content_data === 'string' ? JSON.parse(t.content_data) : t.content_data;
                  const topicQuizzes = quizzes.filter(q => q.topic_id === t.id);
                  return (
                    <div key={t.id} className="wl-topic-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="wl-topic-header">
                        <span className="wl-topic-icon">{typeIcons[t.content_type]}</span>
                        <span className="badge badge-primary">{t.target_audience}</span>
                      </div>
                      <h3 className="heading-sm" style={{ margin: '12px 0 8px' }}>{t.title}</h3>
                      {t.description && <p className="text-sm text-muted" style={{ marginBottom: 16 }}>{t.description}</p>}

                      {/* Content summary */}
                      <div className="wl-content-box">
                        {t.content_type === 'quran' && contentData.surahName && (
                          <p className="text-sm">📖 {contentData.surahName} • Verses {contentData.fromVerse}–{contentData.toVerse}</p>
                        )}
                        {t.content_type === 'hadith' && (
                          <p className="text-sm">📚 {contentData.collection} • Hadith #{contentData.fromNumber}–{contentData.toNumber}</p>
                        )}
                        <div className="flex gap-sm" style={{ marginTop: 8 }}>
                          <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>📊 {t.difficulty}</span>
                          <span className="text-xs text-muted">📅 Ends {new Date(t.week_end).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Quizzes for this topic */}
                      {topicQuizzes.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <p className="text-xs text-muted" style={{ marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Available Quizzes:</p>
                          <div className="flex flex-col gap-sm">
                            {topicQuizzes.map(q => (
                              <Link key={q.id} to={user ? `/weekly/quiz/${q.id}` : '/login'} className="wl-quiz-link">
                                <span>{q.quiz_type === 'live_final' ? '🔴' : '🎮'} {q.title}</span>
                                <span className="text-xs text-muted">{q.question_count} Q • {q.attempt_count} attempts</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center" style={{ padding: 60, marginBottom: 40 }}>
              <span style={{ fontSize: '4rem' }}>📚</span>
              <h3 className="heading-md" style={{ marginTop: 16 }}>No Active Topics This Week</h3>
              <p className="text-muted" style={{ marginTop: 8 }}>Check back soon — new content is assigned weekly!</p>
            </div>
          )}

          {/* Past Results */}
          {pastTopics.length > 0 && (
            <div>
              <h2 className="heading-md" style={{ marginBottom: 16 }}>📁 Previous Weeks</h2>
              <div className="grid-3 gap-md">
                {pastTopics.slice(0, 6).map(t => (
                  <div key={t.id} className="card" style={{ opacity: 0.7 }}>
                    <span style={{ fontSize: '1.5rem' }}>{typeIcons[t.content_type]}</span>
                    <h4 className="heading-sm" style={{ margin: '8px 0 4px' }}>{t.title}</h4>
                    <p className="text-xs text-muted">{new Date(t.week_start).toLocaleDateString()} — {new Date(t.week_end).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .wl-topic-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 28px;
          transition: var(--transition);
        }
        .wl-topic-card:hover { border-color: var(--primary); }
        .wl-topic-header { display: flex; justify-content: space-between; align-items: center; }
        .wl-topic-icon { font-size: 2rem; }
        .wl-content-box { background: var(--bg); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border); }
        .wl-quiz-link {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; background: var(--bg); border: 1px solid var(--border);
          border-radius: var(--radius-md); transition: var(--transition); font-size: 0.9rem; font-weight: 500;
        }
        .wl-quiz-link:hover { border-color: var(--primary); background: rgba(13,107,75,0.05); transform: translateX(4px); }
      `}</style>
    </div>
  );
}
