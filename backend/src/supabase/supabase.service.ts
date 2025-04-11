import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'Supabase URL and Key must be provided in environment variables',
      );
      throw new Error('Supabase configuration is missing');
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Supabase client:', error);
      throw error; // Re-throw the error to prevent the application from starting incorrectly
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      this.logger.error('Supabase client requested before initialization');
      throw new Error('Supabase client not initialized');
    }
    return this.supabase;
  }
}
