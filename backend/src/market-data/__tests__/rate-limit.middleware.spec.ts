/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method */
import { RateLimitMiddleware } from '../rate-limit.middleware';
import { HttpException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { Request, Response } from 'express';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let redisService: jest.Mocked<RedisService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    redisService = {
      incr: jest.fn(),
      expire: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

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

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:my-api-key');
    expect(redisService.expire).toHaveBeenCalledWith(
      'rate_limit:my-api-key',
      60,
    );
    expect(next).toHaveBeenCalled();
  });

  it('uses IP address for anonymous requests', async () => {
    (req.header as jest.Mock).mockReturnValue(undefined);
    (req as any).ip = '192.168.1.1';
    redisService.incr.mockResolvedValue(1);
    redisService.expire.mockResolvedValue(undefined);

    await middleware.use(req as Request, res as Response, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:192.168.1.1');
    expect(redisService.expire).toHaveBeenCalledWith(
      'rate_limit:192.168.1.1',
      60,
    );
    expect(next).toHaveBeenCalled();
  });

  it('allows requests under the limit', async () => {
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
  });

  it('enforces lower limit for anonymous users (IP-based)', async () => {
    (req.header as jest.Mock).mockReturnValue(undefined);
    (req as any).ip = '1.2.3.4';
    redisService.incr.mockResolvedValue(11);

    await expect(
      middleware.use(req as Request, res as Response, next),
    ).rejects.toThrow(HttpException);
  });

  it('falls back to "anonymous" if both API key and IP are missing', async () => {
    (req.header as jest.Mock).mockReturnValue(undefined);
    (req as any).ip = undefined;
    redisService.incr.mockResolvedValue(1);
    redisService.expire.mockResolvedValue(undefined);

    await middleware.use(req as Request, res as Response, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:anonymous');
    expect(next).toHaveBeenCalled();
  });

  it('does not set TTL if not first request', async () => {
    (req.header as jest.Mock).mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(2);

    await middleware.use(req as Request, res as Response, next);

    expect(redisService.expire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
