import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeApiKeyService } from '../exchange-api-key.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as ccxt from 'ccxt';
import * as encryptionUtils from '../../utils/encryption.util';

jest.mock('ccxt', () => {
  return {
    __esModule: true,
    exchanges: ['binance', 'kraken'],
    binance: jest.fn().mockImplementation(() => ({
      fetchBalance: jest.fn().mockResolvedValue({}),
    })),
    AuthenticationError: class AuthenticationError extends Error {},
    ExchangeNotAvailable: class ExchangeNotAvailable extends Error {},
    NetworkError: class NetworkError extends Error {},
  };
});

jest.mock('../../utils/encryption.util', () => ({
  decrypt: jest.fn((text) => text.replace('encrypted-', '')),
  encrypt: jest.fn((text) => `encrypted-${text}`),
}));

describe('ExchangeApiKeyService', () => {
  let service: ExchangeApiKeyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    userApiKey: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeApiKeyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ExchangeApiKeyService>(ExchangeApiKeyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('testApiKey', () => {
    it('should succeed when exchangeId is in ccxt.exchanges', async () => {
      const userId = 'user-1';
      const apiKeyId = 'key-1';
      const mockKey = {
        user_id: userId,
        exchange_id: 'binance',
        api_key_encrypted: 'encrypted-api-key',
        api_secret_encrypted: 'encrypted-api-secret',
      };

      (prisma.userApiKey.findUnique as jest.Mock).mockResolvedValue(mockKey);

      const result = await service.testApiKey(userId, apiKeyId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('connection successful');
    });

    it('should fail when exchangeId is NOT in ccxt.exchanges', async () => {
      const userId = 'user-1';
      const apiKeyId = 'key-1';
      const mockKey = {
        user_id: userId,
        exchange_id: 'invalid-exchange',
        api_key_encrypted: 'encrypted-api-key',
        api_secret_encrypted: 'encrypted-api-secret',
      };

      (prisma.userApiKey.findUnique as jest.Mock).mockResolvedValue(mockKey);

      const result = await service.testApiKey(userId, apiKeyId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('is not supported by the validation library');
    });
  });
});
