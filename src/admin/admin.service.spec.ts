import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Role } from '../common/decorators/roles.decorator';

describe('AdminService', () => {
  let service: AdminService;
  let userRepository: any;
  let orderRepository: any;
  let productRepository: any;

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
    userRepository = module.get(getRepositoryToken(User));
    orderRepository = module.get(getRepositoryToken(Order));
    productRepository = module.get(getRepositoryToken(Product));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should return correct dashboard summary', async () => {
      // Mock total sales
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ total: 1000 });

      // Mock active users
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: 10 });

      // Mock pending orders
      orderRepository.count.mockResolvedValueOnce(5);

      // Mock total products
      productRepository.count.mockResolvedValueOnce(50);

      const result = await service.getDashboardSummary();

      expect(result).toEqual({
        total_sales: 1000,
        active_users: 10,
        pending_orders: 5,
        total_products: 50,
      });
    });

    it('should handle zero values', async () => {
      // Mock all queries to return zero
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ total: 0 });
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: 0 });
      orderRepository.count.mockResolvedValueOnce(0);
      productRepository.count.mockResolvedValueOnce(0);

      const result = await service.getDashboardSummary();

      expect(result).toEqual({
        total_sales: 0,
        active_users: 0,
        pending_orders: 0,
        total_products: 0,
      });
    });
  });

  describe('getSalesAnalytics', () => {
    it('should return sales data for last 7 days by default', async () => {
      const mockSalesData = [
        { date: '2024-01-01', revenue: '1000' },
        { date: '2024-01-02', revenue: '2000' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValueOnce(mockSalesData);

      const result = await service.getSalesAnalytics();

      expect(result).toEqual({
        dates: ['2024-01-01', '2024-01-02'],
        revenue: [1000, 2000],
        range: 'last_7_days',
      });
    });

    it('should return sales data for specified range', async () => {
      const mockSalesData = [
        { date: '2024-01-01', revenue: '1000' },
        { date: '2024-01-02', revenue: '2000' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValueOnce(mockSalesData);

      const result = await service.getSalesAnalytics('last_30_days');

      expect(result).toEqual({
        dates: ['2024-01-01', '2024-01-02'],
        revenue: [1000, 2000],
        range: 'last_30_days',
      });
    });
  });

  describe('getUsers', () => {
    it('should return users without search', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          created_at: new Date(),
          role: Role.USER,
          order_count: 2,
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([mockUsers, 1]);

      const result = await service.getUsers();

      expect(result).toEqual({
        users: mockUsers,
        total: 1,
      });
    });

    it('should return filtered users with search', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          created_at: new Date(),
          role: Role.USER,
          order_count: 2,
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([mockUsers, 1]);

      const result = await service.getUsers('test');

      expect(result).toEqual({
        users: mockUsers,
        total: 1,
      });
    });
  });

  describe('blockUser', () => {
    it('should block user successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: Role.ADMIN,
      };

      userRepository.findOne.mockResolvedValueOnce(mockUser);
      userRepository.save.mockResolvedValueOnce({ ...mockUser, role: Role.USER });

      const result = await service.blockUser('1');

      expect(result).toEqual({
        message: 'User blocked successfully',
        user_id: '1',
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        role: Role.USER,
      });
    });

    it('should throw error if user not found', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.blockUser('non-existent')).rejects.toThrow('User not found');
    });
  });
}); 