import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeApiKeyController } from '../exchange-api-key.controller';
import { ExchangeApiKeyService } from '../exchange-api-key.service';

describe('ExchangeApiKeyController', () => {
  let controller: ExchangeApiKeyController;
  let service: ExchangeApiKeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExchangeApiKeyController],
      providers: [
        {
          provide: ExchangeApiKeyService,
          useValue: {
            addApiKey: jest.fn().mockResolvedValue({ api_key_id: 'id1' }),
            listApiKeys: jest.fn().mockResolvedValue([]),
            deleteApiKey: jest
              .fn()
              .mockResolvedValue({ message: 'API key deleted' }),
            testApiKey: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<ExchangeApiKeyController>(ExchangeApiKeyController);
    service = module.get<ExchangeApiKeyService>(ExchangeApiKeyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should add an API key', async () => {
    const req = { user: { user_id: 'user1' } };
    const dto = { exchange_id: 'binance', api_key: 'k', api_secret: 's' };
    const result = await controller.addApiKey(req, dto as any);
    expect(result).toHaveProperty('api_key_id');
  });

  it('should list API keys', async () => {
    const req = { user: { user_id: 'user1' } };
    const result = await controller.listApiKeys(req);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should delete an API key', async () => {
    const req = { user: { user_id: 'user1' } };
    const result = await controller.deleteApiKey(req, 'id1');
    expect(result).toHaveProperty('message');
  });

  it('should test an API key', async () => {
    const req = { user: { user_id: 'user1' } };
    const result = await controller.testApiKey(req, 'id1', {});
    expect(result).toHaveProperty('success');
  });
});
