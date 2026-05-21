import { validate } from 'class-validator';
import { CreateOrderDto } from '../dto/create-order.dto';

describe('CreateOrderDto', () => {
  let dto: CreateOrderDto;

  beforeEach(() => {
    dto = new CreateOrderDto();
    dto.exchangeId = 'binance';
    dto.symbol = 'BTC/USDT';
    dto.side = 'buy';
    dto.type = 'market';
    dto.quantity = 1;
  });

  it('should pass with valid market order', async () => {
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with valid limit order', async () => {
    dto.type = 'limit';
    dto.price = 50000;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if exchangeId is too long', async () => {
    dto.exchangeId = 'a'.repeat(51);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('exchangeId');
  });

  it('should fail if side is invalid', async () => {
    (dto as any).side = 'invalid';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('side');
  });

  it('should fail if quantity is not positive', async () => {
    dto.quantity = 0;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('quantity');
  });

  it('should fail if price is missing for limit order', async () => {
    dto.type = 'limit';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('price');
  });

  it('should fail if stopPrice is missing for stop order', async () => {
    dto.type = 'stop';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('stopPrice');
  });

  it('should fail if both price and stopPrice are missing for stop_limit order', async () => {
    dto.type = 'stop_limit';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    // Should have errors for both price and stopPrice
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('price');
    expect(properties).toContain('stopPrice');
  });
});
