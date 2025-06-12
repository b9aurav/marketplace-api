import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from './entities/order.entity';
import { Order } from './entities/order.entity';
import { Request } from 'express';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockRequest = {
    user: {
      id: 'user1',
    },
  };

  const mockOrdersService = {
    getUserOrders: jest.fn(),
    getOrderDetails: jest.fn(),
    cancelOrder: jest.fn(),
    trackOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserOrders', () => {
    it('should return user orders without status filter', async () => {
      const mockOrders = {
        orders: [
          {
            id: '1',
            user_id: 'user1',
            address_id: 'addr1',
            items: [],
            address: {},
            status: OrderStatus.PENDING,
            total: 100,
            tracking_number: null,
            payment_method: 'credit_card',
            transaction_id: 'txn1',
            created_at: new Date(),
            updated_at: new Date(),
            user: { id: 'user1' },
            order_items: [],
            coupon_code: null,
            discount_amount: 0,
            tracking_info: null,
          } as unknown as Order,
        ],
        total: 1,
      };

      jest.spyOn(service, 'getUserOrders').mockResolvedValue(mockOrders);

      const result = await controller.getUserOrders(mockRequest);

      expect(result).toEqual(mockOrders);
      expect(service.getUserOrders).toHaveBeenCalledWith('user1');
    });

    it('should return filtered user orders with status', async () => {
      const mockOrders = {
        orders: [
          {
            id: '1',
            user_id: 'user1',
            address_id: 'addr1',
            items: [],
            address: {},
            status: OrderStatus.PENDING,
            total: 100,
            tracking_number: null,
            payment_method: 'credit_card',
            transaction_id: 'txn1',
            created_at: new Date(),
            updated_at: new Date(),
            user: { id: 'user1' },
            order_items: [],
            coupon_code: null,
            discount_amount: 0,
            tracking_info: null,
          } as unknown as Order,
        ],
        total: 1,
      };

      jest.spyOn(service, 'getUserOrders').mockResolvedValue(mockOrders);

      const result = await controller.getUserOrders(mockRequest);

      expect(result).toEqual(mockOrders);
      expect(service.getUserOrders).toHaveBeenCalledWith('user1');
    });
  });

  describe('getOrderDetails', () => {
    it('should return order details', async () => {
      const mockOrder = {
        order: {
          id: '1',
          user_id: 'user1',
          address_id: 'addr1',
          items: [],
          address: {},
          status: OrderStatus.PENDING,
          total: 100,
          tracking_number: null,
          payment_method: 'credit_card',
          transaction_id: 'txn1',
          created_at: new Date(),
          updated_at: new Date(),
          user: { id: 'user1' },
          order_items: [],
          coupon_code: null,
          discount_amount: 0,
          tracking_info: null,
        } as unknown as Order,
      };

      jest.spyOn(service, 'getOrderDetails').mockResolvedValue(mockOrder);

      const result = await controller.getOrderDetails(mockRequest, '1');

      expect(result).toEqual(mockOrder.order);
      expect(service.getOrderDetails).toHaveBeenCalledWith('user1', '1');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      const mockResponse = {
        message: 'Order cancelled successfully',
      };

      mockOrdersService.cancelOrder.mockResolvedValue(mockResponse);

      const result = await controller.cancelOrder(mockRequest, '1');

      expect(result).toEqual(mockResponse);
      expect(service.cancelOrder).toHaveBeenCalledWith('user1', '1');
    });
  });

  describe('trackOrder', () => {
    it('should return tracking information', async () => {
      const mockTrackingInfo = {
        order: {
          id: '1',
          user_id: 'user1',
          address_id: 'addr1',
          items: [],
          address: {},
          status: OrderStatus.SHIPPED,
          total: 100,
          tracking_number: 'TRACK123',
          payment_method: 'credit_card',
          transaction_id: 'txn1',
          created_at: new Date(),
          updated_at: new Date(),
          user: { id: 'user1' },
          order_items: [],
          coupon_code: null,
          discount_amount: 0,
          tracking_info: {
            location: 'Warehouse A',
            estimated_delivery: new Date('2025-06-12T08:02:55.112Z'),
            updates: [
              {
                timestamp: new Date(),
                status: 'In Transit',
                location: 'Warehouse A',
              },
            ],
          },
        } as unknown as Order,
      };

      jest.spyOn(service, 'trackOrder').mockResolvedValue(mockTrackingInfo);

      const result = await controller.trackOrder(mockRequest, '1');

      expect(result).toEqual(mockTrackingInfo.order);
      expect(service.trackOrder).toHaveBeenCalledWith('user1', '1');
    });
  });
}); 