import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let supabaseService: SupabaseService;

  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test User',
    phone: '+1234567890',
  };

  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    supabaseService = moduleFixture.get<SupabaseService>(SupabaseService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.data.user).toHaveProperty('id');
          expect(res.body.data.user.email).toBe(testUser.email);
          expect(res.body.data.user.name).toBe(testUser.name);
        });
    });

    it('should not register a user with existing email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.message).toContain('already registered');
        });
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data.user.email).toBe(testUser.email);
          authToken = res.body.data.access_token;
        });
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.message).toContain('Invalid credentials');
        });
    });
  });

  describe('GET /auth/me', () => {
    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.data.email).toBe(testUser.email);
          expect(res.body.data.name).toBe(testUser.name);
        });
    });

    it('should not get profile without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.message).toContain('Unauthorized');
        });
    });

    it('should not get profile with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.message).toContain('Unauthorized');
        });
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should send password reset email', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.message).toContain('reset link');
        });
    });

    it('should handle non-existent email gracefully', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('success');
          expect(res.body.message).toContain('reset link');
        });
    });
  });

  // Note: Testing reset-password endpoint requires a valid reset token
  // which is typically sent via email. This would require additional setup
  // to mock the email service and capture the reset token.
  describe('POST /auth/reset-password', () => {
    it('should require valid reset token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          new_password: 'newpassword123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.status).toBe('error');
          expect(res.body.message).toContain('Invalid or expired token');
        });
    });
  });
}); 