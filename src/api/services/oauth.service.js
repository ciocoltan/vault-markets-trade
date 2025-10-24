const { OAuth2Client } = require('google-auth-library');
// const appleAuth = require('apple-signin-auth');
const config = require('../../config/environment');

const getGoogleUserDataFromCode = async (code) => {
    try {
        const oAuth2Client = new OAuth2Client(
            config.oauth.google.clientID,
            config.oauth.google.clientSecret,
            config.oauth.google.redirectUri
        );

        const { tokens } = await oAuth2Client.getToken(code);
        const id_token = tokens.id_token;

        if (!id_token) {
            throw new Error('ID token not found in Google response.');
        }

        const ticket = await oAuth2Client.verifyIdToken({
            idToken: id_token,
            audience: config.oauth.google.clientID,
        });

        const payload = ticket.getPayload();

        if (!payload) {
            throw new Error('Failed to decode Google ID token.');
        }

        const profile = {
            email: payload.email,
            firstName: payload.given_name,
            lastName: payload.family_name,
            provider: 'google',
        };

        return { profile, id_token };

    } catch (error) {
        console.error('Error exchanging Google auth code:', error.message);
        throw new Error('Failed to authenticate with Google.');
    }
};

/**
 * Verifies an Apple identity token.
 * NOTE: Apple's flow might also use a code. This function assumes a direct token verification.
 * @param {string} token - The identity token from the frontend.
 * @returns {Promise<{profile: object, id_token: string}>} The user's profile and the token.
 */
// const verifyAppleToken = async (token) => {
//     try {
//         const payload = await appleAuth.verifyIdToken(token, {
//             audience: config.oauth.apple.clientID,
//             ignoreExpiration: true, 
//         });

//         const profile = {
//             email: payload.email,
//             firstName: null, 
//             lastName: null,
//             provider: 'apple',
//         };

//         return { profile, id_token: token };

//     } catch (error) {
//         console.error('Apple token verification failed:', error);
//         throw new Error('Failed to verify Apple token.');
//     }
// };

module.exports = {
    getGoogleUserDataFromCode,
    // verifyAppleToken,
};

