const db = require('../config/db');

// Middleware: require premium subscription (admin bypasses)
const premiumOnly = async (req, res, next) => {
  try {
    // Admin always has access
    if (req.user && req.user.role === 'admin') return next();

    if (!req.user) {
      return res.status(401).json({ message: 'Login required.', requiresPremium: true });
    }

    const [users] = await db.query('SELECT subscription_type, subscription_expires FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found.', requiresPremium: true });
    }

    const user = users[0];

    // Check if premium and not expired
    if (user.subscription_type === 'premium') {
      if (!user.subscription_expires || new Date(user.subscription_expires) > new Date()) {
        return next();
      }
    }

    return res.status(403).json({ 
      message: 'This is a premium feature. Please subscribe to access.',
      requiresPremium: true 
    });
  } catch (error) {
    console.error('Premium check error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { premiumOnly };
