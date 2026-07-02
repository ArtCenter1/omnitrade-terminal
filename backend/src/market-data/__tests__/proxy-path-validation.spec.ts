import { Test, TestingModule } from '@nestjs/testing';
import { CoinGeckoProxyController } from '../coingecko-proxy.controller';
import { BinanceTestnetProxyController } from '../binance-testnet-proxy.controller';
import { RedisService } from '../../redis/redis.service';
import { CircuitBreakerService } from '../circuit-breaker.service';
import { Request } from 'express';

describe('Proxy Controllers Path Validation', () => {
  let coingeckoController: CoinGeckoProxyController;
  let binanceController: BinanceTestnetProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoinGeckoProxyController, BinanceTestnetProxyController],
      providers: [
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            getWithRevalidate: jest.fn(),
            getWithoutExpiry: jest.fn(),
          },
        },
        {
          provide: CircuitBreakerService,
          useValue: {
            registerCircuit: jest.fn(),
            isAllowed: jest.fn().mockReturnValue(true),
            recordSuccess: jest.fn(),
            recordFailure: jest.fn(),
            getLastFailureTime: jest.fn(),
          },
        },
      ],
    }).compile();

    coingeckoController = module.get<CoinGeckoProxyController>(
      CoinGeckoProxyController,
    );
    binanceController = module.get<BinanceTestnetProxyController>(
      BinanceTestnetProxyController,
    );
  });

  describe('CoinGeckoProxyController', () => {
    it('should reject paths with traversal sequences (..)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/coingecko/../../etc/passwd',
        query: {},
      } as unknown as Request;

      const result: any = await coingeckoController.proxyRequest(mockRequest, '../../etc/passwd');
      expect(result.error).toBe(true);
      expect(result.status).toBe(400);
      expect(result.message).toContain('Invalid request path');
    });

    it('should reject paths with protocol sequences (://)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/coingecko/https://google.com',
        query: {},
      } as unknown as Request;

      const result: any = await coingeckoController.proxyRequest(mockRequest, 'https://google.com');
      expect(result.error).toBe(true);
      expect(result.status).toBe(400);
      expect(result.message).toContain('Invalid request path');
    });

    it('should reject paths with null bytes (\\0)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/coingecko/test%00',
        query: {},
      } as unknown as Request;

      const result: any = await coingeckoController.proxyRequest(mockRequest, 'test\0');
      expect(result.error).toBe(true);
      expect(result.status).toBe(400);
      expect(result.message).toContain('Invalid request path');
    });
  });

  describe('BinanceTestnetProxyController', () => {
    it('should reject paths with traversal sequences (..)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/binance-testnet/../../etc/passwd',
        url: '/api/proxy/binance-testnet/../../etc/passwd',
      } as unknown as Request;

      const result: any = await binanceController.proxyRequest(mockRequest);
      expect(result.error).toBe(true);
      expect(result.status).toBe(400);
      expect(result.message).toContain('Invalid request path');
    });

    it('should reject paths with protocol sequences (://)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/binance-testnet/https://google.com',
        url: '/api/proxy/binance-testnet/https://google.com',
      } as unknown as Request;

      const result: any = await binanceController.proxyRequest(mockRequest);
      expect(result.error).toBe(true);
      expect(result.status).toBe(400);
      expect(result.message).toContain('Invalid request path');
    });
  });
});
