import { MarketDataService } from '../market-data.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';

jest.mock('axios');

describe('MarketDataService', () => {
  let service: MarketDataService;
  let configService: ConfigService;
  let redisService: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'COINGECKO_API_BASE_URL') return 'https://api.coingecko.com/api/v3';
        if (key === 'COINGECKO_API_KEY') return 'test-key';
        return null;
      }),
    } as any;
    redisService = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue('OK'),
    } as any;
    service = new MarketDataService(configService, redisService);
  });

  describe('cacheFetch', () => {
    it('returns cached data if present', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(JSON.stringify({ foo: 'bar' }));

      // Helper to access private method
      const cacheFetch = (
        service as unknown as { cacheFetch: (typeof service)['cacheFetch'] }
      ).cacheFetch.bind(service);
      const result = await cacheFetch('key', 60, () => {
        throw new Error('Should not call fetcher');
      });

      expect(result).toEqual({ foo: 'bar' });
    });

    it('calls fetcher and caches result if no cache', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);
      const fetcher = jest.fn().mockResolvedValue({ data: 123 });

      const cacheFetch = (
        service as unknown as { cacheFetch: (typeof service)['cacheFetch'] }
      ).cacheFetch.bind(service);
      const result = await cacheFetch('key', 60, fetcher);

      expect(fetcher).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ data: 123 }),
        60,
      );
      expect(result).toEqual({ data: 123 });
    });
  });

  describe('getMarkets', () => {
    it('fetches markets from API and caches them', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({
        data: [{ id: 'bitcoin', symbol: 'btc' }],
      });

      const result = await service.getMarkets();

      expect(result).toEqual([{ id: 'bitcoin', symbol: 'btc' }]);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/coins/markets',
        expect.objectContaining({
          params: expect.objectContaining({
            vs_currency: 'usd',
          }),
        }),
      );
    });

    it('returns cached markets if present', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(JSON.stringify([{ id: 'bitcoin' }]));
      const result = await service.getMarkets();
      expect(result).toEqual([{ id: 'bitcoin' }]);
    });

    it('throws error if API call fails', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockRejectedValue(new Error('API error'));

      await expect(service.getMarkets()).rejects.toThrow('Failed to fetch markets from CoinGecko: API error');
    });
  });

  describe('getOrderbook', () => {
    it('fetches orderbook from API and caches it', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({
        data: { bids: [], asks: [] },
      });

      const result = await service.getOrderbook('BTCUSDT', 50);

      expect(result).toEqual({ bids: [], asks: [] });
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.exchange.example.com/orderbook',
        { params: { symbol: 'BTCUSDT', limit: 50 } },
      );
    });
  });

  describe('getTrades', () => {
    it('fetches trades from API and caches them', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: [{ id: 1 }] });

      const result = await service.getTrades('BTCUSDT', 10);

      expect(result).toEqual([{ id: 1 }]);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.exchange.example.com/trades',
        { params: { symbol: 'BTCUSDT', limit: 10 } },
      );
    });
  });

  describe('getKlines', () => {
    it('fetches klines from API and caches them', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: [[1, 2, 3]] });

      const result = await service.getKlines('BTCUSDT', '1m', 1000, 2000, 500);

      expect(result).toEqual([[1, 2, 3]]);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.exchange.example.com/klines',
        {
          params: {
            symbol: 'BTCUSDT',
            interval: '1m',
            startTime: 1000,
            endTime: 2000,
            limit: 500,
          },
        },
      );
    });
  });
});
