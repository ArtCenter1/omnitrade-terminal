import { IsEmail } from 'class-validator';

/**
 * DTO for password reset requests.
 */
export class PasswordResetRequestDto {
  @IsEmail()
  email: string;
}
