// src/services/exchange/__tests__/binanceTestnetAdapter.test.ts

import {
  BinanceTestnetAdapter,
  NormalizedAccountInfo,
} from '../binanceTestnetAdapter';
import { makeApiRequest } from '@/utils/apiUtils'; // The function we need to mock
import logger from '@/utils/logger';

// Mock the makeApiRequest utility
jest.mock('@/utils/apiUtils');
const mockedMakeApiRequest = makeApiRequest as jest.MockedFunction<
  typeof makeApiRequest
>;

// Mock the logger to prevent console noise during tests
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock ApiKeyManager dependency indirectly by spying on getApiCredentials
// We need to mock the module first if getApiCredentials imports it dynamically
// For simplicity here, we'll spy on the private method directly, though this can be brittle.
// A better approach might involve dependency injection or refactoring getApiCredentials.
let getApiCredentialsSpy: jest.SpyInstance;

describe('BinanceTestnetAdapter', () => {
  let adapter: BinanceTestnetAdapter;
  const testApiKeyId = 'test-api-key-id-123';
  const mockApiKey = 'mock-binance-api-key';
  const mockApiSecret = 'mock-binance-api-secret';

  beforeEach(() => {
    adapter = new BinanceTestnetAdapter();
    // Reset mocks before each test
    mockedMakeApiRequest.mockClear();
    (logger.info as jest.Mock).mockClear();
    (logger.error as jest.Mock).mockClear();
    (logger.debug as jest.Mock).mockClear();

    // Spy on the private getApiCredentials method BEFORE the instance is used in tests
    // This is generally discouraged but necessary here without refactoring
    getApiCredentialsSpy = jest
      .spyOn(
        adapter as any, // Use 'as any' to access private method
        'getApiCredentials',
      )
      .mockResolvedValue({ apiKey: mockApiKey, apiSecret: mockApiSecret });
  });

  afterEach(() => {
    // Restore the original implementation after each test
    getApiCredentialsSpy.mockRestore();
  });

  describe('getAccountInfo', () => {
    const mockRawAccountInfo = {
      makerCommission: 10, // 0.10%
      takerCommission: 10, // 0.10%
      buyerCommission: 0,
      sellerCommission: 0,
      commissionRates: {
        // Example newer structure
        maker: '0.00100000', // 0.1%
        taker: '0.00100000',
        buyer: '0.00000000',
        seller: '0.00000000',
      },
      canTrade: true,
      canWithdraw: true,
      canDeposit: true,
      updateTime: 1678886400000, // Example timestamp
      accountType: 'SPOT',
      balances: [
        { asset: 'BTC', free: '1.234', locked: '0.100' },
        { asset: 'ETH', free: '10.5', locked: '2.0' },
        { asset: 'USDT', free: '10000.00', locked: '500.00' },
        { asset: 'BNB', free: '0.0000001', locked: '0.0' }, // Near zero balance
        { asset: 'LTC', free: '0.0', locked: '0.0' }, // Zero balance
      ],
      permissions: ['SPOT'],
      uid: 123456789,
    };

    const expectedNormalizedInfo: Omit<NormalizedAccountInfo, 'rawResponse'> = {
      exchangeId: 'binance_testnet',
      accountType: 'SPOT',
      canTrade: true,
      canWithdraw: true,
      canDeposit: true,
      makerCommission: 0.001, // 0.1%
      takerCommission: 0.001, // 0.1%
      balances: {
        BTC: { free: 1.234, locked: 0.1 },
        ETH: { free: 10.5, locked: 2.0 },
        USDT: { free: 10000.0, locked: 500.0 },
        BNB: { free: 0.0000001, locked: 0.0 }, // Should still be included if > epsilon
      },
      updateTime: 1678886400000,
    };

    it('should call makeAuthenticatedRequest with correct parameters', async () => {
      mockedMakeApiRequest.mockResolvedValue(mockRawAccountInfo);

      await adapter.getAccountInfo(testApiKeyId);

      expect(getApiCredentialsSpy).toHaveBeenCalledWith(testApiKeyId);
      // Check the arguments passed to the underlying makeApiRequest
      // Note: We don't check the signature/timestamp params directly as they are generated internally
      expect(mockedMakeApiRequest).toHaveBeenCalledTimes(1);
      const callArgs = mockedMakeApiRequest.mock.calls[0];
      expect(callArgs[0]).toBe('binance_testnet'); // exchangeId
      expect(callArgs[1]).toContain('/api/v3/account'); // url contains endpoint
      expect(callArgs[2]).toMatchObject({
        // options
        method: 'GET',
        weight: 10,
        headers: { 'X-MBX-APIKEY': mockApiKey }, // Check if API key header is set
        // We don't check body for GET, but ensure params were processed (signature added)
      });
      // Check if the URL contains the signature and timestamp (indirect check)
      expect(callArgs[1]).toMatch(/timestamp=\d+/);
      expect(callArgs[1]).toMatch(/signature=[a-f0-9]+/);
    });

    it('should fetch and normalize account information correctly', async () => {
      mockedMakeApiRequest.mockResolvedValue(mockRawAccountInfo);

      const result = await adapter.getAccountInfo(testApiKeyId);

      expect(result).toEqual(expectedNormalizedInfo);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Fetching account info'),
        expect.anything(),
      );
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Received raw account info'),
        expect.anything(),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Successfully fetched and normalized account info',
        ),
        { assetCount: 4 },
      ); // 4 non-zero balances
    });

    it('should handle commission rates from older structure if newer is missing', async () => {
      const oldStructureInfo = {
        ...mockRawAccountInfo,
        commissionRates: undefined, // Simulate missing newer structure
        makerCommission: 15, // 0.15%
        takerCommission: 20, // 0.20%
      };
      mockedMakeApiRequest.mockResolvedValue(oldStructureInfo);

      const result = await adapter.getAccountInfo(testApiKeyId);

      expect(result.makerCommission).toBe(0.0015);
      expect(result.takerCommission).toBe(0.002);
    });

    it('should throw an error if apiKeyId is missing', async () => {
      await expect(adapter.getAccountInfo('')).rejects.toThrow(
        'API Key ID is required to fetch account information.',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Missing apiKeyId'),
        expect.anything(),
      );
      expect(mockedMakeApiRequest).not.toHaveBeenCalled();
    });

    it('should handle API errors from makeAuthenticatedRequest', async () => {
      const apiError = new Error('Binance API error (400): Invalid symbol');
      (apiError as any).response = {
        data: { code: -1121, msg: 'Invalid symbol' },
      };
      mockedMakeApiRequest.mockRejectedValue(apiError);

      await expect(adapter.getAccountInfo(testApiKeyId)).rejects.toThrow(
        'Binance API error (-1121): Invalid symbol',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching account info'),
        expect.anything(),
      );
    });

    it('should handle authentication errors specifically', async () => {
      const authError = new Error('Authentication failed: Invalid API-key');
      mockedMakeApiRequest.mockRejectedValue(authError); // Simulate auth error from makeApiRequest

      await expect(adapter.getAccountInfo(testApiKeyId)).rejects.toThrow(
        `Binance Testnet authentication failed. Please check your API keys for ID: ${testApiKeyId}. Original error: Authentication failed: Invalid API-key`,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching account info'),
        expect.objectContaining({
          message: 'Authentication failed: Invalid API-key',
        }),
      );
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Network Error');
      mockedMakeApiRequest.mockRejectedValue(genericError);

      await expect(adapter.getAccountInfo(testApiKeyId)).rejects.toThrow(
        'Failed to fetch account info from Binance Testnet: Network Error',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching account info'),
        expect.anything(),
      );
    });
  });
});
