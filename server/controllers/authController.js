const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const authController = {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { name, email, password, role, parent_id, phone, city, country, address } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required.' });
      }

      // Check if user exists
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already registered.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Insert user
      const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role, parent_id, phone, city, country, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, password_hash, role || 'parent', parent_id || null, phone || null, city || null, country || null, address || null]
      );

      // Generate token
      const token = jwt.sign(
        { id: result.insertId, email, role: role || 'parent', name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        message: 'Registration successful!',
        token,
        user: { id: result.insertId, name, email, role: role || 'parent' }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      // Find user
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const user = users[0];

      // Check password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        message: 'Login successful!',
        token,
        user: {
          id: user.id, name: user.name, email: user.email,
          role: user.role, avatar: user.avatar, coins: user.coins
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login.' });
    }
  },

  // GET /api/auth/me
  async getMe(req, res) {
    try {
      const [users] = await db.query(
        'SELECT id, name, email, role, avatar, parent_id, phone, city, country, address, coins, created_at FROM users WHERE id = ?',
        [req.user.id]
      );
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.json({ user: users[0] });
    } catch (error) {
      console.error('GetMe error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
};

module.exports = authController;
