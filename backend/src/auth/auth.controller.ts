import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
@Controller('auth')
export class AuthController {
  // TODO: Implement password reset using Firebase Admin SDK
  @Post('password-reset-request')
  async handlePasswordResetRequest(
    @Body() body: { email: string },
  ): Promise<{ message: string }> {
    // Ensure email is provided
    if (!body || !body.email) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }
    // Placeholder: Firebase password reset not yet implemented
    throw new HttpException(
      'Password reset via Firebase not yet implemented.',
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
