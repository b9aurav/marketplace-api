import { Injectable, Logger } from "@nestjs/common";
import { CacheService } from "../cache.service";
import { CacheMetrics } from "../interfaces/cache.interface";

@Injectable()
export class CacheMonitoringService {
  private readonly logger = new Logger(CacheMonitoringService.name);
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Start cache performance monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      await this.logCacheMetrics();
      await this.checkCacheHealth();
    }, intervalMs);

    this.logger.log(`Cache monitoring started with ${intervalMs}ms interval`);
  }

  /**
   * Stop cache performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.log('Cache monitoring stopped');
    }
  }

  /**
   * Get current cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    return this.cacheService.getMetrics();
  }

  /**
   * Get cache health status
   */
  async getCacheHealth(): Promise<{
    isAvailable: boolean;
    metrics: CacheMetrics;
    memoryUsage?: any;
    recommendations: string[];
  }> {
    const isAvailable = await this.cacheService.isAvailable();
    const metrics = this.getCacheMetrics();
    const memoryUsage = await this.cacheService.getMemoryUsage();
    const recommendations = this.generateRecommendations(metrics);

    return {
      isAvailable,
      metrics,
      memoryUsage,
      recommendations,
    };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.cacheService.resetMetrics();
    this.logger.log('Cache metrics reset');
  }

  /**
   * Log cache metrics
   */
  private async logCacheMetrics(): Promise<void> {
    const metrics = this.getCacheMetrics();
    
    this.logger.log(`Cache Metrics - Hit Rate: ${metrics.hitRate}%, ` +
      `Hits: ${metrics.hits}, Misses: ${metrics.misses}, ` +
      `Errors: ${metrics.errors}, Avg Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);

    // Log warnings for poor performance
    if (metrics.hitRate !== undefined && metrics.hitRate < 70) {
      this.logger.warn(`Low cache hit rate: ${metrics.hitRate}%`);
    }

    if (metrics.errors > 0) {
      this.logger.warn(`Cache errors detected: ${metrics.errors}`);
    }

    if (metrics.averageResponseTime > 100) {
      this.logger.warn(`High cache response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
    }
  }

  /**
   * Check cache health and log issues
   */
  private async checkCacheHealth(): Promise<void> {
    const isAvailable = await this.cacheService.isAvailable();
    
    if (!isAvailable) {
      this.logger.error('Cache is not available!');
      return;
    }

    const memoryUsage = await this.cacheService.getMemoryUsage();
    if (memoryUsage && memoryUsage.used_memory_human) {
      this.logger.debug(`Cache memory usage: ${memoryUsage.used_memory_human}`);
    }
  }

  /**
   * Generate performance recommendations based on metrics
   */
  private generateRecommendations(metrics: CacheMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.hitRate !== undefined && metrics.hitRate < 50) {
      recommendations.push('Consider reviewing cache keys and TTL values - hit rate is very low');
    }

    if (metrics.hitRate !== undefined && metrics.hitRate < 70) {
      recommendations.push('Cache hit rate could be improved - consider cache warming strategies');
    }

    if (metrics.errors > metrics.totalRequests * 0.05) {
      recommendations.push('High error rate detected - check Redis connection and configuration');
    }

    if (metrics.averageResponseTime > 50) {
      recommendations.push('High cache response time - consider Redis performance tuning');
    }

    if (metrics.totalRequests === 0) {
      recommendations.push('No cache requests detected - ensure cache decorators are properly applied');
    }

    if (recommendations.length === 0) {
      recommendations.push('Cache performance is optimal');
    }

    return recommendations;
  }

  /**
   * Generate cache performance report
   */
  async generatePerformanceReport(): Promise<{
    summary: string;
    metrics: CacheMetrics;
    health: any;
    recommendations: string[];
  }> {
    const metrics = this.getCacheMetrics();
    const health = await this.getCacheHealth();
    
    const summary = `Cache Performance Summary:
- Hit Rate: ${metrics.hitRate}%
- Total Requests: ${metrics.totalRequests}
- Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
- Errors: ${metrics.errors}
- Cache Availability: ${health.isAvailable ? 'Available' : 'Unavailable'}`;

    return {
      summary,
      metrics,
      health,
      recommendations: health.recommendations,
    };
  }
}