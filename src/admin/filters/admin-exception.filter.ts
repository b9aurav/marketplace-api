import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminException } from '../exceptions/admin.exception';

@Catch()
export class AdminExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AdminExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: [],
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof AdminException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      errorResponse = {
        ...exceptionResponse,
        path: request.url,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        errorResponse = {
          error: {
            code: 'HTTP_ERROR',
            message: (exceptionResponse as any).message || exception.message,
            details: (exceptionResponse as any).details || [],
          },
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      } else {
        errorResponse.error.message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      errorResponse.error.message = exception.message;
    }

    // Log the error with appropriate level
    if (status >= 500) {
      this.logger.error(
        `Admin API Error: ${errorResponse.error.message}`,
        exception instanceof Error ? exception.stack : exception
      );
    } else {
      this.logger.warn(
        `Admin API Warning: ${errorResponse.error.message}`,
        { path: request.url, method: request.method }
      );
    }

    response.status(status).json(errorResponse);
  }
}