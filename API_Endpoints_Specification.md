# Marketplace Admin API Endpoints Specification

## Overview

This document specifies all the API endpoints required for the Marketplace Admin Frontend application. The endpoints are organized by feature modules and follow RESTful conventions with proper authentication and authorization.

## Base Configuration

- **Base URL**: `/api`
- **Authentication**: JWT Bearer tokens
- **Content Type**: `application/json`
- **Response Format**: JSON

## Authentication & Authorization

All admin endpoints require authentication with JWT tokens and appropriate role-based permissions.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 1. Dashboard & Analytics

### 1.1 Dashboard Metrics
```http
GET /api/admin/dashboard/metrics
```
**Description**: Get overall dashboard statistics and KPIs
**Auth**: Admin required
**Query Parameters**:
- `date_from` (optional): Start date (YYYY-MM-DD)
- `date_to` (optional): End date (YYYY-MM-DD)

**Response**:
```json
{
  "total_users": 1234,
  "total_products": 567,
  "total_orders": 890,
  "total_revenue": 45678.90,
  "user_growth": 12.5,
  "order_growth": 8.3,
  "revenue_growth": 15.2,
  "active_users": 456,
  "pending_orders": 23,
  "low_stock_products": 12
}
```

### 1.2 Sales Analytics
```http
GET /api/admin/dashboard/sales-analytics
```
**Description**: Get sales trends and analytics data
**Auth**: Admin required
**Query Parameters**:
- `date_from` (required): Start date
- `date_to` (required): End date
- `interval` (optional): day, week, month (default: day)

**Response**:
```json
{
  "sales_trend": [
    {
      "date": "2024-01-01",
      "revenue": 1234.56,
      "orders": 45,
      "average_order_value": 27.43
    }
  ],
  "total_revenue": 45678.90,
  "total_orders": 890,
  "growth_rate": 12.5
}
```

---

## 2. User Management

### 2.1 Get Users List
```http
GET /api/admin/users
```
**Description**: Get paginated list of users with filtering
**Auth**: Admin required
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or email
- `role` (optional): Filter by role (user, admin)
- `status` (optional): Filter by status (active, blocked)
- `date_from` (optional): Registration date filter
- `date_to` (optional): Registration date filter
- `sort_by` (optional): name, email, created_at (default: created_at)
- `sort_order` (optional): asc, desc (default: desc)

**Response**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "user",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "order_count": 5,
      "total_spent": 234.56
    }
  ],
  "total": 1234,
  "page": 1,
  "limit": 10,
  "total_pages": 124
}
```

### 2.2 Get User Details
```http
GET /api/admin/users/{id}
```
**Description**: Get detailed user information
**Auth**: Admin required

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "user",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "addresses": [
    {
      "id": "uuid",
      "label": "Home",
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "zip": "12345",
      "is_default": true
    }
  ],
  "order_history": [
    {
      "id": "uuid",
      "status": "delivered",
      "total": 123.45,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "statistics": {
    "total_orders": 5,
    "total_spent": 234.56,
    "average_order_value": 46.91,
    "last_order_date": "2024-01-01T00:00:00Z"
  }
}
```

### 2.3 Update User Status
```http
PATCH /api/admin/users/{id}/status
```
**Description**: Block or unblock a user
**Auth**: Admin required

**Request Body**:
```json
{
  "status": "blocked" // or "active"
}
```

### 2.4 User Analytics
```http
GET /api/admin/users/analytics
```
**Description**: Get user registration and activity analytics
**Auth**: Admin required
**Query Parameters**:
- `date_from` (optional): Start date
- `date_to` (optional): End date

**Response**:
```json
{
  "total_users": 1234,
  "new_registrations": 45,
  "active_users": 890,
  "blocked_users": 12,
  "registration_trend": [
    {
      "date": "2024-01-01",
      "count": 12
    }
  ],
  "user_activity": {
    "daily_active": 234,
    "weekly_active": 567,
    "monthly_active": 890
  }
}
```

---

## 3. Product Management

