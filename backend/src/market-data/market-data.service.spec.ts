import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataService } from './market-data.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

describe('MarketDataService', () => {
  let service: MarketDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'COINGECKO_API_BASE_URL') {
                return 'https://api.coingecko.com/api/v3';
              }
              return null;
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MarketDataService>(MarketDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
