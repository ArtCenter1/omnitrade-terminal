import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsPositive,
  ValidateIf,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  exchangeId: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsEnum(['buy', 'sell'])
  side: 'buy' | 'sell';

  @IsEnum(['market', 'limit', 'stop', 'stop_limit'])
  type: 'market' | 'limit' | 'stop' | 'stop_limit';

  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.type === 'limit' || o.type === 'stop_limit')
  price?: number;

  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.type === 'stop' || o.type === 'stop_limit')
  stopPrice?: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
