import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default_key';

/**
 * Encrypt a message using AES (matches backend implementation)
 * @param {string} text - Plain text message
 * @returns {string} Encrypted string
 */
export const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

/**
 * Decrypt an AES encrypted message
 * @param {string} cipherText - Encrypted string
 * @returns {string} Decrypted plain text
 */
export const decrypt = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '[Unable to decrypt]';
  }
};
