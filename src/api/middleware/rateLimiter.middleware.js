const { rateLimit } = require('express-rate-limit');

const baseConfig = {
	windowMs: 15 * 60 * 1000,
	standardHeaders: true,
	legacyHeaders: false
};

const registerLimiter = rateLimit({
    ...baseConfig,
	max: 10, 
    handler: (req, res, next, options) => {
        console.log(`Too many registration attempts from this IP: ${req.ip}`);
        res.status(options.statusCode).json({
            success: false,
            message: 'Too many registration attempts from this IP, please try again after 15 minutes.'
        });
    },
});

const loginLimiter = rateLimit({
    ...baseConfig,
	max: 10,
    handler: (req, res, next, options) => {
        console.log(`Too many login attempts from this IP: ${req.ip}`);
        res.status(options.statusCode).json({
            success: false,
            message: 'Too many login attempts from this IP, please try again after 15 minutes.'
        });
    },
});

const forgotPasswordLimiter = rateLimit({
    ...baseConfig,
	max: 5, 
    handler: (req, res, next, options) => {
        console.log(`Too many password reset attempts from this IP: ${req.ip}`);
        res.status(options.statusCode).json({
            success: false,
            message: 'Too many password reset requests from this IP, please try again after 15 minutes.'
        });
    },
});

module.exports = {
    registerLimiter,
    loginLimiter,
    forgotPasswordLimiter,
};