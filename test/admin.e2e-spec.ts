import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../src/users/entities/user.entity";
import { Order } from "../src/orders/entities/order.entity";
import { Product } from "../src/products/entities/product.entity";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "../src/common/guards/roles.guard";
import { Role } from "../src/common/decorators/roles.decorator";

describe("AdminController (e2e)", () => {
  let app: INestApplication;

  const mockJwtToken = "mock-jwt-token";
  const mockUser = {
    id: "admin1",
    email: "admin@example.com",
    name: "Admin User",
    role: Role.ADMIN,
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    innerJoin: jest.fn().mockReturnThis(),
  };

  const mockUserRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockOrderRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockProductRepository = {
    count: jest.fn(),
  };

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
            return false;
          }
          request.user = mockUser;
          return true;
        }),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation((context) => {
          const request = context.switchToHttp().getRequest();
          return request.user?.role === Role.ADMIN;
        }),
      })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .overrideProvider(getRepositoryToken(Order))
      .useValue(mockOrderRepository)
      .overrideProvider(getRepositoryToken(Product))
      .useValue(mockProductRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /admin/dashboard/summary", () => {
    it("should return dashboard summary", async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: 1000 });
      mockOrderRepository.count.mockResolvedValue(5);
      mockProductRepository.count.mockResolvedValue(10);

      const res = await request(app.getHttpServer())
        .get("/admin/dashboard/summary")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("total_sales");
      expect(res.body).toHaveProperty("active_users");
      expect(res.body).toHaveProperty("pending_orders");
      expect(res.body).toHaveProperty("total_products");
    });
  });

  describe("GET /admin/users", () => {
    it("should return users list without search", async () => {
      const mockUsers = [
        {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          created_at: new Date(),
          role: Role.USER,
          order_count: 2,
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 1]);

      const res = await request(app.getHttpServer())
        .get("/admin/users")
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("total");
      expect(res.body.users).toHaveLength(1);
    });

    it("should return filtered users with search", async () => {
      const mockUsers = [
        {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          created_at: new Date(),
          role: Role.USER,
          order_count: 2,
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 1]);

      const res = await request(app.getHttpServer())
        .get("/admin/users")
        .query({ search: "test" })
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("total");
      expect(res.body.users).toHaveLength(1);
    });
  });

  describe("POST /admin/users/:id/block", () => {
    it("should block user successfully", async () => {
      const userId = "user1";
      const mockTargetUser = {
        id: userId,
        role: Role.ADMIN,
        email: "user@example.com",
        name: "Test User",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(mockTargetUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockTargetUser,
        role: Role.USER,
      });

      const res = await request(app.getHttpServer())
        .post(`/admin/users/${userId}/block`)
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("message", "User blocked successfully");
      expect(res.body).toHaveProperty("user_id", userId);
    });

    it("should return 404 for non-existent user", async () => {
      const userId = "nonexistent";
      mockUserRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post(`/admin/users/${userId}/block`)
        .set("Authorization", `Bearer ${mockJwtToken}`)
        .expect(404);
    });
  });
});
