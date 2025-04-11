import { RateLimitMiddleware } from '../rate-limit.middleware';
import Redis from 'ioredis';
import { HttpException } from '@nestjs/common';

jest.mock('ioredis');

const mockIncr = jest.fn();
const mockExpire = jest.fn();

interface MockRequest {
  header: jest.Mock;
}

(
  Redis as unknown as {
    mockImplementation: (
      impl: () => { incr: jest.Mock; expire: jest.Mock },
    ) => void;
  }
).mockImplementation(() => ({
  incr: mockIncr,
  expire: mockExpire,
}));

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let req: MockRequest;
  let res: jest.Mocked<import('express').Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new RateLimitMiddleware();
    req = { header: jest.fn() };
    res = undefined as unknown as jest.Mocked<import('express').Response>;
    next = jest.fn();
  });

  it('sets TTL on first request', async () => {
    req.header.mockReturnValue('my-api-key');
    mockIncr.mockResolvedValue(1);
    mockExpire.mockResolvedValue(1);

    await middleware.use(
      req as unknown as import('express').Request,
      res as unknown as import('express').Response,
      next,
    );

    expect(mockExpire).toHaveBeenCalledWith('rate_limit:my-api-key', 60);
    expect(next).toHaveBeenCalled();
  });

  it('allows requests under the limit', async () => {
    req.header.mockReturnValue('my-api-key');
    mockIncr.mockResolvedValue(50);

    await middleware.use(
      req as unknown as import('express').Request,
      res as unknown as import('express').Response,
      next,
    );

    expect(next).toHaveBeenCalled();
  });

  it('throws 429 when over the limit for API key', async () => {
    req.header.mockReturnValue('my-api-key');
    mockIncr.mockResolvedValue(101);

    await expect(
      middleware.use(
        req as unknown as import('express').Request,
        res as unknown as import('express').Response,
        next,
      ),
    ).rejects.toThrow(HttpException);
  });

  it('enforces lower limit for anonymous users', async () => {
    req.header.mockReturnValue(undefined);
    mockIncr.mockResolvedValue(11);

    await expect(
      middleware.use(
        req as unknown as import('express').Request,
        res as unknown as import('express').Response,
        next,
      ),
    ).rejects.toThrow(HttpException);
  });

  it('does not set TTL if not first request', async () => {
    req.header.mockReturnValue('my-api-key');
    mockIncr.mockResolvedValue(2);

    await middleware.use(
      req as unknown as import('express').Request,
      res as unknown as import('express').Response,
      next,
    );

    expect(mockExpire).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
