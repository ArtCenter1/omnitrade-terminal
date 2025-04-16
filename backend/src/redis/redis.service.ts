import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private inMemoryFallback: Record<string, { value: string; expiry: number }> = {};

  constructor() {
    this.initializeRedis();
  }

  async onModuleInit() {
    // This is called when the module is initialized
    // The connection is already attempted in the constructor
  }

  private initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.logger.log(`Attempting to connect to Redis at ${redisUrl}`);
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 200, 3000);
          this.logger.warn(`Redis connection attempt ${times} failed. Retrying in ${delay}ms...`);
          return delay;
        },
        reconnectOnError: (err) => {
          this.logger.error(`Redis connection error: ${err.message}`);
          return true; // Always try to reconnect
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Successfully connected to Redis');
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis error: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.logger.log('Reconnecting to Redis...');
      });
    } catch (error) {
      this.logger.error(`Failed to initialize Redis: ${error.message}`);
      this.isConnected = false;
    }
  }

  /**
   * Get a value from Redis with fallback to in-memory cache
   */
  async get(key: string): Promise<string | null> {
    try {
      if (this.isConnected && this.client) {
        return await this.client.get(key);
      } else {
        this.logger.warn(`Redis not connected, using in-memory fallback for GET ${key}`);
        const now = Date.now();
        const item = this.inMemoryFallback[key];
        
        if (item && item.expiry > now) {
          return item.value;
        }
        
        return null;
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key} from Redis: ${error.message}`);
      // Fall back to in-memory cache
      const item = this.inMemoryFallback[key];
      return item && item.expiry > Date.now() ? item.value : null;
    }
  }

  /**
   * Set a value in Redis with fallback to in-memory cache
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
      } else {
        this.logger.warn(`Redis not connected, using in-memory fallback for SET ${key}`);
        // Store in in-memory fallback
        this.inMemoryFallback[key] = {
          value,
          expiry: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : Number.MAX_SAFE_INTEGER
        };
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis: ${error.message}`);
      // Store in in-memory fallback
      this.inMemoryFallback[key] = {
        value,
        expiry: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : Number.MAX_SAFE_INTEGER
      };
    }
  }

  /**
   * Increment a value in Redis with fallback to in-memory cache
   */
  async incr(key: string): Promise<number> {
    try {
      if (this.isConnected && this.client) {
        return await this.client.incr(key);
      } else {
        this.logger.warn(`Redis not connected, using in-memory fallback for INCR ${key}`);
        // Increment in in-memory fallback
        const item = this.inMemoryFallback[key];
        const currentValue = item ? parseInt(item.value, 10) || 0 : 0;
        const newValue = currentValue + 1;
        
        this.inMemoryFallback[key] = {
          value: newValue.toString(),
          expiry: item?.expiry || Number.MAX_SAFE_INTEGER
        };
        
        return newValue;
      }
    } catch (error) {
      this.logger.error(`Error incrementing key ${key} in Redis: ${error.message}`);
      // Increment in in-memory fallback
      const item = this.inMemoryFallback[key];
      const currentValue = item ? parseInt(item.value, 10) || 0 : 0;
      const newValue = currentValue + 1;
      
      this.inMemoryFallback[key] = {
        value: newValue.toString(),
        expiry: item?.expiry || Number.MAX_SAFE_INTEGER
      };
      
      return newValue;
    }
  }

  /**
   * Set expiry on a key in Redis with fallback to in-memory cache
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.expire(key, ttlSeconds);
      } else {
        this.logger.warn(`Redis not connected, using in-memory fallback for EXPIRE ${key}`);
        // Set expiry in in-memory fallback
        const item = this.inMemoryFallback[key];
        if (item) {
          item.expiry = Date.now() + (ttlSeconds * 1000);
        }
      }
    } catch (error) {
      this.logger.error(`Error setting expiry for key ${key} in Redis: ${error.message}`);
      // Set expiry in in-memory fallback
      const item = this.inMemoryFallback[key];
      if (item) {
        item.expiry = Date.now() + (ttlSeconds * 1000);
      }
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the Redis client (use with caution)
   */
  getClient(): Redis | null {
    return this.client;
  }
}
