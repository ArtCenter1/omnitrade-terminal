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
            get: jest.fn().mockReturnValue('https://api.coingecko.com/api/v3'),
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
