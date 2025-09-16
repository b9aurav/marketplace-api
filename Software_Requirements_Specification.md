# Software Requirements Specification (SRS)
## Marketplace API Platform

### Document Information
- **Project Name**: Marketplace API Platform
- **Version**: 1.0.0
- **Date**: December 2024
- **Document Type**: Software Requirements Specification

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [System Requirements](#5-system-requirements)
6. [Database Schema](#6-database-schema)
7. [Security Requirements](#7-security-requirements)
8. [Performance Requirements](#8-performance-requirements)
9. [Quality Attributes](#9-quality-attributes)
10. [Constraints](#10-constraints)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for a comprehensive e-commerce marketplace API platform built with NestJS, TypeScript, and PostgreSQL. The system provides a complete backend solution for online marketplace operations including user management, product catalog, shopping cart, order processing, payments, and administrative functions.

### 1.2 Scope
The Marketplace API Platform is a RESTful web service that enables:
- User registration, authentication, and profile management
- Product catalog management with categories and reviews
- Shopping cart functionality with coupon support
- Order processing and tracking
- Payment processing with multiple methods
- Administrative dashboard and analytics
- Personalized product recommendations
- Webhook integrations for external services

### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **JWT**: JSON Web Token
- **CRUD**: Create, Read, Update, Delete
- **SRS**: Software Requirements Specification
- **UUID**: Universally Unique Identifier
- **E2E**: End-to-End testing

### 1.4 References
- NestJS Framework Documentation
- TypeORM Documentation
- Stripe API Documentation
- Supabase Documentation

---

## 2. Overall Description

### 2.1 Product Perspective
The Marketplace API Platform is a standalone backend system designed to support e-commerce marketplace applications. It integrates with:
- **Supabase**: For authentication and user management
- **Stripe**: For payment processing
- **PostgreSQL**: For data persistence
- **External SMS Services**: For notifications
- **File Storage Services**: For product images

### 2.2 Product Functions
The system provides the following major functions:
- User authentication and authorization
- Product catalog management
- Shopping cart operations
- Order processing and fulfillment
- Payment processing
- Administrative operations
- Analytics and reporting
- Recommendation engine
- Webhook handling

### 2.3 User Classes and Characteristics
1. **End Users (Customers)**
   - Browse and search products
   - Manage shopping cart
   - Place and track orders
   - Manage profile and addresses
   - Leave product reviews

2. **Administrators**
   - Manage product catalog
   - Process orders
   - View analytics and reports
   - Manage users
   - Configure system settings

3. **External Systems**
   - Payment processors (Stripe)
   - SMS services
   - File storage services

### 2.4 Operating Environment
- **Server**: Node.js runtime environment
- **Database**: PostgreSQL 12+
- **Framework**: NestJS with TypeScript
- **Authentication**: Supabase Auth
- **Payment Processing**: Stripe
- **Documentation**: Swagger/OpenAPI

---

## 3. System Features

### 3.1 Authentication and Authorization

#### 3.1.1 User Registration
**Description**: Allow new users to create accounts
**Priority**: High
**Functional Requirements**:
- FR-AUTH-001: System shall accept user registration with email, password, name, and optional phone
- FR-AUTH-002: System shall validate email format and password strength (minimum 6 characters)
- FR-AUTH-003: System shall prevent duplicate email registrations
- FR-AUTH-004: System shall assign default USER role to new registrations
- FR-AUTH-005: System shall integrate with Supabase for user creation

#### 3.1.2 User Login
**Description**: Authenticate existing users
**Priority**: High
**Functional Requirements**:
- FR-AUTH-006: System shall authenticate users with email and password
- FR-AUTH-007: System shall return JWT access token upon successful authentication
- FR-AUTH-008: System shall return user profile information with token
- FR-AUTH-009: System shall handle invalid credentials gracefully

#### 3.1.3 Password Management
**Description**: Handle password reset functionality
**Priority**: Medium
**Functional Requirements**:
- FR-AUTH-010: System shall provide forgot password functionality
- FR-AUTH-011: System shall send password reset links via email
- FR-AUTH-012: System shall validate reset tokens and allow password updates
- FR-AUTH-013: System shall expire reset tokens after reasonable time period

#### 3.1.4 Profile Management
**Description**: Allow users to view and manage their profiles
**Priority**: Medium
**Functional Requirements**:
- FR-AUTH-014: System shall provide authenticated endpoint to retrieve user profile
- FR-AUTH-015: System shall protect profile endpoints with JWT authentication
- FR-AUTH-016: System shall return user information without sensitive data

### 3.2 Product Management

#### 3.2.1 Product Catalog
**Description**: Manage product information and catalog
**Priority**: High
**Functional Requirements**:
- FR-PROD-001: System shall store product information (name, description, price, stock, images)
- FR-PROD-002: System shall support product categorization
- FR-PROD-003: System shall provide product search and filtering capabilities
- FR-PROD-004: System shall support pagination for product listings
- FR-PROD-005: System shall calculate and display product ratings from reviews

#### 3.2.2 Product Search and Filtering
**Description**: Enable product discovery
**Priority**: High
**Functional Requirements**:
- FR-PROD-006: System shall filter products by category
- FR-PROD-007: System shall filter products by price range (min_price, max_price)
- FR-PROD-008: System shall sort products by price, rating, or date
- FR-PROD-009: System shall provide trending products endpoint
- FR-PROD-010: System shall return detailed product information including reviews

#### 3.2.3 Product Reviews
**Description**: Allow customers to review products
**Priority**: Medium
**Functional Requirements**:
- FR-PROD-011: System shall allow authenticated users to submit product reviews
- FR-PROD-012: System shall store review content and numeric rating (1-5)
- FR-PROD-013: System shall associate reviews with users and products
- FR-PROD-014: System shall calculate average product ratings from reviews
- FR-PROD-015: System shall display reviews with product details

### 3.3 Shopping Cart Management

#### 3.3.1 Cart Operations
**Description**: Manage user shopping carts
**Priority**: High
**Functional Requirements**:
- FR-CART-001: System shall maintain individual carts for each authenticated user
- FR-CART-002: System shall allow adding products to cart with specified quantities
- FR-CART-003: System shall allow removing items from cart
- FR-CART-004: System shall calculate cart totals including item prices and quantities
- FR-CART-005: System shall validate product availability before adding to cart

#### 3.3.2 Coupon Management
**Description**: Support discount coupons
**Priority**: Medium
**Functional Requirements**:
- FR-CART-006: System shall allow applying coupon codes to carts
- FR-CART-007: System shall validate coupon codes and calculate discounts
- FR-CART-008: System shall store applied coupons and discount amounts
- FR-CART-009: System shall handle invalid or expired coupons gracefully
- FR-CART-010: System shall recalculate totals after coupon application

### 3.4 Order Management

#### 3.4.1 Order Processing
**Description**: Handle order creation and management
**Priority**: High
**Functional Requirements**:
- FR-ORDER-001: System shall create orders from user carts
- FR-ORDER-002: System shall associate orders with user addresses
- FR-ORDER-003: System shall track order status (pending, paid, processing, shipped, delivered, cancelled)
- FR-ORDER-004: System shall store order items with product details and prices
- FR-ORDER-005: System shall generate unique order identifiers

#### 3.4.2 Order Tracking
**Description**: Provide order status and tracking
**Priority**: Medium
**Functional Requirements**:
- FR-ORDER-006: System shall provide order tracking functionality
- FR-ORDER-007: System shall store tracking numbers and shipping information
- FR-ORDER-008: System shall maintain order status history
- FR-ORDER-009: System shall allow users to view their order history
- FR-ORDER-010: System shall provide detailed order information including items and totals

#### 3.4.3 Order Cancellation
**Description**: Handle order cancellations
**Priority**: Medium
**Functional Requirements**:
- FR-ORDER-011: System shall allow users to cancel orders in appropriate status
- FR-ORDER-012: System shall update order status to cancelled
- FR-ORDER-013: System shall handle refund processing for cancelled orders
- FR-ORDER-014: System shall prevent cancellation of shipped or delivered orders

### 3.5 Payment Processing

#### 3.5.1 Payment Methods
**Description**: Manage user payment methods
**Priority**: High
**Functional Requirements**:
- FR-PAY-001: System shall allow users to save payment methods
- FR-PAY-002: System shall integrate with Stripe for payment processing
- FR-PAY-003: System shall store payment method metadata securely
- FR-PAY-004: System shall allow users to view saved payment methods
- FR-PAY-005: System shall support multiple payment method types

#### 3.5.2 Payment Processing
**Description**: Process order payments
**Priority**: High
**Functional Requirements**:
- FR-PAY-006: System shall process payments for orders
- FR-PAY-007: System shall handle payment success and failure scenarios
- FR-PAY-008: System shall store transaction IDs and payment details
- FR-PAY-009: System shall update order status based on payment results
- FR-PAY-010: System shall support payment method selection during checkout

#### 3.5.3 Digital Wallet
**Description**: Support digital wallet functionality
**Priority**: Low
**Functional Requirements**:
- FR-PAY-011: System shall provide digital wallet top-up functionality
- FR-PAY-012: System shall track wallet balances
- FR-PAY-013: System shall allow wallet payments for orders
- FR-PAY-014: System shall maintain wallet transaction history

### 3.6 User Management

#### 3.6.1 Address Management
**Description**: Manage user addresses
**Priority**: Medium
**Functional Requirements**:
- FR-USER-001: System shall allow users to save multiple addresses
- FR-USER-002: System shall support address labels (home, work, etc.)
- FR-USER-003: System shall allow setting default addresses
- FR-USER-004: System shall validate address information
- FR-USER-005: System shall associate addresses with orders

#### 3.6.2 User Profile
**Description**: Manage user profile information
**Priority**: Medium
**Functional Requirements**:
- FR-USER-006: System shall store user profile information (name, email, phone)
- FR-USER-007: System shall allow profile updates
- FR-USER-008: System shall maintain user creation and update timestamps
- FR-USER-009: System shall support user role management (USER, ADMIN)
- FR-USER-010: System shall provide user order history

### 3.7 Administrative Functions

#### 3.7.1 Dashboard Analytics
**Description**: Provide administrative dashboard
**Priority**: Medium
**Functional Requirements**:
- FR-ADMIN-001: System shall provide dashboard summary statistics
- FR-ADMIN-002: System shall generate sales analytics reports
- FR-ADMIN-003: System shall support date range filtering for analytics
- FR-ADMIN-004: System shall track key performance metrics
- FR-ADMIN-005: System shall restrict admin functions to ADMIN role users

#### 3.7.2 User Management
**Description**: Administrative user management
**Priority**: Medium
**Functional Requirements**:
- FR-ADMIN-006: System shall allow administrators to search users
- FR-ADMIN-007: System shall provide user listing functionality
- FR-ADMIN-008: System shall allow user account blocking
- FR-ADMIN-009: System shall maintain user activity logs
- FR-ADMIN-010: System shall provide user statistics and metrics

#### 3.7.3 Product Management
**Description**: Administrative product management
**Priority**: High
**Functional Requirements**:
- FR-ADMIN-011: System shall allow administrators to create products
- FR-ADMIN-012: System shall allow administrators to update product information
- FR-ADMIN-013: System shall allow administrators to manage product categories
- FR-ADMIN-014: System shall allow administrators to update product stock
- FR-ADMIN-015: System shall provide product performance analytics

#### 3.7.4 Order Management
**Description**: Administrative order management
**Priority**: High
**Functional Requirements**:
- FR-ADMIN-016: System shall allow administrators to view all orders
- FR-ADMIN-017: System shall allow administrators to update order status
- FR-ADMIN-018: System shall allow administrators to process refunds
- FR-ADMIN-019: System shall provide order analytics and reporting
- FR-ADMIN-020: System shall allow administrators to manage shipping information

### 3.8 Recommendations

#### 3.8.1 Personalized Recommendations
**Description**: Provide product recommendations
**Priority**: Low
**Functional Requirements**:
- FR-REC-001: System shall generate personalized product recommendations
- FR-REC-002: System shall base recommendations on user purchase history
- FR-REC-003: System shall provide recommendation API endpoints
- FR-REC-004: System shall support wishlist functionality
- FR-REC-005: System shall track recommendation effectiveness

### 3.9 Webhook Integration

#### 3.9.1 External Webhooks
**Description**: Handle external service webhooks
**Priority**: Medium
**Functional Requirements**:
- FR-HOOK-001: System shall handle Stripe webhook events
- FR-HOOK-002: System shall process payment status updates
- FR-HOOK-003: System shall handle SMS delivery status webhooks
- FR-HOOK-004: System shall validate webhook signatures
- FR-HOOK-005: System shall log webhook events for debugging

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- RESTful API endpoints with JSON request/response format
- Swagger/OpenAPI documentation interface
- Administrative dashboard interfaces (if web UI is implemented)

### 4.2 Hardware Interfaces
- Standard HTTP/HTTPS network interfaces
- Database connection interfaces
- File system interfaces for logging and temporary storage

### 4.3 Software Interfaces

#### 4.3.1 Database Interface
- **PostgreSQL Database**: Primary data storage
- **Connection**: TypeORM with connection pooling
- **Schema**: Relational database with foreign key constraints

#### 4.3.2 Authentication Service
- **Supabase Auth**: User authentication and management
- **Integration**: JWT token validation and user session management
- **Configuration**: Environment-based configuration

#### 4.3.3 Payment Service
- **Stripe API**: Payment processing and method management
- **Integration**: Webhook handling for payment events
- **Security**: API key authentication

#### 4.3.4 External Services
- **SMS Services**: Notification delivery
- **File Storage**: Product image storage
- **Email Services**: Password reset and notifications

### 4.4 Communication Interfaces
- **HTTP/HTTPS**: RESTful API communication
- **WebSocket**: Real-time notifications (if implemented)
- **SMTP**: Email communication
- **Webhook**: External service integration

---

## 5. System Requirements

### 5.1 Functional Requirements Summary
The system shall provide:
- Complete user authentication and authorization system
- Comprehensive product catalog management
- Shopping cart and order processing functionality
- Payment processing with multiple methods
- Administrative dashboard and analytics
- Recommendation engine
- Webhook integration capabilities

### 5.2 Business Rules
- BR-001: Only authenticated users can access cart and order functionality
- BR-002: Only administrators can access admin endpoints
- BR-003: Product stock must be validated before order creation
- BR-004: Orders cannot be cancelled after shipping
- BR-005: Payment must be processed before order fulfillment
- BR-006: User emails must be unique across the system
- BR-007: Product prices must be positive values
- BR-008: Review ratings must be between 1 and 5

---

## 6. Database Schema

### 6.1 Entity Relationship Overview
The system uses the following main entities:

#### 6.1.1 Users Table
```sql
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR UNIQUE NOT NULL,
  name: VARCHAR NOT NULL,
  phone: VARCHAR NULL,
  role: ENUM('user', 'admin') DEFAULT 'user',
  created_at: TIMESTAMP DEFAULT NOW(),
  updated_at: TIMESTAMP DEFAULT NOW()
)
```

#### 6.1.2 Addresses Table
```sql
addresses (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  label: VARCHAR NOT NULL,
  street: VARCHAR NOT NULL,
  city: VARCHAR NOT NULL,
  state: VARCHAR NOT NULL,
  zip: VARCHAR NOT NULL,
  is_default: BOOLEAN DEFAULT FALSE
)
```

#### 6.1.3 Categories Table
```sql
categories (
  id: UUID PRIMARY KEY,
  name: VARCHAR NOT NULL,
  description: TEXT NULL,
  image: VARCHAR NULL
)
```

#### 6.1.4 Products Table
```sql
products (
  id: UUID PRIMARY KEY,
  name: VARCHAR NOT NULL,
  description: TEXT NOT NULL,
  price: DECIMAL(10,2) NOT NULL,
  stock: INTEGER DEFAULT 0,
  images: TEXT[] NOT NULL,
  rating: DECIMAL(3,2) DEFAULT 0,
  category_id: UUID REFERENCES categories(id),
  created_at: TIMESTAMP DEFAULT NOW(),
  updated_at: TIMESTAMP DEFAULT NOW()
)
```

#### 6.1.5 Reviews Table
```sql
reviews (
  id: UUID PRIMARY KEY,
  content: TEXT NOT NULL,
  rating: INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  product_id: UUID REFERENCES products(id),
  user_id: UUID REFERENCES users(id),
  created_at: TIMESTAMP DEFAULT NOW()
)
```

#### 6.1.6 Carts Table
```sql
carts (
  id: UUID PRIMARY KEY,
  user_id: UUID NOT NULL,
  coupon_code: VARCHAR NULL,
  discount_amount: DECIMAL(10,2) DEFAULT 0
)
```

#### 6.1.7 Cart Items Table
```sql
cart_items (
  id: UUID PRIMARY KEY,
  cart_id: UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id: UUID REFERENCES products(id),
  quantity: INTEGER NOT NULL,
  price: DECIMAL(10,2) NOT NULL
)
```

#### 6.1.8 Orders Table
```sql
orders (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  address_id: UUID REFERENCES addresses(id),
  status: ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  total: DECIMAL(10,2) NOT NULL,
  tracking_number: VARCHAR NULL,
  payment_method: VARCHAR NULL,
  transaction_id: VARCHAR NULL,
  coupon_code: VARCHAR NULL,
  discount_amount: DECIMAL(10,2) DEFAULT 0,
  tracking_info: JSONB NULL,
  created_at: TIMESTAMP DEFAULT NOW(),
  updated_at: TIMESTAMP DEFAULT NOW()
)
```

#### 6.1.9 Order Items Table
```sql
order_items (
  id: UUID PRIMARY KEY,
  order_id: UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id: UUID REFERENCES products(id),
  product_name: VARCHAR NOT NULL,
  quantity: INTEGER NOT NULL,
  price: DECIMAL(10,2) NOT NULL
)
```

### 6.2 Relationships
- Users have many Addresses (1:N)
- Users have many Orders (1:N)
- Users have many Reviews (1:N)
- Categories have many Products (1:N)
- Products have many Reviews (1:N)
- Products belong to one Category (N:1)
- Users have one Cart (1:1)
- Carts have many Cart Items (1:N)
- Orders have many Order Items (1:N)
- Orders belong to one User (N:1)
- Orders belong to one Address (N:1)

### 6.3 Indexes
- Primary keys on all tables (UUID)
- Unique index on users.email
- Index on products.category_id
- Index on orders.user_id
- Index on orders.status
- Index on reviews.product_id
- Index on cart_items.cart_id
- Index on order_items.order_id

---

## 7. Security Requirements

### 7.1 Authentication
- JWT-based authentication using Supabase
- Token expiration and refresh mechanisms
- Secure password hashing (handled by Supabase)
- Password strength requirements (minimum 6 characters)

### 7.2 Authorization
- Role-based access control (USER, ADMIN)
- Route-level authorization guards
- Resource-level access control (users can only access their own data)
- Admin-only endpoints protection

### 7.3 Data Protection
- Input validation using class-validator
- SQL injection prevention through TypeORM
- XSS prevention through input sanitization
- CORS configuration for cross-origin requests

### 7.4 API Security
- Rate limiting using throttler
- Request size limits
- Webhook signature validation
- API key protection for external services

### 7.5 Data Privacy
- Sensitive data exclusion from API responses
- Secure storage of payment information (via Stripe)
- User data access controls
- Audit logging for sensitive operations

---

## 8. Performance Requirements

### 8.1 Response Time
- API endpoints shall respond within 500ms for 95% of requests
- Database queries shall execute within 100ms for simple operations
- Complex analytics queries shall complete within 2 seconds
- File uploads shall process within 5 seconds

### 8.2 Throughput
- System shall handle 1000 concurrent users
- API shall process 10,000 requests per minute
- Database shall support 500 concurrent connections
- Payment processing shall handle 100 transactions per minute

### 8.3 Scalability
- Horizontal scaling support through stateless design
- Database connection pooling for efficient resource usage
- Caching strategies for frequently accessed data
- Load balancing capability

### 8.4 Resource Usage
- Memory usage shall not exceed 2GB per instance
- CPU usage shall remain below 80% under normal load
- Database storage growth shall be monitored and optimized
- Network bandwidth usage shall be optimized

---

## 9. Quality Attributes

### 9.1 Reliability
- System uptime of 99.9%
- Graceful error handling and recovery
- Data consistency and integrity
- Backup and disaster recovery procedures

### 9.2 Maintainability
- Modular architecture with clear separation of concerns
- Comprehensive code documentation
- Unit and integration test coverage > 80%
- Standardized coding practices and style guides

### 9.3 Usability
- Intuitive API design following REST principles
- Comprehensive API documentation with examples
- Clear error messages and status codes
- Consistent response formats

### 9.4 Portability
- Environment-agnostic configuration
- Docker containerization support
- Database migration scripts
- Cross-platform compatibility

---

## 10. Constraints

### 10.1 Technical Constraints
- Must use NestJS framework with TypeScript
- Must use PostgreSQL as primary database
- Must integrate with Supabase for authentication
- Must use Stripe for payment processing
- Must follow RESTful API design principles

### 10.2 Business Constraints
- Must comply with PCI DSS for payment processing
- Must support multi-currency transactions
- Must provide audit trails for financial transactions
- Must support data export for compliance

### 10.3 Regulatory Constraints
- Must comply with GDPR for user data protection
- Must implement data retention policies
- Must provide user data deletion capabilities
- Must maintain transaction records for legal requirements

### 10.4 Environmental Constraints
- Must operate in cloud environments
- Must support containerized deployment
- Must integrate with CI/CD pipelines
- Must support monitoring and logging systems

---

## Appendices

### A. API Endpoint Summary
- **Authentication**: `/api/auth/*` - Registration, login, profile management
- **Products**: `/api/products/*` - Product catalog and search
- **Cart**: `/api/cart/*` - Shopping cart management
- **Orders**: `/api/orders/*` - Order processing and tracking
- **Payments**: `/api/payments/*` - Payment processing
- **Admin**: `/api/admin/*` - Administrative functions
- **Recommendations**: `/api/recommendations/*` - Product recommendations
- **Webhooks**: `/api/webhooks/*` - External service integration

### B. Error Codes
- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource already exists
- **422**: Unprocessable Entity - Validation errors
- **500**: Internal Server Error - System error

### C. Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_JWT_SECRET`: JWT secret for token validation
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`: Database configuration
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `THROTTLE_LIMIT`: Rate limiting configuration

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Final  
**Approved By**: Development Team