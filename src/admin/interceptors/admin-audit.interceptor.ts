import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AdminAuditService } from '../services/admin-audit.service';
import { ADMIN_AUDIT_KEY, AdminAuditOptions } from '../decorators/admin-audit.decorator';

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AdminAuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AdminAuditOptions>(
      ADMIN_AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.get('User-Agent');

    return next.handle().pipe(
      tap(() => {
        // Log successful action
        this.auditService.logAction({
          adminId: user.id,
          action: auditOptions.action,
          resource: auditOptions.resource,
          description: auditOptions.description,
          metadata: {
            method: request.method,
            url: request.url,
            params: request.params,
            query: request.query,
          },
          ipAddress,
          userAgent,
          status: 'success',
        });
      }),
      catchError((error) => {
        // Log failed action
        this.auditService.logAction({
          adminId: user.id,
          action: auditOptions.action,
          resource: auditOptions.resource,
          description: auditOptions.description,
          metadata: {
            method: request.method,
            url: request.url,
            params: request.params,
            query: request.query,
          },
          ipAddress,
          userAgent,
          status: 'failure',
          errorMessage: error.message,
        });

        throw error;
      }),
    );
  }
}