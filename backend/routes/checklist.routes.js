const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklist.controller');

router.post('/save', checklistController.saveChecklist);
router.get('/', checklistController.getJigChecklists);

module.exports = router;
