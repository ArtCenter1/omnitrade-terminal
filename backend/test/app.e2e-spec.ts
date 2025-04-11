import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer() as unknown as import('http').Server)
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

describe('/auth/password-reset-request rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  const endpoint = '/auth/password-reset-request';
  const testEmail = 'test@example.com';

  it('allows 3 requests from the same IP', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .post(endpoint)
        .set('X-Forwarded-For', '1.2.3.4')
        .send({ email: testEmail })
        .expect((res) => {
          // Accept 200, 201, or 204 (depending on implementation)
          if (![200, 201, 204].includes(res.status)) {
            throw new Error(`Unexpected status: ${res.status}`);
          }
        });
    }
  });

  it('blocks the 4th request from the same IP with 429', async () => {
    // Send 3 requests to reach the limit
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer() as unknown as import('http').Server)
        .post(endpoint)
        .set('X-Forwarded-For', '5.6.7.8')
        .send({ email: testEmail });
    }
    // 4th request should be rate limited
    await request(app.getHttpServer())
      .post(endpoint)
      .set('X-Forwarded-For', '5.6.7.8')
      .send({ email: testEmail })
      .expect(429);
  });
});
