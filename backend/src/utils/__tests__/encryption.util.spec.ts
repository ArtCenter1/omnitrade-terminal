import { encrypt, decrypt } from '../encryption.util';
import * as crypto from 'crypto';

describe('Encryption Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should encrypt and decrypt correctly', () => {
    const plaintext = 'my-secret-api-key';
    const encrypted = encrypt(plaintext);

    expect(encrypted).toContain(':');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should use different IVs for the same plaintext', () => {
    const plaintext = 'consistent-plaintext';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    expect(encrypted1).not.toBe(encrypted2);

    const [iv1] = encrypted1.split(':');
    const [iv2] = encrypted2.split(':');
    expect(iv1).not.toBe(iv2);

    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it('should decrypt legacy encrypted data', () => {
    // Manually create legacy encrypted data using the known legacy key and static IV
    const plaintext = 'legacy-secret';
    const legacyKey = crypto
      .createHash('sha256')
      .update('super_secret_key')
      .digest();
    const legacyIv = Buffer.alloc(16, 0);

    const cipher = crypto.createCipheriv('aes-256-cbc', legacyKey, legacyIv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // The legacy format was just the hex ciphertext without the "iv:" prefix
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should use environment variable for encryption key when available', () => {
    process.env.API_KEY_ENCRYPTION_KEY = 'custom-test-key';
    const plaintext = 'env-secret';
    const encrypted = encrypt(plaintext);

    // Verify it can be decrypted with the same env key
    expect(decrypt(encrypted)).toBe(plaintext);

    // If we change the key, decryption should fail
    process.env.API_KEY_ENCRYPTION_KEY = 'different-key';
    expect(() => decrypt(encrypted)).toThrow();
  });

  it('should fallback to dev key when environment variable is not set', () => {
    delete process.env.API_KEY_ENCRYPTION_KEY;
    process.env.NODE_ENV = 'development';

    const plaintext = 'fallback-secret';
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it('should throw in production if environment variable is missing', () => {
    delete process.env.API_KEY_ENCRYPTION_KEY;
    process.env.NODE_ENV = 'production';

    expect(() => encrypt('test')).toThrow(
      'CRITICAL: API_KEY_ENCRYPTION_KEY is not set',
    );
  });
});