### 3.1 Get Products List
```http
GET /api/admin/products
```
**Description**: Get paginated list of products with filtering
**Auth**: Admin required
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search by name or description
- `category_id` (optional): Filter by category
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter
- `stock_status` (optional): in_stock, low_stock, out_of_stock
- `status` (optional): active, inactive, draft
- `featured` (optional): true, false
- `sort_by` (optional): name, price, rating, created_at, stock, sales
- `sort_order` (optional): asc, desc

**Response**:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "stock": 50,
      "images": ["url1", "url2"],
      "rating": 4.5,
      "category_id": "uuid",
      "category": {
        "id": "uuid",
        "name": "Category Name"
      },
      "sku": "SKU123",
      "weight": 1.5,
      "dimensions": {
        "length": 10,
        "width": 5,
        "height": 3
      },
      "status": "active",
      "featured": true,
      "tags": ["tag1", "tag2"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 567,
  "page": 1,
  "limit": 10,
  "total_pages": 57
}
```

### 3.2 Get Product Details
```http
GET /api/admin/products/{id}
```
**Description**: Get detailed product information
**Auth**: Admin required

### 3.3 Create Product
```http
POST /api/admin/products
```
**Description**: Create a new product
**Auth**: Admin required

**Request Body**:
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "stock": 50,
  "images": ["url1", "url2"],
  "category_id": "uuid",
  "sku": "SKU123",
  "weight": 1.5,
  "dimensions": {
    "length": 10,
    "width": 5,
    "height": 3
  },
  "status": "active",
  "featured": true,
  "tags": ["tag1", "tag2"],
  "meta_title": "SEO Title",
  "meta_description": "SEO Description"
}
```

### 3.4 Update Product
```http
PUT /api/admin/products/{id}
```
**Description**: Update existing product
**Auth**: Admin required
**Request Body**: Same as create product

### 3.5 Delete Product
```http
DELETE /api/admin/products/{id}
```
**Description**: Delete a product (soft delete)
**Auth**: Admin required

### 3.6 Product Analytics
```http
GET /api/admin/products/analytics
```
**Description**: Get product performance analytics
**Auth**: Admin required
**Query Parameters**:
- `date_from` (optional): Start date
- `date_to` (optional): End date

**Response**:
```json
{
  "total_products": 567,
  "active_products": 500,
  "inactive_products": 50,
  "draft_products": 17,
  "low_stock_products": 23,
  "out_of_stock_products": 8,
  "featured_products": 45,
  "average_price": 75.50,
  "total_inventory_value": 125000.00,
  "top_selling_products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sales_count": 150,
      "revenue": 5000.00
    }
  ],
  "category_distribution": [
    {
      "category_id": "uuid",
      "category_name": "Electronics",
      "product_count": 120,
      "percentage": 25.5
    }
  ]
}
```

### 3.7 Update Inventory
```http
PATCH /api/admin/products/{id}/inventory
```
**Description**: Update product stock levels
**Auth**: Admin required

**Request Body**:
```json
{
  "stock": 100,
  "minimum_stock": 10,
  "reason": "Inventory adjustment"
}
```

### 3.8 Bulk Product Actions
```http
POST /api/admin/products/bulk-action
```
**Description**: Perform bulk actions on multiple products
**Auth**: Admin required

**Request Body**:
```json
{
  "product_ids": ["uuid1", "uuid2"],
  "action": "activate", // activate, deactivate, delete, feature, unfeature, update_category
  "data": {
    "category_id": "uuid",
    "status": "active",
    "featured": true
  }
}
```

### 3.9 Export Products
```http
POST /api/admin/products/export
```
**Description**: Export products data
**Auth**: Admin required

**Request Body**:
```json
{
  "filters": {
    "category_id": "uuid",
    "status": "active"
  },
  "format": "csv", // csv, xlsx
  "fields": ["name", "price", "stock", "category"]
}
```

**Response**:
```json
{
  "download_url": "https://example.com/exports/products.csv"
}
```

---

## 4. Category Management

### 4.1 Get Categories
```http
GET /api/admin/categories
```
**Description**: Get list of categories
**Auth**: Admin required
**Query Parameters**:
- `include_products` (optional): Include product count

