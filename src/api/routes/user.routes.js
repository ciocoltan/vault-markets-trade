const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const checkAuth = require('../middleware/auth.middleware');

router.use(checkAuth);
router.post('/questionnaire', userController.submitQuestionnaireAnswers);
router.post('/progress', userController.getUserProgress);

module.exports = router;