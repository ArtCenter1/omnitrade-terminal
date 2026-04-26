import * as crypto from 'crypto';

/**
 * Encryption Utility for sensitive data like API keys and secrets.
 *
 * It uses AES-256-CBC with a random 16-byte IV for each encryption.
 * The IV is stored alongside the ciphertext (iv:ciphertext).
 *
 * For backward compatibility, it supports decrypting data encrypted with
 * the legacy hardcoded key and static IV.
 */

// Legacy constants for backward compatibility
const LEGACY_KEY = crypto
  .createHash('sha256')
  .update('super_secret_key')
  .digest();
const LEGACY_IV = Buffer.alloc(16, 0);

/**
 * Gets the encryption key from environment variables.
 * Falls back to a development key with a warning if not set.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.API_KEY_ENCRYPTION_KEY;
  if (!envKey || envKey === 'your-encryption-key-for-api-keys') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL: API_KEY_ENCRYPTION_KEY is not set in production environment!',
      );
    }
    // Fallback for development/testing only
    return crypto.createHash('sha256').update('dev_fallback_key').digest();
  }
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypts plaintext using AES-256-CBC with a random IV.
 * @param text The plaintext to encrypt
 * @returns The encrypted string in the format "iv:ciphertext" (both hex)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with AES-256-CBC.
 * Supports both new "iv:ciphertext" format and legacy hex-only format.
 * @param encryptedText The encrypted text to decrypt
 * @returns The decrypted plaintext
 */
export function decrypt(encryptedText: string): string {
  // Check if it's the new format (iv:ciphertext)
  if (encryptedText.includes(':')) {
    const [ivHex, ciphertext] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      getEncryptionKey(),
      iv,
    );
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Legacy decryption path
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    LEGACY_KEY,
    LEGACY_IV,
  );
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
