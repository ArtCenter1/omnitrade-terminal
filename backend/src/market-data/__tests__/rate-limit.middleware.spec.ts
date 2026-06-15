import { RateLimitMiddleware } from '../rate-limit.middleware';
import { RedisService } from '../../redis/redis.service';
import { HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let redisService: RedisService;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    redisService = {
      incr: jest.fn(),
      expire: jest.fn(),
    } as unknown as RedisService;
    middleware = new RateLimitMiddleware(redisService);
    req = {
      header: jest.fn(),
      ip: '127.0.0.1',
    };
    res = {};
    next = jest.fn();
  });

  it('sets TTL on first request for API key', async () => {
    (req.header as jest.Mock).mockReturnValue('my-api-key');
    (redisService.incr as jest.Mock).mockResolvedValue(1);
    (redisService.expire as jest.Mock).mockResolvedValue(1);

    await middleware.use(req as Request, res as Response, next);

    expect(redisService.expire).toHaveBeenCalledWith(
      'rate_limit:key:my-api-key',
      60,
    );
    expect(next).toHaveBeenCalled();
  });

  it('allows requests under the limit', async () => {
    (req.header as jest.Mock).mockReturnValue('my-api-key');
    (redisService.incr as jest.Mock).mockResolvedValue(50);

    await middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('throws 429 when over the limit for API key', async () => {
    (req.header as jest.Mock).mockReturnValue('my-api-key');
    (redisService.incr as jest.Mock).mockResolvedValue(101);

    await expect(
      middleware.use(req as Request, res as Response, next),
    ).rejects.toThrow(HttpException);
  });

  it('enforces lower limit for anonymous users (IP-based)', async () => {
    (req.header as jest.Mock).mockReturnValue(undefined);
    (redisService.incr as jest.Mock).mockResolvedValue(11);

    await expect(
      middleware.use(req as Request, res as Response, next),
    ).rejects.toThrow(HttpException);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:ip:127.0.0.1');
  });

  it('does not set TTL if not first request', async () => {
    (req.header as jest.Mock).mockReturnValue('my-api-key');
    (redisService.incr as jest.Mock).mockResolvedValue(2);

    await middleware.use(req as Request, res as Response, next);

    expect(redisService.expire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
