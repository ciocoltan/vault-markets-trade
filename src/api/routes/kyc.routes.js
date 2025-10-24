const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');
const checkAuth = require('../middleware/auth.middleware');

// The middleware will run first, and if successful, it will pass the request
// (with the attached user data) to the kycController.
router.post('/token', checkAuth, kycController.generateSumsubToken);

// Webhooks typically do not require user authentication, so this remains unchanged.
router.post('/webhook', kycController.handleWebhook);
router.post('/status', checkAuth, kycController.getKycStatus);

module.exports = router;

