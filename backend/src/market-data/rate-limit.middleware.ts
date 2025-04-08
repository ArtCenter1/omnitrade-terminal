import {
  Injectable,
  NestMiddleware,
  HttpException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

const redis = new Redis();

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.header('x-api-key') || 'anonymous';
    const key = `rate_limit:${apiKey}`;
    const limit = apiKey === 'anonymous' ? 10 : 100; // 10 req/min anonymous, 100 req/min with key
    const ttlSeconds = 60;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, ttlSeconds);
    }

    if (current > limit) {
      throw new HttpException('Rate limit exceeded', 429);
    }

    next();
  }
}