import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { OrderManagementService } from "./order-management.service";
import { Order, OrderStatus } from "../../orders/entities/order.entity";
import { OrderItem } from "../../orders/entities/order-item.entity";
import { User } from "../../users/entities/user.entity";
import { Address } from "../../users/entities/address.entity";
import { CacheService } from "../../common/cache/cache.service";
import { CacheKeyGenerator } from "../../common/cache/cache-key-generator.service";
import {
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
  ProcessRefundDto,
  OrderAnalyticsQueryDto,
} from "../dto/order-management.dto";

describe("OrderManagementService", () => {
  let service: OrderManagementService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let cacheService: jest.Mocked<CacheService>;
  let cacheKeyGenerator: jest.Mocked<CacheKeyGenerator>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Order>>;

  const mockOrder: Order = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    status: OrderStatus.PENDING,
    total: 100.0,
    fees: 5.0,
    net_amount: 95.0,
    tracking_number: "TRK123",
    payment_method: "credit_card",
    transaction_id: "txn_123",
    payment_method_details: { last4: "1234" },
    admin_notes: "Test order",
    shipping_details: { carrier: "UPS" },
    coupon_code: "SAVE10",
    discount_amount: 10.0,
    created_at: new Date("2023-01-01"),
    updated_at: new Date("2023-01-01"),
    user_id: "user123",
    address_id: "addr123",
    user: {
      id: "user123",
      email: "test@example.com",
      name: "Test User",
      phone: "123-456-7890",
    } as User,
    address: {
      id: "addr123",
      street: "123 Main St",
      city: "Test City",
      state: "TS",
      zip: "12345",
      label: "Home",
      is_default: true,
      user_id: "user123",
    } as Address,
    items: [
      {
        id: "item123",
        product_id: "prod123",
        product_name: "Test Product",
        quantity: 2,
        price: 50.0,
        product: {
          id: "prod123",
          name: "Test Product",
          images: ["image1.jpg"],
          sku: "SKU123",
        },
      } as OrderItem,
    ],
    tracking_info: null,
  } as Order;

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getOne: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getRawOne: jest.fn(),
      getCount: jest.fn(),
      limit: jest.fn().mockReturnThis(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderManagementService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            createQueryBuilder: jest.fn(() => queryBuilder),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Address),
          useValue: {
            createQueryBuilder: jest.fn(() => queryBuilder),
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
      ],
    }).compile();

    service = module.get<OrderManagementService>(OrderManagementService);
    orderRepository = module.get(getRepositoryToken(Order));
    cacheService = module.get(CacheService);
    cacheKeyGenerator = module.get(CacheKeyGenerator);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getOrders", () => {
    it("should return cached orders if available", async () => {
      const query: GetOrdersQueryDto = { page: 1, limit: 10 };
      const cacheKey = "test-cache-key";
      const cachedResult = {
        orders: [mockOrder],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      };

      cacheKeyGenerator.generateListKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getOrders(query);

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedResult);
    });

    it("should fetch orders from database when not cached", async () => {
      const query: GetOrdersQueryDto = { page: 1, limit: 10 };
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateListKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      queryBuilder.getManyAndCount.mockResolvedValue([[mockOrder], 1]);

      const result = await service.getOrders(query);

      expect(queryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should apply search filter correctly", async () => {
      const query: GetOrdersQueryDto = {
        page: 1,
        limit: 10,
        search: "test@example.com",
      };
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateListKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getOrders(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "(order.id ILIKE :search OR user.email ILIKE :search OR order.tracking_number ILIKE :search)",
        { search: "%test@example.com%" },
      );
    });

    it("should apply status filter correctly", async () => {
      const query: GetOrdersQueryDto = {
        page: 1,
        limit: 10,
        status: OrderStatus.PENDING,
      };
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateListKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getOrders(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "order.status = :status",
        { status: OrderStatus.PENDING },
      );
    });
  });

  describe("getOrderDetails", () => {
    it("should return cached order details if available", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateSimpleKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(mockOrder);

      const result = await service.getOrderDetails(orderId);

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(result.id).toBe(orderId);
    });

    it("should fetch order details from database when not cached", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateSimpleKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      queryBuilder.getOne.mockResolvedValue(mockOrder);

      const result = await service.getOrderDetails(orderId);

      expect(queryBuilder.getOne).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
      expect(result.id).toBe(orderId);
    });

    it("should throw NotFoundException when order not found", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const cacheKey = "test-cache-key";

      cacheKeyGenerator.generateSimpleKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(service.getOrderDetails(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status successfully", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const updateData: UpdateOrderStatusDto = {
        status: OrderStatus.PAID,
        admin_notes: "Payment confirmed",
      };

      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      await service.updateOrderStatus(orderId, updateData);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: orderId },
        relations: ["user"],
      });
      expect(orderRepository.save).toHaveBeenCalled();
      expect(cacheService.delPattern).toHaveBeenCalled();
    });

    it("should throw NotFoundException when order not found", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const updateData: UpdateOrderStatusDto = {
        status: OrderStatus.PAID,
      };

      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus(orderId, updateData),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException for invalid status transition", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const updateData: UpdateOrderStatusDto = {
        status: OrderStatus.SHIPPED, // Invalid transition from PENDING
      };

      orderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.updateOrderStatus(orderId, updateData),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("processRefund", () => {
    it("should process refund successfully", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const refundData: ProcessRefundDto = {
        amount: 50.0,
        reason: "Customer request",
        admin_notes: "Approved by admin",
      };

      const paidOrder = { ...mockOrder, status: OrderStatus.PAID };
      orderRepository.findOne.mockResolvedValue(paidOrder);
      orderRepository.save.mockResolvedValue(paidOrder);

      const result = await service.processRefund(orderId, refundData);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(50.0);
      expect(orderRepository.save).toHaveBeenCalled();
      expect(cacheService.delPattern).toHaveBeenCalled();
    });

    it("should throw NotFoundException when order not found", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const refundData: ProcessRefundDto = {
        amount: 50.0,
        reason: "Customer request",
      };

      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.processRefund(orderId, refundData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException when refund amount exceeds order total", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const refundData: ProcessRefundDto = {
        amount: 150.0, // Exceeds order total of 100.00
        reason: "Customer request",
      };

      orderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.processRefund(orderId, refundData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException for non-refundable order status", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const refundData: ProcessRefundDto = {
        amount: 50.0,
        reason: "Customer request",
      };

      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
      orderRepository.findOne.mockResolvedValue(cancelledOrder);

      await expect(service.processRefund(orderId, refundData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getOrderAnalytics", () => {
    it("should return cached analytics if available", async () => {
      const query: OrderAnalyticsQueryDto = {
        date_from: "2023-01-01",
        date_to: "2023-01-31",
        interval: "day",
      };
      const cacheKey = "test-analytics-key";
      const cachedResult = {
        total_orders: 100,
        total_revenue: 10000,
        average_order_value: 100,
        orders_by_status: { pending: 10, paid: 90 },
        revenue_by_status: { pending: 1000, paid: 9000 },
        orders_trend: [],
        top_payment_methods: [],
        refund_statistics: {
          total_refunds: 0,
          total_refund_amount: 0,
          refund_rate: 0,
        },
        growth_metrics: {
          order_growth: 10,
          revenue_growth: 15,
        },
      };

      cacheKeyGenerator.generateAnalyticsKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getOrderAnalytics(query);

      expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedResult);
    });

    it("should fetch analytics from database when not cached", async () => {
      const query: OrderAnalyticsQueryDto = {
        date_from: "2023-01-01",
        date_to: "2023-01-31",
        interval: "day",
      };
      const cacheKey = "test-analytics-key";

      cacheKeyGenerator.generateAnalyticsKey.mockReturnValue(cacheKey);
      cacheService.get.mockResolvedValue(null);

      // Mock various analytics queries
      queryBuilder.getCount
        .mockResolvedValueOnce(100) // total orders current
        .mockResolvedValueOnce(90); // total orders previous

      queryBuilder.getRawOne
        .mockResolvedValueOnce({ total: "10000" }) // total revenue current
        .mockResolvedValueOnce({ average: "100" }) // average order value current
        .mockResolvedValueOnce({ total: "9000" }) // total revenue previous
        .mockResolvedValueOnce({ total: "8100" }); // total revenue previous for growth

      queryBuilder.getRawMany
        .mockResolvedValueOnce([{ status: "pending", count: "10" }]) // orders by status
        .mockResolvedValueOnce([{ status: "pending", revenue: "1000" }]) // revenue by status
        .mockResolvedValueOnce([
          { date: "2023-01-01", orders: "5", revenue: "500" },
        ]) // trend
        .mockResolvedValueOnce([
          { method: "credit_card", count: "50", revenue: "5000" },
        ]); // payment methods

      const result = await service.getOrderAnalytics(query);

      expect(result.total_orders).toBe(100);
      expect(result.total_revenue).toBe(10000);
      expect(result.average_order_value).toBe(100);
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
});
