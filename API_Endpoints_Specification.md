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
  "tags": ["tag1", "tag2"]
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
      "user_id": "uuid",
      "address_id": "uuid",
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
          "price": 55.55,
          "total": 111.10
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



---

## 6. File Upload & Management

### 6.1 Upload Image
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

### 6.2 Get Files List
```http
GET /api/admin/upload/files
```
**Description**: Get paginated list of uploaded files
**Auth**: Admin required
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by file type
- `search` (optional): Search by filename
- `uploaded_by` (optional): Filter by uploader ID

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "filename": "product-123.jpg",
      "original_name": "original-image.jpg",
      "url": "https://example.com/images/product-123.jpg",
      "mime_type": "image/jpeg",
      "size": 1024000,
      "type": "product",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "total_pages": 5
}
```

### 6.3 Get File Details
```http
GET /api/admin/upload/files/{id}
```
**Description**: Get detailed file information
**Auth**: Admin required

**Response**:
```json
{
  "id": "uuid",
  "filename": "product-123.jpg",
  "original_name": "original-image.jpg",
  "url": "https://example.com/images/product-123.jpg",
  "mime_type": "image/jpeg",
  "size": 1024000,
  "type": "product",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 6.4 Delete Image
```http
DELETE /api/admin/upload/image/{id}
```
**Description**: Delete uploaded image
**Auth**: Admin required

**Response**:
```json
{
  "message": "File deleted successfully"
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



This specification covers all the API endpoints required for the Marketplace Admin Frontend based on the implemented features and requirements. Each endpoint includes proper authentication, request/response formats, and error handling.