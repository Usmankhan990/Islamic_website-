import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function KidsGames() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadGames = async () => {
      try {
        const gamesRes = await api.get('/games?active_only=true');
        setGames(gamesRes.data.games);
        // Get user's completed games
        if (user) {
          try {
            const res = await api.get(`/games/completed/${user.id}`);
            setCompletedIds(res.data.completedGameIds || []);
          } catch {}
        }
      } catch {}
      setLoading(false);
    };
    loadGames();
  }, [user]);

  // Filter out completed games
  const availableGames = games.filter(g => !completedIds.includes(g.id));
  const filtered = filter === 'all' ? availableGames : availableGames.filter(g => g.type === filter);
  const typeIcons = { quiz: '❓', matching: '🧩', drag_drop: '🎯', fill_blank: '✏️' };
  const diffColors = { easy: '#22C55E', medium: '#F59E0B', hard: '#EF4444' };

  return (
    <div className="page container">
      <div className="text-center animate-slide-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-kids)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800 }}>
          🎮 Fun Islamic Games!
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-kids)' }}>
          Play and learn about Islam — earn points and badges! 🌟
        </p>
      </div>

      {/* Filters */}
      <div className="tabs" style={{ marginBottom: 24, justifyContent: 'center' }}>
        {[['all', '🎮 All'], ['quiz', '❓ Quiz'], ['matching', '🧩 Matching'], ['fill_blank', '✏️ Fill Blank']].map(([key, label]) => (
          <button key={key} className={`tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader"><div className="spinner"></div></div>
      ) : (
        <div className="grid-3 gap-lg">
          {filtered.map((g, i) => (
            <Link to={`/kids/play/${g.id}`} key={g.id} className="game-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="game-card-icon">{typeIcons[g.type] || '🎮'}</div>
              <h3 className="game-card-title">{g.title}</h3>
              <p className="game-card-desc">{g.description}</p>
              <div className="game-card-footer">
                <span className="badge" style={{ background: `${diffColors[g.difficulty]}22`, color: diffColors[g.difficulty] }}>
                  {g.difficulty}
                </span>
                <span className="text-xs text-muted">🎯 {g.play_count} plays</span>
              </div>
              <div className="game-card-play">▶ PLAY</div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="text-center" style={{ gridColumn: '1 / -1', padding: 60 }}>
              <span style={{ fontSize: '4rem' }}>🎮</span>
              <p className="text-muted" style={{ marginTop: 12, fontFamily: 'var(--font-kids)' }}>No games yet! Check back soon!</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .game-card {
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 28px;
          text-align: center;
          transition: var(--transition);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          display: block;
        }
        .game-card:hover {
          border-color: var(--kids-primary);
          transform: translateY(-6px);
          box-shadow: 0 12px 40px rgba(255,107,107,0.2);
        }
        .game-card-icon { font-size: 3rem; margin-bottom: 12px; }
        .game-card-title { font-family: var(--font-kids); font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
        .game-card-desc { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px; }
        .game-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .game-card-play {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 10px;
          background: linear-gradient(135deg, var(--kids-primary), var(--kids-accent));
          color: white;
          font-family: var(--font-kids);
          font-weight: 800;
          font-size: 1.1rem;
          transform: translateY(100%);
          transition: var(--transition);
        }
        .game-card:hover .game-card-play { transform: translateY(0); }
      `}</style>
    </div>
  );
}
