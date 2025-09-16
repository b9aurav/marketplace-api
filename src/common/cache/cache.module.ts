import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";
import { CacheService } from "./cache.service";
import { CacheKeyGenerator } from "./cache-key-generator.service";

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
        });

        return {
          store: () => store,
          ttl: configService.get("CACHE_TTL", 300), // 5 minutes default
        };
      },
    }),
  ],
  providers: [CacheService, CacheKeyGenerator],
  exports: [CacheService, CacheKeyGenerator],
})
export class CacheModule {}
