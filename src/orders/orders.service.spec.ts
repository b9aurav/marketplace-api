import { Test, TestingModule } from "@nestjs/testing";
import { OrdersService } from "./orders.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Order, OrderStatus } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Product } from "../products/entities/product.entity";
import { DataSource } from "typeorm";

describe("OrdersService", () => {
  let service: OrdersService;

  const mockOrdersRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockOrderItemsRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProductsRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        findOne: jest.fn(),
      },
      isTransactionActive: true,
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrdersRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemsRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserOrders", () => {
    it("should return user orders without status filter", async () => {
      const mockOrders = [
        {
          id: "1",
          user_id: "user1",
          address_id: "addr1",
          items: [],
          address: {},
          status: OrderStatus.PENDING,
          total: 100,
          tracking_number: null,
          payment_method: "credit_card",
          transaction_id: "txn1",
          created_at: new Date(),
          updated_at: new Date(),
          user: { id: "user1" },
          order_items: [],
          coupon_code: null,
          discount_amount: 0,
          tracking_info: null,
        },
      ];

      mockOrdersRepository.findAndCount.mockResolvedValue([mockOrders, 1]);

      const result = await service.getUserOrders("user1");

      expect(result).toEqual({
        orders: mockOrders,
        total: 1,
      });
      expect(mockOrdersRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: "user1" } },
        relations: ["items", "items.product"],
        order: { created_at: "DESC" },
      });
    });

    it("should return filtered user orders with status", async () => {
      const mockOrders = [
        {
          id: "1",
          created_at: new Date(),
          total: 100,
          status: OrderStatus.PENDING,
          user: { id: "user1", email: "test@example.com", name: "Test User" },
          items: [],
          address: {},
          tracking_number: "TRACK123",
          payment_method: "credit_card",
          transaction_id: "TRANS123",
        },
      ];

      mockOrdersRepository.findAndCount.mockResolvedValue([
        mockOrders,
        mockOrders.length,
      ]);

      const result = await service.getUserOrders("user1");

      expect(result).toEqual({
        orders: mockOrders,
        total: mockOrders.length,
      });
      expect(mockOrdersRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: "user1" } },
        relations: ["items", "items.product"],
        order: { created_at: "DESC" },
      });
    });
  });

  describe("getOrderDetails", () => {
    it("should return order details when found", async () => {
      const mockOrder = {
        id: "1",
        user_id: "user1",
        address_id: "addr1",
        items: [],
        address: {},
        status: OrderStatus.PENDING,
        total: 100,
        tracking_number: null,
        payment_method: "credit_card",
        transaction_id: "txn1",
        created_at: new Date(),
        updated_at: new Date(),
        user: { id: "user1" },
        order_items: [],
        coupon_code: null,
        discount_amount: 0,
        tracking_info: null,
      };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.getOrderDetails("user1", "1");

      expect(result).toEqual({ order: mockOrder });
      expect(mockOrdersRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1", user: { id: "user1" } },
        relations: ["items", "items.product"],
      });
    });

    it("should throw NotFoundException when order not found", async () => {
      mockOrdersRepository.findOne.mockResolvedValue(null);

      await expect(service.getOrderDetails("user1", "1")).rejects.toThrow(
        "Order not found",
      );
    });
  });

  describe("cancelOrder", () => {
    it("should cancel order when in valid status", async () => {
      const mockOrder = {
        id: "1",
        status: OrderStatus.PENDING,
        save: jest.fn(),
      };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.cancelOrder("user1", "1");

      expect(result).toEqual({ message: "Order cancelled successfully" });
      expect(mockOrder.status).toBe(OrderStatus.CANCELLED);
      expect(mockOrdersRepository.save).toHaveBeenCalledWith(mockOrder);
    });

    it("should throw NotFoundException when order not found", async () => {
      mockOrdersRepository.findOne.mockResolvedValue(null);

      await expect(service.cancelOrder("user1", "1")).rejects.toThrow(
        "Order not found",
      );
    });

    it("should throw error when order cannot be cancelled", async () => {
      const mockOrder = {
        id: "1",
        status: OrderStatus.SHIPPED,
      };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.cancelOrder("user1", "1")).rejects.toThrow(
        "Only pending orders can be cancelled",
      );
    });
  });

  describe("trackOrder", () => {
    it("should return tracking information when order found", async () => {
      const mockOrder = {
        id: "1",
        user_id: "user1",
        address_id: "addr1",
        items: [],
        address: {},
        status: OrderStatus.SHIPPED,
        total: 100,
        tracking_number: "TRACK123",
        payment_method: "credit_card",
        transaction_id: "txn1",
        created_at: new Date(),
        updated_at: new Date(),
        user: { id: "user1" },
        order_items: [],
        coupon_code: null,
        discount_amount: 0,
        tracking_info: {
          location: "Warehouse A",
          estimated_delivery: new Date("2025-06-12T08:02:55.112Z"),
          updates: [
            {
              timestamp: new Date(),
              status: "In Transit",
              location: "Warehouse A",
            },
          ],
        },
      };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.trackOrder("user1", "1");

      expect(result).toEqual({ order: mockOrder });
      expect(mockOrdersRepository.findOne).toHaveBeenCalledWith({
        where: { id: "1", user: { id: "user1" } },
      });
    });

    it("should throw NotFoundException when order not found", async () => {
      mockOrdersRepository.findOne.mockResolvedValue(null);

      await expect(service.trackOrder("user1", "1")).rejects.toThrow(
        "Order not found",
      );
    });
  });

  describe("getAllOrders", () => {
    it("should return all orders without filters", async () => {
      const mockOrders = [
        {
          id: "1",
          user_id: "user1",
          address_id: "addr1",
          items: [],
          address: {},
          status: OrderStatus.PENDING,
          total: 100,
          tracking_number: null,
          payment_method: "credit_card",
          transaction_id: "txn1",
          created_at: new Date(),
          updated_at: new Date(),
          user: { id: "user1", email: "user1@example.com", name: "User 1" },
          order_items: [],
          coupon_code: null,
          discount_amount: 0,
          tracking_info: null,
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      mockOrdersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAllOrders();

      expect(result).toEqual({
        orders: mockOrders.map((order) => ({
          id: order.id,
          date: order.created_at,
          total: order.total,
          status: order.status,
          user: {
            id: order.user.id,
            email: order.user.email,
            name: order.user.name,
          },
          items: order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            product: {
              id: item.product?.id,
              name: item.product?.name,
              images: item.product?.images,
            },
          })),
          address: order.address,
          tracking_number: order.tracking_number,
          payment_method: order.payment_method,
          transaction_id: order.transaction_id,
        })),
      });
    });

    it("should return filtered orders with user_id and status", async () => {
      const mockOrders = [
        {
          id: "1",
          user_id: "user1",
          address_id: "addr1",
          items: [],
          address: {},
          status: OrderStatus.PENDING,
          total: 100,
          tracking_number: null,
          payment_method: "credit_card",
          transaction_id: "txn1",
          created_at: new Date(),
          updated_at: new Date(),
          user: { id: "user1", email: "user1@example.com", name: "User 1" },
          order_items: [],
          coupon_code: null,
          discount_amount: 0,
          tracking_info: null,
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      mockOrdersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAllOrders("user1", OrderStatus.PENDING);

      expect(result).toEqual({
        orders: mockOrders.map((order) => ({
          id: order.id,
          date: order.created_at,
          total: order.total,
          status: order.status,
          user: {
            id: order.user.id,
            email: order.user.email,
            name: order.user.name,
          },
          items: order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            product: {
              id: item.product?.id,
              name: item.product?.name,
              images: item.product?.images,
            },
          })),
          address: order.address,
          tracking_number: order.tracking_number,
          payment_method: order.payment_method,
          transaction_id: order.transaction_id,
        })),
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "order.user_id = :userId",
        { userId: "user1" },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "order.status = :status",
        { status: OrderStatus.PENDING },
      );
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status successfully", async () => {
      const mockOrder = {
        id: "1",
        status: OrderStatus.PENDING,
        save: jest.fn(),
      };

      mockOrdersRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.updateOrderStatus("1", {
        status: OrderStatus.SHIPPED,
      });

      expect(result).toEqual({
        message: "Order status updated successfully",
        order: {
          id: "1",
          status: OrderStatus.SHIPPED,
        },
      });
      expect(mockOrder.status).toBe(OrderStatus.SHIPPED);
      expect(mockOrdersRepository.save).toHaveBeenCalledWith(mockOrder);
    });

    it("should throw NotFoundException when order not found", async () => {
      mockOrdersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus("1", { status: OrderStatus.SHIPPED }),
      ).rejects.toThrow("Order not found");
    });
  });
});
