import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
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
        if (token === 'valid-token-user-1') {
          return Promise.resolve({ uid: 'user-1', email: 'user1@example.com' });
        }
        if (token === 'valid-token-user-2') {
          return Promise.resolve({ uid: 'user-2', email: 'user2@example.com' });
        }
        return Promise.reject(new Error('Invalid token'));
      }),
    }),
    credential: {
        cert: jest.fn()
    },
    initializeApp: jest.fn()
  };
});

describe('Orders Data Isolation (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should correctly extract user_id from token', async () => {
    const orderData = {
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      quantity: 1,
    };

    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', 'Bearer valid-token-user-1')
      .send(orderData);

    expect(response.body.userId).toBe('user-1');
  });

  it('should isolate orders between users', async () => {
    const orderData1 = {
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'market',
      quantity: 1,
    };

    const orderData2 = {
      exchangeId: 'kraken',
      symbol: 'ETH/USDT',
      side: 'sell',
      type: 'market',
      quantity: 2,
    };

    // User 1 places an order
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', 'Bearer valid-token-user-1')
      .send(orderData1);

    // User 2 places an order
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', 'Bearer valid-token-user-2')
      .send(orderData2);

    // User 1 should only see their own order
    const response1 = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', 'Bearer valid-token-user-1');

    expect(response1.body).toHaveLength(1);
    expect(response1.body[0].userId).toBe('user-1');
    expect(response1.body[0].symbol).toBe('BTC/USDT');

    // User 2 should only see their own order
    const response2 = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', 'Bearer valid-token-user-2');

    expect(response2.body).toHaveLength(1);
    expect(response2.body[0].userId).toBe('user-2');
    expect(response2.body[0].symbol).toBe('ETH/USDT');
  });
});
