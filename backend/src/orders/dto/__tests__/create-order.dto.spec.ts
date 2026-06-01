import { validate } from 'class-validator';
import { CreateOrderDto, OrderSide, OrderType } from '../create-order.dto';

describe('CreateOrderDto', () => {
  let dto: CreateOrderDto;

  beforeEach(() => {
    dto = new CreateOrderDto();
    dto.exchangeId = 'binance';
    dto.symbol = 'BTC/USDT';
    dto.side = OrderSide.BUY;
    dto.type = OrderType.MARKET;
    dto.quantity = 1;
  });

  it('should pass validation with valid market order data', async () => {
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if exchangeId is missing', async () => {
    delete (dto as any).exchangeId;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('exchangeId');
  });

  it('should fail if quantity is not positive', async () => {
    dto.quantity = -1;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('quantity');
  });

  it('should fail if price is missing for limit order', async () => {
    dto.type = OrderType.LIMIT;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    expect(errors[0].constraints?.isNotEmpty).toContain('Price is required');
  });

  it('should pass if price is provided for limit order', async () => {
    dto.type = OrderType.LIMIT;
    dto.price = 50000;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if stopPrice is missing for stop order', async () => {
    dto.type = OrderType.STOP;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    expect(errors[0].constraints?.isNotEmpty).toContain(
      'Stop price is required',
    );
  });

  it('should pass if stopPrice is provided for stop order', async () => {
    dto.type = OrderType.STOP;
    dto.stopPrice = 49000;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if price or stopPrice is missing for stop-limit order', async () => {
    dto.type = OrderType.STOP_LIMIT;
    const errors = await validate(dto);
    // Should have errors for both price and stopPrice
    expect(errors.length).toBe(2);
  });

  it('should pass if both price and stopPrice are provided for stop-limit order', async () => {
    dto.type = OrderType.STOP_LIMIT;
    dto.price = 50000;
    dto.stopPrice = 49000;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
