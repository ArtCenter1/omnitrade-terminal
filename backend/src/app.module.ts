import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file *before* anything else
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Corrected path: up two levels

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketDataModule } from './market-data/market-data.module';
import { AuthModule } from './auth/auth.module'; // Assuming this is Firebase Auth
import { SupabaseModule } from './supabase/supabase.module';
// Determine which auth module to load based on environment variable
const authProvider = process.env.VITE_AUTH_PROVIDER;
const authModules = [];

if (authProvider === 'firebase') {
  authModules.push(AuthModule);
  console.log('Using Firebase Auth Module'); // Added log for confirmation
} else if (authProvider === 'supabase') {
  authModules.push(SupabaseModule);
  console.log('Using Supabase Auth Module'); // Added log for confirmation
} else {
  // Optional: Handle cases where the provider is not set or invalid
  console.warn(
    `WARN: VITE_AUTH_PROVIDER is set to "${authProvider}", which is not "firebase" or "supabase". No specific auth module loaded.`,
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
    MarketDataModule,
    ...authModules, // Spread the conditionally added auth modules here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
