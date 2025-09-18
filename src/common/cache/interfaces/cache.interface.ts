export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  getMetrics(): CacheMetrics;
  resetMetrics(): void;
  warmCache(warmupData: Array<{ key: string; value: any; ttl?: number }>): Promise<void>;
  getMemoryUsage(): Promise<any>;
  configureLRUEviction(): Promise<void>;
  isAvailable(): Promise<boolean>;
}

export interface ICacheKeyGenerator {
  generateKey(prefix: string, params: Record<string, any>): string;
  generatePatternKey(prefix: string, pattern: string): string;
}

export interface CacheOptions {
  ttl?: number;
  keyGenerator?: (args: any[]) => string;
  condition?: (args: any[]) => boolean;
  version?: string;
  skipCache?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalRequests: number;
  averageResponseTime: number;
  lastResetTime: Date;
  hitRate?: number;
}

export interface CacheWarmupData {
  key: string;
  value: any;
  ttl?: number;
}
