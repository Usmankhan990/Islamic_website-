import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function KidsLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/progress/leaderboard').then(r => { setLeaderboard(r.data.leaderboard); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="page container">
      <div className="text-center animate-slide-up" style={{ marginBottom: 48 }}>
        <h1 style={{ fontFamily: 'var(--font-kids)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800 }}>
          🏆 Leaderboard
        </h1>
        <p className="text-muted" style={{ fontFamily: 'var(--font-kids)' }}>Top learners on NoorAcademy!</p>
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div className="leaderboard-wrapper" style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Top 3 */}
          {leaderboard.length >= 3 && (
            <div className="top-three">
              {[1, 0, 2].map(idx => {
                const u = leaderboard[idx];
                if (!u) return null;
                return (
                  <div key={idx} className={`top-card rank-${idx + 1}`} style={{ animationDelay: `${idx * 0.2}s` }}>
                    <span className="top-medal">{medals[idx]}</span>
                    <div className="top-avatar">{u.name?.charAt(0)}</div>
                    <div className="top-name">{u.name}</div>
                    <div className="top-score">{u.total_score} pts</div>
                    <div className="top-badges">{u.badge_count} 🏆</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest */}
          <div className="leaderboard-list">
            {leaderboard.slice(3).map((u, i) => (
              <div key={i} className="leaderboard-row animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="lb-rank">#{i + 4}</span>
                <div className="lb-avatar">{u.name?.charAt(0)}</div>
                <span className="lb-name">{u.name}</span>
                <span className="lb-games">{u.games_played} games</span>
                <span className="lb-badges">{u.badge_count} 🏆</span>
                <span className="lb-score">{u.total_score} pts</span>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center" style={{ padding: 60 }}>
              <span style={{ fontSize: '4rem' }}>🏆</span>
              <p className="text-muted" style={{ marginTop: 16, fontFamily: 'var(--font-kids)' }}>
                No scores yet! Be the first to play and rank!
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .top-three { display: flex; justify-content: center; align-items: flex-end; gap: 16px; margin-bottom: 32px; }
        .top-card {
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 24px 20px;
          text-align: center;
          width: 180px;
          animation: slideUp 0.5s ease;
        }
        .top-card.rank-1 { border-color: #FBBF24; transform: scale(1.1); box-shadow: 0 8px 30px rgba(251,191,36,0.2); }
        .top-card.rank-2 { border-color: #C0C0C0; }
        .top-card.rank-3 { border-color: #CD7F32; }
        .top-medal { font-size: 2.5rem; display: block; }
        .top-avatar {
          width: 56px; height: 56px; border-radius: 50%; margin: 12px auto;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; font-weight: 800;
        }
        .top-name { font-family: var(--font-kids); font-weight: 700; font-size: 1rem; margin: 4px 0; }
        .top-score { color: var(--accent); font-family: var(--font-kids); font-weight: 800; font-size: 1.2rem; }
        .top-badges { color: var(--text-muted); font-size: 0.8rem; margin-top: 4px; }
        .leaderboard-list { display: flex; flex-direction: column; gap: 8px; }
        .leaderboard-row {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: var(--transition);
        }
        .leaderboard-row:hover { border-color: var(--primary); background: var(--surface-light); }
        .lb-rank { font-weight: 800; color: var(--text-muted); width: 40px; font-size: 0.9rem; }
        .lb-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--surface-light);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
        }
        .lb-name { flex: 1; font-weight: 600; }
        .lb-games { color: var(--text-muted); font-size: 0.85rem; }
        .lb-badges { font-size: 0.85rem; }
        .lb-score { font-weight: 800; color: var(--accent); font-family: var(--font-kids); min-width: 80px; text-align: right; }
        @media (max-width: 768px) {
          .top-three { flex-direction: column; align-items: center; }
          .top-card.rank-1 { transform: none; }
          .lb-games { display: none; }
        }
      `}</style>
    </div>
  );
}
