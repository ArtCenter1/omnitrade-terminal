/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { RateLimitMiddleware } from '../rate-limit.middleware';
import { RedisService } from '../../redis/redis.service';
import { HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let redisService: jest.Mocked<RedisService>;
  let req: any;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    redisService = {
      incr: jest.fn(),
      expire: jest.fn(),
    } as any;

    middleware = new RateLimitMiddleware(redisService);
    req = {
      header: jest.fn(),
      ip: '127.0.0.1',
    };
    res = {};
    next = jest.fn();
  });

  it('sets TTL on first request with API key', async () => {
    (req.header as jest.Mock).mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(1);
    redisService.expire.mockResolvedValue(undefined);

    await middleware.use(req as Request, res as Response, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:key:my-api-key');
    expect(redisService.expire).toHaveBeenCalledWith(
      'rate_limit:key:my-api-key',
      60,
    );
    expect(next).toHaveBeenCalled();
  });

  it('sets TTL on first request with IP (anonymous)', async () => {
    (req.header as jest.Mock).mockReturnValue(undefined);
    req.ip = '192.168.1.1';
    redisService.incr.mockResolvedValue(1);
    redisService.expire.mockResolvedValue(undefined);

    await middleware.use(req as Request, res as Response, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:ip:192.168.1.1');
    expect(redisService.expire).toHaveBeenCalledWith(
      'rate_limit:ip:192.168.1.1',
      60,
    );
    expect(next).toHaveBeenCalled();
  });

  it('allows requests under the limit for API key', async () => {
    (req.header as jest.Mock).mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(50);

    await middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('throws 429 when over the limit for API key', async () => {
    (req.header as jest.Mock).mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(101);

    await expect(
      middleware.use(req as Request, res as Response, next),
    ).rejects.toThrow(HttpException);

    try {
      await middleware.use(req as Request, res as Response, next);
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(429);
    }
  });

  it('enforces lower limit for anonymous users (IP-based)', async () => {
    (req.header as jest.Mock).mockReturnValue(undefined);
    req.ip = '1.2.3.4';
    redisService.incr.mockResolvedValue(11);

    await expect(
      middleware.use(req as Request, res as Response, next),
    ).rejects.toThrow(HttpException);
  });

  it('uses socket.remoteAddress if req.ip is missing', async () => {
    (req.header as jest.Mock).mockReturnValue(undefined);
    delete req.ip;
    req.socket = { remoteAddress: '5.6.7.8' };
    redisService.incr.mockResolvedValue(1);

    await middleware.use(req as Request, res as Response, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:ip:5.6.7.8');
  });

  it('logs error but proceeds if Redis fails', async () => {
    (req.header as jest.Mock).mockReturnValue('my-api-key');
    redisService.incr.mockRejectedValue(new Error('Redis connection failed'));

    // We expect it to NOT throw and to call next()
    await middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });
});
