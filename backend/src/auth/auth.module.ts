import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { passwordResetLimiter } from '../middleware/rate-limiter.middleware';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(passwordResetLimiter).forRoutes({
      path: 'auth/password-reset-request', // Correct path relative to controller prefix
      method: RequestMethod.POST,
    });
  }
}
