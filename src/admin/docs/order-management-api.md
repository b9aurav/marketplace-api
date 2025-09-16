# Admin Order Management API Documentation

This document describes the admin API endpoints for order management, including comprehensive filtering, status updates, refund processing, and analytics.

## Base URL
All endpoints are prefixed with `/api/admin/orders`

## Authentication
All endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- Admin role permissions

## Endpoints

### 1. Get Orders List

**GET** `/api/admin/orders`

Retrieve a paginated list of orders with comprehensive filtering options.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (minimum: 1) |
| `limit` | number | No | 10 | Items per page (1-100) |
| `search` | string | No | - | Search by order ID, user email, or tracking number |
| `status` | enum | No | - | Filter by order status |
| `user_id` | UUID | No | - | Filter by user ID |
| `payment_method` | string | No | - | Filter by payment method |
| `min_total` | number | No | - | Minimum order total |
| `max_total` | number | No | - | Maximum order total |
| `date_from` | string | No | - | Start date (YYYY-MM-DD) |
| `date_to` | string | No | - | End date (YYYY-MM-DD) |
| `sort_by` | enum | No | created_at | Sort field: created_at, updated_at, total, status |
| `sort_order` | enum | No | desc | Sort order: asc, desc |

#### Order Status Values
- `pending` - Order placed but not paid
- `paid` - Payment confirmed
- `processing` - Order being prepared
- `shipped` - Order shipped to customer
- `delivered` - Order delivered
- `cancelled` - Order cancelled

#### Response

```json
{
  "orders": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "pending",
      "total": 100.00,
      "fees": 5.00,
      "net_amount": 95.00,
      "tracking_number": "TRK123456",
      "payment_method": "credit_card",
      "transaction_id": "txn_123",
      "payment_method_details": {
        "last4": "1234",
        "brand": "visa"
      },
      "admin_notes": "Customer requested expedited shipping",
      "shipping_details": {
        "carrier": "UPS",
        "service": "Ground"
      },
      "coupon_code": "SAVE10",
      "discount_amount": 10.00,
      "created_at": "2023-01-01T10:00:00Z",
      "updated_at": "2023-01-01T10:00:00Z",
      "user": {
        "id": "user123",
        "email": "customer@example.com",
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "address": {
        "id": "addr123",
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001",
        "country": "US"
      },
      "items": [
        {
          "id": "item123",
          "product_id": "prod123",
          "product_name": "Wireless Headphones",
          "quantity": 2,
          "price": 50.00,
          "total": 100.00,
          "product": {
            "id": "prod123",
            "name": "Wireless Headphones",
            "images": ["headphones.jpg"],
            "sku": "WH-001"
          }
        }
      ]
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "total_pages": 15
}
```

#### Example Requests

```bash
# Get first page of orders
GET /api/admin/orders?page=1&limit=10

# Search for orders by customer email
GET /api/admin/orders?search=customer@example.com

# Filter by status and date range
GET /api/admin/orders?status=pending&date_from=2023-01-01&date_to=2023-01-31

# Filter by amount range
GET /api/admin/orders?min_total=50&max_total=200

# Sort by total amount descending
GET /api/admin/orders?sort_by=total&sort_order=desc
```

### 2. Get Order Details

**GET** `/api/admin/orders/{id}`

Retrieve detailed information about a specific order.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

