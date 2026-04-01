# SmartStock WMS API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## Authentication Endpoints

### Register New User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123!",
  "role": "Staff"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "role": "Staff",
    "createdAt": "2025-10-21T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**
- `username`: 3-30 characters, alphanumeric and underscore only
- `password`: Minimum 6 characters, must contain uppercase, lowercase, and number
- `role`: Either "Admin" or "Staff" (optional, defaults to "Staff")

---

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "role": "Staff"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Verify Token
**GET** `/auth/verify`

Verify if the current token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "role": "Staff"
  }
}
```

---

## Product Endpoints

### Get All Products
**GET** `/products`

Retrieve all products with optional filtering and pagination.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (string): Search by name or SKU
- `category` (string): Filter by category
- `location` (string): Filter by location
- `status` (string): Filter by stock status (in-stock, low-stock, out-of-stock)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sortBy` (string): Field to sort by (default: createdAt)
- `order` (string): Sort order (asc/desc, default: desc)

**Example Request:**
```
GET /products?search=laptop&category=Electronics&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "success": true,
  "products": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Laptop Pro 15",
      "sku": "ELEC-LAP-001",
      "category": "Electronics",
      "quantity": 50,
      "location": "A-1-5",
      "description": "High-performance laptop",
      "unitPrice": 999.99,
      "reorderLevel": 10,
      "stockStatus": "In Stock",
      "isLowStock": false,
      "createdAt": "2025-10-21T10:00:00.000Z",
      "updatedAt": "2025-10-21T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

---

### Get Single Product
**GET** `/products/:id`

Retrieve a specific product by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "product": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Laptop Pro 15",
    "sku": "ELEC-LAP-001",
    "category": "Electronics",
    "quantity": 50,
    "location": "A-1-5",
    "description": "High-performance laptop",
    "unitPrice": 999.99,
    "reorderLevel": 10,
    "stockStatus": "In Stock",
    "isLowStock": false,
    "createdBy": "507f1f77bcf86cd799439012",
    "createdAt": "2025-10-21T10:00:00.000Z",
    "updatedAt": "2025-10-21T10:00:00.000Z"
  }
}
```

---

### Create Product
**POST** `/products`

Create a new product (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Laptop Pro 15",
  "sku": "ELEC-LAP-001",
  "category": "Electronics",
  "quantity": 50,
  "location": "A-1-5",
  "description": "High-performance laptop",
  "unitPrice": 999.99,
  "reorderLevel": 10
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Laptop Pro 15",
    "sku": "ELEC-LAP-001",
    ...
  }
}
```

**Validation Rules:**
- `name`: Required, max 100 characters
- `sku`: Required, unique, uppercase letters/numbers/hyphens only
- `category`: Required, max 50 characters
- `quantity`: Required, non-negative integer
- `location`: Required, max 50 characters
- `description`: Optional, max 500 characters
- `unitPrice`: Optional, non-negative number
- `reorderLevel`: Optional, non-negative integer (default: 10)

---

### Update Product
**PUT** `/products/:id`

Update an existing product.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Product Name",
  "quantity": 75,
  "unitPrice": 1099.99
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product updated successfully",
  "product": { ... }
}
```

---

### Delete Product
**DELETE** `/products/:id`

