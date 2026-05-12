import { IsString, IsNumber, IsPositive, IsOptional, IsEnum, MinLength } from 'class-validator';

/**
 * DTO for placing a new order.
 */
export class CreateOrderDto {
  @IsString()
  @MinLength(1)
  exchangeId: string;

  @IsString()
  @MinLength(1)
  symbol: string;

  @IsEnum(['buy', 'sell'])
  side: 'buy' | 'sell';

  @IsEnum(['market', 'limit', 'stop', 'stop_limit'])
  type: 'market' | 'limit' | 'stop' | 'stop_limit';

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
