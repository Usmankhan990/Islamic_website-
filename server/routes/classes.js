const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const auth = require('../middleware/auth');
const { admin, adminOrTeacher } = require('../middleware/admin');
const db = require('../config/db');

router.get('/', classController.getAll);
router.get('/:id', classController.getById);
router.post('/', auth, adminOrTeacher, classController.create);
router.put('/:id', auth, adminOrTeacher, classController.update);
router.delete('/:id', auth, adminOrTeacher, classController.delete);

// Class Request System
router.post('/request', auth, async (req, res) => {
  try {
    const { topic, preferred_time, message } = req.body;
    await db.query('INSERT INTO class_requests (user_id, topic, preferred_time, message) VALUES (?,?,?,?)',
      [req.user.id, topic, preferred_time, message]);
    res.status(201).json({ message: 'Class request submitted successfully!' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.get('/requests/my', auth, async (req, res) => {
  try {
    const [requests] = await db.query('SELECT * FROM class_requests WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ requests });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.get('/requests/all', auth, admin, async (req, res) => {
  try {
    const [requests] = await db.query(
      'SELECT cr.*, u.name, u.email FROM class_requests cr JOIN users u ON cr.user_id = u.id ORDER BY cr.created_at DESC'
    );
    res.json({ requests });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.put('/requests/:id/respond', auth, admin, async (req, res) => {
  try {
    const { status, admin_response, meeting_link, schedule_time } = req.body;
    await db.query('UPDATE class_requests SET status=?, admin_response=?, meeting_link=?, schedule_time=? WHERE id=?',
      [status, admin_response, meeting_link, schedule_time, req.params.id]);
    res.json({ message: `Request ${status}!` });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
