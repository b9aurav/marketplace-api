# File Upload Management API

This document describes the file upload and management endpoints for the admin API.

## Overview

The file upload system provides secure image upload, processing, and management capabilities for administrators. It includes file validation, image optimization, metadata tracking, and audit trails.

## Features

- **Image Upload**: Secure upload with validation and optimization
- **File Management**: List, view, and delete uploaded files
- **Image Processing**: Automatic resizing and optimization
- **Audit Trails**: Complete tracking of file operations
- **Caching**: Performance optimization with Redis caching
- **Security**: File type validation and size limits

## Endpoints

### 1. Upload Image

Upload and process an image file with validation and optimization.

**Endpoint:** `POST /api/admin/upload/image`

**Authentication:** Required (Admin role)

**Content-Type:** `multipart/form-data`

**Request Body:**
```typescript
{
  file: File,           // Image file (required)
  type?: string,        // File type: 'product' | 'category' | 'general' (default: 'general')
  metadata?: string     // Additional metadata (optional)
}
```

**File Validation:**
- **Allowed MIME types:** image/jpeg, image/jpg, image/png, image/gif, image/webp, image/svg+xml
- **Maximum file size:** 10MB
- **Image processing:** Automatic resizing (max 2048px) and optimization

**Response:**
```typescript
{
  id: string,           // Unique file identifier
  filename: string,     // Generated filename
  original_name: string, // Original filename
  url: string,          // Public URL
  mime_type: string,    // MIME type
  size: number,         // File size in bytes
  type: string,         // File type
  created_at: string    // Upload timestamp
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/admin/upload/image" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "type=product"
```

**Example Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "1703000000000-abc123def456.jpg",
  "original_name": "product-image.jpg",
  "url": "http://localhost:3000/uploads/1703000000000-abc123def456.jpg",
  "mime_type": "image/jpeg",
  "size": 856432,
  "type": "product",
  "created_at": "2023-12-20T10:30:00.000Z"
}
```

### 2. Delete Image

Delete an uploaded image file and its metadata.

**Endpoint:** `DELETE /api/admin/upload/image/{id}`

**Authentication:** Required (Admin role)

**Path Parameters:**
- `id` (string, UUID): ID of the file to delete

**Response:** `204 No Content`

**Example Request:**
```bash
curl -X DELETE "http://localhost:3000/api/admin/upload/image/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Files List

Retrieve a paginated list of uploaded files with filtering options.

**Endpoint:** `GET /api/admin/upload/files`

**Authentication:** Required (Admin role)

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `type` (string, optional): Filter by file type ('product' | 'category' | 'general')
- `search` (string, optional): Search by filename or original name
- `uploaded_by` (string, UUID, optional): Filter by uploader ID

**Response:**
```typescript
{
  data: FileUploadResponse[],  // Array of file records
  total: number,               // Total number of files
  page: number,                // Current page
  limit: number,               // Items per page
  total_pages: number          // Total pages
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/upload/files?page=1&limit=10&type=product&search=logo" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "filename": "1703000000000-abc123def456.jpg",
      "original_name": "product-logo.jpg",
      "url": "http://localhost:3000/uploads/1703000000000-abc123def456.jpg",
      "mime_type": "image/jpeg",
      "size": 856432,
      "type": "product",
      "created_at": "2023-12-20T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1
}
```

### 4. Get File Details

Retrieve detailed information about a specific uploaded file.

**Endpoint:** `GET /api/admin/upload/files/{id}`

**Authentication:** Required (Admin role)

**Path Parameters:**
- `id` (string, UUID): ID of the file

