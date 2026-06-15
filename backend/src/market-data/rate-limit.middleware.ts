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
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';

      // Security: Use different key formats for authenticated vs anonymous users
      // This prevents all anonymous users from sharing a single "anonymous" bucket (BOLA/DoS risk)
      const key = apiKey ? `rate_limit:key:${apiKey}` : `rate_limit:ip:${ip}`;
      const limit = apiKey ? 100 : 10; // 100 req/min with key, 10 req/min per IP anonymous
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
