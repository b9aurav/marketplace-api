import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Order, OrderStatus } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/order-item.entity';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/common/decorators/roles.decorator';
import { Address } from '../src/users/entities/address.entity';
import { Product, ProductStatus } from '../src/products/entities/product.entity';
import { Category } from '../src/products/entities/category.entity';
import { AdminModule } from '../src/admin/admin.module';
import { OrdersModule } from '../src/orders/orders.module';
import { UsersModule } from '../src/users/users.module';
import { ProductsModule } from '../src/products/products.module';
import { AuthModule } from '../src/auth/auth.module';
import { CacheModule } from '../src/common/cache/cache.module';

describe('Admin Order Management (e2e)', () => {
  let app: INestApplication;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;
  let userRepository: Repository<User>;
  let addressRepository: Repository<Address>;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let jwtService: JwtService;
  let adminToken: string;
  let testUser: User;
  let testAdmin: User;
  let testProduct: Product;
  let testCategory: Category;
  let testAddress: Address;
  let testOrder: Order;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Order, OrderItem, User, Address, Product, Category],
          synchronize: true,
          dropSchema: true,
        }),
        CacheModule,
        AuthModule,
        UsersModule,
        ProductsModule,
        OrdersModule,
        AdminModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Get repositories
    orderRepository = moduleFixture.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = moduleFixture.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    addressRepository = moduleFixture.get<Repository<Address>>(getRepositoryToken(Address));
    productRepository = moduleFixture.get<Repository<Product>>(getRepositoryToken(Product));
    categoryRepository = moduleFixture.get<Repository<Category>>(getRepositoryToken(Category));
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test data
    await createTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up orders before each test
    await orderItemRepository.delete({});
    await orderRepository.delete({});
    
    // Recreate test order
    await createTestOrder();
  });

  async function createTestData() {
    // Create admin user
    testAdmin = await userRepository.save({
      email: 'admin@test.com',
      password: 'hashedpassword',
      name: 'Test Admin',
      role: Role.ADMIN,
      is_verified: true,
    });

    // Create regular user
    testUser = await userRepository.save({
      email: 'user@test.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: Role.USER,
      is_verified: true,
    });

    // Create address
    testAddress = await addressRepository.save({
      user: testUser,
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
      country: 'US',
      is_default: true,
    });

    // Create category
    testCategory = await categoryRepository.save({
      name: 'Test Category',
      description: 'Test category description',
      slug: 'test-category',
    });

    // Create product
    testProduct = await productRepository.save({
      name: 'Test Product',
      description: 'Test product description',
      price: 50.00,
      stock: 100,
      category: testCategory,
      images: ['test-image.jpg'],
      sku: 'TEST-SKU-001',
      status: ProductStatus.ACTIVE,
    });

    // Generate admin token
    adminToken = jwtService.sign({
      sub: testAdmin.id,
      email: testAdmin.email,
      role: testAdmin.role,
    });
  }

  async function createTestOrder() {
    testOrder = await orderRepository.save({
      user: testUser,
      address: testAddress,
      status: OrderStatus.PENDING,
      total: 100.00,
      fees: 5.00,
      net_amount: 95.00,
      payment_method: 'credit_card',
      transaction_id: 'txn_test_123',
      payment_method_details: { last4: '1234' },
      admin_notes: 'Test order notes',
      shipping_details: { carrier: 'UPS', service: 'Ground' },
      coupon_code: 'SAVE10',
      discount_amount: 10.00,
    });

    await orderItemRepository.save({
      order: testOrder,
      product: testProduct,
      product_name: testProduct.name,
      quantity: 2,
      price: 50.00,
    });
  }

  describe('GET /api/admin/orders', () => {
    it('should return paginated orders list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('total_pages');
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.orders.length).toBeGreaterThan(0);

      const order = response.body.orders[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('total');
      expect(order).toHaveProperty('user');
      expect(order).toHaveProperty('items');
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          status: OrderStatus.PENDING,
        })
        .expect(200);

      expect(response.body.orders.every((order: any) => order.status === OrderStatus.PENDING)).toBe(true);
    });

    it('should filter orders by user_id', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          user_id: testUser.id,
        })
        .expect(200);

      expect(response.body.orders.every((order: any) => order.user.id === testUser.id)).toBe(true);
    });

    it('should search orders by email', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          search: testUser.email,
        })
        .expect(200);

      expect(response.body.orders.length).toBeGreaterThan(0);
    });

    it('should filter orders by amount range', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          min_total: 50,
          max_total: 150,
        })
        .expect(200);

      expect(response.body.orders.every((order: any) => 
        order.total >= 50 && order.total <= 150
      )).toBe(true);
    });

    it('should sort orders correctly', async () => {
      // Create another order with different total
      await orderRepository.save({
        user: testUser,
        address: testAddress,
        status: OrderStatus.PAID,
        total: 200.00,
        fees: 10.00,
        net_amount: 190.00,
        payment_method: 'paypal',
      });

      const response = await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          sort_by: 'total',
          sort_order: 'desc',
        })
        .expect(200);

      const orders = response.body.orders;
      expect(orders.length).toBeGreaterThan(1);
      expect(orders[0].total).toBeGreaterThanOrEqual(orders[1].total);
    });

    it('should require admin authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/orders')
        .expect(401);
    });
  });

  describe('GET /api/admin/orders/:id', () => {
    it('should return order details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/admin/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testOrder.id);
      expect(response.body).toHaveProperty('status', testOrder.status);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('items');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      await request(app.getHttpServer())
        .get(`/api/admin/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/orders/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('PATCH /api/admin/orders/:id/status', () => {
    it('should update order status successfully', async () => {
      const updateData = {
        status: OrderStatus.PAID,
        admin_notes: 'Payment confirmed by admin',
        tracking_number: 'TRK123456',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Order status updated successfully');

      // Verify the order was updated
      const updatedOrder = await orderRepository.findOne({
        where: { id: testOrder.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.PAID);
      expect(updatedOrder.admin_notes).toBe(updateData.admin_notes);
      expect(updatedOrder.tracking_number).toBe(updateData.tracking_number);
    });

    it('should update status with minimal data', async () => {
      const updateData = {
        status: OrderStatus.PAID,
      };

      await request(app.getHttpServer())
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      const updatedOrder = await orderRepository.findOne({
        where: { id: testOrder.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.PAID);
    });

    it('should return 400 for invalid status transition', async () => {
      const updateData = {
        status: OrderStatus.DELIVERED, // Invalid transition from PENDING
      };

      await request(app.getHttpServer())
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should return 400 for invalid status', async () => {
      const updateData = {
        status: 'invalid_status',
      };

      await request(app.getHttpServer())
        .patch(`/api/admin/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      const updateData = {
        status: OrderStatus.PAID,
      };

      await request(app.getHttpServer())
        .patch(`/api/admin/orders/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('POST /api/admin/orders/:id/refund', () => {
    beforeEach(async () => {
      // Set order to PAID status for refund eligibility
      await orderRepository.update(testOrder.id, { status: OrderStatus.PAID });
    });

    it('should process refund successfully', async () => {
      const refundData = {
        amount: 50.00,
        reason: 'Customer request',
        admin_notes: 'Approved by admin',
        notify_customer: true,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/admin/orders/${testOrder.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('amount', refundData.amount);
      expect(response.body).toHaveProperty('refund_id');
      expect(response.body).toHaveProperty('message');
    });

    it('should process partial refund', async () => {
      const refundData = {
        amount: 25.00,
        reason: 'Defective item',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/admin/orders/${testOrder.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.amount).toBe(25.00);
    });

    it('should return 400 for refund amount exceeding order total', async () => {
      const refundData = {
        amount: 150.00, // Exceeds order total
        reason: 'Customer request',
      };

      await request(app.getHttpServer())
        .post(`/api/admin/orders/${testOrder.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(400);
    });

    it('should return 400 for non-refundable order status', async () => {
      // Set order to CANCELLED status
      await orderRepository.update(testOrder.id, { status: OrderStatus.CANCELLED });

      const refundData = {
        amount: 50.00,
        reason: 'Customer request',
      };

      await request(app.getHttpServer())
        .post(`/api/admin/orders/${testOrder.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(400);
    });

    it('should return 400 for invalid refund data', async () => {
      const refundData = {
        amount: -10.00, // Negative amount
        reason: 'Customer request',
      };

      await request(app.getHttpServer())
        .post(`/api/admin/orders/${testOrder.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(400);
    });
  });

  describe('GET /api/admin/orders/analytics/overview', () => {
    beforeEach(async () => {
      // Create additional test orders for analytics
      await orderRepository.save([
        {
          user: testUser,
          address: testAddress,
          status: OrderStatus.PAID,
          total: 150.00,
          fees: 7.50,
          net_amount: 142.50,
          payment_method: 'paypal',
          created_at: new Date('2023-01-15'),
        },
        {
          user: testUser,
          address: testAddress,
          status: OrderStatus.DELIVERED,
          total: 200.00,
          fees: 10.00,
          net_amount: 190.00,
          payment_method: 'credit_card',
          created_at: new Date('2023-01-20'),
        },
      ]);
    });

    it('should return order analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/orders/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          date_from: '2023-01-01',
          date_to: '2023-01-31',
          interval: 'day',
        })
        .expect(200);

      expect(response.body).toHaveProperty('total_orders');
      expect(response.body).toHaveProperty('total_revenue');
      expect(response.body).toHaveProperty('average_order_value');
      expect(response.body).toHaveProperty('orders_by_status');
      expect(response.body).toHaveProperty('revenue_by_status');
      expect(response.body).toHaveProperty('orders_trend');
      expect(response.body).toHaveProperty('top_payment_methods');
      expect(response.body).toHaveProperty('refund_statistics');
      expect(response.body).toHaveProperty('growth_metrics');

      expect(typeof response.body.total_orders).toBe('number');
      expect(typeof response.body.total_revenue).toBe('number');
      expect(typeof response.body.average_order_value).toBe('number');
      expect(Array.isArray(response.body.orders_trend)).toBe(true);
      expect(Array.isArray(response.body.top_payment_methods)).toBe(true);
    });

    it('should handle different intervals', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/orders/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          date_from: '2023-01-01',
          date_to: '2023-12-31',
          interval: 'month',
        })
        .expect(200);

      expect(response.body).toHaveProperty('orders_trend');
    });

    it('should filter analytics by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/orders/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          date_from: '2023-01-01',
          date_to: '2023-01-31',
          status: OrderStatus.PAID,
        })
        .expect(200);

      expect(response.body).toHaveProperty('total_orders');
      expect(response.body).toHaveProperty('total_revenue');
    });

    it('should return 400 for missing required parameters', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/orders/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          date_from: '2023-01-01',
          // Missing date_to
        })
        .expect(400);
    });

    it('should return 400 for invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/orders/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          date_from: 'invalid-date',
          date_to: '2023-01-31',
        })
        .expect(400);
    });
  });
});