import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, games: 0, competitions: 0, reviews: 0, prizes: 0, classes: 0, weeklyTopics: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users').then(r => r.data.users?.length || 0).catch(() => 0),
      api.get('/games').then(r => r.data.games?.length || 0).catch(() => 0),
      api.get('/competitions').then(r => r.data.competitions?.length || 0).catch(() => 0),
      api.get('/reviews').then(r => r.data.reviews?.length || 0).catch(() => 0),
      api.get('/prizes').then(r => r.data.prizes?.length || 0).catch(() => 0),
      api.get('/classes').then(r => r.data.classes?.length || 0).catch(() => 0),
      api.get('/weekly-topics').then(r => r.data.topics?.length || 0).catch(() => 0),
    ]).then(([users, games, competitions, reviews, prizes, classes, weeklyTopics]) => {
      setStats({ users, games, competitions, reviews, prizes, classes, weeklyTopics });
      setLoading(false);
    });
  }, []);

  const cards = [
    { icon: '👥', label: 'Users', value: stats.users, link: '/admin/users', color: '#3B82F6' },
    { icon: '🎮', label: 'Games', value: stats.games, link: '/admin/games', color: '#FF6B6B' },
    { icon: '📚', label: 'Weekly Topics', value: stats.weeklyTopics, link: '/admin/weekly', color: '#8B5CF6' },
    { icon: '🏅', label: 'Competitions', value: stats.competitions, link: '/admin/competitions', color: '#FBBF24' },
    { icon: '🎁', label: 'Prizes', value: stats.prizes, link: '/admin/prizes', color: '#A855F7' },
    { icon: '⭐', label: 'Reviews', value: stats.reviews, link: '/admin/reviews', color: '#22C55E' },
    { icon: '🎓', label: 'Classes', value: stats.classes, link: '/admin/classes', color: '#4ECDC4' },
  ];

  const quickActions = [
    { icon: '📚', label: 'Weekly Topic', link: '/admin/weekly/new', color: '#8B5CF6' },
    { icon: '🎮', label: 'Create Game', link: '/admin/games/new', color: '#FF6B6B' },
    { icon: '🏅', label: 'Competition', link: '/admin/competitions', color: '#FBBF24' },
    { icon: '🎓', label: 'Schedule Class', link: '/admin/classes', color: '#4ECDC4' },
    { icon: '⭐', label: 'Reviews', link: '/admin/reviews', color: '#22C55E' },
  ];

  return (
    <div className="page container">
      <div style={{ marginBottom: 32 }}>
        <h1 className="heading-xl">⚙️ Admin Panel</h1>
        <p className="text-muted" style={{ marginTop: 4 }}>Manage your Islamic learning platform</p>
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <>
          {/* Stats Grid */}
          <div className="admin-stats-grid" style={{ marginBottom: 40 }}>
            {cards.map((c, i) => (
              <Link to={c.link} key={i} className="admin-stat-card animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, '--card-color': c.color }}>
                <div className="admin-stat-icon">{c.icon}</div>
                <div className="admin-stat-value" style={{ color: c.color }}>{c.value}</div>
                <div className="admin-stat-label">{c.label}</div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <h2 className="heading-md" style={{ marginBottom: 16 }}>⚡ Quick Actions</h2>
          <div className="admin-actions-grid">
            {quickActions.map((a, i) => (
              <Link to={a.link} key={i} className="admin-action-btn animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, '--btn-color': a.color }}>
                <span className="admin-action-icon">{a.icon}</span>
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <style>{`
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
        }
        .admin-stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: var(--transition);
          text-decoration: none;
          color: inherit;
          border-top: 3px solid var(--card-color);
        }
        .admin-stat-card:hover {
          transform: translateY(-6px);
          border-color: var(--card-color);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        .admin-stat-icon { font-size: 2.2rem; line-height: 1; }
        .admin-stat-value {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1;
        }
        .admin-stat-label {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .admin-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .admin-action-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: var(--radius-md);
          color: var(--btn-color);
          font-weight: 600;
          font-size: 0.95rem;
          transition: var(--transition);
          text-decoration: none;
        }
        .admin-action-btn:hover {
          background: rgba(139,92,246,0.12);
          transform: translateY(-2px);
        }
        .admin-action-icon { font-size: 1.3rem; }
        @media (max-width: 768px) {
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .admin-actions-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
