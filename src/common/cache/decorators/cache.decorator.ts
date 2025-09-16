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
