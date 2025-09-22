import { Test, TestingModule } from "@nestjs/testing";
import { OrderManagementController } from "./order-management.controller";
import { OrderManagementService } from "../services/order-management.service";
import { AdminAuditInterceptor } from "../interceptors/admin-audit.interceptor";
import { OrderStatus } from "../../orders/entities/order.entity";
import {
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
  ProcessRefundDto,
  OrderAnalyticsQueryDto,
  PaginatedOrdersDto,
  OrderDetailsDto,
  OrderAnalyticsDto,
  RefundResultDto,
} from "../dto/order-management.dto";

describe("OrderManagementController", () => {
  let controller: OrderManagementController;
  let service: jest.Mocked<OrderManagementService>;

  const mockPaginatedOrders: PaginatedOrdersDto = {
    orders: [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: OrderStatus.PENDING,
        total: 100.0,
        tracking_number: "TRK123",
        user_id: "user123",
        address_id: "addr123",
        payment_method: "credit_card",
        transaction_id: "txn_123",
        coupon_code: "SAVE10",
        discount_amount: 10.0,
        created_at: new Date("2023-01-01"),
        updated_at: new Date("2023-01-01"),
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          phone: "123-456-7890",
        },
        address: {
          street: "123 Main St",
          city: "Test City",
          state: "TS",
          zip: "12345",
        },
        items: [
          {
            id: "item123",
            product_id: "prod123",
            product_name: "Test Product",
            quantity: 2,
            price: 50.0,
            total: 100.0,
            product: {
              id: "prod123",
              name: "Test Product",
              images: ["image1.jpg"],
              sku: "SKU123",
            },
          },
        ],
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    total_pages: 1,
  };

  const mockOrderDetails: OrderDetailsDto = {
    ...mockPaginatedOrders.orders[0],
    tracking_info: {
      location: "Warehouse",
      estimated_delivery: new Date("2023-01-10"),
      updates: [
        {
          timestamp: new Date("2023-01-01"),
          status: "Order placed",
          location: "Warehouse",
        },
      ],
    },
  };

  const mockOrderAnalytics: OrderAnalyticsDto = {
    total_orders: 100,
    total_revenue: 10000,
    average_order_value: 100,
    orders_by_status: {
      pending: 10,
      paid: 50,
      shipped: 30,
      delivered: 10,
    },
    revenue_by_status: {
      pending: 1000,
      paid: 5000,
      shipped: 3000,
      delivered: 1000,
    },
    orders_trend: [
      {
        date: "2023-01-01",
        orders: 5,
        revenue: 500,
      },
    ],
    top_payment_methods: [
      {
        method: "credit_card",
        count: 80,
        revenue: 8000,
      },
    ],
    refund_statistics: {
      total_refunds: 5,
      total_refund_amount: 500,
      refund_rate: 5,
    },
    growth_metrics: {
      order_growth: 10,
      revenue_growth: 15,
    },
  };

  const mockRefundResult: RefundResultDto = {
    success: true,
    refund_id: "ref_123",
    amount: 50.0,
    message: "Refund processed successfully",
    transaction_id: "txn_123",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderManagementController],
      providers: [
        {
          provide: OrderManagementService,
          useValue: {
            getOrders: jest.fn(),
            getOrderDetails: jest.fn(),
            updateOrderStatus: jest.fn(),
            processRefund: jest.fn(),
            getOrderAnalytics: jest.fn(),
          },
        },
      ],
    })
      .overrideInterceptor(AdminAuditInterceptor)
      .useValue({
        intercept: jest.fn((context, next) => next.handle()),
      })
      .compile();

    controller = module.get<OrderManagementController>(
      OrderManagementController,
    );
    service = module.get(OrderManagementService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getOrders", () => {
    it("should return paginated orders", async () => {
      const query: GetOrdersQueryDto = {
        page: 1,
        limit: 10,
      };

      service.getOrders.mockResolvedValue(mockPaginatedOrders);

      const result = await controller.getOrders(query);

      expect(service.getOrders).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedOrders);
    });

    it("should handle query parameters correctly", async () => {
      const query: GetOrdersQueryDto = {
        page: 2,
        limit: 20,
        search: "test@example.com",
        status: OrderStatus.PENDING,
        user_id: "user123",
        payment_method: "credit_card",
        min_total: 50,
        max_total: 200,
        date_from: "2023-01-01",
        date_to: "2023-01-31",
        sort_by: "total",
        sort_order: "asc",
      };

      service.getOrders.mockResolvedValue(mockPaginatedOrders);

      const result = await controller.getOrders(query);

      expect(service.getOrders).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedOrders);
    });
  });

  describe("getOrderDetails", () => {
    it("should return order details", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";

      service.getOrderDetails.mockResolvedValue(mockOrderDetails);

      const result = await controller.getOrderDetails(orderId);

      expect(service.getOrderDetails).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(mockOrderDetails);
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status successfully", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const updateData: UpdateOrderStatusDto = {
        status: OrderStatus.PAID,
        admin_notes: "Payment confirmed",
        tracking_number: "TRK456",
      };

      service.updateOrderStatus.mockResolvedValue(undefined);

      const result = await controller.updateOrderStatus(orderId, updateData);

      expect(service.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        updateData,
      );
      expect(result).toEqual({ message: "Order status updated successfully" });
    });

    it("should handle minimal update data", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const updateData: UpdateOrderStatusDto = {
        status: OrderStatus.SHIPPED,
      };

      service.updateOrderStatus.mockResolvedValue(undefined);

      const result = await controller.updateOrderStatus(orderId, updateData);

      expect(service.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        updateData,
      );
      expect(result).toEqual({ message: "Order status updated successfully" });
    });
  });

  describe("processRefund", () => {
    it("should process refund successfully", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const refundData: ProcessRefundDto = {
        amount: 50.0,
        reason: "Customer request",
        admin_notes: "Approved by admin",
        notify_customer: true,
      };

      service.processRefund.mockResolvedValue(mockRefundResult);

      const result = await controller.processRefund(orderId, refundData);

      expect(service.processRefund).toHaveBeenCalledWith(orderId, refundData);
      expect(result).toEqual(mockRefundResult);
    });

    it("should handle minimal refund data", async () => {
      const orderId = "123e4567-e89b-12d3-a456-426614174000";
      const refundData: ProcessRefundDto = {
        amount: 25.0,
        reason: "Defective product",
      };

      service.processRefund.mockResolvedValue(mockRefundResult);

      const result = await controller.processRefund(orderId, refundData);

      expect(service.processRefund).toHaveBeenCalledWith(orderId, refundData);
      expect(result).toEqual(mockRefundResult);
    });
  });

  describe("getOrderAnalytics", () => {
    it("should return order analytics", async () => {
      const query: OrderAnalyticsQueryDto = {
        date_from: "2023-01-01",
        date_to: "2023-01-31",
        interval: "day",
      };

      service.getOrderAnalytics.mockResolvedValue(mockOrderAnalytics);

      const result = await controller.getOrderAnalytics(query);

      expect(service.getOrderAnalytics).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockOrderAnalytics);
    });

    it("should handle analytics query with status filter", async () => {
      const query: OrderAnalyticsQueryDto = {
        date_from: "2023-01-01",
        date_to: "2023-01-31",
        interval: "week",
        status: OrderStatus.DELIVERED,
      };

      service.getOrderAnalytics.mockResolvedValue(mockOrderAnalytics);

      const result = await controller.getOrderAnalytics(query);

      expect(service.getOrderAnalytics).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockOrderAnalytics);
    });

    it("should handle different interval types", async () => {
      const query: OrderAnalyticsQueryDto = {
        date_from: "2023-01-01",
        date_to: "2023-12-31",
        interval: "month",
      };

      service.getOrderAnalytics.mockResolvedValue(mockOrderAnalytics);

      const result = await controller.getOrderAnalytics(query);

      expect(service.getOrderAnalytics).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockOrderAnalytics);
    });
  });
});
