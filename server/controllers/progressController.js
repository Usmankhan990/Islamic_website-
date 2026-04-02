const db = require('../config/db');

const progressController = {
  // GET /api/progress/:userId
  async getByUser(req, res) {
    try {
      const [progress] = await db.query('SELECT * FROM progress WHERE user_id = ? ORDER BY surah_number', [req.params.userId]);
      const [achievements] = await db.query('SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC', [req.params.userId]);
      const [certificates] = await db.query('SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC', [req.params.userId]);
      
      res.json({ progress, achievements, certificates });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/progress
  async updateProgress(req, res) {
    try {
      const { surah_number, surah_name, verses_memorized, total_verses } = req.body;
      const userId = req.user.id;
      const completion_pct = total_verses > 0 ? ((verses_memorized / total_verses) * 100).toFixed(2) : 0;

      await db.query(
        `INSERT INTO progress (user_id, surah_number, surah_name, verses_memorized, total_verses, completion_pct) 
         VALUES (?,?,?,?,?,?) 
         ON DUPLICATE KEY UPDATE verses_memorized=?, completion_pct=?`,
        [userId, surah_number, surah_name, verses_memorized, total_verses, completion_pct, verses_memorized, completion_pct]
      );

      // Check for completion achievement
      if (parseFloat(completion_pct) >= 100) {
        await db.query(
          'INSERT INTO achievements (user_id, badge_name, badge_icon, description) VALUES (?,?,?,?)',
          [userId, `Memorized ${surah_name}!`, '📖', `Completed memorization of Surah ${surah_name}`]
        );
      }

      res.json({ message: 'Progress updated.', completion_pct });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/progress/achievements
  async addAchievement(req, res) {
    try {
      const { user_id, badge_name, badge_icon, description } = req.body;
      await db.query(
        'INSERT INTO achievements (user_id, badge_name, badge_icon, description) VALUES (?,?,?,?)',
        [user_id, badge_name, badge_icon || '🏆', description]
      );
      res.status(201).json({ message: 'Achievement added!' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/progress/certificates
  async addCertificate(req, res) {
    try {
      const { user_id, title, description, pdf_url } = req.body;
      await db.query(
        'INSERT INTO certificates (user_id, title, description, pdf_url) VALUES (?,?,?,?)',
        [user_id, title, description, pdf_url]
      );
      res.status(201).json({ message: 'Certificate issued!' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/progress/leaderboard
  async globalLeaderboard(req, res) {
    try {
      const [leaderboard] = await db.query(
        `SELECT u.id, u.name, u.avatar, 
         COALESCE(SUM(gr.score), 0) as total_score,
         COUNT(DISTINCT gr.game_id) as games_played,
         (SELECT COUNT(*) FROM achievements WHERE user_id = u.id) as badge_count
         FROM users u LEFT JOIN game_results gr ON u.id = gr.user_id
         WHERE u.role IN ('child', 'parent')
         GROUP BY u.id, u.name, u.avatar
         HAVING total_score > 0
         ORDER BY total_score DESC LIMIT 50`
      );
      res.json({ leaderboard });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = progressController;
