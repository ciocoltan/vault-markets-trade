const { decrypt } = require('../../utils/crypto.util');
const config = require('../../config/environment');

const checkAuth = (req, res, next) => {
  // Get the encrypted token from the cookies
  const encryptedToken = req.cookies[config.security.cookieSessionKey];

  // If no token is found, the user is not authenticated
  if (!encryptedToken) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No session token provided.' });
  }

  try {
    // Decrypt the token to get the session data
    const decryptedData = decrypt(encryptedToken);
    const sessionData = JSON.parse(decryptedData);

    // Check if the decrypted data has the expected format
    if (!sessionData.user || !sessionData.token) {
      throw new Error('Invalid session data format.');
    }

    // Attach the user data to the request object for use in subsequent handlers
    req.user = sessionData;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    res.clearCookie(config.security.cookieSessionKey);
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid session token.' });
  }
};

module.exports = checkAuth;