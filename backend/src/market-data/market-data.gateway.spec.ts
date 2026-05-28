import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataGateway } from './market-data.gateway';
import { MarketDataService } from './market-data.service';

describe('MarketDataGateway', () => {
  let gateway: MarketDataGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataGateway,
        {
          provide: MarketDataService,
          useValue: {},
        },
      ],
    }).compile();

    gateway = module.get<MarketDataGateway>(MarketDataGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
