import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeApiKeyController } from '../exchange-api-key.controller';
import { ExchangeApiKeyService } from '../exchange-api-key.service';
import { Request } from 'express';
import { CreateExchangeApiKeyDto } from '../dto/create-exchange-api-key.dto';

describe('ExchangeApiKeyController', () => {
  let controller: ExchangeApiKeyController;
  // Service is used in the test setup but not directly in tests
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
    expect(service).toBeDefined();
  });

  it('should add an API key', async () => {
    const req = { user: { user_id: 'user1' } } as Request & {
      user: { user_id: string };
    };
    const dto: CreateExchangeApiKeyDto = {
      exchange_id: 'binance',
      api_key: 'k',
      api_secret: 's',
    };
    const result = await controller.addApiKey(req, dto);
    expect(result).toHaveProperty('api_key_id');
  });

  it('should list API keys', async () => {
    const req = { user: { user_id: 'user1' } } as Request & {
      user: { user_id: string };
    };
    const result = await controller.listApiKeys(req);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should delete an API key', async () => {
    const req = { user: { user_id: 'user1' } } as Request & {
      user: { user_id: string };
    };
    const result = await controller.deleteApiKey(req, 'id1');
    expect(result).toHaveProperty('message');
  });

  it('should test an API key', async () => {
    const req = { user: { user_id: 'user1' } } as Request & {
      user: { user_id: string };
    };
    const result = await controller.testApiKey(req, 'id1');
    expect(result).toHaveProperty('success');
  });
});
