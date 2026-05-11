import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { orderPlacementLimiter } from './../src/middleware/rate-limiter.middleware';

describe('Order Placement Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.setGlobalPrefix('api');
    app.use('/api/orders', orderPlacementLimiter);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const endpoint = '/api/orders';
  const mockOrder = {
    exchangeId: 'binance',
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'market',
    quantity: 1,
  };

  it('allows 20 requests from the same IP', async () => {
    for (let i = 0; i < 20; i++) {
      // We don't care about auth here as rate limiting hits before the guard
      await request(app.getHttpServer() as unknown as import('http').Server)
        .post(endpoint)
        .set('X-Forwarded-For', '10.10.10.10')
        .send(mockOrder)
        .expect((res) => {
          // It should NOT be 429. It might be 401 (Unauthorized) if the guard hits,
          // which is fine since we just want to verify the rate limiter doesn't block it.
          if (res.status === 429) {
            throw new Error('Rate limited prematurely');
          }
        });
    }
  });

  it('blocks the 21st request from the same IP with 429', async () => {
    for (let i = 0; i < 20; i++) {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .post(endpoint)
        .set('X-Forwarded-For', '20.20.20.20')
        .send(mockOrder);
    }
    await request(app.getHttpServer() as unknown as import('http').Server)
      .post(endpoint)
      .set('X-Forwarded-For', '20.20.20.20')
      .send(mockOrder)
      .expect(429);
  });
});
