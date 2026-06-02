import { Test, TestingModule } from '@nestjs/testing';
import { BinanceTestnetProxyController } from '../binance-testnet-proxy.controller';
import axios from 'axios';
import { Request } from 'express';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('BinanceTestnetProxyController (Security)', () => {
  let controller: BinanceTestnetProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BinanceTestnetProxyController],
    }).compile();

    controller = module.get<BinanceTestnetProxyController>(
      BinanceTestnetProxyController,
    );
  });

  it('should not leak upstream error data to the client', async () => {
    const sensitiveData = {
      internal_ip: '10.0.0.5',
      stack_trace: 'at InternalModule.run...',
      server_version: 'v1.2.3',
    };

    mockedAxios.mockRejectedValueOnce({
      response: {
        status: 400,
        data: sensitiveData,
      },
      message: 'Bad Request',
      isAxiosError: true,
    });

    const mockRequest = {
      originalUrl: '/api/proxy/binance-testnet/v3/ticker/price',
      method: 'GET',
      url: '/v3/ticker/price',
    } as Request;

    const result = await controller.proxyRequest(mockRequest);

    expect(result).toBeDefined();
    expect(result.error).toBe(true);
    // The vulnerability: returning the raw data from upstream
    // In a secure implementation, 'data' should be missing or sanitized.
    expect(result.data).toBeUndefined();
    expect(result.message).not.toContain(JSON.stringify(sensitiveData));
    expect(result.message).toBe(
      'Upstream Binance Testnet API error. Please try again later.',
    );
  });
});
