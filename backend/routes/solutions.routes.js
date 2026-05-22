const express = require('express');
const router = express.Router();
const solutionsController = require('../controllers/solutions.controller');

router.get('/jig', solutionsController.getJigSolutions);
router.post('/jig', solutionsController.createJigSolution);
router.put('/jig/:id', solutionsController.updateJigSolution);
router.delete('/jig/:id', solutionsController.deleteJigSolution);

router.get('/program', solutionsController.getProgramSolutions);
router.post('/program', solutionsController.createProgramSolution);
router.put('/program/:id', solutionsController.updateProgramSolution);
router.delete('/program/:id', solutionsController.deleteProgramSolution);

module.exports = router;
