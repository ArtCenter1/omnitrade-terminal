import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Ensure ConfigModule is imported if ConfigService is used
  providers: [SupabaseService],
  exports: [SupabaseService], // Export SupabaseService for other modules
})
export class SupabaseModule {}
