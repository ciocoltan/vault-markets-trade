const dotenv = require("dotenv");
dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  crm: {
    baseUrl: process.env.CRM_API_BASE_URL,
    apiKey: process.env.CRM_API_KEY,
  },
  security: {
    cookieSessionKey: process.env.COOKIE_SESSION_KEY,
    aesKey: process.env.AES_SECRET_KEY,
    aesIv: process.env.AES_IV,
  },
  cache: {
    durationHours: parseInt(process.env.CACHE_DURATION_HOURS, 10) || 720,
  },
  sumsub: {
    appToken: process.env.SUMSUB_APP_TOKEN,
    secretKey: process.env.SUMSUB_SECRET_KEY,
  },
  recaptcha: {
    projectID: process.env.RECAPTCHA_PROJECT_ID,
    siteKey: process.env.RECAPTCHA_SITE_KEY,
  },
  oauth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.NODE_ENV === 'production'
            ? process.env.GOOGLE_PROD_REDIRECT_URI
            : process.env.GOOGLE_DEV_REDIRECT_URI,
    },
  },
};

const requiredVariables = [
  "CRM_API_BASE_URL",
  "CRM_API_KEY",
  "COOKIE_SESSION_KEY",
  "AES_SECRET_KEY",
  "AES_IV",
  "SUMSUB_APP_TOKEN",
  "SUMSUB_SECRET_KEY",
  "RECAPTCHA_PROJECT_ID",
  "RECAPTCHA_SITE_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_DEV_REDIRECT_URI",
  "GOOGLE_PROD_REDIRECT_URI" 
  // 'APPLE_CLIENT_ID'
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    console.error(
      `❌ FATAL ERROR: Environment variable ${variable} is not set.`
    );
    process.exit(1);
  }
}

module.exports = config;
