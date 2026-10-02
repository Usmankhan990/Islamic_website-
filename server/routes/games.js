const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const auth = require('../middleware/auth');
const { adminOrTeacher } = require('../middleware/admin');

router.get('/', gameController.getAll);
// Must come before /:id to avoid conflict
// A game is completed once every one of its levels has been won
router.get('/completed/:userId', auth, async (req, res) => {
  try {
    const db = require('../config/db');
    const [results] = await db.query(
      `SELECT g.id AS game_id FROM games g
       WHERE EXISTS (SELECT 1 FROM game_questions q WHERE q.game_id = g.id)
         AND NOT EXISTS (
           SELECT 1 FROM game_questions q
           WHERE q.game_id = g.id
             AND NOT EXISTS (SELECT 1 FROM game_results r
                             WHERE r.game_id = g.id AND r.user_id = ? AND r.level = q.level AND r.passed = TRUE))`,
      [req.params.userId]
    );
    res.json({ completedGameIds: results.map(r => r.game_id) });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});
router.get('/progress/me', auth, gameController.myProgress);
router.get('/:id', gameController.getById);
router.get('/:id/next-level', auth, gameController.nextLevel);
router.get('/:id/leaderboard', gameController.leaderboard);
router.post('/', auth, adminOrTeacher, gameController.create);
router.put('/:id', auth, adminOrTeacher, gameController.update);
router.delete('/:id', auth, adminOrTeacher, gameController.delete);
router.post('/:id/play', auth, gameController.play);

module.exports = router;
