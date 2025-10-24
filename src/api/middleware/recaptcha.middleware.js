const recaptchaService = require('../services/recaptcha.service');

const verifyRecaptchaMiddleware = (action) => async (req, res, next) => {
    const token = req.body.recaptchaToken;

    if (!token) {
        return res.status(400).json({ success: false, message: 'reCAPTCHA token is required.' });
    }

    try {
        const { success, score, error } = await recaptchaService.verifyRecaptcha(token, action);
        
        if (!success) {
            return res.status(403).json({ success: false, message: `reCAPTCHA verification failed: ${error}` });
        }
        
        // You can adjust this threshold as needed. 0.5 is a common starting point.
        if (score < 0.5) {
             console.log(`Low reCAPTCHA score (${score}) for action '${action}'. Request blocked.`);
             return res.status(403).json({ success: false, message: 'Request blocked due to low reCAPTCHA score.' });
        }
        
        next();
    } catch (error) {
        console.error('Server error during reCAPTCHA verification:', error);
        return res.status(500).json({ success: false, message: 'Could not verify reCAPTCHA.' });
    }
};

module.exports = {
    verifyRecaptchaMiddleware
};