**Response:**
```typescript
{
  id: string,           // Unique file identifier
  filename: string,     // Generated filename
  original_name: string, // Original filename
  url: string,          // Public URL
  mime_type: string,    // MIME type
  size: number,         // File size in bytes
  type: string,         // File type
  created_at: string    // Upload timestamp
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/upload/files/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "1703000000000-abc123def456.jpg",
  "original_name": "product-image.jpg",
  "url": "http://localhost:3000/uploads/1703000000000-abc123def456.jpg",
  "mime_type": "image/jpeg",
  "size": 856432,
  "type": "product",
  "created_at": "2023-12-20T10:30:00.000Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File size exceeds maximum allowed size of 10MB",
    "details": []
  },
  "timestamp": "2023-12-20T10:30:00.000Z",
  "path": "/api/admin/upload/image"
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized access",
    "details": []
  },
  "timestamp": "2023-12-20T10:30:00.000Z",
  "path": "/api/admin/upload/image"
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "File with ID 123e4567-e89b-12d3-a456-426614174000 not found",
    "details": []
  },
  "timestamp": "2023-12-20T10:30:00.000Z",
  "path": "/api/admin/upload/image/123e4567-e89b-12d3-a456-426614174000"
}
```

### 413 Payload Too Large
```json
{
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "File size exceeds maximum allowed size",
    "details": []
  },
  "timestamp": "2023-12-20T10:30:00.000Z",
  "path": "/api/admin/upload/image"
}
```

## File Processing

### Image Optimization
- **Automatic resizing**: Images larger than 2048px on the longest side are resized
- **Format optimization**: JPEG quality set to 85%, PNG compression level 8
- **Progressive JPEG**: Enabled for better loading experience
- **WebP support**: Native WebP optimization
- **SVG preservation**: SVG files are not processed to maintain vector quality

### File Storage
- **Unique filenames**: Generated using timestamp and random bytes
- **Directory structure**: Files stored in configurable upload directory
- **Public URLs**: Generated for direct access to uploaded files
- **Metadata tracking**: Complete file information stored in database

### Security Features
- **MIME type validation**: Only allowed image types accepted
- **File size limits**: Maximum 10MB per file
- **Content validation**: File content verified to match MIME type
- **Secure filenames**: Generated filenames prevent directory traversal
- **Audit logging**: All file operations logged for security

## Caching Strategy

### Cache Keys
- **File lists**: `admin:files:list:{query_hash}`
- **File details**: `admin:files:details:{file_id}`

### Cache TTL
- **File lists**: 10 minutes
- **File details**: 30 minutes

### Cache Invalidation
- **On upload**: All file list caches invalidated
- **On delete**: All file list caches invalidated
- **Pattern-based**: Uses `admin:files:*` pattern for bulk invalidation

## Usage Examples

### Upload Product Image
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('type', 'product');

const response = await fetch('/api/admin/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded file:', result);
```

### Get Files with Filters
```javascript
const params = new URLSearchParams({
  page: '1',
  limit: '20',
  type: 'product',
  search: 'logo'
});

const response = await fetch(`/api/admin/upload/files?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const files = await response.json();
console.log('Files:', files);
```

### Delete File
```javascript
const response = await fetch(`/api/admin/upload/image/${fileId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  console.log('File deleted successfully');
}
```

## Environment Configuration

### Required Environment Variables
```bash
# Upload directory (default: ./uploads)
UPLOAD_PATH=./uploads

# Base URL for file access (default: http://localhost:3000)
BASE_URL=http://localhost:3000

# Maximum file size in bytes (default: 10MB)
MAX_FILE_SIZE=10485760
```

### File System Requirements
- **Write permissions**: Upload directory must be writable
- **Disk space**: Adequate space for file storage
- **Backup strategy**: Regular backup of upload directory recommended

## Performance Considerations

### Image Processing
- **Sharp library**: High-performance image processing
- **Memory usage**: Large images processed in streams when possible
- **CPU usage**: Image processing is CPU-intensive, consider scaling

### Storage
- **Local storage**: Files stored on local filesystem
- **CDN integration**: Consider CDN for production deployments
- **Cleanup**: Implement cleanup for orphaned files

### Monitoring
- **File upload metrics**: Track upload success/failure rates
- **Storage usage**: Monitor disk space usage
- **Performance metrics**: Track image processing times