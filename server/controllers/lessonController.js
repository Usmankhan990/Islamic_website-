const db = require('../config/db');

const lessonController = {
  // GET /api/lessons
  async getAll(req, res) {
    try {
      const { category } = req.query;
      let query = `SELECT l.*, g.title as game_title, u.name as creator_name 
        FROM lessons l LEFT JOIN games g ON l.game_id = g.id LEFT JOIN users u ON l.created_by = u.id WHERE l.is_published = TRUE`;
      const params = [];

      if (category) { query += ' AND l.category = ?'; params.push(category); }
      query += ' ORDER BY l.order_num ASC, l.created_at DESC';

      const [lessons] = await db.query(query, params);
      res.json({ lessons });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/lessons/:id
  async getById(req, res) {
    try {
      const [lessons] = await db.query('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
      if (lessons.length === 0) return res.status(404).json({ message: 'Lesson not found.' });
      res.json({ lesson: lessons[0] });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/lessons
  async create(req, res) {
    try {
      const { title, description, category, content_html, media_url, game_id, order_num } = req.body;

      const [result] = await db.query(
        'INSERT INTO lessons (title, description, category, content_html, media_url, game_id, order_num, created_by) VALUES (?,?,?,?,?,?,?,?)',
        [title, description, category || 'general', content_html, media_url, game_id, order_num || 0, req.user.id]
      );

      res.status(201).json({ message: 'Lesson created!', lessonId: result.insertId });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/lessons/:id
  async update(req, res) {
    try {
      const { title, description, category, content_html, media_url, game_id, order_num, is_published } = req.body;

      await db.query(
        'UPDATE lessons SET title=COALESCE(?,title), description=COALESCE(?,description), category=COALESCE(?,category), content_html=COALESCE(?,content_html), media_url=COALESCE(?,media_url), game_id=COALESCE(?,game_id), order_num=COALESCE(?,order_num), is_published=COALESCE(?,is_published) WHERE id=?',
        [title, description, category, content_html, media_url, game_id, order_num, is_published, req.params.id]
      );

      res.json({ message: 'Lesson updated.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // DELETE /api/lessons/:id
  async delete(req, res) {
    try {
      await db.query('DELETE FROM lessons WHERE id = ?', [req.params.id]);
      res.json({ message: 'Lesson deleted.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = lessonController;
