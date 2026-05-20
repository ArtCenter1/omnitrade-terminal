import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('CreateOrderDto Validation', () => {
  const validatorOptions = {};

  const toDto = (plain: any) => {
    return plainToInstance(CreateOrderDto, plain);
  };

  it('should validate a valid market order', async () => {
    const dto = toDto({
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      quantity: 0.1,
    });
    const errors = await validate(dto, validatorOptions);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid limit order', async () => {
    const dto = toDto({
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      side: 'sell',
      type: 'limit',
      price: 50000,
      quantity: 0.1,
    });
    const errors = await validate(dto, validatorOptions);
    expect(errors.length).toBe(0);
  });

  it('should fail if exchangeId is missing', async () => {
    const dto = toDto({
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      quantity: 0.1,
    });
    const errors = await validate(dto, validatorOptions);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('exchangeId');
  });

  it('should fail if price is missing for limit order', async () => {
    const dto = toDto({
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'limit',
      quantity: 0.1,
    });
    const errors = await validate(dto, validatorOptions);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.property === 'price')).toBeDefined();
  });

  it('should fail if stopPrice is missing for stop order', async () => {
    const dto = toDto({
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'stop',
      quantity: 0.1,
    });
    const errors = await validate(dto, validatorOptions);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.property === 'stopPrice')).toBeDefined();
  });

  it('should fail if quantity is 0', async () => {
    const dto = toDto({
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      quantity: 0,
    });
    const errors = await validate(dto, validatorOptions);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.find(e => e.property === 'quantity')).toBeDefined();
  });
});
