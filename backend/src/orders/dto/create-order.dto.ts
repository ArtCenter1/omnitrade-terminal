import { IsString, IsEnum, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';

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

export class CreateOrderDto {
  @IsString()
  exchangeId: string;

  @IsString()
  symbol: string;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsEnum(OrderType)
  type: OrderType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  stopPrice?: number;

  @IsNumber()
  @IsPositive()
  @Min(0.00000001)
  quantity: number;
}
