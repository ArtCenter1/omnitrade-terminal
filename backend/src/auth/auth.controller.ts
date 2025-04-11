import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthError } from '@supabase/supabase-js';

@Controller('auth')
export class AuthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post('password-reset-request')
  async handlePasswordResetRequest(
    @Body() body: { email: string },
  ): Promise<{ message: string }> {
    // Ensure email is provided
    if (!body || !body.email) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const { error } = await this.supabase
        .getClient()
        .auth.resetPasswordForEmail(body.email, {
          redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
        });

      if (error) {
        console.error('Supabase password reset error:', error);
        throw new HttpException(
          error.message || 'Failed to send password reset email',
          error instanceof AuthError
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        message:
          'If an account exists for this email, a password reset link has been sent.',
      };
    } catch (err) {
      console.error('Unexpected error in password reset request:', err);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'An internal server error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
