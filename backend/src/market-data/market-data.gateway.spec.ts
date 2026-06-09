import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataGateway } from './market-data.gateway';
import { MarketDataService } from './market-data.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('MarketDataGateway', () => {
  let gateway: MarketDataGateway;

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataGateway,
        {
          provide: MarketDataService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    gateway = module.get<MarketDataGateway>(MarketDataGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should have JwtAuthGuard applied', () => {
    const guards = Reflect.getMetadata('__guards__', MarketDataGateway);
    expect(guards).toContain(JwtAuthGuard);
  });
});
