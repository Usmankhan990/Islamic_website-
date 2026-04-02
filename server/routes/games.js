const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const auth = require('../middleware/auth');
const { adminOrTeacher } = require('../middleware/admin');

router.get('/', gameController.getAll);
// Must come before /:id to avoid conflict
router.get('/completed/:userId', auth, async (req, res) => {
  try {
    const db = require('../config/db');
    const [results] = await db.query('SELECT DISTINCT game_id FROM game_results WHERE user_id = ?', [req.params.userId]);
    res.json({ completedGameIds: results.map(r => r.game_id) });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});
router.get('/:id', gameController.getById);
router.get('/:id/leaderboard', gameController.leaderboard);
router.post('/', auth, adminOrTeacher, gameController.create);
router.put('/:id', auth, adminOrTeacher, gameController.update);
router.delete('/:id', auth, adminOrTeacher, gameController.delete);
router.post('/:id/play', auth, gameController.play);

module.exports = router;
