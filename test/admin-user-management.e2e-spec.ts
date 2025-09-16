import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Order } from '../src/orders/entities/order.entity';
import { Role } from '../src/common/decorators/roles.decorator';
import { UserStatus } from '../src/admin/dto/user-management.dto';
import { OrderStatus } from '../src/orders/entities/order.entity';

describe('Admin User Management (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orderRepository: Repository<Order>;
  let adminToken: string;
  let testUser: User;
  let adminUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    orderRepository = moduleFixture.get<Repository<Order>>(getRepositoryToken(Order));

    // Create admin user for authentication
    adminUser = await userRepository.save({
      email: 'admin@test.com',
      name: 'Admin User',
      role: Role.ADMIN,
      is_active: true,
    });

    // Create test user
    testUser = await userRepository.save({
      email: 'testuser@test.com',
      name: 'Test User',
      phone: '+1234567890',
      role: Role.USER,
      is_active: true,
      last_login_at: new Date(),
      metadata: { test: 'data' },
    });

    // Create some test orders for the user
    await orderRepository.save([
      {
        user_id: testUser.id,
        total: 100.00,
        status: OrderStatus.DELIVERED,
        address_id: '123e4567-e89b-12d3-a456-426614174000', // Mock address ID
      },
      {
        user_id: testUser.id,
        total: 50.00,
        status: OrderStatus.DELIVERED,
        address_id: '123e4567-e89b-12d3-a456-426614174000', // Mock address ID
      },
    ]);

    // Get admin token (this would normally be done through login)
    // For testing purposes, we'll mock the JWT token
    adminToken = 'mock-admin-token';
  });

  afterAll(async () => {
    // Clean up test data
    await orderRepository.delete({ user_id: testUser.id });
    await userRepository.delete({ id: testUser.id });
    await userRepository.delete({ id: adminUser.id });
    await app.close();
  });

  describe('/api/admin/users (GET)', () => {
    it('should return paginated users list', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('total_pages');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter users by search term', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                name: expect.stringContaining('Test'),
              }),
            ])
          );
        });
    });

    it('should filter users by role', () => {
      return request(app.getHttpServer())
        .get(`/api/admin/users?role=${Role.USER}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((user: any) => {
            expect(user.role).toBe(Role.USER);
          });
        });
    });

    it('should filter users by status', () => {
      return request(app.getHttpServer())
        .get(`/api/admin/users?status=${UserStatus.ACTIVE}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((user: any) => {
            expect(user.is_active).toBe(true);
          });
        });
    });

    it('should apply pagination', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(1);
          expect(res.body.data.length).toBeLessThanOrEqual(1);
        });
    });

    it('should apply sorting', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users?sort_by=name&sort_order=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const names = res.body.data.map((user: any) => user.name);
          const sortedNames = [...names].sort();
          expect(names).toEqual(sortedNames);
        });
    });

    it('should require admin authentication', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .expect(401);
    });
  });

  describe('/api/admin/users/:id (GET)', () => {
    it('should return user details', () => {
      return request(app.getHttpServer())
        .get(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUser.id);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('name', testUser.name);
          expect(res.body).toHaveProperty('phone', testUser.phone);
          expect(res.body).toHaveProperty('role', testUser.role);
          expect(res.body).toHaveProperty('is_active', testUser.is_active);
          expect(res.body).toHaveProperty('metadata');
          expect(res.body).toHaveProperty('addresses');
          expect(res.body).toHaveProperty('recent_orders');
          expect(res.body).toHaveProperty('total_orders');
          expect(res.body).toHaveProperty('average_order_value');
          expect(res.body).toHaveProperty('order_count');
          expect(res.body).toHaveProperty('total_spent');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/123e4567-e89b-12d3-a456-426614174999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should require admin authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/admin/users/${testUser.id}`)
        .expect(401);
    });
  });

  describe('/api/admin/users/:id/status (PATCH)', () => {
    it('should update user status to inactive', () => {
      return request(app.getHttpServer())
        .patch(`/api/admin/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: UserStatus.INACTIVE,
          reason: 'Test deactivation',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('inactive');
        });
    });

    it('should update user status to active', () => {
      return request(app.getHttpServer())
        .patch(`/api/admin/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: UserStatus.ACTIVE,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('active');
        });
    });

    it('should return 400 for invalid status', () => {
      return request(app.getHttpServer())
        .patch(`/api/admin/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid-status',
        })
        .expect(400);
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .patch('/api/admin/users/123e4567-e89b-12d3-a456-426614174999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: UserStatus.INACTIVE,
        })
        .expect(404);
    });

    it('should require admin authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/admin/users/${testUser.id}/status`)
        .send({
          status: UserStatus.INACTIVE,
        })
        .expect(401);
    });
  });

  describe('/api/admin/users/analytics (GET)', () => {
    it('should return user analytics', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total_users');
          expect(res.body).toHaveProperty('active_users');
          expect(res.body).toHaveProperty('inactive_users');
          expect(res.body).toHaveProperty('blocked_users');
          expect(res.body).toHaveProperty('new_users_today');
          expect(res.body).toHaveProperty('new_users_this_week');
          expect(res.body).toHaveProperty('new_users_this_month');
          expect(res.body).toHaveProperty('registration_trend');
          expect(res.body).toHaveProperty('role_distribution');
          expect(res.body).toHaveProperty('activity_metrics');
          expect(Array.isArray(res.body.registration_trend)).toBe(true);
          expect(Array.isArray(res.body.role_distribution)).toBe(true);
          expect(Array.isArray(res.body.activity_metrics)).toBe(true);
        });
    });

    it('should accept date range parameters', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/analytics?date_from=2023-01-01&date_to=2023-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total_users');
          expect(res.body).toHaveProperty('registration_trend');
        });
    });

    it('should accept interval parameter', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/analytics?interval=month')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total_users');
          expect(res.body).toHaveProperty('registration_trend');
        });
    });

    it('should require admin authentication', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users/analytics')
        .expect(401);
    });
  });
});