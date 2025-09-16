# Admin Dashboard API Documentation

## Overview

The Admin Dashboard API provides comprehensive metrics and analytics endpoints for monitoring the overall health and performance of the marketplace platform. All endpoints implement intelligent caching with a 5-minute TTL to ensure optimal performance.

## Authentication

All dashboard endpoints require admin authentication:
- **Authentication**: Bearer Token (JWT)
- **Required Role**: ADMIN
- **Headers**: `Authorization: Bearer <admin_jwt_token>`

## Endpoints

### 1. Get Dashboard Metrics

Retrieve comprehensive dashboard metrics including user, product, order counts and growth rates.

**Endpoint**: `GET /api/admin/dashboard/metrics`

**Query Parameters**:
- `date_from` (optional): Start date for metrics calculation (ISO 8601 format)
- `date_to` (optional): End date for metrics calculation (ISO 8601 format)

**Example Request**:
```bash
GET /api/admin/dashboard/metrics?date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "total_users": 1250,
  "total_products": 450,
  "total_orders": 2100,
  "total_revenue": 125000.50,
  "user_growth": 15.5,
  "order_growth": 22.3,
  "revenue_growth": 18.7,
  "active_users": 1180,
  "pending_orders": 45,
  "low_stock_products": 12
}
```

**Response Fields**:
- `total_users`: Total number of users in the system
- `total_products`: Total number of products in the catalog
- `total_orders`: Total number of orders placed
- `total_revenue`: Total revenue from completed orders
- `user_growth`: User growth percentage compared to previous period
- `order_growth`: Order growth percentage compared to previous period
- `revenue_growth`: Revenue growth percentage compared to previous period
- `active_users`: Number of active users
- `pending_orders`: Number of orders with pending status
- `low_stock_products`: Number of products with stock below minimum threshold

### 2. Get Sales Analytics

Retrieve detailed sales analytics with trend data, growth rates, and performance metrics.

**Endpoint**: `GET /api/admin/dashboard/sales-analytics`

**Query Parameters**:
- `date_from` (required): Start date for analytics (ISO 8601 format)
- `date_to` (required): End date for analytics (ISO 8601 format)
- `interval` (optional): Grouping interval - `day`, `week`, or `month` (default: `day`)

**Example Request**:
```bash
GET /api/admin/dashboard/sales-analytics?date_from=2024-01-01&date_to=2024-01-31&interval=day
Authorization: Bearer <admin_token>
```

**Response**:
```json
{
  "sales_trend": [
    {
      "date": "2024-01-01",
      "revenue": 1250.00,
      "orders": 15,
      "average_order_value": 83.33
    },
    {
      "date": "2024-01-02",
      "revenue": 1450.00,
      "orders": 18,
      "average_order_value": 80.56
    }
  ],
  "total_revenue": 45000.00,
  "total_orders": 520,
  "growth_rate": 12.5,
  "average_order_value": 86.54,
  "peak_sales_day": "2024-01-15",
  "peak_sales_amount": 2100.00
}
```

**Response Fields**:
- `sales_trend`: Array of daily/weekly/monthly sales data points
  - `date`: Date for the data point
  - `revenue`: Revenue for this period
  - `orders`: Number of orders for this period
  - `average_order_value`: Average order value for this period
- `total_revenue`: Total revenue for the entire period
- `total_orders`: Total number of orders for the period
- `growth_rate`: Growth rate compared to previous period (%)
- `average_order_value`: Average order value for the entire period
- `peak_sales_day`: Date with highest sales
- `peak_sales_amount`: Revenue amount for the peak sales day

## Caching Strategy

### Cache Implementation
- **Cache Provider**: Redis
- **TTL**: 5 minutes (300 seconds)
- **Cache Keys**: Generated based on endpoint and query parameters
- **Invalidation**: Automatic expiration after TTL

### Cache Key Patterns
- Dashboard metrics: `admin:dashboard:metrics:{parameters}`
- Sales analytics: `admin:sales:analytics:{parameters}`

### Performance Benefits
- **Response Time**: Cached responses typically serve in <50ms
- **Database Load**: Reduces complex analytics queries by ~95%
- **Scalability**: Supports high concurrent admin usage

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date parameters",
    "details": [
      {
        "field": "date_from",
        "message": "date_from must be a valid ISO 8601 date string"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/admin/dashboard/sales-analytics"
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Admin access required",
    "details": []
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/admin/dashboard/metrics"
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error",
    "details": []
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/admin/dashboard/metrics"
}
```

## Usage Examples

### Basic Dashboard Metrics
```javascript
// Get current dashboard metrics
const response = await fetch('/api/admin/dashboard/metrics', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const metrics = await response.json();
console.log(`Total Revenue: $${metrics.total_revenue}`);
console.log(`Revenue Growth: ${metrics.revenue_growth}%`);
```

### Sales Analytics with Date Range
```javascript
// Get monthly sales analytics for Q1 2024
const response = await fetch('/api/admin/dashboard/sales-analytics?' + 
  new URLSearchParams({
    date_from: '2024-01-01',
    date_to: '2024-03-31',
    interval: 'month'
  }), {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const analytics = await response.json();
analytics.sales_trend.forEach(month => {
  console.log(`${month.date}: $${month.revenue} (${month.orders} orders)`);
});
```

### Dashboard with Custom Date Range
```javascript
// Get metrics for a specific period
const startDate = '2024-01-01';
const endDate = '2024-01-31';

const response = await fetch(`/api/admin/dashboard/metrics?date_from=${startDate}&date_to=${endDate}`, {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const metrics = await response.json();
console.log(`January Metrics:`, metrics);
```

## Performance Considerations

### Optimal Usage Patterns
1. **Cache Awareness**: Identical requests within 5 minutes will be served from cache
2. **Date Range Optimization**: Smaller date ranges generally perform better
3. **Interval Selection**: Use appropriate intervals (day for short periods, month for long periods)

### Rate Limiting
- **Admin Endpoints**: 100 requests per minute per admin user
- **Burst Allowance**: Up to 20 requests in a 10-second window

### Monitoring
- All dashboard requests are logged for audit purposes
- Performance metrics are tracked for optimization
- Cache hit rates are monitored for efficiency

## Integration Notes

### Frontend Integration
- Dashboard data should be refreshed every 5-10 minutes
- Implement loading states for better user experience
- Handle error states gracefully with fallback displays

### Mobile Considerations
- All endpoints return mobile-friendly JSON responses
- Consider data usage when implementing auto-refresh
- Implement offline caching for critical metrics

### Security
- All endpoints require valid admin JWT tokens
- Audit logs track all dashboard access
- Rate limiting prevents abuse
- Sensitive financial data is properly formatted and secured