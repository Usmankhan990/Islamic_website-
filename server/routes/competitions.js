const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const competitionController = require('../controllers/competitionController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Multer config for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `recitation_${req.user.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.webm', '.ogg', '.m4a', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/webm')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed.'));
    }
  }
});

router.get('/', competitionController.getAll);
// User's joined competitions for current week
router.get('/my-joined', auth, async (req, res) => {
  try {
    const db = require('../config/db');
    const [comps] = await db.query(
      `SELECT c.*, ce.score, ce.rank_position,
       (SELECT COUNT(*) FROM competition_entries WHERE competition_id = c.id) as participant_count
       FROM competitions c 
       INNER JOIN competition_entries ce ON c.id = ce.competition_id
       WHERE ce.user_id = ? AND c.end_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY c.start_time DESC`,
      [req.user.id]
    );
    res.json({ competitions: comps });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});
// Weekly leaderboard
router.get('/leaderboard/weekly', async (req, res) => {
  try {
    const db = require('../config/db');
    const [results] = await db.query(
      `SELECT u.id, u.name, u.avatar, 
       SUM(ce.score) as total_score, 
       COUNT(ce.id) as competitions_joined,
       MIN(ce.rank_position) as best_rank
       FROM competition_entries ce
       JOIN users u ON ce.user_id = u.id 
       JOIN competitions c ON ce.competition_id = c.id
       WHERE c.end_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY u.id, u.name, u.avatar
       ORDER BY total_score DESC, best_rank ASC
       LIMIT 50`
    );
    res.json({ leaderboard: results.map((r, i) => ({ ...r, rank: i + 1 })) });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});
router.get('/:id', competitionController.getById);
router.get('/:id/results', competitionController.results);
router.post('/', auth, admin, competitionController.create);
router.put('/:id', auth, admin, competitionController.update);
router.delete('/:id', auth, admin, competitionController.delete);
router.post('/:id/join', auth, competitionController.join);
router.put('/:id/judge', auth, admin, competitionController.judge);
router.post('/:id/submit-recording', auth, upload.single('audio'), competitionController.submitRecording);
router.post('/entries/:entryId/vote', auth, competitionController.vote);

module.exports = router;
