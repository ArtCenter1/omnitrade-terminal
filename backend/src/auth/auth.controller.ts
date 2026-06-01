import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
@Controller('auth')
export class AuthController {
  // TODO: Implement password reset using Firebase Admin SDK
  @Post('password-reset-request')
  handlePasswordResetRequest(
    @Body() dto: PasswordResetRequestDto,
  ): Promise<{ message: string }> {
    // Placeholder: Firebase password reset not yet implemented
    throw new HttpException(
      'Password reset via Firebase not yet implemented.',
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
