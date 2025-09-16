import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ICacheService } from './interfaces/cache.interface';

@Injectable()
export class CacheService implements ICacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      this.logger.debug(`Cache GET: ${key} - ${value ? 'HIT' : 'MISS'}`);
      return value || null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET: ${key} with TTL ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}:`, error);
      throw error;
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
            this.logger.debug(`Cache DEL PATTERN: ${pattern} - deleted ${keys.length} keys`);
          }
        } else {
          this.logger.warn(`Pattern deletion not supported for current cache store`);
        }
      } else {
        this.logger.warn(`No cache stores available for pattern deletion`);
      }
    } catch (error) {
      this.logger.error(`Cache DEL PATTERN error for pattern ${pattern}:`, error);
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
}