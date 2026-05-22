const express = require('express');
const router = express.Router();
const machinesController = require('../controllers/machines.controller');

router.get('/', machinesController.getMachines);
router.post('/', machinesController.createMachine);
router.put('/:id', machinesController.updateMachine);
router.delete('/:id', machinesController.deleteMachine);

module.exports = router;