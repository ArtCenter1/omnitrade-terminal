import { validateSync } from 'class-validator';

import {
  SymbolDto,
  OrderbookDto,
  TradesDto,
  KlinesDto,
} from '../market-data.controller';

describe('DTO Validation', () => {
  describe('SymbolDto', () => {
    it('validates correct symbol', () => {
      const dto = Object.assign(new SymbolDto(), { symbol: 'BTCUSDT' });
      const errors = validateSync(dto);
      expect(errors.length).toBe(0);
    });

    it('fails on missing symbol', () => {
      const dto = new SymbolDto();
      const errors = validateSync(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('OrderbookDto', () => {
    it('validates with optional limit', () => {
      const dto = Object.assign(new OrderbookDto(), { symbol: 'BTCUSDT', limit: '50' });
      const errors = validateSync(dto);
      expect(errors.length).toBe(0);
    });

    it('fails with invalid limit', () => {
      const dto = Object.assign(new OrderbookDto(), { symbol: 'BTCUSDT', limit: 'abc' });
      const errors = validateSync(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('TradesDto', () => {
    it('validates with optional limit', () => {
      const dto = Object.assign(new TradesDto(), { symbol: 'BTCUSDT', limit: '100' });
      const errors = validateSync(dto);
      expect(errors.length).toBe(0);
    });

    it('fails with invalid limit', () => {
      const dto = Object.assign(new TradesDto(), { symbol: 'BTCUSDT', limit: 'xyz' });
      const errors = validateSync(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('KlinesDto', () => {
    it('validates correct input', () => {
      const dto = Object.assign(new KlinesDto(), {
        symbol: 'BTCUSDT',
        interval: '1m',
        startTime: '1000',
        endTime: '2000',
        limit: '500',
      });
      const errors = validateSync(dto);
      expect(errors.length).toBe(0);
    });

    it('fails with missing required interval', () => {
      const dto = Object.assign(new KlinesDto(), { symbol: 'BTCUSDT' });
      const errors = validateSync(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('fails with invalid number strings', () => {
      const dto = Object.assign(new KlinesDto(), {
        symbol: 'BTCUSDT',
        interval: '1m',
        startTime: 'abc',
        endTime: 'def',
        limit: 'ghi',
      });
      const errors = validateSync(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});