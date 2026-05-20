import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsNumber,
  Min,
  ValidateIf,
  IsOptional,
} from 'class-validator';

/**
 * DTO for placing a new order.
 * Now implemented as a class to enable runtime validation and transformation.
 */
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  exchangeId: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsIn(['buy', 'sell'])
  side: 'buy' | 'sell';

  @IsIn(['market', 'limit', 'stop', 'stop_limit'])
  type: 'market' | 'limit' | 'stop' | 'stop_limit';

  @ValidateIf((o) => o.type === 'limit' || o.type === 'stop_limit')
  @IsNumber()
  @Min(0)
  price?: number;

  @ValidateIf((o) => o.type === 'stop' || o.type === 'stop_limit')
  @IsNumber()
  @Min(0)
  stopPrice?: number;

  @IsNumber()
  @Min(0.00000001, { message: 'Quantity must be greater than 0' })
  quantity: number;
}
