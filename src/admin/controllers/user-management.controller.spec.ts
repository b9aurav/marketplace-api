import { Test, TestingModule } from "@nestjs/testing";
import { UserManagementController } from "./user-management.controller";
import { UserManagementService } from "../services/user-management.service";
import { AdminGuard } from "../guards/admin.guard";
import { AdminAuditInterceptor } from "../interceptors/admin-audit.interceptor";
import { Role } from "../../common/decorators/roles.decorator";
import { User } from "../../users/entities/user.entity";
import {
  GetUsersQueryDto,
  UpdateUserStatusDto,
  UserStatus,
  PaginatedUsersDto,
  UserDetailsDto,
  UserAnalyticsDto,
} from "../dto/user-management.dto";

describe("UserManagementController", () => {
  let controller: UserManagementController;
  let service: jest.Mocked<UserManagementService>;

  const mockAdmin: User = {
    id: "admin-123",
    email: "admin@example.com",
    name: "Admin User",
    phone: null,
    role: Role.ADMIN,
    is_active: true,
    last_login_at: new Date(),
    metadata: {},
    addresses: [],
    orders: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPaginatedUsers: PaginatedUsersDto = {
    data: [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "user@example.com",
        name: "Test User",
        phone: "+1234567890",
        role: Role.USER,
        is_active: true,
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        order_count: 5,
        total_spent: 250.0,
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    total_pages: 1,
  };

  const mockUserDetails: UserDetailsDto = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "user@example.com",
    name: "Test User",
    phone: "+1234567890",
    role: Role.USER,
    is_active: true,
    last_login_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    order_count: 5,
    total_spent: 250.0,
    metadata: {},
    addresses: [],
    recent_orders: [],
    total_orders: 5,
    average_order_value: 50.0,
    first_order_date: new Date(),
    last_order_date: new Date(),
  };

  const mockUserAnalytics: UserAnalyticsDto = {
    total_users: 100,
    active_users: 80,
    inactive_users: 20,
    blocked_users: 0,
    new_users_today: 5,
    new_users_this_week: 25,
    new_users_this_month: 100,
    registration_trend: [
      { date: "2023-01-01", count: 10 },
      { date: "2023-01-02", count: 15 },
    ],
    role_distribution: [
      { role: "user", count: 80, percentage: 80 },
      { role: "admin", count: 20, percentage: 20 },
    ],
    activity_metrics: [
      { period: "2023-01", active_users: 50, login_count: 200 },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserManagementController],
      providers: [
        {
          provide: UserManagementService,
          useValue: {
            getUsers: jest.fn(),
            getUserDetails: jest.fn(),
            updateUserStatus: jest.fn(),
            getUserAnalytics: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideInterceptor(AdminAuditInterceptor)
      .useValue({ intercept: jest.fn((context, next) => next.handle()) })
      .compile();

    controller = module.get<UserManagementController>(UserManagementController);
    service = module.get(UserManagementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUsers", () => {
    it("should return paginated users", async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10 };
      service.getUsers.mockResolvedValue(mockPaginatedUsers);

      const result = await controller.getUsers(query);

      expect(service.getUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedUsers);
    });

    it("should handle search query", async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10, search: "test" };
      service.getUsers.mockResolvedValue(mockPaginatedUsers);

      const result = await controller.getUsers(query);

      expect(service.getUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedUsers);
    });

    it("should handle role filter", async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10, role: Role.USER };
      service.getUsers.mockResolvedValue(mockPaginatedUsers);

      const result = await controller.getUsers(query);

      expect(service.getUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedUsers);
    });

    it("should handle status filter", async () => {
      const query: GetUsersQueryDto = {
        page: 1,
        limit: 10,
        status: UserStatus.ACTIVE,
      };
      service.getUsers.mockResolvedValue(mockPaginatedUsers);

      const result = await controller.getUsers(query);

      expect(service.getUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedUsers);
    });

    it("should handle date range filters", async () => {
      const query: GetUsersQueryDto = {
        page: 1,
        limit: 10,
        date_from: "2023-01-01",
        date_to: "2023-12-31",
      };
      service.getUsers.mockResolvedValue(mockPaginatedUsers);

      const result = await controller.getUsers(query);

      expect(service.getUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedUsers);
    });

    it("should handle sorting options", async () => {
      const query: GetUsersQueryDto = {
        page: 1,
        limit: 10,
        sort_by: "name",
        sort_order: "asc",
      };
      service.getUsers.mockResolvedValue(mockPaginatedUsers);

      const result = await controller.getUsers(query);

      expect(service.getUsers).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedUsers);
    });
  });

  describe("getUserDetails", () => {
    it("should return user details", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      service.getUserDetails.mockResolvedValue(mockUserDetails);

      const result = await controller.getUserDetails(userId);

      expect(service.getUserDetails).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserDetails);
    });
  });

  describe("updateUserStatus", () => {
    it("should update user status successfully", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const updateDto: UpdateUserStatusDto = {
        status: UserStatus.INACTIVE,
        reason: "Test reason",
      };
      service.updateUserStatus.mockResolvedValue();

      const result = await controller.updateUserStatus(
        userId,
        updateDto,
        mockAdmin,
      );

      expect(service.updateUserStatus).toHaveBeenCalledWith(
        userId,
        updateDto,
        mockAdmin.id,
      );
      expect(result).toEqual({
        message: `User status updated to ${updateDto.status} successfully`,
      });
    });

    it("should update user status without reason", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const updateDto: UpdateUserStatusDto = {
        status: UserStatus.ACTIVE,
      };
      service.updateUserStatus.mockResolvedValue();

      const result = await controller.updateUserStatus(
        userId,
        updateDto,
        mockAdmin,
      );

      expect(service.updateUserStatus).toHaveBeenCalledWith(
        userId,
        updateDto,
        mockAdmin.id,
      );
      expect(result).toEqual({
        message: `User status updated to ${updateDto.status} successfully`,
      });
    });
  });

  describe("getUserAnalytics", () => {
    it("should return user analytics", async () => {
      const query = { date_from: "2023-01-01", date_to: "2023-12-31" };
      service.getUserAnalytics.mockResolvedValue(mockUserAnalytics);

      const result = await controller.getUserAnalytics(query);

      expect(service.getUserAnalytics).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockUserAnalytics);
    });

    it("should return user analytics with default parameters", async () => {
      const query = {};
      service.getUserAnalytics.mockResolvedValue(mockUserAnalytics);

      const result = await controller.getUserAnalytics(query);

      expect(service.getUserAnalytics).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockUserAnalytics);
    });

    it("should handle interval parameter", async () => {
      const query = {
        date_from: "2023-01-01",
        date_to: "2023-12-31",
        interval: "month",
      };
      service.getUserAnalytics.mockResolvedValue(mockUserAnalytics);

      const result = await controller.getUserAnalytics(query);

      expect(service.getUserAnalytics).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockUserAnalytics);
    });
  });
});
