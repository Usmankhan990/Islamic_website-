const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.get('/leaderboard', progressController.globalLeaderboard);
router.get('/:userId', auth, progressController.getByUser);
router.post('/', auth, progressController.updateProgress);
router.post('/achievements', auth, admin, progressController.addAchievement);
router.post('/certificates', auth, admin, progressController.addCertificate);

module.exports = router;
