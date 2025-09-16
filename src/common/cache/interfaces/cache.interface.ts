export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
}

export interface ICacheKeyGenerator {
  generateKey(prefix: string, params: Record<string, any>): string;
  generatePatternKey(prefix: string, pattern: string): string;
}

export interface CacheOptions {
  ttl?: number;
  keyGenerator?: (args: any[]) => string;
  condition?: (args: any[]) => boolean;
}
