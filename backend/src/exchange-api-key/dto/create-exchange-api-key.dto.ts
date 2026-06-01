import { IsString, IsOptional, Length } from 'class-validator';

/**
 * DTO for adding a new exchange API key.
 */
export class CreateExchangeApiKeyDto {
  @IsString()
  @Length(1, 50)
  exchange_id: string;

  @IsString()
  @Length(1, 255)
  api_key: string;

  @IsString()
  @Length(1, 255)
  api_secret: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  key_nickname?: string;
}
