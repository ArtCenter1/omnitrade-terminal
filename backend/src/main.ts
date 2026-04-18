import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  globalRateLimiter,
  passwordResetLimiter,
} from './middleware/rate-limiter.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security: Trust proxy for correct IP identification behind a reverse proxy (e.g., Nginx, Vercel)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security: CORS configuration with whitelist
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Security: Disable X-Powered-By header to reduce information leakage
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Security: Manually enforce standard security headers
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Security: Global rate limiting
  app.use(globalRateLimiter);

  // Security: Specific rate limiting for sensitive endpoints
  app.use('/api/auth/password-reset-request', passwordResetLimiter);

  // Apply ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw errors if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow conversion of primitive types
      },
    }),
  );

  // Set global API prefix
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 8888);
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1); // Exit if bootstrap fails
});
