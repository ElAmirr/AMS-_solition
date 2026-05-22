const express = require('express');
const router = express.Router();
const jigsController = require('../controllers/jigs.controller');

router.get('/', jigsController.getJigs);
router.post('/', jigsController.createJig);
router.put('/:id', jigsController.updateJig);
router.delete('/:id', jigsController.deleteJig);

module.exports = router;