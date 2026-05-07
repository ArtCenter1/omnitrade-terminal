import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { orderPlacementLimiter } from './../src/middleware/rate-limiter.middleware';
import * as admin from 'firebase-admin';

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  return {
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user' }),
    }),
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    apps: [{}],
  };
});

describe('Order Placement Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.VITE_AUTH_PROVIDER = 'firebase';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();

    // Mimic main.ts setup
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.setGlobalPrefix('api');

    // Explicitly apply the middleware to the endpoint for testing
    app.use('/api/orders', orderPlacementLimiter);

    // Apply ValidationPipe for DTO checks
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const endpoint = '/api/orders';
  const orderData = {
    exchangeId: 'binance',
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'market',
    quantity: 0.01,
  };

  it('allows 20 requests from the same IP', async () => {
    for (let i = 0; i < 20; i++) {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .post(endpoint)
        .set('Authorization', 'Bearer token')
        .set('X-Forwarded-For', '10.0.0.10')
        .send(orderData)
        .expect((res: any) => {
          if (res.status === 429) {
            throw new Error(`Should not be rate limited yet at request ${i + 1}`);
          }
          expect(res.status).toBe(201);
        });
    }
  });

  it('blocks the 21st request from the same IP with 429', async () => {
    // Send 20 requests first
    for (let i = 0; i < 20; i++) {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .post(endpoint)
        .set('Authorization', 'Bearer token')
        .set('X-Forwarded-For', '10.0.0.11')
        .send(orderData);
    }

    // 21st request should be rate limited
    const res = await request(app.getHttpServer() as unknown as import('http').Server)
      .post(endpoint)
      .set('Authorization', 'Bearer token')
      .set('X-Forwarded-For', '10.0.0.11')
      .send(orderData);

    expect(res.status).toBe(429);
    expect(res.body.message || res.text).toContain('Too many order placement requests');
  });

  it('validates invalid order data (DTO check)', async () => {
    const invalidOrder = {
      exchangeId: '', // Invalid: MinLength(1)
      symbol: 'BTC/USDT',
      side: 'invalid-side', // Invalid: Enum
      type: 'market',
      quantity: -1, // Invalid: Positive
    };

    const res = await request(app.getHttpServer() as unknown as import('http').Server)
      .post(endpoint)
      .set('Authorization', 'Bearer token')
      .send(invalidOrder);

    expect(res.status).toBe(400);
    expect(res.body.message).toEqual(expect.arrayContaining([
      expect.stringContaining('exchangeId'),
      expect.stringContaining('side'),
      expect.stringContaining('quantity'),
    ]));
  });
});
