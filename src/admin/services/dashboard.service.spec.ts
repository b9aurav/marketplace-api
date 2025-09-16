import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { User } from '../../users/entities/user.entity';
import { Order, OrderStatus } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';
import { CacheService } from '../../common/cache/cache.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let userRepository: jest.Mocked<Repository<User>>;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    userRepository = module.get(getRepositoryToken(User));
    orderRepository = module.get(getRepositoryToken(Order));
    productRepository = module.get(getRepositoryToken(Product));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should return cached data when available', async () => {
      const cachedMetrics = {
        total_users: 100,
        total_products: 50,
        total_orders: 200,
        total_revenue: 10000,
        user_growth: 10,
        order_growth: 15,
        revenue_growth: 20,
        active_users: 90,
        pending_orders: 5,
        low_stock_products: 3,
      };

      cacheService.get.mockResolvedValue(cachedMetrics);

      const result = await service.getDashboardMetrics({});

      expect(result).toEqual(cachedMetrics);
      expect(cacheService.get).toHaveBeenCalledWith('admin:dashboard:metrics:');
      expect(userRepository.count).not.toHaveBeenCalled();
    });

    it('should calculate metrics from database when cache is empty', async () => {
      cacheService.get.mockResolvedValue(null);
      
      // Mock repository responses
      userRepository.count.mockResolvedValueOnce(100); // total users
      productRepository.count.mockResolvedValueOnce(50); // total products
      orderRepository.count.mockResolvedValueOnce(200); // total orders
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ total: '10000' }); // total revenue
      userRepository.count.mockResolvedValueOnce(90); // active users
      orderRepository.count.mockResolvedValueOnce(5); // pending orders
      productRepository.count.mockResolvedValueOnce(3); // low stock products

      // Mock previous period data for growth calculation
      userRepository.count.mockResolvedValueOnce(90); // previous total users
      productRepository.count.mockResolvedValueOnce(45); // previous total products
      orderRepository.count.mockResolvedValueOnce(180); // previous total orders
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ total: '8000' }); // previous total revenue
      userRepository.count.mockResolvedValueOnce(80); // previous active users
      orderRepository.count.mockResolvedValueOnce(8); // previous pending orders
      productRepository.count.mockResolvedValueOnce(2); // previous low stock products

      const result = await service.getDashboardMetrics({});

      expect(result.total_users).toBe(100);
      expect(result.total_products).toBe(50);
      expect(result.total_orders).toBe(200);
      expect(result.total_revenue).toBe(10000);
      expect(result.user_growth).toBeCloseTo(11.11, 1); // (100-90)/90 * 100
      expect(cacheService.set).toHaveBeenCalledWith(
        'admin:dashboard:metrics:',
        expect.any(Object),
        300 // 5 minutes TTL
      );
    });

    it('should handle date range filtering', async () => {
      cacheService.get.mockResolvedValue(null);
      
      const query = {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
      };

      // Mock all repository calls
      userRepository.count.mockResolvedValue(50);
      productRepository.count.mockResolvedValue(25);
      orderRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '5000' });

      await service.getDashboardMetrics(query);

      expect(cacheService.get).toHaveBeenCalledWith(
        'admin:dashboard:metrics:date_from:2024-01-01|date_to:2024-01-31'
      );
    });
  });

  describe('getSalesAnalytics', () => {
    it('should return cached analytics when available', async () => {
      const cachedAnalytics = {
        sales_trend: [
          { date: '2024-01-01', revenue: 1000, orders: 10, average_order_value: 100 }
        ],
        total_revenue: 5000,
        total_orders: 50,
        growth_rate: 15,
        average_order_value: 100,
        peak_sales_day: '2024-01-01',
        peak_sales_amount: 1000,
      };

      cacheService.get.mockResolvedValue(cachedAnalytics);

      const query = {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        interval: 'day',
      };

      const result = await service.getSalesAnalytics(query);

      expect(result).toEqual(cachedAnalytics);
      expect(cacheService.get).toHaveBeenCalledWith(
        'admin:sales:analytics:date_from:2024-01-01|date_to:2024-01-31|interval:day'
      );
    });

    it('should calculate analytics from database when cache is empty', async () => {
      cacheService.get.mockResolvedValue(null);

      const query = {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        interval: 'day',
      };

      // Mock sales trend data
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([
        { date: '2024-01-01', revenue: '1000', orders: '10', average_order_value: '100' },
        { date: '2024-01-02', revenue: '1200', orders: '12', average_order_value: '100' },
      ]);

      // Mock total metrics for current period
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({
        totalRevenue: '5000',
        totalOrders: '50',
      });

      // Mock previous period metrics for growth calculation
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({
        totalRevenue: '4000',
        totalOrders: '40',
      });

      const result = await service.getSalesAnalytics(query);

      expect(result.sales_trend).toHaveLength(2);
      expect(result.total_revenue).toBe(5000);
      expect(result.total_orders).toBe(50);
      expect(result.growth_rate).toBe(25); // (5000-4000)/4000 * 100
      expect(result.peak_sales_day).toBe('2024-01-02');
      expect(result.peak_sales_amount).toBe(1200);
      
      expect(cacheService.set).toHaveBeenCalledWith(
        'admin:sales:analytics:date_from:2024-01-01|date_to:2024-01-31|interval:day',
        expect.any(Object),
        300 // 5 minutes TTL
      );
    });

    it('should handle different intervals', async () => {
      cacheService.get.mockResolvedValue(null);

      const query = {
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        interval: 'month',
      };

      mockQueryBuilder.getRawMany.mockResolvedValueOnce([]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ totalRevenue: '0', totalOrders: '0' });

      await service.getSalesAnalytics(query);

      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith("TO_CHAR(order.created_at, 'YYYY-MM')");
    });
  });

  describe('cache key generation', () => {
    it('should generate consistent cache keys', async () => {
      cacheService.get.mockResolvedValue(null);
      
      // Mock all required repository calls to prevent errors
      userRepository.count.mockResolvedValue(0);
      productRepository.count.mockResolvedValue(0);
      orderRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '0' });

      const query1 = { date_from: '2024-01-01', date_to: '2024-01-31' };
      const query2 = { date_to: '2024-01-31', date_from: '2024-01-01' };

      await service.getDashboardMetrics(query1);
      await service.getDashboardMetrics(query2);

      // Both calls should use the same cache key (parameters sorted)
      expect(cacheService.get).toHaveBeenCalledWith(
        'admin:dashboard:metrics:date_from:2024-01-01|date_to:2024-01-31'
      );
      expect(cacheService.get).toHaveBeenCalledTimes(2);
    });
  });
});