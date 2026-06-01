import { validate } from 'class-validator';
import { CreateExchangeApiKeyDto } from '../create-exchange-api-key.dto';

describe('CreateExchangeApiKeyDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = new CreateExchangeApiKeyDto();
    dto.exchange_id = 'binance';
    dto.api_key = 'valid_key';
    dto.api_secret = 'valid_secret';
    dto.key_nickname = 'My Key';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if exchange_id is too long', async () => {
    const dto = new CreateExchangeApiKeyDto();
    dto.exchange_id = 'a'.repeat(51);
    dto.api_key = 'valid_key';
    dto.api_secret = 'valid_secret';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('exchange_id');
  });

  it('should fail if key_nickname is too long', async () => {
    const dto = new CreateExchangeApiKeyDto();
    dto.exchange_id = 'binance';
    dto.api_key = 'valid_key';
    dto.api_secret = 'valid_secret';
    dto.key_nickname = 'a'.repeat(101);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('key_nickname');
  });

  it('should pass if key_nickname is omitted (optional)', async () => {
    const dto = new CreateExchangeApiKeyDto();
    dto.exchange_id = 'binance';
    dto.api_key = 'valid_key';
    dto.api_secret = 'valid_secret';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
