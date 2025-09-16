# Admin Product Management API

This document describes the admin product management endpoints that provide comprehensive product management capabilities with caching optimization.

## Overview

The Product Management API allows administrators to:
- View and filter products with advanced search capabilities
- Create, update, and delete products
- Manage product inventory
- Perform bulk operations on multiple products
- Export product data
- View product analytics and metrics

## Authentication

All endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- Admin role permissions

## Endpoints

### 1. Get Products (GET /api/admin/products)

Retrieve paginated list of products with comprehensive filtering options.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by name, SKU, or description
- `category_id` (optional): Filter by category UUID
- `status` (optional): Filter by status (active, inactive, draft)
- `featured` (optional): Filter by featured status (true/false)
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter
- `min_stock` (optional): Minimum stock filter
- `max_stock` (optional): Maximum stock filter
- `date_from` (optional): Filter products created from date (ISO string)
- `date_to` (optional): Filter products created to date (ISO string)
- `sort_by` (optional): Sort field (name, price, stock, created_at, sales_count, rating)
- `sort_order` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product Description",
      "price": 99.99,
      "stock": 10,
      "images": ["image1.jpg"],
      "rating": 4.5,
      "sku": "PROD-001",
      "weight": 1.5,
      "dimensions": {
        "length": 10,
        "width": 5,
        "height": 3
      },
      "status": "active",
      "featured": false,
      "tags": ["tag1", "tag2"],
      "meta_title": "SEO Title",
      "meta_description": "SEO Description",
      "minimum_stock": 5,
      "sales_count": 0,
      "category_id": "uuid",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "low_stock": false,
      "category_name": "Category Name",
      "total_reviews": 0
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

**Caching:** 15 minutes TTL

### 2. Get Product Details (GET /api/admin/products/:id)

Retrieve detailed information about a specific product.

**Parameters:**
- `id`: Product UUID

**Response:** Single product object (same structure as above)

**Caching:** 30 minutes TTL

### 3. Get Product Analytics (GET /api/admin/products/analytics)

Retrieve comprehensive product analytics and metrics.

**Query Parameters:**
- `date_from` (optional): Filter from date (ISO string)
- `date_to` (optional): Filter to date (ISO string)

**Response:**
```json
{
  "total_products": 100,
  "active_products": 80,
  "inactive_products": 15,
  "draft_products": 5,
  "featured_products": 20,
  "low_stock_products": 10,
  "out_of_stock_products": 5,
  "total_inventory_value": 50000,
  "average_price": 150,
  "top_selling_products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sales_count": 100,
      "revenue": 9999.00
    }
  ],
  "category_distribution": [
    {
      "category_id": "uuid",
      "category_name": "Category Name",
      "product_count": 25,
      "percentage": 25.0
    }
  ],
  "stock_distribution": {
    "in_stock": 95,
    "low_stock": 10,
    "out_of_stock": 5
  },
  "price_distribution": {
    "under_100": 30,
    "between_100_500": 50,
    "between_500_1000": 15,
    "over_1000": 5
  }
}
```

**Caching:** 10 minutes TTL

### 4. Create Product (POST /api/admin/products)

Create a new product with comprehensive details.

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "stock": 10,
  "images": ["image1.jpg"],
  "category_id": "uuid",
  "sku": "PROD-001",
  "weight": 1.5,
  "dimensions": {
    "length": 10,
    "width": 5,
    "height": 3
  },
  "status": "active",
  "featured": false,
  "tags": ["tag1", "tag2"],
  "meta_title": "SEO Title",
  "meta_description": "SEO Description",
  "minimum_stock": 5
}
```

**Response:** Created product object

**Cache Invalidation:** Clears product list and analytics caches

### 5. Update Product (PUT /api/admin/products/:id)

Update an existing product with new information.

**Parameters:**
- `id`: Product UUID

**Request Body:** Same as create (all fields optional)

**Response:** Updated product object

**Cache Invalidation:** Clears related caches

### 6. Delete Product (DELETE /api/admin/products/:id)

Soft delete a product by setting its status to inactive.

**Parameters:**
- `id`: Product UUID

**Response:** 204 No Content

**Cache Invalidation:** Clears related caches

### 7. Update Inventory (PATCH /api/admin/products/:id/inventory)

Update stock quantity and minimum stock threshold for a product.

**Parameters:**
- `id`: Product UUID

**Request Body:**
```json
{
  "stock": 50,
  "minimum_stock": 15,
  "reason": "Restocking"
}
```

**Response:**
```json
{
  "message": "Inventory updated successfully"
}
```

**Cache Invalidation:** Clears related caches

### 8. Bulk Actions (POST /api/admin/products/bulk-action)

Perform bulk operations on multiple products.

**Request Body:**
```json
{
  "product_ids": ["uuid1", "uuid2"],
  "action": "activate",
  "data": {}
}
```

**Available Actions:**
- `activate`: Set status to active
- `deactivate`: Set status to inactive
- `delete`: Soft delete (set status to inactive)
- `feature`: Set featured to true
- `unfeature`: Set featured to false

**Response:**
```json
{
  "message": "Bulk action completed successfully"
}
```

**Cache Invalidation:** Clears related caches

### 9. Export Products (POST /api/admin/products/export)

Export products data in CSV or XLSX format with filtering options.

**Request Body:**
```json
{
  "format": "csv",
  "status": "active",
  "category_id": "uuid",
  "featured": true,
  "date_from": "2023-01-01",
  "date_to": "2023-12-31",
  "fields": ["name", "sku", "price", "stock"]
}
```

**Response:**
```json
{
  "export_id": "export_123",
  "status": "processing",
  "total_records": 100,
  "created_at": "2023-01-01T00:00:00Z",
  "expires_at": "2023-01-02T00:00:00Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  },
  "timestamp": "2023-01-01T00:00:00Z",
  "path": "/api/admin/products"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Product not found
- `CONFLICT`: SKU already exists
- `CACHE_ERROR`: Cache operation failed
- `ADMIN_ERROR`: General admin operation error

## Caching Strategy

The API implements intelligent caching with the following TTL values:
- Product lists: 15 minutes
- Product details: 30 minutes
- Product analytics: 10 minutes

Cache keys include query parameters to ensure accurate cache hits. Cache invalidation occurs automatically when products are modified.

## Performance Considerations

- All list endpoints support pagination to handle large datasets
- Complex analytics queries are cached to improve response times
- Database queries are optimized with proper indexing
- Bulk operations are performed efficiently using batch updates

## Rate Limiting

Admin endpoints have higher rate limits than public endpoints but are still subject to reasonable usage limits to prevent abuse.