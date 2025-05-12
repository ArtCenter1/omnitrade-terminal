import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private inMemoryFallback: Record<string, { value: string; expiry: number }> =
    {};

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
          this.logger.warn(
            `Redis connection attempt ${times} failed. Retrying in ${delay}ms...`,
          );
          return delay;
        },
        reconnectOnError: (err) => {
          this.logger.error(`Redis connection error: ${err.message}`);
          return true; // Always try to reconnect
        },
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
        this.logger.warn(
          `Redis not connected, using in-memory fallback for GET ${key}`,
        );
        const now = Date.now();
        const item = this.inMemoryFallback[key];

        if (item && item.expiry > now) {
          return item.value;
        }

        return null;
      }
    } catch (error) {
      this.logger.error(
        `Error getting key ${key} from Redis: ${error.message}`,
      );
      // Fall back to in-memory cache
      const item = this.inMemoryFallback[key];
      return item && item.expiry > Date.now() ? item.value : null;
    }
  }

  /**
   * Get a value from Redis with stale-while-revalidate pattern
   * This will return stale data immediately while triggering a background refresh
   *
   * @param key The key to get
   * @param ttlSeconds The TTL in seconds for the refreshed data
   * @param fetchFn The function to call to refresh the data
   * @param staleTtlSeconds How long after expiration to still use stale data (default: 1 hour)
   */
  async getWithRevalidate(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<string>,
    staleTtlSeconds: number = 3600
  ): Promise<string | null> {
    try {
      // First try to get from Redis
      let value: string | null = null;
      let isStale = false;

      if (this.isConnected && this.client) {
        try {
          // Get both the value and its TTL
          const [valueResult, ttlResult] = await Promise.all([
            this.client.get(key),
            this.client.ttl(key)
          ]);

          value = valueResult;

          // If TTL is -1 (no expiry) or positive, it's fresh
          // If TTL is -2, the key doesn't exist
          // If TTL is between -1 and -staleTtlSeconds, it's stale but usable
          if (ttlResult === -2) {
            // Key doesn't exist
            value = null;
          } else if (ttlResult < 0 && ttlResult !== -1) {
            // Key exists but has expired
            isStale = true;

            // Check if it's within our stale window
            // Convert TTL to positive seconds since expiration
            const secondsSinceExpiration = Math.abs(ttlResult + 1);
            if (secondsSinceExpiration > staleTtlSeconds) {
              // Too old, don't use
              value = null;
            }
          }
        } catch (redisError) {
          this.logger.error(`Redis error in getWithRevalidate for ${key}: ${redisError.message}`);
          // Fall back to in-memory cache
          const now = Date.now();
          const item = this.inMemoryFallback[key];

          if (item) {
            if (item.expiry > now) {
              // Fresh data
              value = item.value;
              this.logger.log(`Using in-memory fallback for ${key} due to Redis error`);
            } else if (item.expiry > now - staleTtlSeconds * 1000) {
              // Stale but usable data
              value = item.value;
              isStale = true;
              this.logger.log(`Using stale in-memory fallback for ${key} due to Redis error`);
            }
          }
        }
      } else {
        // Redis not connected, check in-memory
        const now = Date.now();
        const item = this.inMemoryFallback[key];

        if (item) {
          if (item.expiry > now) {
            // Fresh data
            value = item.value;
            this.logger.log(`Using in-memory fallback for ${key} (Redis not connected)`);
          } else if (item.expiry > now - staleTtlSeconds * 1000) {
            // Stale but usable data
            value = item.value;
            isStale = true;
            this.logger.log(`Using stale in-memory fallback for ${key} (Redis not connected)`);
          }
        }
      }

      // If we have a value (fresh or stale) and it's stale, trigger a background refresh
      if (value !== null && isStale) {
        this.logger.log(`Returning stale data for ${key} while refreshing in background`);

        // Don't await this - let it run in the background
        this.refreshCache(key, ttlSeconds, fetchFn).catch(err => {
          this.logger.error(`Background refresh failed for ${key}: ${err.message}`);
        });
      } else if (value === null) {
        // No value found, fetch fresh data
        this.logger.log(`No data found for ${key}, fetching fresh data`);
        try {
          value = await fetchFn();
          await this.set(key, value, ttlSeconds);
        } catch (fetchError) {
          this.logger.error(`Failed to fetch data for ${key}: ${fetchError.message}`);

          // Last resort: try to get any expired data from Redis or memory
          try {
            const expiredData = await this.getWithoutExpiry(key);
            if (expiredData) {
              this.logger.warn(`Using expired data for ${key} as last resort after fetch failure`);
              return expiredData;
            }
          } catch (lastResortError) {
            this.logger.error(`Failed to get expired data for ${key}: ${lastResortError.message}`);
          }

          return null;
        }
      }

      return value;
    } catch (error) {
      this.logger.error(`Error in getWithRevalidate for ${key}: ${error.message}`);

      // Last resort: try to get any data from memory
      const item = this.inMemoryFallback[key];
      if (item) {
        this.logger.warn(`Using potentially expired in-memory data for ${key} after error`);
        return item.value;
      }

      return null;
    }
  }

  /**
   * Refresh cache in the background
   * @private
   */
  private async refreshCache(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<string>
  ): Promise<void> {
    try {
      const freshData = await fetchFn();
      await this.set(key, freshData, ttlSeconds);
      this.logger.log(`Successfully refreshed cache for ${key}`);
    } catch (error) {
      this.logger.error(`Failed to refresh cache for ${key}: ${error.message}`);
      throw error;
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
        this.logger.warn(
          `Redis not connected, using in-memory fallback for SET ${key}`,
        );
        // Store in in-memory fallback
        this.inMemoryFallback[key] = {
          value,
          expiry: ttlSeconds
            ? Date.now() + ttlSeconds * 1000
            : Number.MAX_SAFE_INTEGER,
        };
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis: ${error.message}`);
      // Store in in-memory fallback
      this.inMemoryFallback[key] = {
        value,
        expiry: ttlSeconds
          ? Date.now() + ttlSeconds * 1000
          : Number.MAX_SAFE_INTEGER,
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
        this.logger.warn(
          `Redis not connected, using in-memory fallback for INCR ${key}`,
        );
        // Increment in in-memory fallback
        const item = this.inMemoryFallback[key];
        const currentValue = item ? parseInt(item.value, 10) || 0 : 0;
        const newValue = currentValue + 1;

        this.inMemoryFallback[key] = {
          value: newValue.toString(),
          expiry: item?.expiry || Number.MAX_SAFE_INTEGER,
        };

        return newValue;
      }
    } catch (error) {
      this.logger.error(
        `Error incrementing key ${key} in Redis: ${error.message}`,
      );
      // Increment in in-memory fallback
      const item = this.inMemoryFallback[key];
      const currentValue = item ? parseInt(item.value, 10) || 0 : 0;
      const newValue = currentValue + 1;

      this.inMemoryFallback[key] = {
        value: newValue.toString(),
        expiry: item?.expiry || Number.MAX_SAFE_INTEGER,
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
        this.logger.warn(
          `Redis not connected, using in-memory fallback for EXPIRE ${key}`,
        );
        // Set expiry in in-memory fallback
        const item = this.inMemoryFallback[key];
        if (item) {
          item.expiry = Date.now() + ttlSeconds * 1000;
        }
      }
    } catch (error) {
      this.logger.error(
        `Error setting expiry for key ${key} in Redis: ${error.message}`,
      );
      // Set expiry in in-memory fallback
      const item = this.inMemoryFallback[key];
      if (item) {
        item.expiry = Date.now() + ttlSeconds * 1000;
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

  /**
   * Get a value from Redis or in-memory cache even if it's expired
   * This is useful for fallback when Redis is down or network errors occur
   */
  async getWithoutExpiry(key: string): Promise<string | null> {
    try {
      // First try to get from Redis if connected
      if (this.isConnected && this.client) {
        try {
          const value = await this.client.get(key);
          if (value) {
            this.logger.log(`Retrieved data for ${key} from Redis`);
            return value;
          }
        } catch (redisError) {
          this.logger.error(
            `Redis error in getWithoutExpiry for ${key}: ${redisError.message}`,
          );
          // Continue to in-memory fallback
        }
      }

      // If not in Redis or Redis is not connected, check in-memory fallback
      // regardless of expiry
      const item = this.inMemoryFallback[key];
      if (item) {
        const isExpired = item.expiry < Date.now();
        this.logger.warn(
          `Using ${isExpired ? 'expired' : 'unexpired'} data for key ${key} from in-memory cache`,
        );
        return item.value;
      }

      this.logger.warn(`No data found for ${key} in Redis or in-memory cache`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error getting key ${key} without expiry: ${error.message}`,
      );

      // Last resort: check in-memory fallback
      const item = this.inMemoryFallback[key];
      if (item) {
        this.logger.warn(`Last resort: using in-memory data for ${key} after error`);
        return item.value;
      }
      return null;
    }
  }
}
