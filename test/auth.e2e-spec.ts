import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';
import { Role } from '../src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let supabaseService: SupabaseService;

  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test User',
    phone: '+1234567890',
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: testUser.email,
    name: testUser.name,
    role: Role.USER,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSession = {
    token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue({
        signUp: jest.fn().mockResolvedValue({ user: mockUser, session: mockSession }),
        signIn: jest.fn().mockResolvedValue({ user: mockUser, session: mockSession }),
        resetPassword: jest.fn().mockResolvedValue(undefined),
        updatePassword: jest.fn().mockResolvedValue(undefined),
        getUser: jest.fn().mockResolvedValue(mockUser),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation((context) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Invalid token');
          }
          request.user = mockUser;
          return true;
        }),
      })
      .compile();

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
          expect(res.body.message).toBe('Registration successful');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.name).toBe(testUser.name);
        });
    });

    it('should not register with existing email', () => {
      // Mock Supabase to return an error for existing email
      jest.spyOn(supabaseService, 'signUp').mockRejectedValueOnce(new Error('User already registered'));

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
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
          expect(res.body.message).toBe('Login successful');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.name).toBe(testUser.name);
        });
    });

    it('should not login with invalid credentials', () => {
      // Mock Supabase to return an error for invalid credentials
      jest.spyOn(supabaseService, 'signIn').mockRejectedValueOnce(new Error('Invalid login credentials'));

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${mockSession.token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.name).toBe(testUser.name);
          expect(res.body.role).toBe(Role.USER);
        });
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should send reset password email', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('If your email is registered, you will receive a password reset link');
        });
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'valid-token',
          new_password: 'newpassword123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Password has been reset successfully');
        });
    });

    it('should return 401 with invalid token', () => {
      jest.spyOn(supabaseService, 'updatePassword').mockRejectedValueOnce(new Error('Invalid token'));

      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          new_password: 'newpassword123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid or expired token');
        });
    });
  });
}); 