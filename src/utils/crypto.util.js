const crypto = require('crypto');
const config = require('../config/environment');

// Algorithm to be used for encryption
const algorithm = 'aes-256-cbc';
// Secret key and IV from environment variables
const key = Buffer.from(config.security.aesKey, 'utf8');
const iv = Buffer.from(config.security.aesIv, 'utf8');

const encrypt = (text) => {
  // Create a cipher object
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (text) => {
  // Create a decipher object
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  // Decrypt the text
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = { encrypt, decrypt };