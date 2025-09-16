import { Test, TestingModule } from "@nestjs/testing";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { Order } from "../orders/entities/order.entity";
import { Product } from "../products/entities/product.entity";
import { Role } from "../common/decorators/roles.decorator";

describe("AdminController", () => {
  let controller: AdminController;
  let service: AdminService;

  const mockUserRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockOrderRepository = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue({ total: 0 }),
    })),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockProductRepository = {
    count: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getDashboardSummary", () => {
    it("should return dashboard summary", async () => {
      const expectedSummary = {
        total_sales: 1000,
        active_users: 10,
        pending_orders: 5,
        total_products: 50,
      };

      jest
        .spyOn(service, "getDashboardSummary")
        .mockResolvedValue(expectedSummary);

      const result = await controller.getDashboardSummary();
      expect(result).toEqual(expectedSummary);
    });
  });

  describe("getSalesAnalytics", () => {
    it("should return sales analytics for last 7 days by default", async () => {
      const expectedAnalytics = {
        dates: ["2024-01-01", "2024-01-02"],
        revenue: [1000, 2000],
        range: "last_7_days",
      };

      jest
        .spyOn(service, "getSalesAnalytics")
        .mockResolvedValue(expectedAnalytics);

      const result = await controller.getSalesAnalytics();
      expect(result).toEqual(expectedAnalytics);
    });

    it("should return sales analytics for specified range", async () => {
      const expectedAnalytics = {
        dates: ["2024-01-01", "2024-01-02"],
        revenue: [1000, 2000],
        range: "last_30_days",
      };

      jest
        .spyOn(service, "getSalesAnalytics")
        .mockResolvedValue(expectedAnalytics);

      const result = await controller.getSalesAnalytics("last_30_days");
      expect(result).toEqual(expectedAnalytics);
    });
  });

  describe("getUsers", () => {
    it("should return users list without search", async () => {
      const expectedUsers = {
        users: [
          {
            id: "1",
            name: "Test User",
            email: "test@example.com",
            created_at: new Date(),
            role: Role.USER,
            order_count: 2,
          },
        ],
        total: 1,
      };

      jest.spyOn(service, "getUsers").mockResolvedValue(expectedUsers);

      const result = await controller.getUsers();
      expect(result).toEqual(expectedUsers);
    });

    it("should return filtered users with search", async () => {
      const expectedUsers = {
        users: [
          {
            id: "1",
            name: "Test User",
            email: "test@example.com",
            created_at: new Date(),
            role: Role.USER,
            order_count: 2,
          },
        ],
        total: 1,
      };

      jest.spyOn(service, "getUsers").mockResolvedValue(expectedUsers);

      const result = await controller.getUsers("test");
      expect(result).toEqual(expectedUsers);
    });
  });

  describe("blockUser", () => {
    it("should block user successfully", async () => {
      const userId = "1";
      const expectedResponse = {
        message: "User blocked successfully",
        user_id: userId,
      };

      jest.spyOn(service, "blockUser").mockResolvedValue(expectedResponse);

      const result = await controller.blockUser(userId);
      expect(result).toEqual(expectedResponse);
    });

    it("should throw error if user not found", async () => {
      const userId = "non-existent";

      jest
        .spyOn(service, "blockUser")
        .mockRejectedValue(new Error("User not found"));

      await expect(controller.blockUser(userId)).rejects.toThrow(
        "User not found",
      );
    });
  });
});
