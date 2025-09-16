import { HttpException, HttpStatus } from '@nestjs/common';

export class AdminException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    errorCode?: string,
    details?: any[]
  ) {
    super(
      {
        error: {
          code: errorCode || 'ADMIN_ERROR',
          message,
          details: details || [],
        },
        timestamp: new Date().toISOString(),
      },
      statusCode
    );
  }
}

export class AdminValidationException extends AdminException {
  constructor(message: string, details: any[]) {
    super(message, HttpStatus.BAD_REQUEST, 'ADMIN_VALIDATION_ERROR', details);
  }
}

export class AdminAuthorizationException extends AdminException {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN, 'ADMIN_AUTHORIZATION_ERROR');
  }
}

export class AdminResourceNotFoundException extends AdminException {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND, 'ADMIN_RESOURCE_NOT_FOUND');
  }
}

export class AdminConflictException extends AdminException {
  constructor(message: string, details?: any[]) {
    super(message, HttpStatus.CONFLICT, 'ADMIN_CONFLICT_ERROR', details);
  }
}