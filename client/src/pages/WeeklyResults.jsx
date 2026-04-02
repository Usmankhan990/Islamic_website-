import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function WeeklyResults() {
  const { id } = useParams();
  const [data, setData] = useState({ results: [], quiz: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = () => {
      api.get(`/weekly-quizzes/${id}/results`).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
    };
    fetchResults();
    // Poll for live updates every 10 seconds
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="page container">
      <div className="text-center animate-slide-up" style={{ marginBottom: 40 }}>
        <h1 className="heading-xl">📊 Live Results</h1>
        {data.quiz && (
          <>
            <p className="heading-sm" style={{ color: 'var(--accent)', marginTop: 8 }}>{data.quiz.title}</p>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>{data.quiz.topic_title}</p>
          </>
        )}
        <div className="wr-live-badge animate-pulse">
          <span className="wr-live-dot"></span> LIVE — Auto-refreshing every 10s
        </div>
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : data.results.length === 0 ? (
        <div className="text-center" style={{ padding: 60 }}>
          <span style={{ fontSize: '4rem' }}>📊</span>
          <h3 className="heading-md" style={{ marginTop: 16 }}>No Submissions Yet</h3>
          <p className="text-muted">Results will appear here as participants complete the quiz</p>
        </div>
      ) : (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Top 3 Podium */}
          {data.results.length >= 3 && (
            <div className="wr-podium">
              {[1, 0, 2].map(idx => {
                const r = data.results[idx];
                if (!r) return null;
                const pct = r.total_points > 0 ? Math.round((r.score / r.total_points) * 100) : 0;
                return (
                  <div key={idx} className={`wr-podium-card rank-${idx + 1}`}>
                    <span className="wr-medal">{medals[idx]}</span>
                    <div className="wr-avatar">{r.user_name?.charAt(0)}</div>
                    <div className="wr-podium-name">{r.user_name}</div>
                    <div className="wr-podium-score">{r.score} pts</div>
                    <div className="wr-podium-pct">{pct}% • {r.time_taken}s</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Rankings */}
          <div className="wr-rankings">
            {data.results.map((r, i) => {
              const pct = r.total_points > 0 ? Math.round((r.score / r.total_points) * 100) : 0;
              return (
                <div key={i} className="wr-rank-row animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <span className="wr-rank-num">{i < 3 ? medals[i] : `#${i + 1}`}</span>
                  <div className="wr-rank-avatar">{r.user_name?.charAt(0)}</div>
                  <span className="wr-rank-name">{r.user_name}</span>
                  <span className="wr-rank-correct">{r.correct_count}/{r.total_questions}</span>
                  <span className="wr-rank-time">⏱ {r.time_taken}s</span>
                  <span className="wr-rank-pct" style={{ color: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--error)' }}>{pct}%</span>
                  <span className="wr-rank-score">{r.score} pts</span>
                </div>
              );
            })}
          </div>

          <div className="text-center" style={{ marginTop: 32 }}>
            <Link to="/weekly" className="btn btn-outline">📚 Back to Topics</Link>
          </div>
        </div>
      )}

      <style>{`
        .wr-live-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(34,197,94,0.1); color: var(--success); border: 1px solid rgba(34,197,94,0.3);
          padding: 6px 16px; border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600;
          margin-top: 16px;
        }
        .wr-live-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; }
        .wr-podium { display: flex; justify-content: center; align-items: flex-end; gap: 16px; margin-bottom: 32px; }
        .wr-podium-card {
          background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius-xl);
          padding: 24px 20px; text-align: center; width: 180px;
        }
        .wr-podium-card.rank-1 { border-color: #FBBF24; transform: scale(1.05); box-shadow: 0 8px 30px rgba(251,191,36,0.2); }
        .wr-podium-card.rank-2 { border-color: #C0C0C0; }
        .wr-podium-card.rank-3 { border-color: #CD7F32; }
        .wr-medal { font-size: 2.5rem; }
        .wr-avatar {
          width: 48px; height: 48px; border-radius: 50%; margin: 10px auto;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem; font-weight: 800;
        }
        .wr-podium-name { font-weight: 700; font-size: 0.95rem; margin: 4px 0; }
        .wr-podium-score { color: var(--accent); font-family: var(--font-heading); font-weight: 800; font-size: 1.3rem; }
        .wr-podium-pct { color: var(--text-muted); font-size: 0.75rem; }
        .wr-rankings { display: flex; flex-direction: column; gap: 8px; }
        .wr-rank-row {
          display: flex; align-items: center; gap: 16px; padding: 14px 20px;
          background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);
          transition: var(--transition);
        }
        .wr-rank-row:hover { border-color: var(--primary); }
        .wr-rank-num { font-weight: 800; width: 36px; text-align: center; font-size: 0.95rem; }
        .wr-rank-avatar {
          width: 32px; height: 32px; border-radius: 50%; background: var(--surface-light);
          display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; flex-shrink: 0;
        }
        .wr-rank-name { flex: 1; font-weight: 600; }
        .wr-rank-correct { color: var(--text-muted); font-size: 0.85rem; }
        .wr-rank-time { color: var(--text-dim); font-size: 0.8rem; }
        .wr-rank-pct { font-weight: 700; min-width: 50px; text-align: right; }
        .wr-rank-score { font-family: var(--font-heading); font-weight: 800; color: var(--accent); min-width: 70px; text-align: right; }
        @media (max-width: 768px) {
          .wr-podium { flex-direction: column; align-items: center; }
          .wr-podium-card.rank-1 { transform: none; }
          .wr-rank-time, .wr-rank-correct { display: none; }
        }
      `}</style>
    </div>
  );
}