Delete a product (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Order Endpoints

### Get All Orders
**GET** `/orders`

Retrieve all orders with optional filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (string): Filter by type (Inbound/Outbound)
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `partyName` (string): Search by party name
- `startDate` (string): Filter orders after this date
- `endDate` (string): Filter orders before this date
- `page` (number): Page number
- `limit` (number): Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "orders": [
    {
      "id": "507f1f77bcf86cd799439011",
      "orderId": "ORD-20251021-001",
      "type": "Inbound",
      "partyName": "ABC Supplier",
      "status": "Pending",
      "priority": "Medium",
      "totalValue": 5000.00,
      "items": [ ... ],
      "createdAt": "2025-10-21T10:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### Get Single Order
**GET** `/orders/:id`

Retrieve a specific order by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "order": {
    "id": "507f1f77bcf86cd799439011",
    "orderId": "ORD-20251021-001",
    "type": "Inbound",
    "partyName": "ABC Supplier",
    "partyContact": {
      "email": "contact@abcsupplier.com",
      "phone": "1234567890",
      "address": "123 Supplier St"
    },
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "productName": "Laptop Pro 15",
        "productSku": "ELEC-LAP-001",
        "quantity": 50,
        "unitPrice": 999.99
      }
    ],
    "status": "Pending",
    "priority": "Medium",
    "notes": "Rush order",
    "totalValue": 49999.50,
    "createdAt": "2025-10-21T10:00:00.000Z"
  }
}
```

---

### Create Order
**POST** `/orders`

Create a new order.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "Inbound",
  "partyName": "ABC Supplier",
  "partyContact": {
    "email": "contact@abcsupplier.com",
    "phone": "1234567890",
    "address": "123 Supplier St"
  },
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 50,
      "unitPrice": 999.99
    }
  ],
  "priority": "Medium",
  "notes": "Rush order"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": { ... }
}
```

**Validation Rules:**
- `type`: Required, either "Inbound" or "Outbound"
- `partyName`: Required, max 100 characters
- `items`: Required, array with at least 1 item
- `items[].productId`: Required, valid MongoDB ObjectId
- `items[].quantity`: Required, minimum 1
- `priority`: Optional, one of: Low, Medium, High, Urgent

---

### Update Order
**PUT** `/orders/:id`

Update an order (status, priority, notes).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "Processing",
  "priority": "High",
  "notes": "Updated notes"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order updated successfully",
  "order": { ... }
}
```

**Status Values:**
- Pending
- Processing
- Shipped (for Outbound orders)
- Received (for Inbound orders)
- Cancelled

**Note:** Changing status to "Received" (Inbound) or "Shipped" (Outbound) automatically updates inventory.

---

### Cancel Order
**DELETE** `/orders/:id`

Cancel an order (sets status to Cancelled).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

## Health Check Endpoints

### Basic Health Check
**GET** `/health`

Check if the API is running.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "SmartStock WMS API is running",
  "timestamp": "2025-10-21T10:00:00.000Z",
  "environment": "development"
}
```

---

### Detailed Health Check
**GET** `/health/detailed`

Get detailed system health information.

**Response:** `200 OK`
```json
{
  "success": true,
  "timestamp": "2025-10-21T10:00:00.000Z",
  "environment": "production",
  "application": {
    "name": "SmartStock WMS",
    "version": "1.0.0",
    "uptime": { ... }
  },
  "database": {
    "status": "connected",
    "host": "cluster0.mongodb.net",
    ...
  },
  "system": {
    "platform": "linux",
    "cpus": { ... },
    "memory": { ... }
  }
}
```

---

### Readiness Probe
**GET** `/health/readiness`

Kubernetes-style readiness probe.

**Response:** `200 OK`
```json
{
  "success": true,
  "ready": true,
  "timestamp": "2025-10-21T10:00:00.000Z"
}
```

---

### Liveness Probe
**GET** `/health/liveness`

Kubernetes-style liveness probe.

**Response:** `200 OK`
```json
{
  "success": true,
  "alive": true,
  "timestamp": "2025-10-21T10:00:00.000Z"
}
```

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized / Invalid Token |
| 403 | Forbidden / Insufficient Permissions |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate SKU) |
| 429 | Too Many Requests (Rate Limit) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- General API endpoints: 100 requests per 15 minutes per IP
- Authentication endpoints: 10 requests per 15 minutes per IP

When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store JWT tokens securely** (httpOnly cookies or secure storage)
3. **Never expose JWT secret keys**
4. **Rotate tokens regularly**
5. **Implement proper CORS policies**
6. **Validate and sanitize all inputs**
7. **Use strong passwords** (min 6 chars, uppercase, lowercase, number)
8. **Monitor for suspicious activity**

---

## Support

For issues or questions:
- GitHub Issues: [Your Repository]
- Email: support@smartstock.com
- Documentation: [Your Docs URL]

---

## Changelog

### Version 1.0.0 (2025-10-21)
- Initial release
- Authentication system
- Product management
- Order management
- Health check endpoints
