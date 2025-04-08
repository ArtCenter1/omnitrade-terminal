import { MarketDataService } from '../market-data.service';
import axios from 'axios';
import Redis from 'ioredis';

jest.mock('axios');
jest.mock('ioredis');

const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();

(Redis as any).mockImplementation(() => ({
  get: mockRedisGet,
  set: mockRedisSet,
}));

describe('MarketDataService', () => {
  let service: MarketDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MarketDataService();
  });

  describe('cacheFetch', () => {
    it('returns cached data if present', async () => {
      mockRedisGet.mockResolvedValue(JSON.stringify({ foo: 'bar' }));

      const result = await (service as any).cacheFetch('key', 60, async () => {
        throw new Error('Should not call fetcher');
      });

      expect(result).toEqual({ foo: 'bar' });
    });

    it('calls fetcher and caches result if no cache', async () => {
      mockRedisGet.mockResolvedValue(null);
      const fetcher = jest.fn().mockResolvedValue({ data: 123 });
      mockRedisSet.mockResolvedValue('OK');

      const result = await (service as any).cacheFetch('key', 60, fetcher);

      expect(fetcher).toHaveBeenCalled();
      expect(mockRedisSet).toHaveBeenCalledWith('key', JSON.stringify({ data: 123 }), 'EX', 60);
      expect(result).toEqual({ data: 123 });
    });
  });

  describe('getSymbols', () => {
    it('fetches symbols from API and caches them', async () => {
      mockRedisGet.mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: ['BTCUSDT', 'ETHUSDT'] });
      mockRedisSet.mockResolvedValue('OK');

      const result = await service.getSymbols();

      expect(result).toEqual(['BTCUSDT', 'ETHUSDT']);
      expect(axios.get).toHaveBeenCalledWith('https://api.exchange.example.com/symbols');
    });

    it('returns cached symbols if present', async () => {
      mockRedisGet.mockResolvedValue(JSON.stringify(['BTCUSDT']));
      const result = await service.getSymbols();
      expect(result).toEqual(['BTCUSDT']);
    });

    it('throws error if API call fails', async () => {
      mockRedisGet.mockResolvedValue(null);
      (axios.get as jest.Mock).mockRejectedValue(new Error('API error'));

      await expect(service.getSymbols()).rejects.toThrow('API error');
    });
  });

  describe('getTicker', () => {
    it('fetches ticker from API and caches it', async () => {
      mockRedisGet.mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: { price: '100' } });
      mockRedisSet.mockResolvedValue('OK');

      const result = await service.getTicker('BTCUSDT');

      expect(result).toEqual({ price: '100' });
      expect(axios.get).toHaveBeenCalledWith('https://api.exchange.example.com/ticker', { params: { symbol: 'BTCUSDT' } });
    });
  });

  describe('getOrderbook', () => {
    it('fetches orderbook from API and caches it', async () => {
      mockRedisGet.mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: { bids: [], asks: [] } });
      mockRedisSet.mockResolvedValue('OK');

      const result = await service.getOrderbook('BTCUSDT', 50);

      expect(result).toEqual({ bids: [], asks: [] });
      expect(axios.get).toHaveBeenCalledWith('https://api.exchange.example.com/orderbook', { params: { symbol: 'BTCUSDT', limit: 50 } });
    });
  });

  describe('getTrades', () => {
    it('fetches trades from API and caches them', async () => {
      mockRedisGet.mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: [{ id: 1 }] });
      mockRedisSet.mockResolvedValue('OK');

      const result = await service.getTrades('BTCUSDT', 10);

      expect(result).toEqual([{ id: 1 }]);
      expect(axios.get).toHaveBeenCalledWith('https://api.exchange.example.com/trades', { params: { symbol: 'BTCUSDT', limit: 10 } });
    });
  });

  describe('getKlines', () => {
    it('fetches klines from API and caches them', async () => {
      mockRedisGet.mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: [[1,2,3]] });
      mockRedisSet.mockResolvedValue('OK');

      const result = await service.getKlines('BTCUSDT', '1m', 1000, 2000, 500);

      expect(result).toEqual([[1,2,3]]);
      expect(axios.get).toHaveBeenCalledWith('https://api.exchange.example.com/klines', {
        params: { symbol: 'BTCUSDT', interval: '1m', startTime: 1000, endTime: 2000, limit: 500 }
      });
    });
  });
});