const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const auth = require('../middleware/auth');
const { adminOrTeacher } = require('../middleware/admin');

router.get('/', lessonController.getAll);
router.get('/:id', lessonController.getById);
router.post('/', auth, adminOrTeacher, lessonController.create);
router.put('/:id', auth, adminOrTeacher, lessonController.update);
router.delete('/:id', auth, adminOrTeacher, lessonController.delete);

module.exports = router;
