import { IsString, IsOptional, Length } from 'class-validator';

/**
 * DTO for adding a new exchange API key.
 */
export class CreateExchangeApiKeyDto {
  @IsString()
  exchange_id: string;

  @IsString()
  @Length(1, 255)
  api_key: string;

  @IsString()
  @Length(1, 255)
  api_secret: string;

  @IsOptional()
  @IsString()
  key_nickname?: string;
}