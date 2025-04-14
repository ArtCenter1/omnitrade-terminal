import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { passwordResetLimiter } from '../middleware/rate-limiter.middleware';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(passwordResetLimiter).forRoutes({
      path: 'auth/password-reset-request', // Correct path relative to controller prefix
      method: RequestMethod.POST,
    });
  }
}
