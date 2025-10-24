const {
  RecaptchaEnterpriseServiceClient,
} = require("@google-cloud/recaptcha-enterprise");
const { GoogleAuth } = require("google-auth-library");
const config = require("../../config/environment");

const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

const client = new RecaptchaEnterpriseServiceClient({ auth });
const projectPath = `projects/${config.recaptcha.projectID}`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyRecaptcha(token, recaptchaAction) {
  const request = {
    assessment: {
      event: {
        token: token,
        siteKey: config.recaptcha.siteKey,
      },
    },
    parent: projectPath,
  };

  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const [response] = await client.createAssessment(request);

      if (!response.tokenProperties.valid) {
        console.error(
          `reCAPTCHA token invalid: ${response.tokenProperties.invalidReason}`
        );
        return {
          success: false,
          score: null,
          error: response.tokenProperties.invalidReason,
        };
      }

      if (
        response.tokenProperties.action.toLowerCase() !==
        recaptchaAction.toLowerCase()
      ) {
        console.error(
          `reCAPTCHA action mismatch. Expected: ${recaptchaAction}, Got: ${response.tokenProperties.action}`
        );
        return { success: false, score: null, error: "Action mismatch" };
      }

      console.log(
        `reCAPTCHA score for action '${recaptchaAction}': ${response.riskAnalysis.score}`
      );
      return { success: true, score: response.riskAnalysis.score, error: null };
    } catch (error) {
      lastError = error;
      if (
        error.code === 14 ||
        (error.details && error.details.includes("ECONNRESET"))
      ) {
        console.warn(
          `Attempt ${attempt} failed with a network error. Retrying in ${
            attempt * 200
          }ms...`
        );
        await delay(attempt * 200);
      } else {
        break;
      }
    }
  }

  console.error(
    "Error creating reCAPTCHA assessment after all retries:",
    lastError
  );
  throw new Error("Failed to verify reCAPTCHA.");
}

module.exports = { verifyRecaptcha };
