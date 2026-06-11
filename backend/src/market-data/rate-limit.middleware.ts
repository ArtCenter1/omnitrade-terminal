import {
  Injectable,
  NestMiddleware,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const apiKey = req.header('x-api-key');

      // Security: Use IP-based rate limiting for anonymous requests to prevent global bucket exhaustion.
      // Authenticated requests (with x-api-key) use a separate bucket with a higher limit.
      const key = apiKey
        ? `rate_limit:key:${apiKey}`
        : `rate_limit:ip:${req.ip || 'anonymous'}`;

      const limit = apiKey ? 100 : 10; // 100 req/min with key, 10 req/min per IP
      const ttlSeconds = 60;

      const current = await this.redisService.incr(key);
      if (current === 1) {
        await this.redisService.expire(key, ttlSeconds);
      }

      if (current > limit) {
        throw new HttpException('Rate limit exceeded', 429);
      }

      next();
    } catch (error) {
      // If it's a rate limit exception (HttpException), rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // For any other error (e.g., Redis failure), log it and fail-open to ensure availability
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Rate limiting error: ${errorMessage}`);
      next();
    }
  }
}
