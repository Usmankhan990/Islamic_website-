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
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost dev + any production deployment
    const allowed = [
      'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173',
      'https://testing.codedhouse.com'
    ];
    if (allowed.includes(origin) || origin.endsWith('.codedhouse.com') || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    // Allow all origins in development
    return callback(null, true);
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Per IP. Kids in one school/home share an IP and games make several requests per level,
  // so keep this generous; override with RATE_LIMIT_MAX in .env
  max: Number(process.env.RATE_LIMIT_MAX) || 1000,
  // Quran translation audio makes one TTS request per verse; don't let it lock users out of login/data
  skip: (req) => req.path.startsWith('/tts'),
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
