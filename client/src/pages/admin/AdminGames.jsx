import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function AdminGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/games').then(r => { setGames(r.data.games); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const deleteGame = async (id) => {
    if (!confirm('Delete this game?')) return;
    await api.delete(`/games/${id}`);
    setGames(games.filter(g => g.id !== id));
  };

  const typeIcons = { quiz: '❓', matching: '🧩', drag_drop: '🎯', fill_blank: '✏️' };

  return (
    <div className="page container">
      <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
        <h1 className="heading-xl">🎮 Games</h1>
        <Link to="/admin/games/new" className="btn btn-primary">➕ Create Game</Link>
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div className="grid-3 gap-lg">
          {games.map(g => (
            <div key={g.id} className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                <span style={{ fontSize: '2rem' }}>{typeIcons[g.type] || '🎮'}</span>
                <span className={`badge ${g.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {g.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="heading-sm">{g.title}</h3>
              <p className="text-sm text-muted" style={{ margin: '8px 0 16px' }}>{g.description}</p>
              <div className="text-xs text-muted" style={{ marginBottom: 12 }}>
                Type: {g.type} • Difficulty: {g.difficulty} • {g.play_count} plays
              </div>
              <div className="flex gap-sm">
                <Link to={`/admin/games/edit/${g.id}`} className="btn btn-sm btn-outline" style={{ flex: 1 }}>✏️ Edit</Link>
                <button className="btn btn-sm btn-danger" onClick={() => deleteGame(g.id)} style={{ flex: 1 }}>🗑️ Delete</button>
              </div>
            </div>
          ))}
          {games.length === 0 && (
            <div className="text-center" style={{ gridColumn: '1 / -1', padding: 60 }}>
              <p className="text-muted">No games yet.</p>
              <Link to="/admin/games/new" className="btn btn-primary" style={{ marginTop: 16 }}>Create your first game!</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
