import {
  IsString,
  IsNumber,
  IsEnum,
  IsPositive,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit',
}

/**
 * DTO for placing a new order.
 * Validates that price is provided for limit orders and stopPrice for stop orders.
 */
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  exchangeId: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsEnum(OrderType)
  type: OrderType;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @ValidateIf(
    (o) => o.type === OrderType.LIMIT || o.type === OrderType.STOP_LIMIT,
  )
  @IsNotEmpty({ message: 'Price is required for limit and stop-limit orders' })
  @IsNumber()
  @IsPositive()
  price?: number;

  @ValidateIf(
    (o) => o.type === OrderType.STOP || o.type === OrderType.STOP_LIMIT,
  )
  @IsNotEmpty({
    message: 'Stop price is required for stop and stop-limit orders',
  })
  @IsNumber()
  @IsPositive()
  stopPrice?: number;
}
