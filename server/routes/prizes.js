const express = require('express');
const router = express.Router();
const prizeController = require('../controllers/prizeController');
const auth = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.get('/', auth, admin, prizeController.getAll);
router.post('/', auth, admin, prizeController.create);
router.put('/:id', auth, admin, prizeController.update);
router.delete('/:id', auth, admin, prizeController.delete);

module.exports = router;
