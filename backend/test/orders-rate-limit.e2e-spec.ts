import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { orderPlacementLimiter } from './../src/middleware/rate-limiter.middleware';
import * as admin from 'firebase-admin';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const actualAdmin = jest.requireActual('firebase-admin');
  return {
    ...actualAdmin,
    apps: {
      length: 1
    },
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockImplementation((token) => {
        return Promise.resolve({ uid: 'user-1', email: 'user1@example.com' });
      }),
    }),
    credential: {
        cert: jest.fn()
    },
    initializeApp: jest.fn()
  };
});

describe('Orders Rate Limiting (e2e)', () => {
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
  const orderData = {
    exchangeId: 'binance',
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'market',
    quantity: 1,
  };

  it('allows 20 requests from the same IP', async () => {
    for (let i = 0; i < 20; i++) {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('X-Forwarded-For', '1.1.1.1')
        .set('Authorization', 'Bearer valid-token')
        .send(orderData)
        .expect((res) => {
            if (res.status !== 201) {
                throw new Error(`Failed at request ${i + 1}: Status ${res.status}`);
            }
        });
    }
  });

  it('blocks the 21st request from the same IP with 429', async () => {
    // Send 20 requests to reach the limit
    for (let i = 0; i < 20; i++) {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('X-Forwarded-For', '2.2.2.2')
        .set('Authorization', 'Bearer valid-token')
        .send(orderData);
    }
    // 21st request should be rate limited
    await request(app.getHttpServer())
      .post(endpoint)
      .set('X-Forwarded-For', '2.2.2.2')
      .set('Authorization', 'Bearer valid-token')
      .send(orderData)
      .expect(429);
  });
});
