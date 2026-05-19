import { IsString, IsEnum, IsNumber, IsPositive, IsOptional, Length } from 'class-validator';

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
  @Length(1, 50)
  exchangeId: string;

  @IsString()
  @Length(1, 50)
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
  quantity: number;
}
