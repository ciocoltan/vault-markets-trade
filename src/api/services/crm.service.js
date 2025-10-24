const axios = require('axios');
const FormData = require('form-data');
const config = require('../../config/environment');

/**
 * A generic function to make requests to the Syntellicore CRM API.
 */
const makeCrmRequest = async (method, data = {}) => {
  try {
    const form = new FormData();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        form.append(key, data[key]);
      }
    }

    const response = await axios.post(`${config.crm.baseUrl}?method=${method}`, form, {
      headers: {
        ...form.getHeaders(), // Important for multipart/form-data
        api_key: config.crm.apiKey,
      },
    });

    if (!response.data.success) {
      const error = new Error(response.data.info?.message || 'CRM request failed');
      error.crmError = true; // Custom flag to identify CRM errors
      error.details = response.data;      
      throw error;
    }
   
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`CRM API Error calling method '${method}':`, {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error(`CRM API Error calling method '${method}': No response received.`, error.request);
    } else {
      console.error(`CRM API Error calling method '${method}':`, error.message);
    }
    throw error;
  }
};
 
// Export specific functions for each CRM method for clarity and ease of use
module.exports = {
  // Authentication
  loginUser: (email, password) => makeCrmRequest('user_login', { email, password }),
  socialLoginUser: (email, provider, token) => {
    const socialParams = {
        email,
        socialtoken: token,
        google: provider === 'google' ? 1 : 0,
        // facebook_id could be added here if needed 
    };
    return makeCrmRequest('user_login', socialParams);
  },
  logoutUser: (user, access_token) => makeCrmRequest('user_logout', { user, access_token }),
  createUser: (email, password, country_id, currency, otherData = {}) =>
    makeCrmRequest('create_user', { email, password, country_id, currency, ...otherData }),
  requestPasswordReset: (email) => makeCrmRequest('get_password_reset_link', { email }),
  generateAuthRedirectUrl: (user, access_token, redirect) => makeCrmRequest('user_authenticate', { user, access_token, redirect }),
  getUserData: (user, access_token) => makeCrmRequest('get_users', { user, access_token }),
  setUserData: (user, access_token, userData) =>
    makeCrmRequest('set_user_data', { user, access_token, ...userData }),

  // General Data
  getCountries: (language = 'en', show_on_register = '1') =>
    makeCrmRequest('get_countries', { language, show_on_register }),

  // Questionnaires
  getQuestionnaire: (user, access_token, eqa_id) =>
    makeCrmRequest('get_questionnaires', { user, access_token, eqa_id }),
  setQuestionnaireAnswers: (user, access_token, eqa_multiple_answers) =>
    makeCrmRequest('set_questionnaire_user_answers', { user, access_token, eqa_multiple_answers: JSON.stringify(eqa_multiple_answers) }),
  getQuestionnaireAnswers: (user, access_token, eqa_id) =>
    makeCrmRequest('get_questionnaire_user_answers', { user, access_token, eqa_id }),
  
};