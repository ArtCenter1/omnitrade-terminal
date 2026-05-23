import { IsString, IsEnum, IsNumber, IsPositive, ValidateIf } from 'class-validator';

/**
 * DTO for placing a new order.
 * Includes validation for order types and their required fields.
 */
export class CreateOrderDto {
  @IsString()
  exchangeId: string;

  @IsString()
  symbol: string;

  @IsEnum(['buy', 'sell'], {
    message: 'Side must be either "buy" or "sell"',
  })
  side: 'buy' | 'sell';

  @IsEnum(['market', 'limit', 'stop', 'stop_limit'], {
    message: 'Type must be "market", "limit", "stop", or "stop_limit"',
  })
  type: 'market' | 'limit' | 'stop' | 'stop_limit';

  @IsNumber()
  @IsPositive()
  quantity: number;

  @ValidateIf((o) => o.type === 'limit' || o.type === 'stop_limit')
  @IsNumber()
  @IsPositive()
  price?: number;

  @ValidateIf((o) => o.type === 'stop' || o.type === 'stop_limit')
  @IsNumber()
  @IsPositive()
  stopPrice?: number;
}
