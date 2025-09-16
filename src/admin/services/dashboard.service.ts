import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Order, OrderStatus } from "../../orders/entities/order.entity";
import { Product } from "../../products/entities/product.entity";
import { CacheService } from "../../common/cache/cache.service";
import {
  DashboardMetricsDto,
  SalesAnalyticsDto,
  SalesTrendItem,
  GetDashboardMetricsQueryDto,
  GetSalesAnalyticsQueryDto,
} from "../dto/dashboard.dto";

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly CACHE_TTL = 5 * 60; // 5 minutes

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private cacheService: CacheService,
  ) {}

  async getDashboardMetrics(
    query: GetDashboardMetricsQueryDto,
  ): Promise<DashboardMetricsDto> {
    const cacheKey = this.generateCacheKey("dashboard:metrics", query);

    // Try to get from cache first
    const cachedData =
      await this.cacheService.get<DashboardMetricsDto>(cacheKey);
    if (cachedData) {
      this.logger.debug(`Dashboard metrics served from cache: ${cacheKey}`);
      return cachedData;
    }

    this.logger.debug("Calculating dashboard metrics from database");

    const dateFrom = query.date_from ? new Date(query.date_from) : null;
    const dateTo = query.date_to ? new Date(query.date_to) : null;

    // Calculate current period metrics
    const currentMetrics = await this.calculateMetrics(dateFrom, dateTo);

    // Calculate previous period metrics for growth calculation
    const previousPeriodMetrics = await this.calculatePreviousPeriodMetrics(
      dateFrom,
      dateTo,
    );

    const metrics: DashboardMetricsDto = {
      total_users: currentMetrics.totalUsers,
      total_products: currentMetrics.totalProducts,
      total_orders: currentMetrics.totalOrders,
      total_revenue: currentMetrics.totalRevenue,
      user_growth: this.calculateGrowthRate(
        currentMetrics.totalUsers,
        previousPeriodMetrics.totalUsers,
      ),
      order_growth: this.calculateGrowthRate(
        currentMetrics.totalOrders,
        previousPeriodMetrics.totalOrders,
      ),
      revenue_growth: this.calculateGrowthRate(
        currentMetrics.totalRevenue,
        previousPeriodMetrics.totalRevenue,
      ),
      active_users: currentMetrics.activeUsers,
      pending_orders: currentMetrics.pendingOrders,
      low_stock_products: currentMetrics.lowStockProducts,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, metrics, this.CACHE_TTL);
    this.logger.debug(`Dashboard metrics cached: ${cacheKey}`);

    return metrics;
  }

  async getSalesAnalytics(
    query: GetSalesAnalyticsQueryDto,
  ): Promise<SalesAnalyticsDto> {
    const cacheKey = this.generateCacheKey("sales:analytics", query);

    // Try to get from cache first
    const cachedData = await this.cacheService.get<SalesAnalyticsDto>(cacheKey);
    if (cachedData) {
      this.logger.debug(`Sales analytics served from cache: ${cacheKey}`);
      return cachedData;
    }

    this.logger.debug("Calculating sales analytics from database");

    const dateFrom = new Date(query.date_from);
    const dateTo = new Date(query.date_to);
    const interval = query.interval || "day";

    // Get sales trend data
    const salesTrend = await this.calculateSalesTrend(
      dateFrom,
      dateTo,
      interval,
    );

    // Calculate total metrics for the period
    const totalMetrics = await this.calculateSalesMetrics(dateFrom, dateTo);

    // Calculate previous period for growth rate
    const periodDiff = dateTo.getTime() - dateFrom.getTime();
    const previousDateFrom = new Date(dateFrom.getTime() - periodDiff);
    const previousDateTo = new Date(dateFrom.getTime());
    const previousMetrics = await this.calculateSalesMetrics(
      previousDateFrom,
      previousDateTo,
    );

    // Find peak sales day
    const peakSalesDay = salesTrend.reduce((peak, current) =>
      current.revenue > peak.revenue ? current : peak,
    );

    const analytics: SalesAnalyticsDto = {
      sales_trend: salesTrend,
      total_revenue: totalMetrics.totalRevenue,
      total_orders: totalMetrics.totalOrders,
      growth_rate: this.calculateGrowthRate(
        totalMetrics.totalRevenue,
        previousMetrics.totalRevenue,
      ),
      average_order_value:
        totalMetrics.totalOrders > 0
          ? totalMetrics.totalRevenue / totalMetrics.totalOrders
          : 0,
      peak_sales_day: peakSalesDay.date,
      peak_sales_amount: peakSalesDay.revenue,
    };

    // Cache the result
    await this.cacheService.set(cacheKey, analytics, this.CACHE_TTL);
    this.logger.debug(`Sales analytics cached: ${cacheKey}`);

    return analytics;
  }

  private async calculateMetrics(dateFrom?: Date, dateTo?: Date) {
    // Build base query conditions
    const userQueryBuilder = this.userRepository.createQueryBuilder("user");
    const orderQueryBuilder = this.orderRepository.createQueryBuilder("order");
    const revenueQueryBuilder =
      this.orderRepository.createQueryBuilder("order");

    if (dateFrom && dateTo) {
      userQueryBuilder.where("user.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      });
      orderQueryBuilder.where(
        "order.created_at BETWEEN :dateFrom AND :dateTo",
        { dateFrom, dateTo },
      );
      revenueQueryBuilder.where(
        "order.created_at BETWEEN :dateFrom AND :dateTo",
        { dateFrom, dateTo },
      );
    }

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      activeUsers,
      pendingOrders,
      lowStockProducts,
    ] = await Promise.all([
      userQueryBuilder.getCount(),
      this.productRepository.count(),
      orderQueryBuilder.getCount(),
      revenueQueryBuilder
        .select("COALESCE(SUM(order.total), 0)", "total")
        .andWhere("order.status IN (:...statuses)", {
          statuses: [
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        })
        .getRawOne()
        .then((result) => parseFloat(result.total) || 0),
      this.userRepository
        .createQueryBuilder("user")
        .where("user.is_active = :isActive", { isActive: true })
        .andWhere(
          dateFrom && dateTo
            ? "user.created_at BETWEEN :dateFrom AND :dateTo"
            : "1=1",
          dateFrom && dateTo ? { dateFrom, dateTo } : {},
        )
        .getCount(),
      this.orderRepository
        .createQueryBuilder("order")
        .where("order.status = :status", { status: OrderStatus.PENDING })
        .andWhere(
          dateFrom && dateTo
            ? "order.created_at BETWEEN :dateFrom AND :dateTo"
            : "1=1",
          dateFrom && dateTo ? { dateFrom, dateTo } : {},
        )
        .getCount(),
      this.productRepository
        .createQueryBuilder("product")
        .where("product.stock <= product.minimum_stock")
        .getCount(),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      activeUsers,
      pendingOrders,
      lowStockProducts,
    };
  }

  private async calculatePreviousPeriodMetrics(dateFrom?: Date, dateTo?: Date) {
    if (!dateFrom || !dateTo) {
      // If no date range specified, compare with last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      return this.calculateMetrics(sixtyDaysAgo, thirtyDaysAgo);
    }

    const periodDiff = dateTo.getTime() - dateFrom.getTime();
    const previousDateFrom = new Date(dateFrom.getTime() - periodDiff);
    const previousDateTo = new Date(dateFrom.getTime());

    return this.calculateMetrics(previousDateFrom, previousDateTo);
  }

  private async calculateSalesTrend(
    dateFrom: Date,
    dateTo: Date,
    interval: string,
  ): Promise<SalesTrendItem[]> {
    const dateGroupBy = this.getDateGroupBy(interval);

    const results = await this.orderRepository
      .createQueryBuilder("order")
      .select([
        `${dateGroupBy} as date`,
        "COALESCE(SUM(order.total), 0) as revenue",
        "COUNT(order.id) as orders",
        "COALESCE(AVG(order.total), 0) as average_order_value",
      ])
      .where("order.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      })
      .andWhere("order.status IN (:...statuses)", {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
        ],
      })
      .groupBy(dateGroupBy)
      .orderBy(dateGroupBy, "ASC")
      .getRawMany();

    return results.map((result) => ({
      date: result.date,
      revenue: parseFloat(result.revenue) || 0,
      orders: parseInt(result.orders) || 0,
      average_order_value: parseFloat(result.average_order_value) || 0,
    }));
  }

  private async calculateSalesMetrics(dateFrom: Date, dateTo: Date) {
    const result = await this.orderRepository
      .createQueryBuilder("order")
      .select([
        "COALESCE(SUM(order.total), 0) as totalRevenue",
        "COUNT(order.id) as totalOrders",
      ])
      .where("order.created_at BETWEEN :dateFrom AND :dateTo", {
        dateFrom,
        dateTo,
      })
      .andWhere("order.status IN (:...statuses)", {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
        ],
      })
      .getRawOne();

    return {
      totalRevenue: parseFloat(result.totalRevenue) || 0,
      totalOrders: parseInt(result.totalOrders) || 0,
    };
  }

  private getDateFormat(interval: string): string {
    switch (interval) {
      case "week":
        return 'YYYY-"W"WW';
      case "month":
        return "YYYY-MM";
      default:
        return "YYYY-MM-DD";
    }
  }

  private getDateGroupBy(interval: string): string {
    // Determine database type (e.g., from TypeORM connection options or environment)
    // For simplicity, assuming SQLite for testing if not explicitly PostgreSQL
    const dbType = process.env.DATABASE_TYPE || "sqlite"; // Or get from TypeORM config

    switch (interval) {
      case "week":
        return dbType === "postgres"
          ? "TO_CHAR(order.created_at, 'YYYY-\"W\"WW')"
          : "STRFTIME('%Y-W%W', order.created_at)";
      case "month":
        return dbType === "postgres"
          ? "TO_CHAR(order.created_at, 'YYYY-MM')"
          : "STRFTIME('%Y-%m', order.created_at)";
      default:
        return dbType === "postgres"
          ? "TO_CHAR(order.created_at, 'YYYY-MM-DD')"
          : "STRFTIME('%Y-%m-%d', order.created_at)";
    }
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  private generateCacheKey(prefix: string, params: any): string {
    const paramString = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join("|");
    return `admin:${prefix}:${paramString || "all"}`;
  }
}
