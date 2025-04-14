import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateExchangeApiKeyDto } from './dto/create-exchange-api-key.dto';
import { TestExchangeApiKeyDto } from './dto/test-exchange-api-key.dto';
import * as crypto from 'crypto';

// WARNING: For demo only. Use a secure key management system in production!
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update('super_secret_key')
  .digest(); // 32 bytes
const IV = Buffer.alloc(16, 0); // 16 bytes IV (all zeros for demo)

const prisma = new PrismaClient();

function encrypt(text: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

@Injectable()
export class ExchangeApiKeyService {
  /**
   * Add a new exchange API key for a user.
   */
  async addApiKey(userId: string, dto: CreateExchangeApiKeyDto) {
    // Validate exchange exists
    const exchange = await prisma.exchange.findUnique({
      where: { exchange_id: dto.exchange_id },
    });
    if (!exchange) {
      throw new HttpException('Exchange not found', HttpStatus.BAD_REQUEST);
    }

    // Check uniqueness (user_id, exchange_id, key_nickname)
    const existing = await prisma.userApiKey.findFirst({
      where: {
        user_id: userId,
        exchange_id: dto.exchange_id,
        key_nickname: dto.key_nickname ?? null,
      },
    });
    if (existing) {
      throw new HttpException(
        'API key with this nickname already exists for this exchange',
        HttpStatus.CONFLICT,
      );
    }

    // Encrypt API key and secret
    const api_key_encrypted = encrypt(dto.api_key);
    const api_secret_encrypted = encrypt(dto.api_secret);

    // Store in DB
    const created = await prisma.userApiKey.create({
      data: {
        user_id: userId,
        exchange_id: dto.exchange_id,
        api_key_encrypted,
        api_secret_encrypted,
        key_nickname: dto.key_nickname,
      },
      select: {
        api_key_id: true,
        exchange_id: true,
        key_nickname: true,
        created_at: true,
        updated_at: true,
        is_valid: true,
      },
    });

    return created;
  }

  /**
   * List all exchange API keys for a user (excluding secrets).
   */
  async listApiKeys(userId: string) {
    const keys = await prisma.userApiKey.findMany({
      where: { user_id: userId },
      select: {
        api_key_id: true,
        exchange_id: true,
        key_nickname: true,
        created_at: true,
        updated_at: true,
        is_valid: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return keys;
  }

  /**
   * Delete a specific exchange API key.
   */
  async deleteApiKey(userId: string, apiKeyId: string) {
    // Ensure the key belongs to the user
    const key = await prisma.userApiKey.findUnique({
      where: { api_key_id: apiKeyId },
    });
    if (!key || key.user_id !== userId) {
      throw new HttpException('API key not found', HttpStatus.NOT_FOUND);
    }
    await prisma.userApiKey.delete({
      where: { api_key_id: apiKeyId },
    });
    return { message: 'API key deleted' };
  }

  /**
   * Test the connection/credentials for a given exchange API key.
   * (This is a mock implementation. Replace with real exchange API call.)
   */
  async testApiKey(
    userId: string,
    apiKeyId: string,
    dto: TestExchangeApiKeyDto,
  ) {
    const key = await prisma.userApiKey.findUnique({
      where: { api_key_id: apiKeyId },
    });
    if (!key || key.user_id !== userId) {
      throw new HttpException('API key not found', HttpStatus.NOT_FOUND);
    }
    // Decrypt credentials
    const apiKey = decrypt(key.api_key_encrypted);
    const apiSecret = decrypt(key.api_secret_encrypted);

    // TODO: Implement real exchange connectivity test here.
    // For now, just return a mock "success" if decrypted values are non-empty.
    if (apiKey && apiSecret) {
      return {
        success: true,
        message: 'API key credentials are valid (mocked)',
      };
    } else {
      return { success: false, message: 'Invalid credentials (mocked)' };
    }
  }
}
