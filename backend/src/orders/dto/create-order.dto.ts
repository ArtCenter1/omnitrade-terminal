import {
  IsString,
  IsNumber,
  IsEnum,
  Min,
  ValidateIf,
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
 * DTO for creating a new order.
 * Includes conditional validation for price and stopPrice based on the order type.
 */
export class CreateOrderDto {
  @IsString()
  exchangeId: string;

  @IsString()
  symbol: string;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsEnum(OrderType)
  type: OrderType;

  @IsNumber()
  @Min(0.00000001)
  quantity: number;

  @ValidateIf(
    (o) => o.type === OrderType.LIMIT || o.type === OrderType.STOP_LIMIT,
  )
  @IsNumber()
  @Min(0.00000001)
  price?: number;

  @ValidateIf(
    (o) => o.type === OrderType.STOP || o.type === OrderType.STOP_LIMIT,
  )
  @IsNumber()
  @Min(0.00000001)
  stopPrice?: number;
}
