import { Test, TestingModule } from '@nestjs/testing';
import { BinanceTestnetProxyController } from '../binance-testnet-proxy.controller';
import axios from 'axios';
import { Request } from 'express';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('BinanceTestnetProxyController', () => {
  let controller: BinanceTestnetProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BinanceTestnetProxyController],
    }).compile();

    controller = module.get<BinanceTestnetProxyController>(
      BinanceTestnetProxyController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should NOT leak raw error data from upstream', async () => {
    const mockErrorData = { secret: 'upstream-secret-info', code: -1000 };
    mockedAxios.mockRejectedValueOnce({
      response: {
        status: 400,
        data: mockErrorData,
      },
      message: 'Request failed with status code 400',
    });

    const mockReq = {
      originalUrl: '/api/proxy/binance-testnet/api/v3/ticker/price',
      url: '/api/proxy/binance-testnet/api/v3/ticker/price',
      method: 'GET',
    } as unknown as Request;

    const result = (await controller.proxyRequest(mockReq)) as Record<
      string,
      unknown
    >;

    expect(result).toEqual({
      error: true,
      status: 400,
      // data: mockErrorData, // No longer leaked
      message: 'Binance Testnet API error: Request failed with status code 400',
    });
    expect(result['data']).toBeUndefined();
  });
});
