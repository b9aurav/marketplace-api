import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { CacheService } from "../cache.service";

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const invalidationPatterns = this.reflector.get<string[]>(
      "cache_invalidate",
      context.getHandler(),
    );

    if (!invalidationPatterns || invalidationPatterns.length === 0) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (result) => {
        // Only invalidate cache if the operation was successful
        if (result !== null && result !== undefined) {
          await this.invalidateCachePatterns(invalidationPatterns);
        }
      }),
    );
  }

  private async invalidateCachePatterns(patterns: string[]): Promise<void> {
    const invalidationPromises = patterns.map(async (pattern) => {
      try {
        await this.cacheService.delPattern(pattern);
        this.logger.debug(`Invalidated cache pattern: ${pattern}`);
      } catch (error) {
        this.logger.error(`Failed to invalidate cache pattern ${pattern}:`, error);
      }
    });

    await Promise.allSettled(invalidationPromises);
  }
}