import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateExchangeApiKeyDto } from './dto/create-exchange-api-key.dto';
import * as crypto from 'crypto';
import * as ccxt from 'ccxt';

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
  async testApiKey(userId: string, apiKeyId: string) {
    const key = await prisma.userApiKey.findUnique({
      where: { api_key_id: apiKeyId },
      select: {
        // Added select to fetch necessary fields
        user_id: true,
        exchange_id: true, // Fetch exchange_id
        api_key_encrypted: true,
        api_secret_encrypted: true,
      },
    });
    if (!key || key.user_id !== userId) {
      throw new HttpException('API key not found', HttpStatus.NOT_FOUND);
    }
    // Decrypt credentials
    const apiKey = decrypt(key.api_key_encrypted);
    const apiSecret = decrypt(key.api_secret_encrypted);

    // --- Start CCXT Validation ---
    try {
      // Ensure the exchange ID is in the format ccxt expects (lowercase)
      // Note: Assumes the stored exchange_id is compatible or mapped correctly.
      const exchangeId = key.exchange_id.toLowerCase(); // Example: 'binance', 'kraken'

      // Check if the exchange is supported by ccxt by checking key existence
      if (!(exchangeId in ccxt.exchanges)) {
        // Added newline for formatting
        throw new Error(
          `Exchange '${key.exchange_id}' is not supported by the validation library.`,
        );
      }

      // Instantiate the exchange and cast to 'any' to bypass strict TS checks for dynamic access
      // @ts-expect-error - Suppress TS error for dynamic instantiation which is handled by runtime checks
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const exchange: any = new ccxt[exchangeId]({
        apiKey: apiKey,
        secret: apiSecret,
        // Optional: Add timeouts or other configurations if needed
        // 'enableRateLimit': true, // Consider enabling rate limiting
      });

      // Attempt a simple authenticated call (e.g., fetch balance)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await exchange.fetchBalance(); // This throws an error on failure

      // If the call succeeds, the key is valid
      // Optional: Update is_valid in DB here if desired
      // await prisma.userApiKey.update({
      //   where: { api_key_id: apiKeyId },
      //   data: { is_valid: true },
      // });

      return {
        success: true,
        message: 'API key connection successful.',
      };
    } catch (error) {
      // If the call fails, the key is invalid or there's an issue
      // Optional: Update is_valid in DB here if desired
      // await prisma.userApiKey.update({
      //   where: { api_key_id: apiKeyId },
      //   data: { is_valid: false },
      // });

      let errorMessage =
        'API key connection failed: An unknown error occurred.';
      if (error instanceof Error) {
        // Use specific CCXT error messages if available, otherwise generic Error message
        if (error instanceof ccxt.AuthenticationError) {
          errorMessage = 'API key connection failed: Invalid credentials.';
        } else if (error instanceof ccxt.ExchangeNotAvailable) {
          // Need 'key' in scope to use key.exchange_id. Let's use a generic message for now or fetch key again if needed.
          // For simplicity, using a generic message based on instructions.
          // If key.exchange_id is crucial, the 'key' variable would need to be accessible here.
          // Reverting to a more generic message as 'key' might not be in scope if the initial findUnique failed,
          // although the current structure fetches 'key' before the try block.
          // Let's assume 'key' is accessible as per original code structure.
          errorMessage = `API key connection failed: Exchange '${key?.exchange_id || 'selected exchange'}' is currently unavailable.`;
        } else if (error instanceof ccxt.NetworkError) {
          errorMessage = `API key connection failed: Network error (${error.message}).`;
        } else {
          errorMessage = `API key connection failed: ${error.message}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = `API key connection failed: ${error}`;
      }
      // Log the full error object for debugging
      console.error('CCXT Test Error:', error);
      return { success: false, message: errorMessage };
    }
    // --- End CCXT Validation ---
  }
}
