import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message || 'Internal server error',
      data: null,
    };

    // Add validation errors if available
    const exceptionResponse = exception.getResponse() as any;
    if (exceptionResponse && exceptionResponse.message) {
      errorResponse.message = 
        Array.isArray(exceptionResponse.message) 
          ? exceptionResponse.message.join(', ') 
          : exceptionResponse.message;
    }

    response
      .status(status)
      .json(errorResponse);
  }
}