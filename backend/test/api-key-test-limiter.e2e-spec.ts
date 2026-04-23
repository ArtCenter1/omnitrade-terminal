import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  globalRateLimiter,
  apiKeyTestLimiter,
} from './../src/middleware/rate-limiter.middleware';

describe('API Key Test Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();

    // Apply the same configuration as in main.ts
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.use(globalRateLimiter);
    app.use('/api/exchange-api-keys/:id/test', apiKeyTestLimiter);
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const apiKeyId = 'test-api-key-id';
  const endpoint = `/api/exchange-api-keys/${apiKeyId}/test`;

  it('allows 10 requests to the API key test endpoint', async () => {
    for (let i = 0; i < 10; i++) {
      // We expect 401 Unauthorized because we are not sending a token,
      // but the rate limiter should let it pass through to the auth guard.
      await request(app.getHttpServer())
        .post(endpoint)
        .set('X-Forwarded-For', '10.0.0.1')
        .expect((res) => {
          if (res.status === 429) {
            throw new Error(`Rate limited at request ${i + 1}`);
          }
        });
    }
  });

  it('blocks the 11th request with 429', async () => {
    // 11th request should be rate limited
    await request(app.getHttpServer())
      .post(endpoint)
      .set('X-Forwarded-For', '10.0.0.1')
      .expect(429);
  });

  it('allows requests from a different IP', async () => {
    // Different IP should not be blocked
    await request(app.getHttpServer())
      .post(endpoint)
      .set('X-Forwarded-For', '10.0.0.2')
      .expect((res) => {
        if (res.status === 429) {
          throw new Error('Rate limited for a new IP');
        }
      });
  });
});
