import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { gameIcon } from '../../components/games/gameTypes';
import { useLanguage } from '../../i18n/LanguageContext';

export default function KidsGames() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [games, setGames] = useState([]);
  const [progress, setProgress] = useState({}); // game_id -> { levels_won, total_levels, completed }
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadGames = async () => {
      try {
        const gamesRes = await api.get('/games?active_only=true');
        setGames(gamesRes.data.games);
        // Level progress per game (games with every level won are hidden)
        if (user) {
          try {
            const res = await api.get('/games/progress/me');
            setProgress(Object.fromEntries(res.data.progress.map(p => [p.game_id, p])));
          } catch { /* not critical */ }
        }
      } catch {}
      setLoading(false);
    };
    loadGames();
  }, [user]);

  // Hide games whose every level is already won; games with no questions can't be played
  const availableGames = games.filter(g => g.total_levels > 0 && !progress[g.id]?.completed);
  const filtered = filter === 'all' ? availableGames : availableGames.filter(g => g.type === filter);
  const diffColors = { easy: '#22C55E', medium: '#F59E0B', hard: '#EF4444' };

  return (
    <div className="page container">
      <div className="text-center animate-slide-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-kids)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800 }}>
          🎮 {t('Fun Islamic Games!')}
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-kids)' }}>
          {t('Play and learn about Islam — win levels and earn coins!')} 🪙
        </p>
        {user && <div className="kids-coin-pill">🪙 {t('{n} coins', { n: user.coins ?? 0 })}</div>}
      </div>

      {/* Filters */}
      <div className="tabs" style={{ marginBottom: 24, justifyContent: 'center' }}>
        {[['all', '🎮', 'All'], ['quiz', '❓', 'Quiz'], ['true_false', '✅', 'True / False'], ['memory', '🃏', 'Memory Match'], ['word_jumble', '🔤', 'Word Jumble']].map(([key, icon, label]) => (
          <button key={key} className={`tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {icon} {t(label)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader"><div className="spinner"></div></div>
      ) : (
        <div className="grid-3 gap-lg">
          {filtered.map((g, i) => (
            <Link to={`/kids/play/${g.id}`} key={g.id} className="game-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="game-card-icon">{gameIcon(g.type)}</div>
              <h3 className="game-card-title">{g.title}</h3>
              <p className="game-card-desc">{g.description}</p>
              <div className="game-card-meta">
                <span>🏁 {t('Level {n} of {total}', { n: Math.min((progress[g.id]?.levels_won || 0) + 1, g.total_levels), total: g.total_levels })}</span>
                <span className="game-card-coins">🪙 {t('{n} / level', { n: g.coin_reward })}</span>
              </div>
              <div className="game-card-footer">
                <span className="badge" style={{ background: `${diffColors[g.difficulty]}22`, color: diffColors[g.difficulty] }}>
                  {t(g.difficulty)}
                </span>
                <span className="text-xs text-muted">🎯 {t('{n} plays', { n: g.play_count })}</span>
              </div>
              <div className="game-card-play">▶ {t('PLAY')}</div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="text-center" style={{ gridColumn: '1 / -1', padding: 60 }}>
              <span style={{ fontSize: '4rem' }}>🎮</span>
              <p className="text-muted" style={{ marginTop: 12, fontFamily: 'var(--font-kids)' }}>{t('No games yet! Check back soon!')}</p>
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
        .kids-coin-pill { display: inline-block; margin-top: 12px; padding: 8px 18px; border-radius: 999px; background: rgba(251,191,36,0.15); border: 2px solid rgba(251,191,36,0.5); color: #FBBF24; font-family: var(--font-kids); font-weight: 800; font-size: 1.1rem; }
        .game-card-meta { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; margin-bottom: 12px; color: var(--text-muted); }
        .game-card-coins { color: #FBBF24; }
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
