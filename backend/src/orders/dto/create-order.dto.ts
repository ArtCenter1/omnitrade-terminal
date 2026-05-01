import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
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
 * Enforces strict validation for order parameters.
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stopPrice?: number;

  @IsNumber()
  @Min(0.00000001)
  quantity: number;
}
