const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/games', require('./routes/games'));
app.use('/api/competitions', require('./routes/competitions'));
app.use('/api/prizes', require('./routes/prizes'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api', require('./routes/weekly'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/tts', require('./routes/tts'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🕌 Islamic Platform API is running', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🕌 Islamic Platform API Server`);
  console.log(`📡 Running on http://localhost:${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
