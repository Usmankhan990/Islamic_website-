import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function KidsDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get(`/users/${user.id}/dashboard`).then(r => { setData(r.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div className="page"><div className="loader"><div className="spinner"></div></div></div>;

  return (
    <div className="kids-page page container">
      {/* Welcome Banner */}
      <div className="kids-welcome animate-slide-up">
        <div className="kids-welcome-content">
          <h1 className="kids-heading">🌟 {t('Welcome, {name}!', { name: user?.name })}</h1>
          <p className="kids-subtitle">{t("Keep learning and earning badges! You're doing amazing!")} 🎉</p>
        </div>
        <div className="kids-welcome-mascot animate-float">🧒</div>
      </div>

      {/* Stats */}
      <div className="kids-stats-row">
        <div className="kids-stat-card" style={{ '--stat-color': '#FBBF24' }}>
          <span className="kids-stat-icon">🪙</span>
          <span className="kids-stat-value">{data?.coins || 0}</span>
          <span className="kids-stat-label">{t('Coins')}</span>
        </div>
        <div className="kids-stat-card" style={{ '--stat-color': '#FF6B6B' }}>
          <span className="kids-stat-icon">🎮</span>
          <span className="kids-stat-value">{data?.stats?.games_played || 0}</span>
          <span className="kids-stat-label">{t('Games Played')}</span>
        </div>
        <div className="kids-stat-card" style={{ '--stat-color': '#4ECDC4' }}>
          <span className="kids-stat-icon">⭐</span>
          <span className="kids-stat-value">{data?.stats?.total_score || 0}</span>
          <span className="kids-stat-label">{t('Total Score')}</span>
        </div>
        <div className="kids-stat-card" style={{ '--stat-color': '#A855F7' }}>
          <span className="kids-stat-icon">🏆</span>
          <span className="kids-stat-value">{data?.achievements?.length || 0}</span>
          <span className="kids-stat-label">{t('Badges')}</span>
        </div>
        <div className="kids-stat-card" style={{ '--stat-color': '#FBBF24' }}>
          <span className="kids-stat-icon">🎁</span>
          <span className="kids-stat-value">{data?.prizes?.length || 0}</span>
          <span className="kids-stat-label">{t('Prizes')}</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="kids-quick-links">
        <Link to="/kids/games" className="kids-quick-card" style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}>
          <span style={{ fontSize: '2rem' }}>🎮</span>
          <span>{t('Play Games')}</span>
        </Link>
        <Link to="/kids/competitions" className="kids-quick-card" style={{ background: 'linear-gradient(135deg, #4ECDC4, #45B7AA)' }}>
          <span style={{ fontSize: '2rem' }}>🏅</span>
          <span>{t('Competitions')}</span>
        </Link>
        <Link to="/kids/duas" className="kids-quick-card" style={{ background: 'linear-gradient(135deg, #FFB347, #FF8E53)' }}>
          <span style={{ fontSize: '2rem' }}>🤲</span>
          <span>{t("Daily Du'as")}</span>
        </Link>
        <Link to="/kids/leaderboard" className="kids-quick-card" style={{ background: 'linear-gradient(135deg, #A855F7, #8B5CF6)' }}>
          <span style={{ fontSize: '2rem' }}>🏆</span>
          <span>{t('Leaderboard')}</span>
        </Link>
        <Link to="/quran" className="kids-quick-card" style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)' }}>
          <span style={{ fontSize: '2rem' }}>📖</span>
          <span>{t('Read Quran')}</span>
        </Link>
      </div>

      {/* Achievements */}
      {data?.achievements?.length > 0 && (
        <div className="kids-section">
          <h2 className="kids-section-title">🏆 {t('My Achievements')}</h2>
          <div className="kids-badges-grid">
            {data.achievements.map((a, i) => (
              <div key={i} className="kids-badge-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="kids-badge-icon">{a.badge_icon}</span>
                <span className="kids-badge-name">{a.badge_name}</span>
                <span className="kids-badge-date">{new Date(a.earned_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coin history */}
      {data?.coinHistory?.length > 0 && (
        <div className="kids-section">
          <h2 className="kids-section-title">🪙 {t('My Coins')}</h2>
          <div className="kids-results-list">
            {data.coinHistory.map((c, i) => (
              <div key={i} className="kids-result-card">
                <div className="kids-result-game">{(() => {
                  // Server stores "Won <game> — Level <n>"; show it in the UI language
                  const m = /^Won (.+) — Level (\d+)$/.exec(c.reason || '');
                  return m ? t('Won {game} — Level {n}', { game: m[1], n: m[2] }) : c.reason;
                })()}</div>
                <div className="kids-result-score" style={{ color: '#FBBF24' }}>+{c.amount} 🪙</div>
                <div className="kids-result-date">{new Date(c.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Games */}
      {data?.gameResults?.length > 0 && (
        <div className="kids-section">
          <h2 className="kids-section-title">🎮 {t('Recent Games')}</h2>
          <div className="kids-results-list">
            {data.gameResults.map((r, i) => (
              <div key={i} className="kids-result-card">
                <div className="kids-result-game">{r.game_title}</div>
                <div className="kids-result-score">{r.score}/{r.total_points} ({Math.round((r.score/r.total_points)*100)}%)</div>
                <div className="kids-result-date">{new Date(r.played_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prizes */}
      {data?.prizes?.length > 0 && (
        <div className="kids-section">
          <h2 className="kids-section-title">🎁 {t('My Prizes')}</h2>
          <div className="grid-2 gap-md">
            {data.prizes.map((p, i) => (
              <div key={i} className="card" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <h4 style={{ color: '#FBBF24' }}>🎁 {p.prize_name}</h4>
                <p className="text-sm text-muted" style={{ marginTop: 4 }}>{p.prize_description}</p>
                <span className={`badge ${p.shipping_status === 'delivered' ? 'badge-success' : p.shipping_status === 'shipped' ? 'badge-info' : 'badge-warning'}`} style={{ marginTop: 8 }}>
                  {t(p.shipping_status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .kids-page { color: var(--text); }
        .kids-welcome {
          background: linear-gradient(135deg, #FF6B6B, #A855F7, #4ECDC4);
          border-radius: var(--radius-xl);
          padding: 32px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .kids-heading { font-family: var(--font-kids); font-size: 2rem; font-weight: 800; }
        .kids-subtitle { font-family: var(--font-kids); font-size: 1.1rem; opacity: 0.9; margin-top: 8px; }
        .kids-welcome-mascot { font-size: 4rem; }
        .kids-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .kids-stat-card {
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          text-align: center;
          transition: var(--transition);
        }
        .kids-stat-card:hover { border-color: var(--stat-color); transform: translateY(-4px); }
        .kids-stat-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
        .kids-stat-value { font-family: var(--font-kids); font-size: 2rem; font-weight: 800; color: var(--stat-color); display: block; }
        .kids-stat-label { font-size: 0.85rem; color: var(--text-muted); display: block; margin-top: 4px; }
        .kids-quick-links { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .kids-quick-card {
          border-radius: var(--radius-lg);
          padding: 20px;
          text-align: center;
          color: white;
          font-family: var(--font-kids);
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: var(--transition);
        }
        .kids-quick-card:hover { transform: translateY(-4px) scale(1.02); }
        .kids-section { margin-bottom: 32px; }
        .kids-section-title { font-family: var(--font-kids); font-size: 1.5rem; margin-bottom: 16px; }
        .kids-badges-grid { display: flex; flex-wrap: wrap; gap: 12px; }
        .kids-badge-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          text-align: center;
          min-width: 120px;
        }
        .kids-badge-icon { font-size: 2rem; display: block; }
        .kids-badge-name { display: block; font-weight: 600; margin-top: 4px; font-size: 0.85rem; }
        .kids-badge-date { display: block; font-size: 0.7rem; color: var(--text-dim); margin-top: 4px; }
        .kids-results-list { display: flex; flex-direction: column; gap: 8px; }
        .kids-result-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }
        .kids-result-game { font-weight: 600; }
        .kids-result-score { color: var(--primary-light); font-weight: 700; }
        .kids-result-date { color: var(--text-dim); font-size: 0.85rem; }
        @media (max-width: 768px) {
          .kids-stats-row, .kids-quick-links { grid-template-columns: repeat(2, 1fr); }
          .kids-welcome { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}
