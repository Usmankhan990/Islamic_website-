const db = require('../config/db');

const reviewController = {
  // GET /api/reviews - public (approved only) or admin (all)
  async getAll(req, res) {
    try {
      const isAdmin = req.user && req.user.role === 'admin';
      let query = `SELECT r.*, u.name as user_name, u.avatar FROM reviews r JOIN users u ON r.user_id = u.id`;
      if (!isAdmin) query += ' WHERE r.is_approved = TRUE';
      query += ' ORDER BY r.created_at DESC';

      const [reviews] = await db.query(query);
      res.json({ reviews });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/reviews
  async create(req, res) {
    try {
      const { content, rating } = req.body;
      if (!content) return res.status(400).json({ message: 'Review content is required.' });

      await db.query(
        'INSERT INTO reviews (user_id, content, rating) VALUES (?,?,?)',
        [req.user.id, content, rating || 5]
      );

      res.status(201).json({ message: 'Review submitted! It will appear after admin approval.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/reviews/:id/approve
  async approve(req, res) {
    try {
      const { is_approved, admin_response } = req.body;
      await db.query(
        'UPDATE reviews SET is_approved=?, admin_response=COALESCE(?,admin_response) WHERE id=?',
        [is_approved !== false, admin_response, req.params.id]
      );
      res.json({ message: is_approved !== false ? 'Review approved.' : 'Review rejected.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // DELETE /api/reviews/:id
  async delete(req, res) {
    try {
      await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
      res.json({ message: 'Review deleted.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = reviewController;
