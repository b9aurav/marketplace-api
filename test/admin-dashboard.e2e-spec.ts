import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { DataSource } from "typeorm";
import { User } from "../src/users/entities/user.entity";
import { Order, OrderStatus } from "../src/orders/entities/order.entity";
import {
  Product,
  ProductStatus,
} from "../src/products/entities/product.entity";
import { Category } from "../src/products/entities/category.entity";
import { Role } from "../src/common/decorators/roles.decorator";
import { JwtService } from "@nestjs/jwt";

describe("Admin Dashboard (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let adminToken: string;
  let testUser: User;
  let testCategory: Category;
  let testProduct: Product;
  let testOrder: Order;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test data
    await createTestData();

    // Generate admin token
    adminToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
      role: Role.ADMIN,
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function createTestData() {
    const userRepository = dataSource.getRepository(User);
    const categoryRepository = dataSource.getRepository(Category);
    const productRepository = dataSource.getRepository(Product);
    const orderRepository = dataSource.getRepository(Order);

    // Create admin user
    testUser = userRepository.create({
      email: "admin@test.com",
      name: "Admin User",
      role: Role.ADMIN,
      is_active: true,
      last_login_at: new Date(),
    });
    await userRepository.save(testUser);

    // Create test category
    testCategory = categoryRepository.create({
      name: "Test Category",
      description: "Test category description",
      slug: "test-category",
    });
    await categoryRepository.save(testCategory);

    // Create test product
    testProduct = productRepository.create({
      name: "Test Product",
      description: "Test product description",
      price: 99.99,
      stock: 10,
      images: ["test-image.jpg"],
      sku: "TEST-001",
      status: ProductStatus.ACTIVE,
      category_id: testCategory.id,
      minimum_stock: 5,
      sales_count: 15,
    });
    await productRepository.save(testProduct);

    // Create test order
    testOrder = orderRepository.create({
      status: OrderStatus.DELIVERED,
      total: 199.98,
      user_id: testUser.id,
      address_id: testUser.id, // Using user id as placeholder
      payment_method: "credit_card",
      transaction_id: "test-transaction-123",
      net_amount: 189.98,
      fees: 10.0,
    });
    await orderRepository.save(testOrder);
  }

  async function cleanupTestData() {
    const orderRepository = dataSource.getRepository(Order);
    const productRepository = dataSource.getRepository(Product);
    const categoryRepository = dataSource.getRepository(Category);
    const userRepository = dataSource.getRepository(User);

    await orderRepository.delete({});
    await productRepository.delete({});
    await categoryRepository.delete({});
    await userRepository.delete({});
  }

  describe("/api/admin/dashboard/metrics (GET)", () => {
    it("should return dashboard metrics for admin user", () => {
      return request(app.getHttpServer())
        .get("/api/admin/dashboard/metrics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("total_users");
          expect(res.body).toHaveProperty("total_products");
          expect(res.body).toHaveProperty("total_orders");
          expect(res.body).toHaveProperty("total_revenue");
          expect(res.body).toHaveProperty("user_growth");
          expect(res.body).toHaveProperty("order_growth");
          expect(res.body).toHaveProperty("revenue_growth");
          expect(res.body).toHaveProperty("active_users");
          expect(res.body).toHaveProperty("pending_orders");
          expect(res.body).toHaveProperty("low_stock_products");

          expect(typeof res.body.total_users).toBe("number");
          expect(typeof res.body.total_products).toBe("number");
          expect(typeof res.body.total_orders).toBe("number");
          expect(typeof res.body.total_revenue).toBe("number");
          expect(res.body.total_users).toBeGreaterThanOrEqual(1);
          expect(res.body.total_products).toBeGreaterThanOrEqual(1);
          expect(res.body.total_orders).toBeGreaterThanOrEqual(1);
        });
    });

    it("should return dashboard metrics with date range filter", () => {
      const dateFrom = "2024-01-01";
      const dateTo = "2024-12-31";

      return request(app.getHttpServer())
        .get(
          `/api/admin/dashboard/metrics?date_from=${dateFrom}&date_to=${dateTo}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("total_users");
          expect(res.body).toHaveProperty("total_products");
          expect(res.body).toHaveProperty("total_orders");
          expect(res.body).toHaveProperty("total_revenue");
        });
    });

    it("should return 401 for non-admin user", () => {
      const userToken = jwtService.sign({
        sub: testUser.id,
        email: testUser.email,
        role: Role.USER,
      });

      return request(app.getHttpServer())
        .get("/api/admin/dashboard/metrics")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(401);
    });

    it("should return 401 without authentication", () => {
      return request(app.getHttpServer())
        .get("/api/admin/dashboard/metrics")
        .expect(401);
    });
  });

  describe("/api/admin/dashboard/sales-analytics (GET)", () => {
    it("should return sales analytics with required parameters", () => {
      const dateFrom = "2024-01-01";
      const dateTo = "2024-12-31";

      return request(app.getHttpServer())
        .get(
          `/api/admin/dashboard/sales-analytics?date_from=${dateFrom}&date_to=${dateTo}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("sales_trend");
          expect(res.body).toHaveProperty("total_revenue");
          expect(res.body).toHaveProperty("total_orders");
          expect(res.body).toHaveProperty("growth_rate");
          expect(res.body).toHaveProperty("average_order_value");
          expect(res.body).toHaveProperty("peak_sales_day");
          expect(res.body).toHaveProperty("peak_sales_amount");

          expect(Array.isArray(res.body.sales_trend)).toBe(true);
          expect(typeof res.body.total_revenue).toBe("number");
          expect(typeof res.body.total_orders).toBe("number");
          expect(typeof res.body.growth_rate).toBe("number");
          expect(typeof res.body.average_order_value).toBe("number");
        });
    });

    it("should return sales analytics with different intervals", async () => {
      const dateFrom = "2024-01-01";
      const dateTo = "2024-12-31";
      const intervals = ["day", "week", "month"];

      for (const interval of intervals) {
        await request(app.getHttpServer())
          .get(
            `/api/admin/dashboard/sales-analytics?date_from=${dateFrom}&date_to=${dateTo}&interval=${interval}`,
          )
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty("sales_trend");
            expect(Array.isArray(res.body.sales_trend)).toBe(true);
          });
      }
    });

    it("should return 400 for missing required parameters", () => {
      return request(app.getHttpServer())
        .get("/api/admin/dashboard/sales-analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });

    it("should return 400 for invalid date format", () => {
      return request(app.getHttpServer())
        .get(
          "/api/admin/dashboard/sales-analytics?date_from=invalid-date&date_to=2024-12-31",
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });

    it("should return 401 for non-admin user", () => {
      const userToken = jwtService.sign({
        sub: testUser.id,
        email: testUser.email,
        role: Role.USER,
      });

      return request(app.getHttpServer())
        .get(
          "/api/admin/dashboard/sales-analytics?date_from=2024-01-01&date_to=2024-12-31",
        )
        .set("Authorization", `Bearer ${userToken}`)
        .expect(401);
    });
  });

  describe("Caching behavior", () => {
    it("should serve subsequent requests faster (indicating caching)", async () => {
      const endpoint = "/api/admin/dashboard/metrics";

      // First request
      const start1 = Date.now();
      await request(app.getHttpServer())
        .get(endpoint)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      await request(app.getHttpServer())
        .get(endpoint)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      // Second request should be significantly faster due to caching
      // Note: This is a basic test - in a real scenario, you might want to mock the cache
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });
});
