const express = require('express');
const router = express.Router();
const weeklyController = require('../controllers/weeklyController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// Public
router.get('/weekly-topics', weeklyController.getTopics);
router.get('/weekly-topics/:id', weeklyController.getTopic);
router.get('/weekly-quizzes', weeklyController.getQuizzes);
router.get('/weekly-quizzes/:id', weeklyController.getQuiz);
router.get('/weekly-quizzes/:id/results', weeklyController.getResults);

// Authenticated
router.post('/weekly-quizzes/:id/submit', auth, weeklyController.submitQuiz);

// Admin only
router.post('/weekly-topics', auth, admin, weeklyController.createTopic);
router.put('/weekly-topics/:id', auth, admin, weeklyController.updateTopic);
router.delete('/weekly-topics/:id', auth, admin, weeklyController.deleteTopic);
router.post('/weekly-topics/:id/generate-quiz', auth, admin, weeklyController.generateQuiz);

module.exports = router;
