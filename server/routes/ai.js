const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Public
router.post('/ask', aiController.ask);
router.get('/topics', aiController.topics);

// Admin only
router.post('/knowledge', auth, admin, aiController.addKnowledge);
router.get('/knowledge', auth, admin, aiController.getKnowledge);

module.exports = router;
