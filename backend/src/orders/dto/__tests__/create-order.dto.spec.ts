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

  it('should validate a correct market order', async () => {
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should require price for limit orders', async () => {
    dto.type = OrderType.LIMIT;
    let errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('price');

    dto.price = 50000;
    errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should require stopPrice for stop orders', async () => {
    dto.type = OrderType.STOP;
    let errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('stopPrice');

    dto.stopPrice = 45000;
    errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should require both price and stopPrice for stop_limit orders', async () => {
    dto.type = OrderType.STOP_LIMIT;
    let errors = await validate(dto);
    expect(errors.length).toBe(2);

    dto.price = 50000;
    errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('stopPrice');

    dto.stopPrice = 45000;
    errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if quantity is 0 or negative', async () => {
    dto.quantity = 0;
    let errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    dto.quantity = -1;
    errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if side is invalid', async () => {
    (dto as any).side = 'invalid';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if type is invalid', async () => {
    (dto as any).type = 'invalid';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
