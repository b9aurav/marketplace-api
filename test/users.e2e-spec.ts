import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ConflictException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { CreateAddressDto } from '../src/users/dto/create-address.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    await app.init();

    // Register and login a test user
    const testUser = {
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User',
    };

    try {
      await authService.register(testUser);
    } catch (error) {
      // If already registered, ignore
      if (
        error instanceof ConflictException ||
        error?.message?.includes('already registered')
      ) {
        // continue
      } else {
        throw error;
      }
    }
    const loginResponse = await authService.login({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginResponse.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return user profile when authenticated', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('name', 'Test User');
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });
  });

  describe('POST /users/me/addresses', () => {
    const createAddressDto: CreateAddressDto = {
      label: 'Home',
      street: '123 Main St',
      city: 'Test City',
      state: 'Test State',
      zip: '12345',
      is_default: true,
    };

    it('should add address when authenticated', () => {
      return request(app.getHttpServer())
        .post('/users/me/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createAddressDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('label', createAddressDto.label);
          expect(res.body).toHaveProperty('street', createAddressDto.street);
          expect(res.body).toHaveProperty('city', createAddressDto.city);
          expect(res.body).toHaveProperty('state', createAddressDto.state);
          expect(res.body).toHaveProperty('zip', createAddressDto.zip);
          expect(res.body).toHaveProperty('is_default', createAddressDto.is_default);
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .post('/users/me/addresses')
        .send(createAddressDto)
        .expect(401);
    });

    it('should return 400 when address data is invalid', () => {
      const invalidAddress = {
        label: 'Home',
        // Missing required fields
      };

      return request(app.getHttpServer())
        .post('/users/me/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidAddress)
        .expect(400);
    });
  });
}); 