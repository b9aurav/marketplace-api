# Admin Infrastructure

This module provides the core infrastructure for admin API endpoints with authentication, authorization, audit logging, and error handling.

## Components

### 1. Authentication & Authorization

#### AdminGuard
- Ensures only users with `Role.ADMIN` can access admin endpoints
- Used in combination with `JwtAuthGuard`

```typescript
@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  // Admin-only endpoints
}
```

#### BaseAdminController
- Base class for all admin controllers
- Provides common response formatting methods
- Automatically applies admin guards and exception filters

```typescript
@Controller('users')
export class AdminUsersController extends BaseAdminController {
  @Get()
  async getUsers() {
    const users = await this.userService.getUsers();
    return this.getSuccessResponse(users, 'Users retrieved successfully');
  }
}
```

### 2. Exception Handling

#### AdminException Classes
- `AdminException`: Base admin exception
- `AdminValidationException`: For validation errors
- `AdminAuthorizationException`: For authorization errors
- `AdminResourceNotFoundException`: For resource not found errors
- `AdminConflictException`: For conflict errors

#### AdminExceptionFilter
- Global exception filter for admin endpoints
- Provides consistent error response format
- Logs errors with appropriate levels

### 3. Validation

#### AdminValidationPipe
- Enhanced validation pipe for admin endpoints
- Provides detailed validation error messages
- Throws `AdminValidationException` on validation failures

### 4. Audit Logging

#### AdminAuditService
- Logs all admin actions to the database
- Tracks user, action, resource, IP address, and metadata
- Provides query methods for audit logs

#### @AdminAudit Decorator
- Marks methods for audit logging
- Automatically logs successful and failed actions

```typescript
@Post()
@AdminAudit({
  action: 'CREATE_USER',
  resource: 'user',
  description: 'Create new user account',
})
async createUser(@Body() userData: CreateUserDto) {
  return await this.userService.createUser(userData);
}
```

#### AdminAuditInterceptor
- Intercepts method calls marked with `@AdminAudit`
- Automatically logs actions with request metadata

### 5. Decorators

#### @AdminUser
- Extracts admin user from request
- Can extract specific user properties

```typescript
@Get('profile')
async getProfile(@AdminUser() admin: User, @AdminUser('id') adminId: string) {
  // Use admin user data
}
```

## Usage Example

```typescript
import { Controller, Get, Post, Body, UseInterceptors } from '@nestjs/common';
import { 
  BaseAdminController, 
  AdminAudit, 
  AdminUser, 
  AdminAuditInterceptor,
  AdminValidationPipe 
} from '../admin';

@Controller('users')
@UseInterceptors(AdminAuditInterceptor)
export class AdminUsersController extends BaseAdminController {
  
  @Get()
  @AdminAudit({
    action: 'LIST_USERS',
    resource: 'user',
    description: 'List all users',
  })
  async getUsers(@AdminUser() admin: User) {
    const users = await this.userService.getUsers();
    return this.getSuccessResponse(users);
  }

  @Post()
  @AdminAudit({
    action: 'CREATE_USER',
    resource: 'user',
    description: 'Create new user',
  })
  async createUser(
    @Body(AdminValidationPipe) userData: CreateUserDto,
    @AdminUser('id') adminId: string
  ) {
    const user = await this.userService.createUser(userData);
    return this.getSuccessResponse(user, 'User created successfully');
  }
}
```

## Database Migration

Run the migration to create the audit log table:

```bash
npm run migration:run
```

## Testing

The admin infrastructure includes comprehensive tests:

```bash
npm test -- --testPathPattern=admin
```

## Response Formats

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

### Paginated Response
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

### Error Response
```json
{
  "error": {
    "code": "ADMIN_VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "constraints": { "isEmail": "email must be an email" },
        "value": "invalid-email"
      }
    ]
  },
  "timestamp": "2023-12-01T10:00:00.000Z",
  "path": "/api/admin/users"
}
```