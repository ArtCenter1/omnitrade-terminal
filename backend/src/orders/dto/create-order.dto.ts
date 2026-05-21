import {
  IsString,
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  Length,
  ValidateIf,
  IsDefined,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @Length(1, 50)
  exchangeId: string;

  @IsString()
  @Length(1, 50)
  symbol: string;

  @IsEnum(['buy', 'sell'])
  side: 'buy' | 'sell';

  @IsEnum(['market', 'limit', 'stop', 'stop_limit'])
  type: 'market' | 'limit' | 'stop' | 'stop_limit';

  @ValidateIf((o) => o.type === 'limit' || o.type === 'stop_limit')
  @IsDefined()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ValidateIf((o) => o.type === 'stop' || o.type === 'stop_limit')
  @IsDefined()
  @IsNumber()
  @IsPositive()
  stopPrice?: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
