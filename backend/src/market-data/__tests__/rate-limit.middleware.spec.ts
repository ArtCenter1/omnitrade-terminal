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
      connection: {},
    };
    res = {};
    next = jest.fn();
  });

  it('sets TTL on first request for authenticated user', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(1);
    redisService.expire.mockResolvedValue(undefined);

    await middleware.use(req, res, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:key:my-api-key');
    expect(redisService.expire).toHaveBeenCalledWith('rate_limit:key:my-api-key', 60);
    expect(next).toHaveBeenCalled();
  });

  it('sets TTL on first request for anonymous user', async () => {
    req.header.mockReturnValue(undefined);
    req.ip = '192.168.1.1';
    redisService.incr.mockResolvedValue(1);
    redisService.expire.mockResolvedValue(undefined);

    await middleware.use(req, res, next);

    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:ip:192.168.1.1');
    expect(redisService.expire).toHaveBeenCalledWith('rate_limit:ip:192.168.1.1', 60);
    expect(next).toHaveBeenCalled();
  });

  it('allows requests under the limit for authenticated user', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(50);

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('throws 429 when over the limit for authenticated user', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockResolvedValue(101);

    await expect(middleware.use(req, res, next)).rejects.toThrow(HttpException);
    await expect(middleware.use(req, res, next)).rejects.toMatchObject({
      status: 429,
    });
  });

  it('enforces lower limit for anonymous users', async () => {
    req.header.mockReturnValue(undefined);
    req.ip = '192.168.1.1';
    redisService.incr.mockResolvedValue(11);

    await expect(middleware.use(req, res, next)).rejects.toThrow(HttpException);
  });

  it('uses different buckets for different anonymous IPs', async () => {
    // Request from IP 1
    req.header.mockReturnValue(undefined);
    req.ip = '1.1.1.1';
    redisService.incr.mockResolvedValue(1);
    await middleware.use(req, res, next);
    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:ip:1.1.1.1');

    // Request from IP 2
    req.ip = '2.2.2.2';
    redisService.incr.mockResolvedValue(1);
    await middleware.use(req, res, next);
    expect(redisService.incr).toHaveBeenCalledWith('rate_limit:ip:2.2.2.2');
  });

  it('logs error and proceeds if Redis fails', async () => {
    req.header.mockReturnValue('my-api-key');
    redisService.incr.mockRejectedValue(new Error('Redis connection lost'));

    const loggerSpy = jest.spyOn((middleware as any).logger, 'error').mockImplementation();

    await middleware.use(req, res, next);

    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Redis connection lost'));
    expect(next).toHaveBeenCalled();

    loggerSpy.mockRestore();
  });
});
