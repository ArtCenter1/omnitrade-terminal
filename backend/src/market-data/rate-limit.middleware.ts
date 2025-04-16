import { Injectable, NestMiddleware, HttpException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const apiKey = req.header('x-api-key') || 'anonymous';
      const key = `rate_limit:${apiKey}`;
      const limit = apiKey === 'anonymous' ? 10 : 100; // 10 req/min anonymous, 100 req/min with key
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
      // If there's an error with Redis, log it but allow the request to proceed
      if (!(error instanceof HttpException)) {
        this.logger.error(`Rate limiting error: ${error.message}`);
        // Allow the request to proceed when Redis fails
        next();
      } else {
        // If it's a rate limit exception, throw it
        throw error;
      }
    }
  }
}
