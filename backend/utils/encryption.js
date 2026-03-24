const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_encryption_key';

/**
 * Encrypt a message using AES encryption
 * @param {string} text - Plain text message
 * @returns {string} Encrypted message string
 */
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

/**
 * Decrypt an AES encrypted message
 * @param {string} cipherText - Encrypted message string
 * @returns {string} Decrypted plain text message
 */
const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

module.exports = { encrypt, decrypt };
