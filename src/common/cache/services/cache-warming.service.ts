import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CacheService } from "../cache.service";
import { CacheKeyGenerator } from "../cache-key-generator.service";
import { CACHE_KEYS, CACHE_TTL } from "../constants/cache.constants";
import { CacheWarmupData } from "../interfaces/cache.interface";

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmingService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly cacheKeyGenerator: CacheKeyGenerator,
  ) {}

  async onModuleInit() {
    // Warm up cache on application startup
    await this.warmupFrequentlyAccessedData();
  }

  /**
   * Warm up frequently accessed data
   */
  async warmupFrequentlyAccessedData(): Promise<void> {
    this.logger.log('Starting cache warmup for frequently accessed data');

    const warmupData: CacheWarmupData[] = [
      // System settings - accessed frequently
      {
        key: this.cacheKeyGenerator.generateSimpleKey(CACHE_KEYS.SYSTEM_SETTINGS, 'all'),
        value: await this.getSystemSettingsData(),
        ttl: CACHE_TTL.SYSTEM_SETTINGS,
      },
      // Category tree - accessed on every product page
      {
        key: this.cacheKeyGenerator.generateSimpleKey(CACHE_KEYS.CATEGORY_TREE, 'all'),
        value: await this.getCategoryTreeData(),
        ttl: CACHE_TTL.CATEGORY_TREE,
      },
      // Dashboard metrics - accessed by admins frequently
      {
        key: this.cacheKeyGenerator.generateSimpleKey(CACHE_KEYS.DASHBOARD_METRICS, 'current'),
        value: await this.getDashboardMetricsData(),
        ttl: CACHE_TTL.DASHBOARD_METRICS,
      },
    ];

    await this.cacheService.warmCache(warmupData);
    this.logger.log('Cache warmup completed');
  }

  /**
   * Warm up user-specific data
   */
  async warmupUserData(userId: string): Promise<void> {
    const warmupData: CacheWarmupData[] = [
      {
        key: this.cacheKeyGenerator.generateSimpleKey(CACHE_KEYS.USER_DETAILS, userId),
        value: await this.getUserData(userId),
        ttl: CACHE_TTL.USER_DETAILS,
      },
    ];

    await this.cacheService.warmCache(warmupData);
  }

  /**
   * Warm up product data for featured products
   */
  async warmupFeaturedProducts(): Promise<void> {
    const featuredProducts = await this.getFeaturedProductsData();
    const warmupData: CacheWarmupData[] = featuredProducts.map((product: any) => ({
      key: this.cacheKeyGenerator.generateSimpleKey(CACHE_KEYS.PRODUCT_DETAILS, product.id),
      value: product,
      ttl: CACHE_TTL.PRODUCT_DETAILS,
    }));

    await this.cacheService.warmCache(warmupData);
  }

  /**
   * Warm up analytics data for current period
   */
  async warmupAnalyticsData(): Promise<void> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const warmupData: CacheWarmupData[] = [
      {
        key: this.cacheKeyGenerator.generateAnalyticsKey(
          CACHE_KEYS.SALES_ANALYTICS,
          startOfMonth,
          now,
          'daily'
        ),
        value: await this.getSalesAnalyticsData(startOfMonth, now, 'daily'),
        ttl: CACHE_TTL.SALES_ANALYTICS,
      },
      {
        key: this.cacheKeyGenerator.generateAnalyticsKey(
          CACHE_KEYS.ORDER_ANALYTICS,
          startOfMonth,
          now,
          'daily'
        ),
        value: await this.getOrderAnalyticsData(startOfMonth, now, 'daily'),
        ttl: CACHE_TTL.ORDER_ANALYTICS,
      },
    ];

    await this.cacheService.warmCache(warmupData);
  }

  /**
   * Schedule periodic cache warming
   */
  async schedulePeriodicWarmup(): Promise<void> {
    // Warm up every 30 minutes
    setInterval(async () => {
      try {
        await this.warmupFrequentlyAccessedData();
        await this.warmupFeaturedProducts();
      } catch (error) {
        this.logger.error('Periodic cache warmup failed:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Warm up analytics data every hour
    setInterval(async () => {
      try {
        await this.warmupAnalyticsData();
      } catch (error) {
        this.logger.error('Analytics cache warmup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  // Mock data methods - these would be replaced with actual service calls
  private async getSystemSettingsData(): Promise<any> {
    // This would call the actual system settings service
    return { settings: 'mock_data' };
  }

  private async getCategoryTreeData(): Promise<any> {
    // This would call the actual category service
    return { categories: 'mock_data' };
  }

  private async getDashboardMetricsData(): Promise<any> {
    // This would call the actual dashboard service
    return { metrics: 'mock_data' };
  }

  private async getUserData(userId: string): Promise<any> {
    // This would call the actual user service
    return { user: 'mock_data', id: userId };
  }

  private async getFeaturedProductsData(): Promise<any[]> {
    // This would call the actual product service
    return [{ id: '1', name: 'Featured Product 1' }];
  }

  private async getSalesAnalyticsData(from: Date, to: Date, interval: string): Promise<any> {
    // This would call the actual analytics service
    return { sales: 'mock_data', from, to, interval };
  }

  private async getOrderAnalyticsData(from: Date, to: Date, interval: string): Promise<any> {
    // This would call the actual analytics service
    return { orders: 'mock_data', from, to, interval };
  }
}