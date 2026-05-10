import { IsString, IsNumber, IsEnum, IsPositive, ValidateIf } from 'class-validator';

/**
 * DTO for creating a new order.
 * Includes strict validation for different order types.
 */
export class CreateOrderDto {
  @IsString()
  exchangeId: string;

  @IsString()
  symbol: string;

  @IsEnum(['buy', 'sell'], {
    message: 'side must be either "buy" or "sell"',
  })
  side: 'buy' | 'sell';

  @IsEnum(['market', 'limit', 'stop', 'stop_limit'], {
    message: 'type must be one of: market, limit, stop, stop_limit',
  })
  type: 'market' | 'limit' | 'stop' | 'stop_limit';

  @ValidateIf((o) => o.type === 'limit' || o.type === 'stop_limit')
  @IsNumber()
  @IsPositive()
  price?: number;

  @ValidateIf((o) => o.type === 'stop' || o.type === 'stop_limit')
  @IsNumber()
  @IsPositive()
  stopPrice?: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
