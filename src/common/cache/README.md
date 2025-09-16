# Redis Caching Infrastructure

This module provides a comprehensive Redis-based caching solution for the admin API system with intelligent caching strategies, cache invalidation, and performance optimization.

## Features

- **Redis Integration**: Full Redis support with connection management
- **Method-Level Caching**: Decorator-based caching for service methods
- **Cache Invalidation**: Automatic cache invalidation on data modifications
- **Key Generation**: Consistent and configurable cache key generation
- **Performance Monitoring**: Built-in logging and cache hit/miss tracking
- **Graceful Fallback**: Continues operation when cache is unavailable

## Installation

The cache module is automatically installed and configured when you install the project dependencies. Redis dependencies are included:

- `redis` - Redis client
- `@nestjs/cache-manager` - NestJS cache manager
- `cache-manager` - Cache manager core
- `cache-manager-redis-store` - Redis store for cache manager

## Configuration

### Environment Variables

Add these environment variables to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Cache Configuration
CACHE_TTL=300  # Default TTL in seconds (5 minutes)
```

### Module Setup

The cache module is automatically imported in `app.module.ts` as a global module, making it available throughout the application.

## Usage

### Basic Caching with Decorator

```typescript
import { Injectable } from '@nestjs/common';
import { Cache } from '../common/cache';
import { CACHE_TTL } from '../common/cache';

