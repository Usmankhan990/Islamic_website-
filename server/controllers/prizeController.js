const db = require('../config/db');

const prizeController = {
  // GET /api/prizes
  async getAll(req, res) {
    try {
      const { status, user_id } = req.query;
      let query = `SELECT p.*, u.name as user_name, u.email as user_email, c.title as competition_title
        FROM prizes p JOIN users u ON p.user_id = u.id 
        LEFT JOIN competitions c ON p.competition_id = c.id WHERE 1=1`;
      const params = [];

      if (status) { query += ' AND p.shipping_status = ?'; params.push(status); }
      if (user_id) { query += ' AND p.user_id = ?'; params.push(user_id); }
      query += ' ORDER BY p.created_at DESC';

      const [prizes] = await db.query(query, params);
      res.json({ prizes });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/prizes
  async create(req, res) {
    try {
      const { competition_id, user_id, prize_name, prize_description, shipping_address, notes } = req.body;

      const [result] = await db.query(
        'INSERT INTO prizes (competition_id, user_id, prize_name, prize_description, shipping_address, notes) VALUES (?,?,?,?,?,?)',
        [competition_id, user_id, prize_name, prize_description, shipping_address, notes]
      );

      // Add achievement
      await db.query(
        'INSERT INTO achievements (user_id, badge_name, badge_icon, description) VALUES (?,?,?,?)',
        [user_id, 'Prize Winner! 🎁', '🎁', `Won: ${prize_name}`]
      );

      res.status(201).json({ message: 'Prize created!', prizeId: result.insertId });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/prizes/:id
  async update(req, res) {
    try {
      const { shipping_status, tracking_number, shipping_address, notes } = req.body;

      await db.query(
        'UPDATE prizes SET shipping_status=COALESCE(?,shipping_status), tracking_number=COALESCE(?,tracking_number), shipping_address=COALESCE(?,shipping_address), notes=COALESCE(?,notes) WHERE id=?',
        [shipping_status, tracking_number, shipping_address, notes, req.params.id]
      );

      res.json({ message: 'Prize updated.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // DELETE /api/prizes/:id
  async delete(req, res) {
    try {
      await db.query('DELETE FROM prizes WHERE id = ?', [req.params.id]);
      res.json({ message: 'Prize deleted.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = prizeController;
