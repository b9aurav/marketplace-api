import { Injectable, Inject, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { ICacheService, CacheMetrics } from "./interfaces/cache.interface";

@Injectable()
export class CacheService implements ICacheService {
  private readonly logger = new Logger(CacheService.name);
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    lastResetTime: new Date(),
  };

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const value = await this.cacheManager.get<T>(key);
      const isHit = value !== undefined && value !== null;
      
      // Update metrics
      this.metrics.totalRequests++;
      if (isHit) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }
      this.updateAverageResponseTime(Date.now() - startTime);
      
      this.logger.debug(`Cache GET: ${key} - ${isHit ? "HIT" : "MISS"}`);
      return value || null;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache GET error for key ${key}:`, error);
      // Graceful fallback - return null instead of throwing
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const startTime = Date.now();
    try {
      await this.cacheManager.set(key, value, ttl);
      this.metrics.sets++;
      this.updateAverageResponseTime(Date.now() - startTime);
      this.logger.debug(`Cache SET: ${key} with TTL ${ttl || "default"}`);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache SET error for key ${key}:`, error);
      // Graceful fallback - don't throw error to prevent service disruption
      this.logger.warn(`Continuing without caching for key: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.metrics.deletes++;
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache DEL error for key ${key}:`, error);
      // Graceful fallback - don't throw error
      this.logger.warn(`Failed to delete cache key: ${key}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      // Get the Redis store instance to access Redis-specific methods
      const stores = (this.cacheManager as any).stores || [];
      if (stores.length > 0) {
        const store = stores[0];
        if (store && store.client && store.client.keys) {
          const keys = await store.client.keys(pattern);
          if (keys.length > 0) {
            await Promise.all(keys.map((key: string) => this.del(key)));
            this.logger.debug(
              `Cache DEL PATTERN: ${pattern} - deleted ${keys.length} keys`,
            );
          }
        } else {
          this.logger.warn(
            `Pattern deletion not supported for current cache store`,
          );
        }
      } else {
        this.logger.warn(`No cache stores available for pattern deletion`);
      }
    } catch (error) {
      this.logger.error(
        `Cache DEL PATTERN error for pattern ${pattern}:`,
        error,
      );
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      const exists = value !== undefined && value !== null;
      this.logger.debug(`Cache EXISTS: ${key} - ${exists}`);
      return exists;
    } catch (error) {
      this.logger.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      // Get the Redis store instance to access Redis-specific methods
      const stores = (this.cacheManager as any).stores || [];
      if (stores.length > 0) {
        const store = stores[0];
        if (store && store.client && store.client.ttl) {
          const ttl = await store.client.ttl(key);
          this.logger.debug(`Cache TTL: ${key} - ${ttl}`);
          return ttl;
        } else {
          this.logger.warn(`TTL check not supported for current cache store`);
          return -1;
        }
      } else {
        this.logger.warn(`No cache stores available for TTL check`);
        return -1;
      }
    } catch (error) {
      this.logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
    
    return {
      ...this.metrics,
      hitRate: Number(hitRate.toFixed(2)),
    };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      lastResetTime: new Date(),
    };
    this.logger.debug('Cache metrics reset');
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmCache(warmupData: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    this.logger.log(`Starting cache warmup with ${warmupData.length} entries`);
    
    const promises = warmupData.map(async ({ key, value, ttl }) => {
      try {
        await this.set(key, value, ttl);
      } catch (error) {
        this.logger.warn(`Failed to warm cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    this.logger.log('Cache warmup completed');
  }

  /**
   * Get cache memory usage information
   */
  async getMemoryUsage(): Promise<any> {
    try {
      const stores = (this.cacheManager as any).stores || [];
      if (stores.length > 0) {
        const store = stores[0];
        if (store && store.client && store.client.memory) {
          const memoryInfo = await store.client.memory('usage');
          return memoryInfo;
        }
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to get cache memory usage:', error);
      return null;
    }
  }

  /**
   * Implement LRU eviction by setting maxmemory policy
   */
  async configureLRUEviction(): Promise<void> {
    try {
      const stores = (this.cacheManager as any).stores || [];
      if (stores.length > 0) {
        const store = stores[0];
        if (store && store.client && store.client.config) {
          await store.client.config('SET', 'maxmemory-policy', 'allkeys-lru');
          this.logger.log('LRU eviction policy configured');
        }
      }
    } catch (error) {
      this.logger.error('Failed to configure LRU eviction:', error);
    }
  }

  /**
   * Check if cache is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const testKey = 'cache:health:check';
      await this.set(testKey, 'ok', 1);
      const result = await this.get(testKey);
      await this.del(testKey);
      return result === 'ok';
    } catch (error) {
      this.logger.error('Cache availability check failed:', error);
      return false;
    }
  }

  /**
   * Update average response time metric
   */
  private updateAverageResponseTime(responseTime: number): void {
    if (this.metrics.totalRequests === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
        this.metrics.totalRequests;
    }
  }
}
