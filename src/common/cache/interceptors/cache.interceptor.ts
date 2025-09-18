import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { CacheService } from "../cache.service";
import { CacheKeyGenerator } from "../cache-key-generator.service";
import { CACHE_METADATA_KEY } from "../decorators/cache.decorator";
import { CacheOptions } from "../interfaces/cache.interface";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly cacheKeyGenerator: CacheKeyGenerator,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<CacheOptions>(
      CACHE_METADATA_KEY,
      context.getHandler(),
    );

    if (!cacheOptions || cacheOptions.skipCache) {
      return next.handle();
    }

    // Check if cache is available
    const isCacheAvailable = await this.cacheService.isAvailable();
    if (!isCacheAvailable) {
      this.logger.warn('Cache is not available, falling back to direct execution');
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;
    const args = context.getArgs();

    // Generate cache key
    let cacheKey: string;
    if (cacheOptions.keyGenerator) {
      cacheKey = cacheOptions.keyGenerator(args);
    } else {
      // Default key generation based on method name and arguments
      const keyPrefix = `${className.toLowerCase()}:${methodName}`;
      const params = this.extractParams(request, args);
      cacheKey = this.cacheKeyGenerator.generateKey(keyPrefix, params, cacheOptions.version);
    }

    // Check cache condition
    if (cacheOptions.condition && !cacheOptions.condition(args)) {
      return next.handle();
    }

    try {
      // Try to get from cache
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult !== null) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cachedResult);
      }

      // Cache miss - execute method and cache result
      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return next.handle().pipe(
        tap(async (result) => {
          if (result !== null && result !== undefined) {
            await this.cacheService.set(cacheKey, result, cacheOptions.ttl);
            this.logger.debug(`Cached result for key: ${cacheKey}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for key ${cacheKey}:`, error);
      // Graceful fallback to executing the method without caching
      return next.handle();
    }
  }

  private extractParams(request: any, args: any[]): Record<string, any> {
    const params: Record<string, any> = {};

    // Extract query parameters
    if (request && request.query) {
      Object.assign(params, request.query);
    }

    // Extract route parameters
    if (request && request.params) {
      Object.assign(params, request.params);
    }

    // Extract method arguments (excluding request/response objects)
    args.forEach((arg, index) => {
      if (arg && typeof arg === "object" && !arg.url && !arg.status) {
        // This is likely a DTO or data object, not request/response
        if (arg.constructor && arg.constructor.name !== "Object") {
          params[`arg${index}`] = arg;
        } else {
          Object.assign(params, arg);
        }
      } else if (typeof arg === "string" || typeof arg === "number") {
        params[`arg${index}`] = arg;
      }
    });

    return params;
  }
}
