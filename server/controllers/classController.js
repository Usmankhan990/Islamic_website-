const db = require('../config/db');

const classController = {
  // GET /api/classes
  async getAll(req, res) {
    try {
      const { upcoming_only } = req.query;
      let query = 'SELECT lc.*, u.name as creator_name FROM live_classes lc LEFT JOIN users u ON lc.created_by = u.id WHERE lc.is_active = TRUE';
      if (upcoming_only === 'true') query += ' AND lc.scheduled_at > NOW()';
      query += ' ORDER BY lc.scheduled_at ASC';

      const [classes] = await db.query(query);
      res.json({ classes });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // GET /api/classes/:id
  async getById(req, res) {
    try {
      const [classes] = await db.query('SELECT * FROM live_classes WHERE id = ?', [req.params.id]);
      if (classes.length === 0) return res.status(404).json({ message: 'Class not found.' });
      res.json({ class: classes[0] });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // POST /api/classes
  async create(req, res) {
    try {
      const { title, teacher_name, description, platform, meeting_link, meeting_id, scheduled_at, duration_minutes, is_recurring, recurrence_day, max_students } = req.body;

      const [result] = await db.query(
        'INSERT INTO live_classes (title, teacher_name, description, platform, meeting_link, meeting_id, scheduled_at, duration_minutes, is_recurring, recurrence_day, max_students, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [title, teacher_name, description, platform || 'zoom', meeting_link, meeting_id, scheduled_at, duration_minutes || 60, is_recurring || false, recurrence_day, max_students || 30, req.user.id]
      );

      res.status(201).json({ message: 'Class created!', classId: result.insertId });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // PUT /api/classes/:id
  async update(req, res) {
    try {
      const { title, teacher_name, description, platform, meeting_link, meeting_id, scheduled_at, duration_minutes, is_recurring, recurrence_day, max_students, is_active } = req.body;

      await db.query(
        'UPDATE live_classes SET title=COALESCE(?,title), teacher_name=COALESCE(?,teacher_name), description=COALESCE(?,description), platform=COALESCE(?,platform), meeting_link=COALESCE(?,meeting_link), meeting_id=COALESCE(?,meeting_id), scheduled_at=COALESCE(?,scheduled_at), duration_minutes=COALESCE(?,duration_minutes), is_recurring=COALESCE(?,is_recurring), recurrence_day=COALESCE(?,recurrence_day), max_students=COALESCE(?,max_students), is_active=COALESCE(?,is_active) WHERE id=?',
        [title, teacher_name, description, platform, meeting_link, meeting_id, scheduled_at, duration_minutes, is_recurring, recurrence_day, max_students, is_active, req.params.id]
      );

      res.json({ message: 'Class updated.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  },

  // DELETE /api/classes/:id
  async delete(req, res) {
    try {
      await db.query('DELETE FROM live_classes WHERE id = ?', [req.params.id]);
      res.json({ message: 'Class deleted.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = classController;
