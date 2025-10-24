const crypto = require('crypto');
const axios = require('axios');
const config = require('../../config/environment');
const SUMSUB_APP_TOKEN = config.sumsub.appToken;
const SUMSUB_SECRET_KEY = config.sumsub.secretKey;
const SUMSUB_BASE_URL = 'https://api.sumsub.com';

/**
 * Generates the signature required for Sumsub API requests.
 */
function createSignature(ts, method, path, body) {
    const hmac = crypto.createHmac('sha256', SUMSUB_SECRET_KEY);
    hmac.update(ts + method.toUpperCase() + path);
    if (body) {
        hmac.update(body);
    }
    return hmac.digest('hex');
}

/**
 * Creates an applicant in Sumsub and generates an access token for them.
 */
exports.createAccessToken = async (userId, levelName = 'basic-kyc-level') => {
    const path = `/resources/accessTokens?userId=${encodeURIComponent(userId)}&levelName=${levelName}`;
    const method = 'POST';
    const ts = Math.floor(Date.now() / 1000);

    const headers = {
        'X-App-Token': SUMSUB_APP_TOKEN,
        'X-App-Access-Sig': createSignature(ts, method, path, null),
        'X-App-Access-Ts': ts,
        'Accept': 'application/json',
    };

    try {
        const response = await axios.post(`${SUMSUB_BASE_URL}${path}`, null, { headers });
        return response.data.token;
    } catch (error) {
        console.error("Error creating Sumsub access token:", error.response ? error.response.data : error.message);
        throw new Error('Failed to create Sumsub access token.');
    }
};
