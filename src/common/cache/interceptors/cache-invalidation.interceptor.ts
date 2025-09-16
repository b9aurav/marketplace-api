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
      tap(async () => {
        try {
          // Invalidate cache patterns after successful method execution
          await Promise.all(
            invalidationPatterns.map(async (pattern) => {
              await this.cacheService.delPattern(pattern);
              this.logger.debug(`Invalidated cache pattern: ${pattern}`);
            }),
          );
        } catch (error) {
          this.logger.error("Cache invalidation error:", error);
          // Don't throw error to avoid breaking the main operation
        }
      }),
    );
  }
}
