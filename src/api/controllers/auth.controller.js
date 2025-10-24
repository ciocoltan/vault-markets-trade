const { validationResult } = require('express-validator');
const crypto = require('crypto');
const crmService = require('../services/crm.service');
const oauthService = require('../services/oauth.service');
const { encrypt } = require('../../utils/crypto.util');
const config = require('../../config/environment');

/**
 * Sets the encrypted auth cookie.
 */
const setAuthCookie = (res, user, token) => {
  const sessionData = JSON.stringify({ user, token });
  const encryptedData = encrypt(sessionData);

  res.cookie(config.security.cookieSessionKey, encryptedData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'strict',
  });
};

const handleLoginSuccess = async (res, user, authentication_token, statusCode, message) => {
    setAuthCookie(res, user, authentication_token);

    const [
        userAnswersResponse,
        questionnairesResponse,
    ] = await Promise.all([
        crmService.getQuestionnaireAnswers(user, authentication_token),
        crmService.getQuestionnaire(user, authentication_token, '17')
    ]);

    res.status(statusCode).json({
        success: true,
        message: message,
        user: { id: user },
        userAnswers: userAnswersResponse.data || [],
        questionnaires: questionnairesResponse.data || []
    });
};

const generateSecureRandomPassword = () => {
    const length = 16;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&';    
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += special[crypto.randomInt(special.length)];
    for (let i = 4; i < length; i++) {
        password += allChars[crypto.randomInt(allChars.length)];
    }
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Controller for user registration.
 */
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { email, password, country, currency = 'ZAR', token, ...otherFields } = req.body;

  try {
    const countriesResponse = await crmService.getCountries();
    const countryList = countriesResponse.data;
    const foundCountry = countryList.find(c => c.iso_alpha2_code.toLowerCase() === country.toLowerCase());
    const country_id = foundCountry ? foundCountry.country_id : 3;

    await crmService.createUser(email, password, country_id, currency, otherFields);
    
    const loginResponse = await crmService.loginUser(email, password);
    const { user, authentication_token } = loginResponse.data[0];

    return handleLoginSuccess(res, user, authentication_token, 201, 'User registered and logged in successfully.');

  } catch (error) {
    if (error.crmError) {
      return res.status(400).json({ success: false, message: error.message });
    } else {
      console.error('Unexpected Registration Error:', error);
      return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
  }
};

/**
 * Controller for user login.
 */
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { email, password } = req.body;
  
  try {
    const response = await crmService.loginUser(email, password);
    const { user, authentication_token } = response.data[0];

    return handleLoginSuccess(res, user, authentication_token, 200, 'Login successful.');
    
  } catch (error) {
    if (error.crmError) {
      return res.status(401).json({ success: false, message: error.message });
    } else {
      console.error('Unexpected Login Error:', error);
      return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
  }
};

/**
 * Controller for social media login (Google & Apple).
 * It checks if a user exists. If not, it creates a new account.
 * If the user exists, it returns an error to prevent account takeover.
 */
const socialLogin = async (req, res) => {
    const { provider, token: authCode, country, currency = 'ZAR', ...otherFields } = req.body;

    try {
        let id_token;
        let profile;

        if (provider === 'google') {
            const googleData = await oauthService.getGoogleUserDataFromCode(authCode);
            id_token = googleData.id_token;
            profile = googleData.profile;
        } else if (provider === 'apple') {
            const appleData = await oauthService.verifyAppleToken(authCode);
            id_token = appleData.id_token;
            profile = appleData.profile;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid social provider specified.' });
        }

        try {
            const loginResponse = await crmService.socialLoginUser(profile.email, provider, id_token);
            
            if (!loginResponse || !loginResponse.data || !loginResponse.data[0]) {
                console.error('Invalid response structure from CRM during social login attempt:', loginResponse);
                return res.status(500).json({ success: false, message: 'Received an unexpected response from the authentication service.' });
            }

            const { user, authentication_token } = loginResponse.data[0];
            console.log(`User with email ${profile.email} successful Login via ${provider} provider.`);
            return handleLoginSuccess(res, user, authentication_token, 200, 'Login successful via social provider.');

        } catch (error) {
            // Check for the specific "user not found" error from the CRM to trigger registration
            if (error.crmError && (error.message.toLowerCase().includes('user not found') || error.message.toLowerCase().includes('user does not exist'))) {
                console.log(`User with email ${profile.email} not found via ${provider} login. Creating new account.`);

                const randomPassword = generateSecureRandomPassword();
                const countriesResponse = await crmService.getCountries();
                const countryList = countriesResponse.data;
                let country_id = 3; // Default country ID
                if (country) {
                    const foundCountry = countryList.find(c => c.iso_alpha2_code.toLowerCase() === country.toLowerCase());
                    if (foundCountry) {
                        country_id = foundCountry.country_id;
                    }
                }

                await crmService.createUser(profile.email, randomPassword, country_id, currency, {
                    fname: profile.firstName,
                    lname: profile.lastName,
                    provider: provider,
                    ...otherFields
                });

                const newLoginResponse = await crmService.socialLoginUser(profile.email, provider, id_token);

                if (!newLoginResponse || !newLoginResponse.data || !newLoginResponse.data[0]) {
                    console.error('Invalid response structure from CRM after creating new social user:', newLoginResponse);
                    return res.status(500).json({ success: false, message: 'Received an unexpected response from the authentication service after user creation.' });
                }

                const { user, authentication_token } = newLoginResponse.data[0];
                console.log(`User with email ${profile.email} registered and logged in successfully via ${provider} provider.`);
                
                return handleLoginSuccess(res, user, authentication_token, 201, 'User registered and logged in successfully via social provider.');
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Social Login Error:', error.message);
        if (error.crmError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'An internal server error occurred during social login.' });
    }
};


const forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email } = req.body;

    try {
        await crmService.requestPasswordReset(email);
        
        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });

    } catch (error) {
        if (error.crmError && error.message.toLowerCase().includes('user does not exist')) {
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }
        console.error('Password reset request failed:', error.message);
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

/**
 * Generates a one-time authentication URL for a logged-in user.
 */
const generateRedirect = async (req, res) => {
    try {
        const { user, token } = req.user;
        const { redirect } = req.body;

        if (!redirect) {
            return res.status(400).json({ success: false, message: 'A redirect URL is required.' });
        }

        const response = await crmService.generateAuthRedirectUrl(user, token, redirect);
        const redirectUrl = response.data?.[0]?.url;

        if (!redirectUrl) {
            console.error('CRM did not return a valid redirect URL:', response);
            return res.status(500).json({ success: false, message: 'Failed to generate authentication link.' });
        }
        
        res.status(200).json({
            success: true,
            url: redirectUrl
        });

    } catch (error) {
        console.error('Generate Redirect Error:', error.message);
        if (error.crmError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
};

/**
 * Controller for user logout.
 */
const logout = async (req, res) => {
    try {
        const { user, token } = req.user;
        await crmService.logoutUser(user, token);
    } catch (error) {
        if (!error.message || !error.message.toLowerCase().includes('unauthorized')) {
            console.error('CRM logout failed with an unexpected error:', error.message);
        }
    } finally {
        res.clearCookie(config.security.cookieSessionKey);
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    }
};

/**
 * Checks if the user has a valid session cookie.
 */
const checkStatus = async (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'User is authenticated.',
        user: { id: req.user.user }
    });
};


module.exports = {
  register,
  login,
  socialLogin,
  logout,
  checkStatus,
  forgotPassword,
  generateRedirect,
};

