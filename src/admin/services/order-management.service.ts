import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Order, OrderStatus } from "../../orders/entities/order.entity";
import { OrderItem } from "../../orders/entities/order-item.entity";
import { User } from "../../users/entities/user.entity";
import { Address } from "../../users/entities/address.entity";
import { CacheService } from "../../common/cache/cache.service";
import { CacheKeyGenerator } from "../../common/cache/cache-key-generator.service";
import {
  CACHE_TTL,
  CACHE_KEYS,
  CACHE_PATTERNS,
} from "../../common/cache/constants/cache.constants";
import {
  CacheInvalidate,
  CacheList,
  Cache,
  CacheAnalytics
} from "../../common/cache/decorators/cache.decorator";
import {
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
  ProcessRefundDto,
  OrderAnalyticsQueryDto,
  PaginatedOrdersDto,
  OrderDetailsDto,
  OrderAnalyticsDto,
  RefundResultDto,
  OrderDto,
} from "../dto/order-management.dto";

@Injectable()
export class OrderManagementService {
  private readonly logger = new Logger(OrderManagementService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private cacheService: CacheService,
    private cacheKeyGenerator: CacheKeyGenerator,
  ) { }

  @CacheList(CACHE_TTL.ORDER_LIST)
  async getOrders(query: GetOrdersQueryDto): Promise<PaginatedOrdersDto> {
    const cacheKey = this.cacheKeyGenerator.generateListKey(
      CACHE_KEYS.ORDER_LIST,
      query.page,
      query.limit,
      {
        search: query.search,
        status: query.status,
        user_id: query.user_id,
        payment_method: query.payment_method,
        min_total: query.min_total,
        max_total: query.max_total,
        date_from: query.date_from,
        date_to: query.date_to,
        sort_by: query.sort_by,
        sort_order: query.sort_order,
      },
    );

    // Try to get from cache first
    const cachedResult =
      await this.cacheService.get<PaginatedOrdersDto>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for orders list: ${cacheKey}`);
      return cachedResult;
    }

    const queryBuilder = this.createOrderQueryBuilder();

    // Apply filters
    this.applyOrderFilters(queryBuilder, query);

    // Apply sorting
    const sortField =
      query.sort_by === "total" ? "order.total" : `order.${query.sort_by}`;
    queryBuilder.orderBy(
      sortField,
      query.sort_order?.toUpperCase() as "ASC" | "DESC",
    );

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    queryBuilder.skip(offset).take(query.limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    const result: PaginatedOrdersDto = {
      orders: orders.map((order) => this.transformOrderToDto(order)),
      total,
      page: query.page,
      limit: query.limit,
      total_pages: Math.ceil(total / query.limit),
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.ORDER_LIST);
    this.logger.debug(`Cached orders list: ${cacheKey}`);

    return result;
  }

  @Cache({ ttl: CACHE_TTL.ORDER_LIST, keyGenerator: (args) => `order:${args[0]}` })
  async getOrderDetails(id: string): Promise<OrderDetailsDto> {
    const cacheKey = this.cacheKeyGenerator.generateSimpleKey(
      CACHE_KEYS.ORDER_DETAILS,
      id,
    );

    // Try to get from cache first
    const cachedResult = await this.cacheService.get<OrderDetailsDto>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for order details: ${cacheKey}`);
      return cachedResult;
    }

    const order = await this.orderRepository
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.user", "user")
      .leftJoinAndSelect("order.address", "address")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .where("order.id = :id", { id })
      .getOne();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const result: OrderDetailsDto = {
      ...this.transformOrderToDto(order),
      tracking_info: order.tracking_info,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.ORDER_LIST);
    this.logger.debug(`Cached order details: ${cacheKey}`);

    return result;
  }

  @CacheInvalidate([CACHE_PATTERNS.ORDERS])
  async updateOrderStatus(
    id: string,
    updateData: UpdateOrderStatusDto,
  ): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Validate status transition
    this.validateStatusTransition(order.status, updateData.status);

    const previousStatus = order.status;
    order.status = updateData.status;

    if (updateData.admin_notes) {
      order.admin_notes = updateData.admin_notes;
    }

    if (updateData.tracking_number) {
      order.tracking_number = updateData.tracking_number;
    }

    await this.orderRepository.save(order);

    this.logger.log(
      `Order ${id} status updated from ${previousStatus} to ${updateData.status}`,
    );

    // Invalidate related caches
    await this.invalidateOrderCaches(id);
  }

  @CacheInvalidate([CACHE_PATTERNS.ORDERS])
  async processRefund(
    id: string,
    refundData: ProcessRefundDto,
  ): Promise<RefundResultDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Validate refund amount
    if (refundData.amount > order.total) {
      throw new BadRequestException("Refund amount cannot exceed order total");
    }

    // Check if order is eligible for refund
    if (!this.isRefundEligible(order.status)) {
      throw new BadRequestException(
        `Orders with status '${order.status}' are not eligible for refund`,
      );
    }

    try {
      // Process refund through payment gateway (Stripe integration would go here)
      const refundResult = await this.processPaymentRefund(
        order
      );

      // Update order status if full refund
      if (refundData.amount === order.total) {
        order.status = OrderStatus.CANCELLED;
      }

      // Add admin notes
      const refundNote = `Refund processed: $${refundData.amount} - ${refundData.reason}`;
      order.admin_notes = order.admin_notes
        ? `${order.admin_notes}\n${refundNote}`
        : refundNote;

      await this.orderRepository.save(order);

      this.logger.log(
        `Refund processed for order ${id}: $${refundData.amount}`,
      );

      // Invalidate related caches
      await this.invalidateOrderCaches(id);

      return {
        success: true,
        refund_id: refundResult.refund_id,
        amount: refundData.amount,
        message: "Refund processed successfully",
        transaction_id: refundResult.transaction_id,
      };
    } catch (error) {
      this.logger.error(`Failed to process refund for order ${id}:`, error);
      throw new BadRequestException(
        "Failed to process refund. Please try again.",
      );
    }
  }

  @CacheAnalytics(CACHE_TTL.ORDER_ANALYTICS)
  async getOrderAnalytics(
    query: OrderAnalyticsQueryDto,
  ): Promise<OrderAnalyticsDto> {
    const cacheKey = this.cacheKeyGenerator.generateAnalyticsKey(
      CACHE_KEYS.ORDER_ANALYTICS,
      new Date(query.date_from),
      new Date(query.date_to),
      query.interval,
    );

    // Try to get from cache first
    const cachedResult =
      await this.cacheService.get<OrderAnalyticsDto>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for order analytics: ${cacheKey}`);
      return cachedResult;
    }

    const dateFrom = new Date(query.date_from);
    const dateTo = new Date(query.date_to);

    // Get basic metrics
    const [totalOrders, totalRevenue, averageOrderValue] = await Promise.all([
      this.getTotalOrders(dateFrom, dateTo, query.status),
      this.getTotalRevenue(dateFrom, dateTo, query.status),
      this.getAverageOrderValue(dateFrom, dateTo, query.status),
    ]);

    // Get orders by status
    const ordersByStatus = await this.getOrdersByStatus(dateFrom, dateTo);
    const revenueByStatus = await this.getRevenueByStatus(dateFrom, dateTo);

    // Get trend data
    const ordersTrend = await this.getOrdersTrend(
      dateFrom,
      dateTo,
      query.interval,
    );

    // Get payment method statistics
    const topPaymentMethods = await this.getTopPaymentMethods(dateFrom, dateTo);

    // Get refund statistics
    const refundStatistics = await this.getRefundStatistics();

    // Calculate growth metrics (compare with previous period)
    const growthMetrics = await this.getGrowthMetrics(dateFrom, dateTo);

    const result: OrderAnalyticsDto = {
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      average_order_value: averageOrderValue,
      orders_by_status: ordersByStatus,
      revenue_by_status: revenueByStatus,
      orders_trend: ordersTrend,
      top_payment_methods: topPaymentMethods,
      refund_statistics: refundStatistics,
      growth_metrics: growthMetrics,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, CACHE_TTL.ORDER_ANALYTICS);
    this.logger.debug(`Cached order analytics: ${cacheKey}`);

    return result;
  }

  private createOrderQueryBuilder(): SelectQueryBuilder<Order> {
    return this.orderRepository
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.user", "user")
      .leftJoinAndSelect("order.address", "address")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("items.product", "product");
  }

  private applyOrderFilters(
    queryBuilder: SelectQueryBuilder<Order>,
    query: GetOrdersQueryDto,
  ): void {
    if (query.search) {
      queryBuilder.andWhere(
        "(order.id ILIKE :search OR user.email ILIKE :search OR order.tracking_number ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      queryBuilder.andWhere("order.status = :status", { status: query.status });
    }

    if (query.user_id) {
      queryBuilder.andWhere("order.user_id = :userId", {
        userId: query.user_id,
      });
    }

    if (query.payment_method) {
      queryBuilder.andWhere("order.payment_method = :paymentMethod", {
        paymentMethod: query.payment_method,
      });
    }

    if (query.min_total) {
      queryBuilder.andWhere("order.total >= :minTotal", {
        minTotal: query.min_total,
      });
    }

    if (query.max_total) {
      queryBuilder.andWhere("order.total <= :maxTotal", {
        maxTotal: query.max_total,
      });
    }

    if (query.date_from) {
      queryBuilder.andWhere("order.created_at >= :dateFrom", {
        dateFrom: new Date(query.date_from),
      });
    }

    if (query.date_to) {
      queryBuilder.andWhere("order.created_at <= :dateTo", {
        dateTo: new Date(query.date_to),
      });
    }
  }

  private transformOrderToDto(order: Order): OrderDto {
    return {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      tracking_number: order.tracking_number,
      user_id: order.user_id,
      address_id: order.address_id,
      payment_method: order.payment_method,
      transaction_id: order.transaction_id,
      coupon_code: order.coupon_code,
      discount_amount: Number(order.discount_amount),
      created_at: order.created_at,
      updated_at: order.updated_at,
      user: {
        id: order.user.id,
        email: order.user.email,
        name: order.user.name,
        phone: order.user.phone,
      },
      address: order.address
        ? {
          street: order.address.street,
          city: order.address.city,
          state: order.address.state,
          zip: order.address.zip,
        }
        : null,
      items:
        order.items?.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.price) * item.quantity,
          product: item.product
            ? {
              id: item.product.id,
              name: item.product.name,
              images: item.product.images,
              sku: item.product.sku,
            }
            : undefined,
        })) || [],
    };
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [], // No transitions from delivered
      [OrderStatus.CANCELLED]: [], // No transitions from cancelled
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
      );
    }
  }

  private isRefundEligible(status: OrderStatus): boolean {
    return [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ].includes(status);
  }

  private async processPaymentRefund(order: Order): Promise<{
    refund_id: string;
    transaction_id: string;
  }> {
    // This would integrate with Stripe or other payment gateway
    // For now, return mock data
    return {
      refund_id: `ref_${Date.now()}`,
      transaction_id: order.transaction_id || `txn_${Date.now()}`,
    };
  }

  private async invalidateOrderCaches(orderId?: string): Promise<void> {
    // Invalidate all order-related caches
    await this.cacheService.delPattern(CACHE_PATTERNS.ORDERS);

    if (orderId) {
      const detailsCacheKey = this.cacheKeyGenerator.generateSimpleKey(
        CACHE_KEYS.ORDER_DETAILS,
        orderId,
      );
      await this.cacheService.del(detailsCacheKey);
    }
  }

  // Analytics helper methods
  private async getTotalOrders(
    dateFrom: Date,
    dateTo: Date,
    status?: OrderStatus,
  ): Promise<number> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder("order")
      .where("order.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      });

    if (status) {
      queryBuilder.andWhere("order.status = :status", { status });
    }

    return queryBuilder.getCount();
  }

  private async getTotalRevenue(
    dateFrom: Date,
    dateTo: Date,
    status?: OrderStatus,
  ): Promise<number> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.total)", "total")
      .where("order.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      });

    if (status) {
      queryBuilder.andWhere("order.status = :status", { status });
    }

    const result = await queryBuilder.getRawOne();
    return Number(result.total) || 0;
  }

  private async getAverageOrderValue(
    dateFrom: Date,
    dateTo: Date,
    status?: OrderStatus,
  ): Promise<number> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder("order")
      .select("AVG(order.total)", "average")
      .where("order.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      });

    if (status) {
      queryBuilder.andWhere("order.status = :status", { status });
    }

    const result = await queryBuilder.getRawOne();
    return Number(result.average) || 0;
  }

  private async getOrdersByStatus(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<string, number>> {
    const results = await this.orderRepository
      .createQueryBuilder("order")
      .select("order.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("order.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      })
      .groupBy("order.status")
      .getRawMany();

    return results.reduce((acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    }, {});
  }

  private async getRevenueByStatus(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<string, number>> {
    const results = await this.orderRepository
      .createQueryBuilder("order")
      .select("order.status", "status")
      .addSelect("SUM(order.total)", "revenue")
      .where("order.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      })
      .groupBy("order.status")
      .getRawMany();

    return results.reduce((acc, row) => {
      acc[row.status] = Number(row.revenue);
      return acc;
    }, {});
  }

  private async getOrdersTrend(
    dateFrom: Date,
    dateTo: Date,
    interval: string,
  ): Promise<
    Array<{
      date: string;
      orders: number;
      revenue: number;
    }>
  > {
    let dateFormat: string;
    switch (interval) {
      case "week":
        dateFormat = 'YYYY-"W"WW';
        break;
      case "month":
        dateFormat = "YYYY-MM";
        break;
      default:
        dateFormat = "YYYY-MM-DD";
    }

    const results = await this.orderRepository
      .createQueryBuilder("order")
      .select(`TO_CHAR(order.created_at, '${dateFormat}')`, "date")
      .addSelect("COUNT(*)", "orders")
      .addSelect("SUM(order.total)", "revenue")
      .where("order.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      })
      .groupBy(`TO_CHAR(order.created_at, '${dateFormat}')`)
      .orderBy(`TO_CHAR(order.created_at, '${dateFormat}')`)
      .getRawMany();

    return results.map((row) => ({
      date: row.date,
      orders: Number(row.orders),
      revenue: Number(row.revenue),
    }));
  }

  private async getTopPaymentMethods(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<
    Array<{
      method: string;
      count: number;
      revenue: number;
    }>
  > {
    const results = await this.orderRepository
      .createQueryBuilder("order")
      .select("order.payment_method", "method")
      .addSelect("COUNT(*)", "count")
      .addSelect("SUM(order.total)", "revenue")
      .where("order.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      })
      .andWhere("order.payment_method IS NOT NULL")
      .groupBy("order.payment_method")
      .orderBy("COUNT(*)", "DESC")
      .limit(5)
      .getRawMany();

    return results.map((row) => ({
      method: row.method,
      count: Number(row.count),
      revenue: Number(row.revenue),
    }));
  }

  private async getRefundStatistics(): Promise<{
    total_refunds: number;
    total_refund_amount: number;
    refund_rate: number;
  }> {
    // This would need to be implemented based on refund tracking
    // For now, return mock data

    return {
      total_refunds: 0,
      total_refund_amount: 0,
      refund_rate: 0,
    };
  }

  private async getGrowthMetrics(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{
    order_growth: number;
    revenue_growth: number;
  }> {
    const periodDays = Math.ceil(
      (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24),
    );
    const previousDateFrom = new Date(
      dateFrom.getTime() - periodDays * 24 * 60 * 60 * 1000,
    );
    const previousDateTo = dateFrom;

    const [currentOrders, currentRevenue, previousOrders, previousRevenue] =
      await Promise.all([
        this.getTotalOrders(dateFrom, dateTo),
        this.getTotalRevenue(dateFrom, dateTo),
        this.getTotalOrders(previousDateFrom, previousDateTo),
        this.getTotalRevenue(previousDateFrom, previousDateTo),
      ]);

    const orderGrowth =
      previousOrders > 0
        ? ((currentOrders - previousOrders) / previousOrders) * 100
        : 0;

    const revenueGrowth =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    return {
      order_growth: Math.round(orderGrowth * 100) / 100,
      revenue_growth: Math.round(revenueGrowth * 100) / 100,
    };
  }
}
