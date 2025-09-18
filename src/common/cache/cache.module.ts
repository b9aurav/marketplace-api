import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";
import { CacheService } from "./cache.service";
import { CacheKeyGenerator } from "./cache-key-generator.service";
import { CacheWarmingService } from "./services/cache-warming.service";
import { CacheMonitoringService } from "./services/cache-monitoring.service";
import { CacheInterceptor } from "./interceptors/cache.interceptor";
import { CacheInvalidationInterceptor } from "./interceptors/cache-invalidation.interceptor";

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get("REDIS_HOST", "localhost"),
            port: configService.get("REDIS_PORT", 6379),
          },
          password: configService.get("REDIS_PASSWORD"),
          database: configService.get("REDIS_DB", 0),
          // Configure LRU eviction and memory management
          maxmemoryPolicy: 'allkeys-lru',
        });

        return {
          store: () => store,
          ttl: configService.get("CACHE_TTL", 300), // 5 minutes default
          max: configService.get("CACHE_MAX_ITEMS", 1000), // Maximum items in cache
        };
      },
    }),
  ],
  providers: [
    CacheService,
    CacheKeyGenerator,
    CacheWarmingService,
    CacheMonitoringService,
    CacheInterceptor,
    CacheInvalidationInterceptor,
  ],
  exports: [
    CacheService,
    CacheKeyGenerator,
    CacheWarmingService,
    CacheMonitoringService,
    CacheInterceptor,
    CacheInvalidationInterceptor,
  ],
})
export class CacheModule {}
