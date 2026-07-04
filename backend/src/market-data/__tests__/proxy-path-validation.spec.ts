import { Test, TestingModule } from '@nestjs/testing';
import { CoinGeckoProxyController } from '../coingecko-proxy.controller';
import { BinanceTestnetProxyController } from '../binance-testnet-proxy.controller';
import { RedisService } from '../../redis/redis.service';
import { CircuitBreakerService } from '../circuit-breaker.service';
import { Request } from 'express';
import { HttpException } from '@nestjs/common';

describe('Proxy Path Validation', () => {
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
    it('should block path traversal (..)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/coingecko/../../etc/passwd',
        query: {},
      } as unknown as Request;

      await expect(coingeckoController.proxyRequest(mockRequest, '../../etc/passwd'))
        .rejects.toThrow(HttpException);
    });

    it('should block protocol injection (://)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/coingecko/http://evil.com',
        query: {},
      } as unknown as Request;

      await expect(coingeckoController.proxyRequest(mockRequest, 'http://evil.com'))
        .rejects.toThrow(HttpException);
    });

    it('should block null bytes (\\0)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/coingecko/test\0',
        query: {},
      } as unknown as Request;

      await expect(coingeckoController.proxyRequest(mockRequest, 'test\0'))
        .rejects.toThrow(HttpException);
    });
  });

  describe('BinanceTestnetProxyController', () => {
    it('should block path traversal (..)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/binance-testnet/../../etc/passwd',
        url: '/api/proxy/binance-testnet/../../etc/passwd',
      } as unknown as Request;

      await expect(binanceController.proxyRequest(mockRequest))
        .rejects.toThrow(HttpException);
    });

    it('should block protocol injection (://)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/binance-testnet/http://evil.com',
        url: '/api/proxy/binance-testnet/http://evil.com',
      } as unknown as Request;

      await expect(binanceController.proxyRequest(mockRequest))
        .rejects.toThrow(HttpException);
    });

    it('should block null bytes (\\0)', async () => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/proxy/binance-testnet/test\0',
        url: '/api/proxy/binance-testnet/test\0',
      } as unknown as Request;

      await expect(binanceController.proxyRequest(mockRequest))
        .rejects.toThrow(HttpException);
    });
  });
});
