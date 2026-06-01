import { validate } from 'class-validator';
import { PasswordResetRequestDto } from '../password-reset-request.dto';

describe('PasswordResetRequestDto', () => {
  it('should validate a valid email', async () => {
    const dto = new PasswordResetRequestDto();
    dto.email = 'test@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail on an invalid email', async () => {
    const dto = new PasswordResetRequestDto();
    dto.email = 'invalid-email';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail on empty email', async () => {
    const dto = new PasswordResetRequestDto();
    // @ts-ignore
    dto.email = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
