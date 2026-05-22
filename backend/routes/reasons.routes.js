const express = require('express');
const router = express.Router();
const reasonsController = require('../controllers/reasons.controller');

router.get('/', reasonsController.getReasons);
router.post('/', reasonsController.createReason);
router.put('/:id', reasonsController.updateReason);
router.delete('/:id', reasonsController.deleteReason);

module.exports = router;
