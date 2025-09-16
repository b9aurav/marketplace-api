# Admin User Management API

This document describes the user management endpoints available to admin users.

## Authentication

All endpoints require admin authentication via JWT token in the Authorization header:
```
Authorization: Bearer <admin-jwt-token>
```

## Endpoints

### 1. Get Users List

**GET** `/api/admin/users`

Retrieve a paginated list of users with filtering and sorting options.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (minimum: 1) |
| `limit` | number | 10 | Items per page (1-100) |
| `search` | string | - | Search by name or email |
| `role` | enum | - | Filter by user role (user, admin) |
| `status` | enum | - | Filter by status (active, inactive, blocked) |
| `date_from` | string | - | Filter from date (YYYY-MM-DD) |
| `date_to` | string | - | Filter to date (YYYY-MM-DD) |
| `sort_by` | enum | created_at | Sort field (name, email, created_at) |
| `sort_order` | enum | desc | Sort order (asc, desc) |

#### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "phone": "+1234567890",
      "role": "user",
      "is_active": true,
      "last_login_at": "2023-01-01T00:00:00Z",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "order_count": 5,
      "total_spent": 250.00
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "total_pages": 10
}
```

#### Caching

- Cache TTL: 10 minutes
- Cache key includes all query parameters
- Cache is invalidated when user data is modified

### 2. Get User Details

**GET** `/api/admin/users/{id}`

Retrieve detailed information about a specific user.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

#### Response

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "phone": "+1234567890",
  "role": "user",
  "is_active": true,
  "last_login_at": "2023-01-01T00:00:00Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "metadata": {},
  "addresses": [],
  "recent_orders": [],
  "total_orders": 5,
  "order_count": 5,
  "total_spent": 250.00,
  "average_order_value": 50.00,
  "first_order_date": "2023-01-01T00:00:00Z",
  "last_order_date": "2023-01-01T00:00:00Z"
}
```

#### Caching

- Cache TTL: 15 minutes
- Cache is invalidated when user data is modified

### 3. Update User Status

**PATCH** `/api/admin/users/{id}/status`

Update the status of a user (active/inactive/blocked).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

#### Request Body

```json
{
  "status": "inactive",
  "reason": "Optional reason for status change"
}
```

#### Response

```json
{
  "message": "User status updated to inactive successfully"
}
```

#### Audit Logging

This action is automatically logged for audit purposes with:
- Admin ID who performed the action
- Old and new status values
- Reason (if provided)
- Timestamp and IP address

#### Cache Invalidation

- Invalidates all user-related caches
- Invalidates specific user detail cache

### 4. Get User Analytics

**GET** `/api/admin/users/analytics`

Retrieve comprehensive user analytics and statistics.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date_from` | string | 30 days ago | Start date (YYYY-MM-DD) |
| `date_to` | string | today | End date (YYYY-MM-DD) |
| `interval` | enum | day | Grouping interval (day, week, month) |

#### Response

```json
{
  "total_users": 1000,
  "active_users": 800,
  "inactive_users": 200,
  "blocked_users": 0,
  "new_users_today": 5,
  "new_users_this_week": 25,
  "new_users_this_month": 100,
  "registration_trend": [
    {
      "date": "2023-01-01",
      "count": 10
    }
  ],
  "role_distribution": [
    {
      "role": "user",
      "count": 800,
      "percentage": 80
    },
    {
      "role": "admin",
      "count": 200,
      "percentage": 20
    }
  ],
  "activity_metrics": [
    {
      "period": "2023-01",
      "active_users": 500,
      "login_count": 2000
    }
  ]
}
```

#### Caching

- Cache TTL: 10 minutes
- Cache key includes date range and interval parameters

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "status",
        "message": "status must be one of: active, inactive, blocked"
      }
    ]
  },
  "timestamp": "2023-01-01T00:00:00Z",
  "path": "/api/admin/users/123/status"
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized - Admin access required",
    "details": []
  },
  "timestamp": "2023-01-01T00:00:00Z",
  "path": "/api/admin/users"
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden - Insufficient permissions",
    "details": []
  },
  "timestamp": "2023-01-01T00:00:00Z",
  "path": "/api/admin/users"
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User with ID 123 not found",
    "details": []
  },
  "timestamp": "2023-01-01T00:00:00Z",
  "path": "/api/admin/users/123"
}
```

## Performance Considerations

1. **Caching Strategy**: All endpoints use Redis caching with appropriate TTL values
2. **Pagination**: Large datasets are paginated to prevent memory issues
3. **Database Optimization**: Queries use proper indexing and avoid N+1 problems
4. **Cache Invalidation**: Smart cache invalidation ensures data consistency

## Security Features

1. **Admin Authentication**: All endpoints require valid admin JWT tokens
2. **Role-based Access**: Only users with admin role can access these endpoints
3. **Audit Logging**: All user status changes are logged for compliance
4. **Rate Limiting**: Endpoints are protected by rate limiting
5. **Input Validation**: All inputs are validated and sanitized

## Usage Examples

### Get active users with search
```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/admin/users?status=active&search=john&page=1&limit=20"
```

### Update user status
```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"inactive","reason":"Account suspended"}' \
  "https://api.example.com/api/admin/users/123e4567-e89b-12d3-a456-426614174000/status"
```

### Get user analytics for last month
```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/admin/users/analytics?date_from=2023-01-01&date_to=2023-01-31&interval=day"
```