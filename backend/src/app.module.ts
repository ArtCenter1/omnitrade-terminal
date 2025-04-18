import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file *before* anything else
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Corrected path: up two levels

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'; // Import NestModule and MiddlewareConsumer
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketDataModule } from './market-data/market-data.module';
import { AuthModule } from './auth/auth.module'; // Assuming this is Firebase Auth
import { ExchangeApiKeyModule } from './exchange-api-key/exchange-api-key.module';
import { FirebaseAuthMiddleware } from './middleware/firebase-auth.middleware'; // Corrected import path
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { PortfolioModule } from './portfolio/portfolio.module';
// Determine which auth module to load based on environment variable
const authProvider = process.env.VITE_AUTH_PROVIDER;
const authModules = [];

if (authProvider === 'firebase') {
  authModules.push(AuthModule);
  console.log('Using Firebase Auth Module'); // Added log for confirmation
} else {
  // Optional: Handle cases where the provider is not set or invalid
  console.warn(
    `WARN: VITE_AUTH_PROVIDER is set to "${authProvider}", which is not "firebase". No specific auth module loaded.`,
  );
  // Decide if you want to default or throw an error
  // For now, we'll load neither if unspecified/invalid
}

@Module({
  imports: [
    // ConfigModule still needed for NestJS DI, but .env is already loaded by dotenv
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath should also use the correct path
      envFilePath: path.resolve(__dirname, '../../.env'),
    }),
    PrismaModule,
    RedisModule, // Add Redis module
    MarketDataModule,
    ...authModules, // Spread the conditionally added auth modules here
    ExchangeApiKeyModule,
    PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  // Implement NestModule
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FirebaseAuthMiddleware).forRoutes('*'); // Apply middleware to all routes
  }
}
