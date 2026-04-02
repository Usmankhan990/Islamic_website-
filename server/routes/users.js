const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const db = require('../config/db');

router.get('/', auth, admin, userController.getAll);
router.get('/:id', auth, userController.getById);
router.put('/:id', auth, userController.update);
router.get('/:id/dashboard', auth, userController.getDashboard);

// Check subscription status
router.get('/:id/subscription', auth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT subscription_type, subscription_expires, role FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found.' });
    const u = users[0];
    const isPremium = u.role === 'admin' || (u.subscription_type === 'premium' && (!u.subscription_expires || new Date(u.subscription_expires) > new Date()));
    res.json({ isPremium, subscription_type: u.subscription_type, expires: u.subscription_expires, role: u.role });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// Admin: set user subscription
router.put('/:id/subscription', auth, admin, async (req, res) => {
  try {
    const { subscription_type, days } = req.body;
    const expires = days ? new Date(Date.now() + days * 86400000) : null;
    await db.query('UPDATE users SET subscription_type = ?, subscription_expires = ? WHERE id = ?', 
      [subscription_type || 'premium', expires, req.params.id]);
    res.json({ message: 'Subscription updated!' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