**Response**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Electronics",
      "description": "Electronic devices",
      "image": "url",
      "parent_id": null,
      "slug": "electronics",
      "sort_order": 1,
      "status": "active",
      "product_count": 120,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 4.2 Get Category Tree
```http
GET /api/admin/categories/tree
```
**Description**: Get hierarchical category tree
**Auth**: Admin required

**Response**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "product_count": 120,
      "status": "active",
      "level": 0,
      "children": [
        {
          "id": "uuid",
          "name": "Smartphones",
          "slug": "smartphones",
          "product_count": 45,
          "status": "active",
          "level": 1,
          "children": []
        }
      ]
    }
  ]
}
```

### 4.3 Create Category
```http
POST /api/admin/categories
```
**Description**: Create a new category
**Auth**: Admin required

**Request Body**:
```json
{
  "name": "Category Name",
  "description": "Category description",
  "parent_id": "uuid",
  "image": "url",
  "sort_order": 1,
  "status": "active"
}
```

### 4.4 Update Category
```http
PUT /api/admin/categories/{id}
```
**Description**: Update existing category
**Auth**: Admin required

### 4.5 Delete Category
```http
DELETE /api/admin/categories/{id}
```
**Description**: Delete a category
**Auth**: Admin required

### 4.6 Category Analytics
```http
GET /api/admin/categories/analytics
```
**Description**: Get category performance analytics
**Auth**: Admin required

---

## 5. Order Management

### 5.1 Get Orders List
```http
GET /api/admin/orders
```
**Description**: Get paginated list of orders with filtering
**Auth**: Admin required
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search by order ID or customer
- `status` (optional): Filter by status
- `date_from` (optional): Order date filter
- `date_to` (optional): Order date filter
- `min_total` (optional): Minimum order total
- `max_total` (optional): Maximum order total
- `payment_method` (optional): Filter by payment method
- `user_id` (optional): Filter by customer
- `sort_by` (optional): created_at, total, status, updated_at
- `sort_order` (optional): asc, desc

**Response**:
```json
{
  "orders": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "address_id": "uuid",
      "address": {
        "street": "123 Main St",
        "city": "City",
        "state": "State",
        "zip": "12345"
      },
      "status": "delivered",
      "total": 123.45,
      "tracking_number": "TRK123456",
      "payment_method": "credit_card",
      "transaction_id": "txn_123",
      "coupon_code": "SAVE10",
      "discount_amount": 12.34,
      "items": [
        {
          "id": "uuid",
          "product_id": "uuid",
          "product_name": "Product Name",
          "quantity": 2,
          "price": 55.55
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 890,
  "page": 1,
  "limit": 10,
  "total_pages": 89
}
```

### 5.2 Get Order Details
```http
GET /api/admin/orders/{id}
```
**Description**: Get detailed order information
**Auth**: Admin required

### 5.3 Update Order Status
```http
PATCH /api/admin/orders/{id}/status
```
**Description**: Update order status
**Auth**: Admin required

**Request Body**:
```json
{
  "status": "shipped",
  "tracking_number": "TRK123456",
  "notes": "Order shipped via FedEx"
}
```

### 5.4 Process Refund
```http
POST /api/admin/orders/{id}/refund
```
**Description**: Process order refund
**Auth**: Admin required

**Request Body**:
```json
{
  "amount": 123.45,
  "reason": "Customer request",
  "refund_shipping": true
}
```

### 5.5 Order Analytics
```http
GET /api/admin/orders/analytics
```
**Description**: Get order analytics and metrics
**Auth**: Admin required
**Query Parameters**:
- `date_from` (required): Start date
- `date_to` (required): End date

**Response**:
```json
{
  "total_orders": 890,
  "total_revenue": 45678.90,
  "average_order_value": 51.32,
  "order_growth_rate": 12.5,
  "fulfillment_rate": 95.2,
  "pending_orders": 23,
  "processing_orders": 45,
  "shipped_orders": 67,
  "delivered_orders": 700,
  "cancelled_orders": 34,
  "refunded_orders": 21,
  "order_trends": [
    {
      "date": "2024-01-01",
      "orders": 45,
      "revenue": 2345.67
    }
  ],
  "status_distribution": [
    {
      "status": "delivered",
      "count": 700,
      "percentage": 78.7
    }
  ],
  "top_products": [
    {
      "product_id": "uuid",
      "product_name": "Product Name",
      "quantity_sold": 150,
      "revenue": 5000.00
    }
  ]
}
```

### 5.6 Export Orders
```http
POST /api/admin/orders/export
```
**Description**: Export orders data
**Auth**: Admin required

**Request Body**:
```json
{
  "filters": {
    "date_from": "2024-01-01",
    "date_to": "2024-01-31",
    "status": "delivered"
  },
  "format": "csv",
  "fields": ["id", "user.name", "user.email", "status", "total", "created_at", "items"]
}
```

---

## 6. Payment & Transaction Management

### 6.1 Get Transactions
```http
GET /api/admin/transactions
```
**Description**: Get list of payment transactions
**Auth**: Admin required
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by transaction status
- `payment_method` (optional): Filter by payment method
- `date_from` (optional): Transaction date filter
- `date_to` (optional): Transaction date filter
- `min_amount` (optional): Minimum amount filter
- `max_amount` (optional): Maximum amount filter

**Response**:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "user_id": "uuid",
      "amount": 123.45,
      "currency": "USD",
      "status": "completed",
      "payment_method": "credit_card",
      "payment_method_details": {
        "brand": "visa",
        "last4": "4242"
      },
      "transaction_id": "txn_123",
      "gateway": "stripe",
      "gateway_transaction_id": "pi_123",
      "fees": 3.50,
      "net_amount": 119.95,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1234,
  "page": 1,
  "limit": 10,
  "total_pages": 124
}
```

### 6.2 Get Transaction Details
```http
GET /api/admin/transactions/{id}
```
**Description**: Get detailed transaction information
**Auth**: Admin required

### 6.3 Process Refund
```http
POST /api/admin/transactions/{id}/refund
```
**Description**: Process transaction refund
**Auth**: Admin required

**Request Body**:
```json
{
  "amount": 123.45,
  "reason": "Customer request"
}
```

### 6.4 Payment Analytics
```http
GET /api/admin/payments/analytics
```
**Description**: Get payment and revenue analytics
**Auth**: Admin required
**Query Parameters**:
- `date_from` (optional): Start date
- `date_to` (optional): End date

**Response**:
```json
{
  "total_revenue": 45678.90,
  "total_transactions": 1234,
  "successful_transactions": 1200,
  "failed_transactions": 34,
  "success_rate": 97.2,
  "average_transaction_value": 37.01,
  "revenue_trend": [
    {
      "date": "2024-01-01",
      "revenue": 2345.67,
      "transactions": 45
    }
  ],
  "payment_method_distribution": [
    {
      "method": "credit_card",
      "count": 800,
      "percentage": 66.7,
      "revenue": 30000.00
    }
  ],
  "failed_payments": [
    {
      "id": "uuid",
      "amount": 123.45,
      "reason": "insufficient_funds",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 7. System Configuration

### 7.1 Get System Settings
```http
GET /api/admin/settings
```
**Description**: Get system configuration settings
**Auth**: Admin required

**Response**:
```json
{
  "site_name": "Marketplace",
  "site_description": "E-commerce marketplace",
  "currency": "USD",
  "tax_rate": 8.5,
  "shipping_cost": 9.99,
  "free_shipping_threshold": 50.00,
  "low_stock_threshold": 10,
  "email_notifications": true,
  "sms_notifications": false,
  "maintenance_mode": false
}
```

### 7.2 Update System Settings
```http
PUT /api/admin/settings
```
**Description**: Update system configuration
**Auth**: Admin required

**Request Body**: Same as get settings response

### 7.3 Get Coupon Codes
```http
GET /api/admin/coupons
```
**Description**: Get list of coupon codes
**Auth**: Admin required

**Response**:
```json
{
  "coupons": [
    {
      "id": "uuid",
      "code": "SAVE10",
      "type": "percentage",
      "value": 10.0,
      "minimum_amount": 50.00,
      "maximum_discount": 20.00,
      "usage_limit": 100,
      "used_count": 45,
      "expires_at": "2024-12-31T23:59:59Z",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 7.4 Create Coupon Code
```http
POST /api/admin/coupons
```
**Description**: Create new coupon code
**Auth**: Admin required

**Request Body**:
```json
{
  "code": "SAVE10",
  "type": "percentage",
  "value": 10.0,
  "minimum_amount": 50.00,
  "maximum_discount": 20.00,
  "usage_limit": 100,
  "expires_at": "2024-12-31T23:59:59Z",
  "is_active": true
}
```

---

## 8. Reports & Analytics

### 8.1 Generate Report
```http
POST /api/admin/reports/generate
```
**Description**: Generate custom reports
**Auth**: Admin required

**Request Body**:
```json
{
  "report_type": "sales", // sales, users, products, orders
  "date_from": "2024-01-01",
  "date_to": "2024-01-31",
  "format": "csv", // csv, pdf, xlsx
  "filters": {
    "category_id": "uuid",
    "status": "active"
  },
  "fields": ["name", "revenue", "orders"]
}
```

**Response**:
```json
{
  "report_id": "uuid",
  "download_url": "https://example.com/reports/sales-report.csv",
  "status": "completed",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 8.2 Get Report Status
```http
GET /api/admin/reports/{id}/status
```
**Description**: Check report generation status
**Auth**: Admin required

---

## 9. Notifications & Alerts

### 9.1 Get Notifications
```http
GET /api/admin/notifications
```
**Description**: Get admin notifications
**Auth**: Admin required
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Filter by notification type
- `read` (optional): Filter by read status

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "low_stock",
      "title": "Low Stock Alert",
      "message": "Product XYZ is running low on stock",
      "data": {
        "product_id": "uuid",
        "current_stock": 5
      },
      "read": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 45,
  "unread_count": 12
}
```

### 9.2 Mark Notification as Read
```http
PATCH /api/admin/notifications/{id}/read
```
**Description**: Mark notification as read
**Auth**: Admin required

### 9.3 Get System Alerts
```http
GET /api/admin/alerts
```
**Description**: Get system alerts and warnings
**Auth**: Admin required

**Response**:
```json
{
  "alerts": [
    {
      "type": "low_stock",
      "severity": "warning",
      "message": "5 products are running low on stock",
      "count": 5,
      "action_url": "/products?stock_status=low_stock"
    },
    {
      "type": "failed_payments",
      "severity": "error",
      "message": "12 payments failed in the last 24 hours",
      "count": 12,
      "action_url": "/transactions?status=failed"
    }
  ]
}
```

---

## 10. File Upload & Management

### 10.1 Upload Image
```http
POST /api/admin/upload/image
```
**Description**: Upload product or category images
**Auth**: Admin required
**Content-Type**: `multipart/form-data`

**Request Body**:
```
file: <image_file>
type: product | category | general
```

**Response**:
```json
{
  "url": "https://example.com/images/product-123.jpg",
  "filename": "product-123.jpg",
  "size": 1024000,
  "mime_type": "image/jpeg"
}
```

### 10.2 Delete Image
```http
DELETE /api/admin/upload/image
```
**Description**: Delete uploaded image
**Auth**: Admin required

**Request Body**:
```json
{
  "url": "https://example.com/images/product-123.jpg"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/admin/users"
}
```

### Common Error Codes
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `INTERNAL_ERROR`: Server error

---

## Rate Limiting

All admin endpoints are subject to rate limiting:
- **Rate Limit**: 1000 requests per hour per user
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## WebSocket Events (Real-time Updates)

### Connection
```
ws://localhost:3000/admin/ws
```

### Events
- `order.created`: New order notification
- `order.status_changed`: Order status update
- `product.low_stock`: Low stock alert
- `user.registered`: New user registration
- `payment.failed`: Payment failure notification

### Event Format
```json
{
  "event": "order.created",
  "data": {
    "order_id": "uuid",
    "customer_name": "John Doe",
    "total": 123.45
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

This specification covers all the API endpoints required for the Marketplace Admin Frontend based on the implemented features and requirements. Each endpoint includes proper authentication, request/response formats, and error handling.