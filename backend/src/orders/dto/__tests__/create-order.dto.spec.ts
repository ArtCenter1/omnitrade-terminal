import { validate } from 'class-validator';
import { CreateOrderDto } from '../create-order.dto';

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

  it('should validate a valid market order', async () => {
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid limit order', async () => {
    dto.type = 'limit';
    dto.price = 50000;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if exchangeId is missing', async () => {
    delete (dto as any).exchangeId;
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

  it('should fail if quantity is negative', async () => {
    dto.quantity = -1;
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

  it('should fail if price or stopPrice is missing for stop_limit order', async () => {
    dto.type = 'stop_limit';
    let errors = await validate(dto);
    expect(errors.length).toBe(2); // Both price and stopPrice should fail

    dto.price = 50000;
    errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('stopPrice');

    dto.stopPrice = 51000;
    errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
