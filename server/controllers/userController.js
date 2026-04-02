const db = require('../config/db');

const userController = {
  // GET /api/users - List all users (admin)
  async getAll(req, res) {
    try {
      const { role, search } = req.query;
      let query = 'SELECT id, name, email, role, avatar, city, country, is_active, created_at FROM users WHERE 1=1';
      const params = [];

      if (role) { query += ' AND role = ?'; params.push(role); }
      if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
      query += ' ORDER BY created_at DESC';

      const [users] = await db.query(query, params);
      res.json({ users });
    } catch (error) {
      console.error('GetAll users error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/users/:id
  async getById(req, res) {
    try {
      const [users] = await db.query(
        'SELECT id, name, email, role, avatar, parent_id, phone, city, country, address, created_at FROM users WHERE id = ?',
        [req.params.id]
      );
      if (users.length === 0) return res.status(404).json({ message: 'User not found.' });

      const user = users[0];

      // Get children if parent
      if (user.role === 'parent') {
        const [children] = await db.query(
          'SELECT id, name, email, avatar, created_at FROM users WHERE parent_id = ?',
          [user.id]
        );
        user.children = children;
      }

      res.json({ user });
    } catch (error) {
      console.error('GetById error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/users/:id
  async update(req, res) {
    try {
      const { name, avatar, phone, city, country, address, role, is_active } = req.body;
      const userId = req.params.id;

      // Only admin can change role/active status
      if ((role || is_active !== undefined) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can change role or status.' });
      }

      await db.query(
        'UPDATE users SET name=COALESCE(?,name), avatar=COALESCE(?,avatar), phone=COALESCE(?,phone), city=COALESCE(?,city), country=COALESCE(?,country), address=COALESCE(?,address), role=COALESCE(?,role), is_active=COALESCE(?,is_active) WHERE id=?',
        [name, avatar, phone, city, country, address, role, is_active, userId]
      );

      res.json({ message: 'User updated successfully.' });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/users/:id/dashboard - Child dashboard data
  async getDashboard(req, res) {
    try {
      const userId = req.params.id;

      // Progress
      const [progress] = await db.query('SELECT * FROM progress WHERE user_id = ?', [userId]);

      // Achievements
      const [achievements] = await db.query('SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC', [userId]);

      // Certificates
      const [certificates] = await db.query('SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC', [userId]);

      // Game results (recent)
      const [gameResults] = await db.query(
        `SELECT gr.*, g.title as game_title, g.type as game_type 
         FROM game_results gr JOIN games g ON gr.game_id = g.id 
         WHERE gr.user_id = ? ORDER BY gr.played_at DESC LIMIT 10`,
        [userId]
      );

      // Competition results
      const [competitionResults] = await db.query(
        `SELECT ce.*, c.title as competition_title, c.type as competition_type 
         FROM competition_entries ce JOIN competitions c ON ce.competition_id = c.id 
         WHERE ce.user_id = ? ORDER BY ce.submitted_at DESC LIMIT 10`,
        [userId]
      );

      // Prizes
      const [prizes] = await db.query(
        `SELECT p.*, c.title as competition_title 
         FROM prizes p LEFT JOIN competitions c ON p.competition_id = c.id 
         WHERE p.user_id = ? ORDER BY p.created_at DESC`,
        [userId]
      );

      // Stats
      const [gameStats] = await db.query(
        'SELECT COUNT(*) as games_played, COALESCE(SUM(score),0) as total_score, COALESCE(AVG(score),0) as avg_score FROM game_results WHERE user_id = ?',
        [userId]
      );

      res.json({
        progress,
        achievements,
        certificates,
        gameResults,
        competitionResults,
        prizes,
        stats: gameStats[0]
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = userController;
