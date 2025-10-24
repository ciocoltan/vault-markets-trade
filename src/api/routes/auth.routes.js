const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const checkAuth = require('../middleware/auth.middleware');
const { registerLimiter, loginLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter.middleware.js');
const { verifyRecaptchaMiddleware } = require('../middleware/recaptcha.middleware');

const registerValidationRules = [

  body('email').isEmail().withMessage('Please enter a valid email address.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('country').notEmpty().withMessage('Country is required.'),
];

router.post('/register', registerLimiter,verifyRecaptchaMiddleware('register'), registerValidationRules, authController.register);

const loginValidationRules = [
    body('email').isEmail().withMessage('Please provide a valid email.'),
    body('password').notEmpty().withMessage('Password cannot be empty.')
];

router.post('/login', loginLimiter, verifyRecaptchaMiddleware('login'), loginValidationRules, authController.login);
router.post('/social-login', authController.socialLogin);
router.post('/forgot-password', forgotPasswordLimiter, verifyRecaptchaMiddleware('forgot_password'),[body('email').isEmail().withMessage('Please provide a valid email address.')], authController.forgotPassword);
router.post('/logout', checkAuth, authController.logout);
router.get('/status', checkAuth, authController.checkStatus);
router.post('/generate-redirect', checkAuth, authController.generateRedirect);

module.exports = router;