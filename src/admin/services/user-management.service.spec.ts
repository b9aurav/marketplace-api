import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { UserManagementService } from "./user-management.service";
import { User } from "../../users/entities/user.entity";
import { Order } from "../../orders/entities/order.entity";
import { CacheService } from "../../common/cache/cache.service";
import { CacheKeyGenerator } from "../../common/cache/cache-key-generator.service";
import { AdminAuditService } from "./admin-audit.service";
import { Role } from "../../common/decorators/roles.decorator";
import { UserStatus, GetUsersQueryDto } from "../dto/user-management.dto";

describe("UserManagementService", () => {
  let service: UserManagementService;
  let userRepository: jest.Mocked<Repository<User>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let cacheService: jest.Mocked<CacheService>;
  let cacheKeyGenerator: jest.Mocked<CacheKeyGenerator>;
  let auditService: jest.Mocked<AdminAuditService>;

  const mockUser: User = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "test@example.com",
    name: "Test User",
    phone: "+1234567890",
    role: Role.USER,
    is_active: true,
    last_login_at: new Date(),
    metadata: {},
    addresses: [],
    orders: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getMany: jest.fn(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delPattern: jest.fn(),
          },
        },
        {
          provide: CacheKeyGenerator,
          useValue: {
            generateListKey: jest.fn(),
            generateSimpleKey: jest.fn(),
            generateAnalyticsKey: jest.fn(),
          },
        },
        {
          provide: AdminAuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserManagementService>(UserManagementService);
    userRepository = module.get(getRepositoryToken(User));
    orderRepository = module.get(getRepositoryToken(Order));
    cacheService = module.get(CacheService);
    cacheKeyGenerator = module.get(CacheKeyGenerator);
    auditService = module.get(AdminAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    it("should return cached users if available", async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10 };
      const cacheKey = "test-cache-key";
      const cachedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      };

      cacheKeyGenerator.generateListKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getUsers(query);

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedResult);
      expect(userRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("should fetch users from database when cache miss", async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10 };
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateListKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockUser]);
      orderRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawOne: jest.fn().mockResolvedValue({
          total_orders: "0",
          total_spent: "0",
          average_order_value: "0",
          first_order_date: null,
          last_order_date: null,
        }),
      } as any);

      const result = await service.getUsers(query);

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith("user");
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(cacheService.set).toHaveBeenCalled();
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should apply search filter when provided", async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10, search: "test" };
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateListKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getUsers(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(user.name ILIKE :search OR user.email ILIKE :search)",
        { search: "%test%" },
      );
    });

    it("should apply role filter when provided", async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10, role: Role.ADMIN };
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateListKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getUsers(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "user.role = :role",
        { role: Role.ADMIN },
      );
    });

    it("should apply status filter when provided", async () => {
      const query: GetUsersQueryDto = {
        page: 1,
        limit: 10,
        status: UserStatus.ACTIVE,
      };
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateListKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getUsers(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "user.is_active = :isActive",
        { isActive: true },
      );
    });
  });

  describe("getUserDetails", () => {
    it("should return cached user details if available", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const cacheKey = "test-cache-key";
      const cachedResult = {
        ...mockUser,
        metadata: {},
        addresses: [],
        recent_orders: [],
        total_orders: 0,
        average_order_value: 0,
        first_order_date: null,
        last_order_date: null,
        order_count: 0,
        total_spent: 0,
      };

      cacheKeyGenerator.generateSimpleKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getUserDetails(userId);

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedResult);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it("should fetch user details from database when cache miss", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateSimpleKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);
      orderRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawOne: jest.fn().mockResolvedValue({
          total_orders: "0",
          total_spent: "0",
          average_order_value: "0",
          first_order_date: null,
          last_order_date: null,
        }),
      } as any);
      orderRepository.find.mockResolvedValue([]);

      const result = await service.getUserDetails(userId);

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ["addresses", "orders"],
      });
      expect(cacheService.set).toHaveBeenCalled();
      expect(result.id).toBe(userId);
    });

    it("should throw NotFoundException when user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateSimpleKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserDetails(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateUserStatus", () => {
    it("should update user status and log action", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const adminId = "admin-123";
      const updateDto = { status: UserStatus.INACTIVE, reason: "Test reason" };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);
      cacheService.delPattern.mockResolvedValue();
      cacheService.del.mockResolvedValue();

      await service.updateUserStatus(userId, updateDto, adminId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        is_active: false,
        updated_at: expect.any(Date),
      });
      expect(auditService.logAction).toHaveBeenCalledWith({
        adminId: adminId,
        action: "UPDATE_USER_STATUS",
        resource: "user",
        resourceId: userId,
        description: "Updated user status from active to inactive",
        metadata: {
          old_status: "active",
          new_status: UserStatus.INACTIVE,
          reason: "Test reason",
        },
        ipAddress: "0.0.0.0",
      });
      expect(cacheService.delPattern).toHaveBeenCalled();
    });

    it("should throw NotFoundException when user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const adminId = "admin-123";
      const updateDto = { status: UserStatus.INACTIVE };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUserStatus(userId, updateDto, adminId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getUserAnalytics", () => {
    it("should return cached analytics if available", async () => {
      const query = { date_from: "2023-01-01", date_to: "2023-12-31" };
      const cacheKey = "test-cache-key";
      const cachedResult = {
        total_users: 100,
        active_users: 80,
        inactive_users: 20,
        blocked_users: 0,
        new_users_today: 5,
        new_users_this_week: 25,
        new_users_this_month: 100,
        registration_trend: [],
        role_distribution: [],
        activity_metrics: [],
      };

      cacheKeyGenerator.generateAnalyticsKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getUserAnalytics(query);

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedResult);
      expect(userRepository.count).not.toHaveBeenCalled();
    });

    it("should fetch analytics from database when cache miss", async () => {
      const query = { date_from: "2023-01-01", date_to: "2023-12-31" };
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateAnalyticsKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      userRepository.count
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(80) // active users
        .mockResolvedValueOnce(20) // inactive users
        .mockResolvedValueOnce(5) // new users today
        .mockResolvedValueOnce(25) // new users this week
        .mockResolvedValueOnce(100); // new users this month

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ date: "2023-01-01", count: "10" }]) // registration trend
        .mockResolvedValueOnce([{ role: "user", count: "80" }]) // role distribution
        .mockResolvedValueOnce([
          { period: "2023-01", active_users: "50", login_count: "200" },
        ]); // activity metrics

      const result = await service.getUserAnalytics(query);

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(userRepository.count).toHaveBeenCalledTimes(6);
      expect(cacheService.set).toHaveBeenCalled();
      expect(result.total_users).toBe(100);
      expect(result.active_users).toBe(80);
      expect(result.inactive_users).toBe(20);
    });
  });
});
