import { SetMetadata } from "@nestjs/common";
import { CacheOptions } from "../interfaces/cache.interface";

export const CACHE_METADATA_KEY = "cache_options";

/**
 * Cache decorator for method-level caching
 * @param options Cache configuration options
 */
export const Cache = (options: CacheOptions = {}) => {
  return SetMetadata(CACHE_METADATA_KEY, options);
};

/**
 * Cache invalidation decorator to mark methods that should invalidate cache
 * @param patterns Cache key patterns to invalidate
 */
export const CacheInvalidate = (patterns: string | string[]) => {
  const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
  return SetMetadata("cache_invalidate", patternsArray);
};

/**
 * Advanced cache decorator with TTL and conditions
 */
export const CacheWithTTL = (ttl: number, condition?: (args: any[]) => boolean) => {
  return Cache({ ttl, condition });
};

/**
 * Cache decorator for list operations with pagination
 */
export const CacheList = (ttl: number = 300) => {
  return Cache({
    ttl,
    keyGenerator: (args: any[]) => {
      const [query] = args;
      return `list:${JSON.stringify(query || {})}`;
    },
  });
};

/**
 * Cache decorator for analytics operations
 */
export const CacheAnalytics = (ttl: number = 600) => {
  return Cache({
    ttl,
    keyGenerator: (args: any[]) => {
      const [dateFrom, dateTo, interval] = args;
      return `analytics:${dateFrom?.toISOString() || 'all'}:${dateTo?.toISOString() || 'all'}:${interval || 'default'}`;
    },
  });
};

/**
 * Cache decorator for user-specific data
 */
export const CacheUser = (ttl: number = 900) => {
  return Cache({
    ttl,
    keyGenerator: (args: any[]) => {
      const [userId] = args;
      return `user:${userId}`;
    },
  });
};

/**
 * Cache decorator with versioning support
 */
export const CacheVersioned = (version: string, ttl: number = 300) => {
  return Cache({ version, ttl });
};

/**
 * Conditional cache decorator that only caches based on conditions
 */
export const CacheConditional = (
  condition: (args: any[]) => boolean,
  ttl: number = 300
) => {
  return Cache({ condition, ttl });
};

/**
 * Cache decorator that skips caching in development
 */
export const CacheProduction = (ttl: number = 300) => {
  return Cache({
    ttl,
    condition: () => process.env.NODE_ENV === 'production',
  });
};
