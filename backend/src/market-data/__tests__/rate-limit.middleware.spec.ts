import { RateLimitMiddleware } from '../rate-limit.middleware';
import { RedisService } from '../../redis/redis.service';
import { HttpException } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method */

const mockIncr = jest.fn();
const mockExpire = jest.fn();

const mockRedisService = {
  incr: mockIncr,
  expire: mockExpire,
} as unknown as RedisService;

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new RateLimitMiddleware(mockRedisService);
    req = {
      header: jest.fn(),
      ip: '127.0.0.1',
    };
    res = {} as any;
    next = jest.fn();
  });

  it('sets TTL on first request for API key', async () => {
    req.header.mockReturnValue('my-api-key');
    mockIncr.mockResolvedValue(1);
    mockExpire.mockResolvedValue(undefined);

    await middleware.use(req, res, next);

    expect(mockIncr).toHaveBeenCalledWith('rate_limit:key:my-api-key');
    expect(mockExpire).toHaveBeenCalledWith('rate_limit:key:my-api-key', 60);
    expect(next).toHaveBeenCalled();
  });

  it('sets TTL on first request for IP', async () => {
    req.header.mockReturnValue(undefined);
    req.ip = '1.2.3.4';
    mockIncr.mockResolvedValue(1);
    mockExpire.mockResolvedValue(undefined);

    await middleware.use(req, res, next);

    expect(mockIncr).toHaveBeenCalledWith('rate_limit:ip:1.2.3.4');
    expect(mockExpire).toHaveBeenCalledWith('rate_limit:ip:1.2.3.4', 60);
    expect(next).toHaveBeenCalled();
  });

  it('allows requests under the limit', async () => {
    req.header.mockReturnValue('my-api-key');
    mockIncr.mockResolvedValue(50);

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('throws 429 when over the limit for API key', async () => {
    req.header.mockReturnValue('my-api-key');
    mockIncr.mockResolvedValue(101);

    await expect(middleware.use(req, res, next)).rejects.toThrow(HttpException);
    await expect(middleware.use(req, res, next)).rejects.toMatchObject({
      status: 429,
    });
  });

  it('enforces lower limit for anonymous users (IP-based)', async () => {
    req.header.mockReturnValue(undefined);
    req.ip = '1.2.3.4';
    mockIncr.mockResolvedValue(11);

    await expect(middleware.use(req, res, next)).rejects.toThrow(HttpException);
    expect(mockIncr).toHaveBeenCalledWith('rate_limit:ip:1.2.3.4');
  });

  it('uses "anonymous" fallback if req.ip is missing', async () => {
    req.header.mockReturnValue(undefined);
    req.ip = undefined;
    mockIncr.mockResolvedValue(1);

    await middleware.use(req, res, next);

    expect(mockIncr).toHaveBeenCalledWith('rate_limit:ip:anonymous');
    expect(next).toHaveBeenCalled();
  });

  it('does not set TTL if not first request', async () => {
    req.header.mockReturnValue('my-api-key');
    mockIncr.mockResolvedValue(2);

    await middleware.use(req, res, next);

    expect(mockExpire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('logs error and allows request if Redis fails', async () => {
    req.header.mockReturnValue('my-api-key');
    mockIncr.mockRejectedValue(new Error('Redis connection failed'));

    // Mock logger to avoid polluting test output
    const loggerSpy = jest.spyOn((middleware as any).logger, 'error').mockImplementation();

    await middleware.use(req, res, next);

    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Rate limiting error'));
    expect(next).toHaveBeenCalled();

    loggerSpy.mockRestore();
  });
});
