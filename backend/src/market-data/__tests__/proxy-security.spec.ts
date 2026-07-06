/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { CoinGeckoProxyController } from '../coingecko-proxy.controller';
import { BinanceTestnetProxyController } from '../binance-testnet-proxy.controller';
import { RedisService } from '../../redis/redis.service';
import { CircuitBreakerService } from '../circuit-breaker.service';
import axios from 'axios';
import { Request } from 'express';
import { HttpException } from '@nestjs/common';

jest.mock('axios');

describe('Proxy Controllers Security', () => {
  let coingeckoController: CoinGeckoProxyController;
  let binanceController: BinanceTestnetProxyController;
  let redisService: RedisService;
  let circuitBreakerService: CircuitBreakerService;

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
    redisService = module.get<RedisService>(RedisService);
    circuitBreakerService = module.get<CircuitBreakerService>(
      CircuitBreakerService,
    );
  });

  describe('CoinGeckoProxyController Information Leakage', () => {
    it('should not leak raw error data from upstream CoinGecko API', async () => {
      const mockErrorResponse = {
        response: {
          status: 403,
          data: {
            secret_key: 'exposed_key',
            internal_error: 'database_down',
            quota_limit: 1000,
          },
        },
        message: 'Forbidden',
      };

      (axios as unknown as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      (redisService.getWithRevalidate as jest.Mock).mockImplementationOnce(
        async (key, ttl, fetchFn) => {
          return fetchFn();
        },
      );

      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/coingecko/simple/price',
        query: { ids: 'bitcoin', vs_currencies: 'usd' },
      } as unknown as Request;

      const result: any = await coingeckoController.proxyRequest(
        mockRequest,
        'simple/price',
      );

      expect(result.error).toBe(true);
      // VULNERABILITY: This expectation should fail if the fix is implemented correctly
      // In the vulnerable version, it currently leaks result.data
      expect(result.data).toBeUndefined();
    });
  });

  describe('BinanceTestnetProxyController Information Leakage', () => {
    it('should not leak raw error data from upstream Binance API', async () => {
      const mockErrorResponse = {
        response: {
          status: 400,
          data: {
            code: -1102,
            msg: 'Mandatory parameter "symbol" was not sent, was empty/null, or wrong format.',
            internal_stack: 'at internal/logic.js:100',
          },
        },
        message: 'Bad Request',
      };

      (axios as unknown as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/binance-testnet/ticker/price',
        url: '/api/proxy/binance-testnet/ticker/price',
      } as unknown as Request;

      const result: any = await binanceController.proxyRequest(mockRequest);

      expect(result.error).toBe(true);
      // VULNERABILITY: This expectation should fail if the fix is implemented correctly
      expect(result.data).toBeUndefined();
    });
  });

  describe('Path Validation Security', () => {
    it('should block path traversal attempts in CoinGeckoProxyController', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/coingecko/../../etc/passwd',
        query: {},
      } as unknown as Request;

      try {
        await coingeckoController.proxyRequest(mockRequest, '../../etc/passwd');
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe('Invalid path');
        expect(error.getStatus()).toBe(400);
      }
    });

    it('should block injection characters in CoinGeckoProxyController', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/coingecko/simple/price;rm -rf /',
        query: {},
      } as unknown as Request;

      try {
        await coingeckoController.proxyRequest(
          mockRequest,
          'simple/price;rm -rf /',
        );
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe('Invalid path');
        expect(error.getStatus()).toBe(400);
      }
    });

    it('should block path traversal attempts in BinanceTestnetProxyController', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/binance-testnet/../../etc/passwd',
        params: { '0': '../../etc/passwd' },
      } as unknown as Request;

      const result: any = await binanceController.proxyRequest(mockRequest);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid path');
      expect(result.status).toBe(400);
    });
  });
});
