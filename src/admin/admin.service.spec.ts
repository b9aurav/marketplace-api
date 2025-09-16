import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AdminService } from "./admin.service";
import { User } from "../users/entities/user.entity";
import { Order } from "../orders/entities/order.entity";
import { Product } from "../products/entities/product.entity";
import { Role } from "../common/decorators/roles.decorator";

describe("AdminService", () => {
  let service: AdminService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
    getManyAndCount: jest.fn(),
    innerJoin: jest.fn().mockReturnThis(),
  };

  const mockUserRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockOrderRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    count: jest.fn(),
  };

  const mockProductRepository = {
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<AdminService>(AdminService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getDashboardSummary", () => {
    it("should return dashboard summary with correct values", async () => {
      const mockTotalSales = { total: 1000 };
      const mockActiveUsers = { count: 10 };
      const mockPendingOrders = 5;
      const mockTotalProducts = 50;

      mockQueryBuilder.getRawOne.mockResolvedValueOnce(mockTotalSales);
      mockQueryBuilder.getRawOne.mockResolvedValueOnce(mockActiveUsers);
      mockOrderRepository.count.mockResolvedValue(mockPendingOrders);
      mockProductRepository.count.mockResolvedValue(mockTotalProducts);

      const result = await service.getDashboardSummary();
      expect(result).toEqual({
        total_sales: 1000,
        active_users: 10,
        pending_orders: 5,
        total_products: 50,
      });
    });
  });

  describe("getSalesAnalytics", () => {
    it("should return sales analytics for last 7 days by default", async () => {
      const mockSalesData = [
        { date: "2024-01-01", revenue: "1000" },
        { date: "2024-01-02", revenue: "2000" },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockSalesData);

      const result = await service.getSalesAnalytics();
      expect(result).toEqual({
        dates: ["2024-01-01", "2024-01-02"],
        revenue: [1000, 2000],
        range: "last_7_days",
      });
    });

    it("should return sales analytics for specified range", async () => {
      const mockSalesData = [
        { date: "2024-01-01", revenue: "1000" },
        { date: "2024-01-02", revenue: "2000" },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockSalesData);

      const result = await service.getSalesAnalytics("last_30_days");
      expect(result).toEqual({
        dates: ["2024-01-01", "2024-01-02"],
        revenue: [1000, 2000],
        range: "last_30_days",
      });
    });
  });

  describe("getUsers", () => {
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

      const result = await service.getUsers();
      expect(result).toEqual({
        users: [
          {
            id: "1",
            name: "Test User",
            email: "test@example.com",
            created_at: expect.any(Date),
            role: Role.USER,
            order_count: 2,
          },
        ],
        total: 1,
      });
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

      const result = await service.getUsers("test");
      expect(result).toEqual({
        users: [
          {
            id: "1",
            name: "Test User",
            email: "test@example.com",
            created_at: expect.any(Date),
            role: Role.USER,
            order_count: 2,
          },
        ],
        total: 1,
      });
    });
  });

  describe("blockUser", () => {
    it("should block user successfully", async () => {
      const userId = "1";
      const mockUser = { id: userId, role: Role.ADMIN };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        role: Role.USER,
      });

      const result = await service.blockUser(userId);
      expect(result).toEqual({
        message: "User blocked successfully",
        user_id: userId,
      });
    });

    it("should throw error if user not found", async () => {
      const userId = "non-existent";
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.blockUser(userId)).rejects.toThrow("User not found");
    });
  });
});
