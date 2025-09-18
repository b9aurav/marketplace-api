import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Order, OrderStatus } from "../src/orders/entities/order.entity";
import { User } from "../src/users/entities/user.entity";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../src/common/guards/roles.guard";
import { Role } from "../src/common/decorators/roles.decorator";
import { UnauthorizedException } from "@nestjs/common";

describe("OrdersController (e2e)", () => {
  let app: INestApplication;

  const mockJwtToken = "mock-jwt-token";
  const mockUser = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "test@example.com",
    name: "Test User",
    role: Role.USER,
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockOrderRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockProduct = {
    id: "123e4567-e89b-12d3-a456-426614174010",
    name: "Test Product",
    price: 100,
  };
  const mockAddressId = "123e4567-e89b-12d3-a456-426614174020";

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation((context) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid token");
          }
          request.user = mockUser;
          return true;
        }),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation(() => true),
      })
      .overrideProvider(getRepositoryToken(Order))
      .useValue(mockOrderRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Mock order repository responses
    mockOrderRepository.create.mockImplementation((data) => ({
      ...data,
      id: "123e4567-e89b-12d3-a456-426614174001",
    }));
    mockOrderRepository.save.mockImplementation((data) => ({
      ...data,
      id: "123e4567-e89b-12d3-a456-426614174001",
      status: OrderStatus.PENDING,
      total: 100,
      items: [
        {
          id: "123e4567-e89b-12d3-a456-426614174002",
          product_id: mockProduct.id,
          quantity: 1,
          price: mockProduct.price,
          product: mockProduct,
        },
      ],
    }));
    mockOrderRepository.findOne.mockImplementation(() => ({
      id: "123e4567-e89b-12d3-a456-426614174001",
      user_id: mockUser.id,
      status: OrderStatus.PENDING,
      total: 100,
      items: [
        {
          id: "123e4567-e89b-12d3-a456-426614174002",
          product_id: mockProduct.id,
          quantity: 1,
          price: mockProduct.price,
          product: mockProduct,
        },
      ],
    }));
    mockOrderRepository.findAndCount.mockImplementation(() => {
      const mockOrders = [
        {
          id: "123e4567-e89b-12d3-a456-426614174001",
          user_id: mockUser.id,
          status: OrderStatus.PENDING,
          total: 100,
          items: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      return [mockOrders, mockOrders.length];
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /orders", () => {
    it("should return 401 without auth token", () => {
      return request(app.getHttpServer()).get("/orders").expect(401);
    });

    it("should return user orders without status filter", async () => {
      const mockOrders = [
        {
          id: "123e4567-e89b-12d3-a456-426614174001",
          user_id: mockUser.id,
          status: OrderStatus.PENDING,
          total: 100,
          items: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockOrders);

      const res = await request(app.getHttpServer())
        .get("/orders")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("orders");
      expect(res.body.orders).toHaveLength(1);
      expect(res.body.orders[0]).toHaveProperty(
        "id",
        "123e4567-e89b-12d3-a456-426614174001",
      );
    });

    it("should return filtered user orders with status", async () => {
      const mockOrders = [
        {
          id: "123e4567-e89b-12d3-a456-426614174001",
          user_id: mockUser.id,
          status: OrderStatus.PENDING,
          total: 100,
          items: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockOrders, 1]);

      const res = await request(app.getHttpServer())
        .get("/orders")
        .query({ status: OrderStatus.PENDING })
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("orders");
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.orders).toHaveLength(1);
      res.body.orders.forEach((order: any) => {
        expect(order.status).toBe(OrderStatus.PENDING);
      });
    });
  });

  describe("GET /orders/:id", () => {
    it("should return order details", async () => {
      const mockOrder = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        user_id: mockUser.id,
        status: OrderStatus.PENDING,
        total: 100,
        items: [],
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const res = await request(app.getHttpServer())
        .get("/orders/123e4567-e89b-12d3-a456-426614174001")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty(
        "id",
        "123e4567-e89b-12d3-a456-426614174001",
      );
      expect(res.body).toHaveProperty("status", OrderStatus.PENDING);
      expect(res.body).toHaveProperty("total", 100);
    });

    it("should return 404 for non-existent order", async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get("/orders/999")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(404);
    });
  });

  describe("POST /orders", () => {
    it("should return 401 without auth token", () => {
      return request(app.getHttpServer())
        .post("/orders")
        .send({
          items: [{ product_id: mockProduct.id, quantity: 1 }],
          address_id: mockAddressId,
          payment_method: "credit_card",
        })
        .expect(401);
    });

    it("should create a new order", async () => {
      // Insert a real category into the test database using the API
      const categoryResponse = await request(app.getHttpServer())
        .post("/admin/categories")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .send({
          name: "Test Category",
          description: "A test category",
        });
      // eslint-disable-next-line no-console
      console.log("Category creation response:", categoryResponse.body);
      const category = categoryResponse.body;

      // Create a real product using the API
      const productResponse = await request(app.getHttpServer())
        .post("/admin/products")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .send({
          name: "Test Product",
          description: "Test Description",
          price: 100,
          stock: 10,
          images: [],
          category_id: category.id,
        });
      // eslint-disable-next-line no-console
      console.log("Product creation response:", productResponse.body);
      const product = productResponse.body;

      // Ensure the product is committed to the database
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a real user in the database for address creation
      const userRepository = app.get(getRepositoryToken(User));
      const user = await userRepository.findOne({
        where: { email: mockUser.email },
      });
      if (!user) {
        await userRepository.save({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          phone: "+1234567890",
        });
      } else {
        await userRepository.update(user.id, {
          name: mockUser.name,
          role: mockUser.role,
          phone: "+1234567890",
        });
      }

      // Create a real address using the API
      const addressRes = await request(app.getHttpServer())
        .post("/users/me/addresses")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .send({
          street: "123 Test St",
          city: "Test City",
          state: "Test State",
          zip: "12345",
          label: "Home",
          is_default: true,
        });
      // Always log the response for debugging
      // eslint-disable-next-line no-console
      console.log("Address creation response:", addressRes.body);
      expect(addressRes.status).toBe(201);
      const address = addressRes.body;

      // Debug: Fetch and log the product before creating the order
      const productInDb = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);
      // eslint-disable-next-line no-console
      console.log("Product in DB before order creation:", productInDb.body);

      // Debug: Log the payload being sent to /orders
      const orderPayload = {
        items: [{ product_id: product.id, quantity: 1 }],
        address_id: address.id,
        payment_method: "credit_card",
      };
      // eslint-disable-next-line no-console
      console.log("Order payload:", orderPayload);

      let res;
      try {
        res = await request(app.getHttpServer())
          .post("/orders")
          .set("Authorization", `Bearer ${mockJwtToken}`)
          .send(orderPayload)
          .expect(201);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(
          "Order creation error response:",
          err.response?.body || err,
        );
        throw err;
      }

      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("status", OrderStatus.PENDING);
    });
  });

  describe("POST /orders/:id/cancel", () => {
    it("should return 401 without auth token", () => {
      return request(app.getHttpServer()).post("/orders/1/cancel").expect(401);
    });

    it("should cancel order successfully", async () => {
      const mockOrder = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        user_id: mockUser.id,
        status: OrderStatus.PENDING,
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const res = await request(app.getHttpServer())
        .post("/orders/123e4567-e89b-12d3-a456-426614174001/cancel")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty(
        "message",
        "Order cancelled successfully",
      );
    });
  });

  describe("GET /orders/:id/track", () => {
    it("should return 401 without auth token", () => {
      return request(app.getHttpServer()).get("/orders/1/track").expect(401);
    });

    it("should return tracking information", async () => {
      const mockOrder = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        user_id: mockUser.id,
        status: OrderStatus.SHIPPED,
        tracking_number: "TRACK123",
        created_at: new Date(),
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const res = await request(app.getHttpServer())
        .get("/orders/1/track")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("status", OrderStatus.SHIPPED);
      expect(res.body).toHaveProperty("tracking_number", "TRACK123");
    });
  });
});
