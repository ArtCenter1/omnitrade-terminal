import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { globalRateLimiter } from './middleware/rate-limiter.middleware';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global rate limiting
  app.use(globalRateLimiter);

  // Security: Disable X-Powered-By header
  const expressApp = app.getHttpAdapter().getInstance();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  expressApp.disable('x-powered-by');

  // Security: Manually set security headers (Defense in Depth)
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    );
    next();
  });

  // Security: CORS Whitelist configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

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
