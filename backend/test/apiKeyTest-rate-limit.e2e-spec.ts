import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { apiKeyTestLimiter } from './../src/middleware/rate-limiter.middleware';

describe('API Key Test Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();

    // Mimic main.ts setup
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.setGlobalPrefix('api');

    // Explicitly apply the middleware to the endpoint for testing,
    // as app.use() in main.ts is not executed during Test.createTestingModule()
    app.use('/api/exchange-api-keys/:id/test', apiKeyTestLimiter);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const endpoint = '/api/exchange-api-keys/test-id/test';

  it('allows 10 requests from the same IP', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('X-Forwarded-For', '10.0.0.5')
        .expect((res: any) => {
          // We expect 401 (Unauthorized) because we're not sending a real token,
          // but NOT 429 (Too Many Requests).
          if (res.status === 429) {
            throw new Error(`Should not be rate limited yet at request ${i + 1}`);
          }
        });
    }
  });

  it('blocks the 11th request from the same IP with 429', async () => {
    // Send 10 requests first
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('X-Forwarded-For', '10.0.0.6');
    }

    // 11th request should be rate limited
    const res = await request(app.getHttpServer())
      .post(endpoint)
      .set('X-Forwarded-For', '10.0.0.6');

    expect(res.status).toBe(429);
    // express-rate-limit default message is sometimes in res.text if not JSON
    const message = typeof res.body === 'string' ? res.body : (res.body.message || res.text);
    expect(message).toContain('Too many API key test requests');
  });
});
