import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { AppError } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;       
const TAG_BYTES = 16;      

class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const hexKey = process.env.ENCRYPTION_KEY;

    if (!hexKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set.');
    }

    if (hexKey.length !== 64) {
      throw new Error(
        `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${hexKey.length} chars.`
      );
    }

    this.key = Buffer.from(hexKey, 'hex');
  }

  encrypt(plaintext: string): string {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new AppError('Encryption input must be a non-empty string', 500);
    }

    try {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(ALGORITHM, this.key, iv);

      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      return [
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted.toString('base64'),
      ].join(':');
    } catch (error) {
      logger.error('Encryption failed', error);
      throw new AppError('Encryption failed', 500);
    }
  }

 
  decrypt(stored: string): string {
    if (!stored || typeof stored !== 'string') {
      throw new AppError('Decryption input must be a non-empty string', 500);
    }

    const parts = stored.split(':');
    if (parts.length !== 3) {
      throw new AppError('Invalid encrypted field format', 500);
    }

    try {
      const [ivB64, tagB64, cipherB64] = parts as [string, string, string];
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(tagB64, 'base64');
      const ciphertext = Buffer.from(cipherB64, 'base64');

      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed', error);
      throw new AppError('Decryption failed — data may be corrupted or key mismatch', 500);
    }
  }

 
  reEncrypt(stored: string): string {
    const plain = this.decrypt(stored);
    return this.encrypt(plain);
  }

  isEncrypted(value: string): boolean {
    const parts = value.split(':');
    if (parts.length !== 3) return false;
    try {
      parts.forEach(p => Buffer.from(p, 'base64'));
      return true;
    } catch {
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();
export default encryptionService;