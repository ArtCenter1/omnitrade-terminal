import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis.service';
import { Logger } from '@nestjs/common';

describe('RedisService Logging', () => {
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Mock Logger.prototype.log before service instantiation
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    loggerSpy.mockRestore();
    delete process.env.REDIS_URL;
  });

  it('should mask password in a specific test case', async () => {
    const sensitiveUrl = 'redis://user:mysecretpassword@prod-redis.example.com:6379';
    process.env.REDIS_URL = sensitiveUrl;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    // The log call happens in the constructor
    const logCalls = loggerSpy.mock.calls.map(call => call[0]);
    const connectionLog = logCalls.find(log => typeof log === 'string' && log.includes('Attempting to connect to Redis at'));

    expect(connectionLog).toBe('Attempting to connect to Redis at redis://user:****@prod-redis.example.com:6379');
    expect(connectionLog).not.toContain('mysecretpassword');
  });

  it('should not affect URLs without passwords', async () => {
    const publicUrl = 'redis://localhost:6379';
    process.env.REDIS_URL = publicUrl;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    const logCalls = loggerSpy.mock.calls.map(call => call[0]);
    const connectionLog = logCalls.find(log => typeof log === 'string' && log.includes('Attempting to connect to Redis at'));

    expect(connectionLog).toBe('Attempting to connect to Redis at redis://localhost:6379');
  });
});
