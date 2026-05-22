import { validate } from 'class-validator';
import { CreateOrderDto } from '../dto/create-order.dto';
import { plainToInstance } from 'class-transformer';

describe('CreateOrderDto', () => {
  const validBaseOrder = {
    exchangeId: 'binance',
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'market',
    quantity: 1,
  };

  it('should validate a valid market order', async () => {
    const dto = plainToInstance(CreateOrderDto, validBaseOrder);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid limit order with price', async () => {
    const order = { ...validBaseOrder, type: 'limit', price: 50000 };
    const dto = plainToInstance(CreateOrderDto, order);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail a limit order without price', async () => {
    const order = { ...validBaseOrder, type: 'limit' };
    const dto = plainToInstance(CreateOrderDto, order);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('price');
  });

  it('should validate a valid stop order with stopPrice', async () => {
    const order = { ...validBaseOrder, type: 'stop', stopPrice: 49000 };
    const dto = plainToInstance(CreateOrderDto, order);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail a stop order without stopPrice', async () => {
    const order = { ...validBaseOrder, type: 'stop' };
    const dto = plainToInstance(CreateOrderDto, order);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('stopPrice');
  });

  it('should validate a valid stop_limit order with both price and stopPrice', async () => {
    const order = {
      ...validBaseOrder,
      type: 'stop_limit',
      price: 50000,
      stopPrice: 49000,
    };
    const dto = plainToInstance(CreateOrderDto, order);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail a stop_limit order without price or stopPrice', async () => {
    const order = { ...validBaseOrder, type: 'stop_limit' };
    const dto = plainToInstance(CreateOrderDto, order);
    const errors = await validate(dto);
    // Should have errors for both price and stopPrice
    expect(errors.some((e) => e.property === 'price')).toBeTruthy();
    expect(errors.some((e) => e.property === 'stopPrice')).toBeTruthy();
  });

  it('should fail with invalid side', async () => {
    const order = { ...validBaseOrder, side: 'invalid' };
    const dto = plainToInstance(CreateOrderDto, order);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('side');
  });

  it('should fail with negative quantity', async () => {
    const order = { ...validBaseOrder, quantity: -1 };
    const dto = plainToInstance(CreateOrderDto, order);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('quantity');
  });
});
