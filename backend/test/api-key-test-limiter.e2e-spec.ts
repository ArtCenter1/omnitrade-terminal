import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Server } from 'http';

describe('API Key Test Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api'); // Match main.ts
    // Enable trust proxy to allow X-Forwarded-For headers to be used for rate limiting
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const endpoint = '/api/exchange-api-keys/some-id/test';

  it('allows 10 requests from the same IP', async () => {
    const ip = '10.0.0.1';
    for (let i = 0; i < 10; i++) {
      // We expect 401 Unauthorized because we are not sending a valid JWT,
      // but the rate limiter should still allow the request to reach the guard.
      // 429 would mean it's blocked by the rate limiter.
      const response = await request(app.getHttpServer() as Server)
        .post(endpoint)
        .set('X-Forwarded-For', ip);

      expect(response.status).toBe(401);
    }
  });

  it('blocks the 11th request from the same IP with 429', async () => {
    const ip = '10.0.0.2';
    // Send 10 requests to reach the limit
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer() as Server)
        .post(endpoint)
        .set('X-Forwarded-For', ip)
        .expect(401);
    }
    // 11th request should be rate limited
    await request(app.getHttpServer() as Server)
      .post(endpoint)
      .set('X-Forwarded-For', ip)
      .expect(429);
  });
});
