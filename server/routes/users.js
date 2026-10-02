const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const db = require('../config/db');

router.get('/', auth, admin, userController.getAll);

// Logged-in user asks the admin for premium access
router.post('/me/premium-request', auth, async (req, res) => {
  try {
    await db.query('UPDATE users SET premium_requested_at = NOW() WHERE id = ?', [req.user.id]);
    res.json({ message: 'Request sent! The admin will review it soon.' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.get('/:id', auth, userController.getById);
router.put('/:id', auth, userController.update);
router.get('/:id/dashboard', auth, userController.getDashboard);

// Check subscription status
router.get('/:id/subscription', auth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT subscription_type, subscription_expires, premium_requested_at, role FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found.' });
    const u = users[0];
    const isPremium = u.role === 'admin' || (u.subscription_type === 'premium' && (!u.subscription_expires || new Date(u.subscription_expires) > new Date()));
    res.json({ isPremium, subscription_type: u.subscription_type, expires: u.subscription_expires, requestedAt: u.premium_requested_at, role: u.role });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

// Admin: set user subscription
router.put('/:id/subscription', auth, admin, async (req, res) => {
  try {
    const { subscription_type, days } = req.body;
    const type = subscription_type === 'free' ? 'free' : 'premium';
    const expires = type === 'premium' && days ? new Date(Date.now() + days * 86400000) : null;
    // Granting or removing premium also closes any pending request
    await db.query('UPDATE users SET subscription_type = ?, subscription_expires = ?, premium_requested_at = NULL WHERE id = ?',
      [type, expires, req.params.id]);
    res.json({ message: 'Subscription updated!' });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