#### Response

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "shipped",
  "total": 100.00,
  "fees": 5.00,
  "net_amount": 95.00,
  "tracking_number": "TRK123456",
  "payment_method": "credit_card",
  "transaction_id": "txn_123",
  "payment_method_details": {
    "last4": "1234",
    "brand": "visa"
  },
  "admin_notes": "Customer requested expedited shipping",
  "shipping_details": {
    "carrier": "UPS",
    "service": "Ground"
  },
  "coupon_code": "SAVE10",
  "discount_amount": 10.00,
  "created_at": "2023-01-01T10:00:00Z",
  "updated_at": "2023-01-01T12:00:00Z",
  "user": {
    "id": "user123",
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1234567890"
  },
  "address": {
    "id": "addr123",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  },
  "items": [
    {
      "id": "item123",
      "product_id": "prod123",
      "product_name": "Wireless Headphones",
      "quantity": 2,
      "price": 50.00,
      "total": 100.00,
      "product": {
        "id": "prod123",
        "name": "Wireless Headphones",
        "images": ["headphones.jpg"],
        "sku": "WH-001"
      }
    }
  ],
  "tracking_info": {
    "location": "Distribution Center",
    "estimated_delivery": "2023-01-05T18:00:00Z",
    "updates": [
      {
        "timestamp": "2023-01-01T10:00:00Z",
        "status": "Order placed",
        "location": "Warehouse"
      },
      {
        "timestamp": "2023-01-01T14:00:00Z",
        "status": "Shipped",
        "location": "Distribution Center"
      }
    ]
  }
}
```

### 3. Update Order Status

**PATCH** `/api/admin/orders/{id}/status`

Update the status of an order with optional admin notes and tracking information.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

#### Request Body

```json
{
  "status": "shipped",
  "admin_notes": "Order shipped via UPS Ground",
  "tracking_number": "1Z999AA1234567890"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | Yes | New order status |
| `admin_notes` | string | No | Admin notes for status change |
| `tracking_number` | string | No | Tracking number (for shipped status) |

#### Status Transition Rules

Valid status transitions:
- `pending` → `paid`, `cancelled`
- `paid` → `processing`, `cancelled`
- `processing` → `shipped`, `cancelled`
- `shipped` → `delivered`
- `delivered` → (no transitions)
- `cancelled` → (no transitions)

#### Response

```json
{
  "message": "Order status updated successfully"
}
```

#### Example Requests

```bash
# Update to paid status
PATCH /api/admin/orders/123e4567-e89b-12d3-a456-426614174000/status
{
  "status": "paid",
  "admin_notes": "Payment confirmed via Stripe"
}

# Update to shipped with tracking
PATCH /api/admin/orders/123e4567-e89b-12d3-a456-426614174000/status
{
  "status": "shipped",
  "tracking_number": "1Z999AA1234567890",
  "admin_notes": "Shipped via UPS Ground"
}
```

### 4. Process Refund

**POST** `/api/admin/orders/{id}/refund`

Process a full or partial refund for an order through the payment gateway.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Order ID |

#### Request Body

```json
{
  "amount": 50.00,
  "reason": "Customer requested refund for defective item",
  "admin_notes": "Approved by customer service manager",
  "notify_customer": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Refund amount (must be ≤ order total) |
| `reason` | string | Yes | Reason for refund |
| `admin_notes` | string | No | Internal admin notes |
| `notify_customer` | boolean | No | Send email notification (default: true) |

#### Refund Eligibility

Orders are eligible for refund if their status is:
- `paid`
- `processing`
- `shipped`
- `delivered`

Orders with status `pending` or `cancelled` are not eligible for refund.

#### Response

```json
{
  "success": true,
  "refund_id": "ref_1234567890",
  "amount": 50.00,
  "message": "Refund processed successfully",
  "transaction_id": "txn_refund_123"
}
```

#### Example Requests

```bash
# Process partial refund
POST /api/admin/orders/123e4567-e89b-12d3-a456-426614174000/refund
{
  "amount": 25.00,
  "reason": "One item was defective",
  "admin_notes": "Customer provided photos of defective item"
}

# Process full refund
POST /api/admin/orders/123e4567-e89b-12d3-a456-426614174000/refund
{
  "amount": 100.00,
  "reason": "Order cancelled by customer",
  "notify_customer": true
}
```

### 5. Get Order Analytics

**GET** `/api/admin/orders/analytics/overview`

Retrieve comprehensive order analytics including totals, trends, status distribution, and growth metrics.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date_from` | string | Yes | - | Start date (YYYY-MM-DD) |
| `date_to` | string | Yes | - | End date (YYYY-MM-DD) |
| `interval` | enum | No | day | Grouping interval: day, week, month |
| `status` | enum | No | - | Filter by specific status |

#### Response

```json
{
  "total_orders": 1250,
  "total_revenue": 125000.00,
  "average_order_value": 100.00,
  "orders_by_status": {
    "pending": 50,
    "paid": 300,
    "processing": 200,
    "shipped": 400,
    "delivered": 250,
    "cancelled": 50
  },
  "revenue_by_status": {
    "pending": 5000.00,
    "paid": 30000.00,
    "processing": 20000.00,
    "shipped": 40000.00,
    "delivered": 25000.00,
    "cancelled": 5000.00
  },
  "orders_trend": [
    {
      "date": "2023-01-01",
      "orders": 45,
      "revenue": 4500.00
    },
    {
      "date": "2023-01-02",
      "orders": 52,
      "revenue": 5200.00
    }
  ],
  "top_payment_methods": [
    {
      "method": "credit_card",
      "count": 800,
      "revenue": 80000.00
    },
    {
      "method": "paypal",
      "count": 300,
      "revenue": 30000.00
    },
    {
      "method": "apple_pay",
      "count": 150,
      "revenue": 15000.00
    }
  ],
  "refund_statistics": {
    "total_refunds": 25,
    "total_refund_amount": 2500.00,
    "refund_rate": 2.0
  },
  "growth_metrics": {
    "order_growth": 15.5,
    "revenue_growth": 18.2
  }
}
```

#### Example Requests

```bash
# Get daily analytics for January 2023
GET /api/admin/orders/analytics/overview?date_from=2023-01-01&date_to=2023-01-31&interval=day

# Get weekly analytics for Q1 2023
GET /api/admin/orders/analytics/overview?date_from=2023-01-01&date_to=2023-03-31&interval=week

# Get analytics for delivered orders only
GET /api/admin/orders/analytics/overview?date_from=2023-01-01&date_to=2023-01-31&status=delivered
```

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status transition from 'pending' to 'delivered'",
    "details": []
  },
  "timestamp": "2023-01-01T10:00:00Z",
  "path": "/api/admin/orders/123/status"
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token",
    "details": []
  },
  "timestamp": "2023-01-01T10:00:00Z",
  "path": "/api/admin/orders"
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required",
    "details": []
  },
  "timestamp": "2023-01-01T10:00:00Z",
  "path": "/api/admin/orders"
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Order not found",
    "details": []
  },
  "timestamp": "2023-01-01T10:00:00Z",
  "path": "/api/admin/orders/123e4567-e89b-12d3-a456-426614174000"
}
```

## Caching

The order management system implements intelligent caching:

- **Order Lists**: Cached for 5 minutes with automatic invalidation on updates
- **Order Details**: Cached for 5 minutes with automatic invalidation on updates
- **Order Analytics**: Cached for 10 minutes with automatic invalidation on new orders

Cache keys include all query parameters to ensure accurate cache hits and misses.

## Rate Limiting

Admin endpoints are subject to rate limiting:
- 1000 requests per hour per admin user
- 100 requests per minute per admin user

## Audit Logging

All admin actions are automatically logged including:
- Order status updates
- Refund processing
- Analytics access
- User information (admin who performed the action)
- Timestamp and IP address
- Request parameters and response status

## Performance Considerations

- Use pagination for large order lists
- Analytics queries are optimized with database indexes
- Complex analytics are cached to improve response times
- Background processing is used for large data exports
- Database queries are optimized for common filter combinations

## Security

- All endpoints require admin authentication
- Input validation prevents SQL injection and XSS
- Sensitive payment information is properly masked
- Audit trails maintain data integrity
- Rate limiting prevents abuse