@Injectable()
export class UserService {
  @Cache({ ttl: CACHE_TTL.USER_LIST })
  async getUsers(page: number = 1, limit: number = 10) {
    // This method result will be cached for 10 minutes
    return await this.userRepository.find({
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
```

### Custom Key Generation

```typescript
@Cache({
  ttl: CACHE_TTL.USER_DETAILS,
  keyGenerator: (args) => `user:details:${args[0]}`,
})
async getUserById(id: string) {
  return await this.userRepository.findOne({ where: { id } });
}
```

### Conditional Caching

```typescript
@Cache({
  ttl: CACHE_TTL.PRODUCT_LIST,
  condition: (args) => {
    // Only cache if not searching
    const [, , search] = args;
    return !search;
  },
})
async getProducts(page: number, limit: number, search?: string) {
  // Implementation
}
```

### Cache Invalidation

```typescript
import { CacheInvalidate } from '../common/cache';
import { CACHE_PATTERNS } from '../common/cache';

@CacheInvalidate([CACHE_PATTERNS.USERS])
async updateUser(id: string, data: UpdateUserDto) {
  // This will invalidate all user-related cache entries
  return await this.userRepository.update(id, data);
}
```

### Manual Cache Operations

```typescript
import { CacheService, CacheKeyGenerator } from '../common/cache';

@Injectable()
export class MyService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly keyGenerator: CacheKeyGenerator,
  ) {}

  async customCacheOperation() {
    const key = this.keyGenerator.generateKey('custom', { id: 123 });
    
    // Get from cache
    const cached = await this.cacheService.get(key);
    if (cached) {
      return cached;
    }

    // Set cache
    const data = await this.fetchData();
    await this.cacheService.set(key, data, 300);
    
    return data;
  }

  async invalidatePattern() {
    // Delete all keys matching pattern
    await this.cacheService.delPattern('user:*');
  }
}
```

## Cache Configuration

### TTL Values

Pre-configured TTL values for different data types:

```typescript
export const CACHE_TTL = {
  DASHBOARD_METRICS: 5 * 60,    // 5 minutes
  SALES_ANALYTICS: 10 * 60,     // 10 minutes
  USER_LIST: 10 * 60,           // 10 minutes
  USER_DETAILS: 15 * 60,        // 15 minutes
  PRODUCT_LIST: 15 * 60,        // 15 minutes
  PRODUCT_DETAILS: 30 * 60,     // 30 minutes
  CATEGORY_TREE: 30 * 60,       // 30 minutes
  ORDER_LIST: 5 * 60,           // 5 minutes
  SYSTEM_SETTINGS: 60 * 60,     // 1 hour
};
```

### Cache Key Prefixes

Consistent key prefixes for different data types:

```typescript
export const CACHE_KEYS = {
  DASHBOARD_METRICS: 'admin:dashboard:metrics',
  USER_LIST: 'admin:users:list',
  USER_DETAILS: 'admin:users:details',
  PRODUCT_LIST: 'admin:products:list',
  // ... more keys
};
```

### Cache Invalidation Patterns

Patterns for bulk cache invalidation:

```typescript
export const CACHE_PATTERNS = {
  ALL_ADMIN: 'admin:*',
  USERS: 'admin:users:*',
  PRODUCTS: 'admin:products:*',
  ORDERS: 'admin:orders:*',
  // ... more patterns
};
```

## Key Generation Strategies

### Simple Keys

```typescript
// Generates: "admin:user:123"
const key = keyGenerator.generateSimpleKey('admin:user', '123');
```

### List Keys with Pagination

```typescript
// Generates: "admin:users:list:limit=10:page=1:status=active"
const key = keyGenerator.generateListKey(
  'admin:users:list',
  1,      // page
  10,     // limit
  { status: 'active' }  // filters
);
```

### Analytics Keys with Date Range

```typescript
// Generates: "admin:sales:analytics:from=2023-01-01:to=2023-01-31:interval=day"
const key = keyGenerator.generateAnalyticsKey(
  'admin:sales:analytics',
  new Date('2023-01-01'),
  new Date('2023-01-31'),
  'day'
);
```

## Best Practices

### 1. Choose Appropriate TTL Values

- **Frequently changing data**: 5-10 minutes
- **Moderately changing data**: 15-30 minutes
- **Rarely changing data**: 1+ hours
- **Configuration data**: Several hours

### 2. Use Conditional Caching

```typescript
@Cache({
  condition: (args) => {
    // Don't cache search results or user-specific data
    const [query] = args;
    return !query.search && !query.userId;
  },
})
```

### 3. Implement Cache Invalidation

Always invalidate related cache entries when data changes:

```typescript
@CacheInvalidate([
  CACHE_PATTERNS.USERS,
  CACHE_PATTERNS.DASHBOARD,  // User changes affect dashboard metrics
])
async updateUserStatus(id: string, status: string) {
  // Implementation
}
```

### 4. Handle Cache Failures Gracefully

The cache service automatically handles failures and falls back to database queries. Always ensure your application works without cache.

### 5. Monitor Cache Performance

Use the built-in logging to monitor cache hit rates:

```typescript
// Enable debug logging to see cache operations
// Set LOG_LEVEL=debug in your environment
```

## Testing

### Unit Testing with Mocked Cache

```typescript
describe('UserService', () => {
  let service: UserService;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    cacheService = module.get(CacheService);
  });

  it('should use cache when available', async () => {
    const cachedData = [{ id: 1, name: 'John' }];
    cacheService.get.mockResolvedValue(cachedData);

    const result = await service.getUsers();

    expect(result).toEqual(cachedData);
    expect(cacheService.get).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify connection parameters in `.env`
   - Check network connectivity

2. **Cache Not Working**
   - Ensure `CacheModule` is imported
   - Check if interceptors are properly configured
   - Verify decorator syntax

3. **Memory Issues**
   - Monitor Redis memory usage
   - Implement appropriate TTL values
   - Use cache invalidation patterns

### Debug Mode

Enable debug logging to see cache operations:

```env
LOG_LEVEL=debug
```

This will show cache hits, misses, and operations in the console.

## Performance Considerations

- **Cache Hit Rate**: Aim for 80%+ hit rate for frequently accessed data
- **Memory Usage**: Monitor Redis memory and implement eviction policies
- **Network Latency**: Consider Redis clustering for high-traffic applications
- **Key Expiration**: Use appropriate TTL values to balance freshness and performance

## Integration with Admin API

The cache system is designed specifically for the admin API endpoints and includes:

- Pre-configured cache keys for all admin operations
- Appropriate TTL values for different data types
- Cache invalidation patterns for data consistency
- Performance optimization for analytics queries
- Graceful fallback for high availability