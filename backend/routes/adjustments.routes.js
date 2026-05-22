const express = require('express');
const router = express.Router();

const {
  createAdjustment,
  getAdjustments,
  updateStatus,
  deleteAdjustment
} = require('../controllers/adjustments.controller');

router.post('/', createAdjustment);        // Production request
router.get('/', getAdjustments);            // Dashboards
router.patch('/:id/status', updateStatus);  // Process actions
router.delete('/:id', deleteAdjustment);    // Admin cleanup

module.exports = router;