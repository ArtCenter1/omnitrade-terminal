import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import * as admin from 'firebase-admin';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: jest.fn(),
  };
  return {
    auth: () => mockAuth,
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    apps: [],
  };
});

describe('Orders Data Isolation (e2e)', () => {
  let app: INestApplication;
  const mockVerifyIdToken = admin.auth().verifyIdToken as jest.Mock;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should isolate orders between different users', async () => {
    const user1Token = 'user1-token';
    const user1Uid = 'user1-uid';
    const user2Token = 'user2-token';
    const user2Uid = 'user2-uid';

    // Mock User 1 authentication
    mockVerifyIdToken.mockImplementation((token: string) => {
      if (token === user1Token) return Promise.resolve({ uid: user1Uid });
      if (token === user2Token) return Promise.resolve({ uid: user2Uid });
      return Promise.reject(new Error('Invalid token'));
    });

    // User 1 places an order
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        exchangeId: 'binance',
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'market',
        quantity: 1,
      })
      .expect(201);

    // User 1 SHOULD see their own order
    const user1Orders = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);
    expect(user1Orders.body).toHaveLength(1);
    expect(user1Orders.body[0].symbol).toBe('BTC/USDT');

    // User 2 should NOT see User 1's order
    const user2Orders = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(user2Orders.body).toHaveLength(0);
  });
});
