import { RateLimitMiddleware } from '../rate-limit.middleware';
import { HttpException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let redisService: jest.Mocked<RedisService>;
  let req: any;
  let res: any;
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

  it('uses API key as identifier when provided', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(1);

    await middleware.use(req, res, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:my-api-key');
    expect(next).toHaveBeenCalled();
  });

  it('uses IP as identifier when API key is missing', async () => {
    req.header.mockReturnValue(undefined);
    req.ip = '192.168.1.1';
    redisService.incr.mockResolvedValue(1);

    await middleware.use(req, res, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:192.168.1.1');
    expect(next).toHaveBeenCalled();
  });

  it('falls back to "anonymous" if both API key and IP are missing', async () => {
    req.header.mockReturnValue(undefined);
    req.ip = undefined;
    redisService.incr.mockResolvedValue(1);

    await middleware.use(req, res, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:anonymous');
    expect(next).toHaveBeenCalled();
  });

  it('sets TTL on first request', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(1);

    await middleware.use(req, res, next);

    expect(redisService.expire).toHaveBeenCalledWith(
      'rate_limit:my-api-key',
      60,
    );
    expect(next).toHaveBeenCalled();
  });

  it('allows requests under the limit for API key', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(100);

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('throws 429 when over the limit for API key', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(101);

    await expect(middleware.use(req, res, next)).rejects.toThrow(HttpException);
    await expect(middleware.use(req, res, next)).rejects.toMatchObject({
      status: 429,
    });
  });

  it('enforces lower limit for anonymous users (per IP)', async () => {
    req.header.mockReturnValue(undefined);
    req.ip = '1.2.3.4';
    redisService.incr.mockResolvedValue(11);

    await expect(middleware.use(req, res, next)).rejects.toThrow(HttpException);
  });

  it('allows anonymous users under their limit', async () => {
    req.header.mockReturnValue(undefined);
    req.ip = '1.2.3.4';
    redisService.incr.mockResolvedValue(10);

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('does not set TTL if not first request', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(2);

    await middleware.use(req, res, next);

    expect(redisService.expire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('allows request to proceed if Redis fails', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockRejectedValue(new Error('Redis connection failed'));

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
