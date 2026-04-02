const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.get('/', reviewController.getAll);
router.post('/', auth, reviewController.create);
router.put('/:id/approve', auth, admin, reviewController.approve);
router.delete('/:id', auth, admin, reviewController.delete);

module.exports = router;
