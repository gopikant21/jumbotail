# API Test Endpoint Samples

A comprehensive guide to testing all available API endpoints in the Jumbotail E-commerce Search Engine.

## Base URL

```
http://localhost:3000
```

## Authentication

All endpoints are currently open for testing. Rate limiting applies to `/api/*` routes.

---

## Root & Health Endpoints

### 1. Welcome Message

```http
GET /
```

**Expected Response:**

```json
{
  "message": "Welcome to Jumbotail E-commerce Search Engine API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "api": "/api/v1",
    "documentation": "/api/v1/docs"
  },
  "timestamp": "2026-01-27T12:00:00.000Z"
}
```

### 2. Health Check

```http
GET /health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T12:00:00.000Z",
  "uptime": "5 minutes",
  "memory": {
    "used": 45,
    "total": 120,
    "external": 10
  },
  "environment": "development"
}
```

---

## API v1 Info

### 3. API Information

```http
GET /api/v1/
```

**Expected Response:**

```json
{
  "service": "E-commerce Search Engine",
  "version": "1.0.0",
  "description": "Microservice for product search with advanced ranking algorithms",
  "endpoints": {
    "products": "/api/v1/product",
    "search": "/api/v1/search",
    "health": "/health"
  },
  "documentation": "https://github.com/your-org/ecommerce-search-engine/wiki",
  "support": "team@ecommerce.com"
}
```

---

## Product Management Endpoints

### 4. Create Product

```http
POST /api/v1/product
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Latest Apple iPhone with titanium design",
  "category": "smartphones",
  "brand": "Apple",
  "price": 999.99,
  "rating": 4.8,
  "popularity": 0.95,
  "inStock": true,
  "features": ["5G", "ProRAW", "Action Button", "USB-C"],
  "specifications": {
    "display": "6.1-inch Super Retina XDR",
    "storage": "128GB",
    "camera": "48MP Main"
  }
}
```

### 5. Get Product by ID

```http
GET /api/v1/product/12345
```

### 6. Update Product

```http
PUT /api/v1/product/12345
Content-Type: application/json

{
  "price": 899.99,
  "inStock": true,
  "rating": 4.9
}
```

### 7. Delete Product

```http
DELETE /api/v1/product/123
```

### 8. Bulk Create Products

```http
POST /api/v1/product/bulk
Content-Type: application/json

{
  "products": [
    {
      "name": "Samsung Galaxy S24",
      "category": "smartphones",
      "brand": "Samsung",
      "price": 849.99,
      "rating": 4.7,
      "popularity": 0.88
    },
    {
      "name": "Google Pixel 8",
      "category": "smartphones",
      "brand": "Google",
      "price": 699.99,
      "rating": 4.6,
      "popularity": 0.82
    }
  ]
}
```

### 9. Update Metadata

```http
PUT /api/v1/product/meta-data
Content-Type: application/json

{
  "productId": "123",
  "metadata": {
    "tags": ["premium", "latest", "bestseller"],
    "searchKeywords": ["iPhone", "Apple", "smartphone", "mobile"]
  }
}
```

### 10. Get Products by Category

```http
GET /api/v1/product/category/smartphones
```

### 11. Get Products by Brand

```http
GET /api/v1/product/brand/Apple
```

### 12. Get All Categories

```http
GET /api/v1/product/categories
```

### 13. Get All Brands

```http
GET /api/v1/product/brands
```

---

## Search Endpoints

### 14. Basic Product Search

```http
GET /api/v1/search/product?query=iPhone&limit=10&offset=0
```

**Query Parameters:**

- `query` (string): Search query
- `limit` (number): Number of results (default: 20)
- `offset` (number): Pagination offset (default: 0)
- `category` (string): Filter by category
- `brand` (string): Filter by brand
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `minRating` (number): Minimum rating filter
- `inStock` (boolean): In stock filter
- `sortBy` (string): Sort field (relevance, price_low, price_high, rating, popularity, newest)

### 15. Advanced Search

```http
POST /api/v1/search/advanced
Content-Type: application/json

{
  "query": "smartphone camera",
  "filters": {
    "category": ["smartphones", "cameras"],
    "brand": ["Apple", "Samsung", "Google"],
    "priceRange": {
      "min": 500,
      "max": 1200
    },
    "rating": {
      "min": 4.0
    },
    "features": ["5G", "wireless charging"]
  },
  "sort": {
    "field": "popularity",
    "order": "desc"
  },
  "pagination": {
    "limit": 20,
    "offset": 0
  }
}
```

### 16. Search Suggestions

```http
GET /api/v1/search/suggestions?query=ipho&limit=5
```

**Expected Response:**

```json
{
  "data": [
    "iPhone 15 Pro",
    "iPhone 15",
    "iPhone 14 Pro",
    "iPhone accessories",
    "iPhone cases"
  ],
  "query": "ipho",
  "count": 5,
  "status": "success"
}
```

### 17. Trending Searches

```http
GET /api/v1/search/trending?limit=10
```

**Expected Response:**

```json
{
  "data": [
    {
      "query": "iPhone 15",
      "count": 1250,
      "trend": "up"
    },
    {
      "query": "Samsung Galaxy S24",
      "count": 980,
      "trend": "stable"
    }
  ],
  "count": 2,
  "status": "success"
}
```

### 18. Search Filters

```http
GET /api/v1/search/filters?category=smartphones
```

**Expected Response:**

```json
{
  "data": {
    "categories": [
      { "label": "Smartphones", "value": "smartphones" },
      { "label": "Accessories", "value": "accessories" }
    ],
    "brands": [
      { "label": "Apple", "value": "apple" },
      { "label": "Samsung", "value": "samsung" }
    ],
    "priceRanges": [
      { "label": "Under ₹1,000", "value": "0-1000", "min": 0, "max": 1000 },
      {
        "label": "₹1,000 - ₹5,000",
        "value": "1000-5000",
        "min": 1000,
        "max": 5000
      }
    ],
    "ratingRanges": [
      { "label": "4.5+ Stars", "value": "4.5+", "min": 4.5, "max": 5 },
      { "label": "4.0+ Stars", "value": "4.0+", "min": 4.0, "max": 5 }
    ]
  },
  "status": "success"
}
```

### 19. Similar Products

```http
GET /api/v1/search/similar/123?limit=5
```

**Expected Response:**

```json
{
  "data": [
    {
      "productId": 12346,
      "title": "iPhone 15",
      "category": "smartphones",
      "brand": "Apple",
      "price": 799.99,
      "rating": 4.7
    },
    {
      "productId": 12347,
      "title": "Samsung Galaxy S24",
      "category": "smartphones",
      "brand": "Samsung",
      "price": 849.99,
      "rating": 4.6
    }
  ],
  "baseProduct": {
    "productId": 12345,
    "title": "iPhone 15 Pro",
    "category": "smartphones",
    "brand": "Apple",
    "price": 999.99
  },
  "count": 2,
  "status": "success"
}
```

### 20. Search Analytics

```http
GET /api/v1/search/analytics?period=7d
```

**Expected Response:**

```json
{
  "data": {
    "search": {
      "totalQueries": 15420,
      "uniqueQueries": 3240,
      "avgResponseTime": 85,
      "popularQueries": [
        { "query": "iPhone", "count": 1250 },
        { "query": "Samsung", "count": 980 }
      ]
    },
    "repository": {
      "totalProducts": 50000,
      "categories": 15,
      "brands": 200
    },
    "system": {
      "uptime": 3600,
      "memoryUsage": {
        "rss": 134217728,
        "heapTotal": 67108864,
        "heapUsed": 45088768
      },
      "nodeVersion": "v20.14.0"
    }
  },
  "timestamp": "2026-01-27T12:00:00.000Z",
  "status": "success"
}
```

---

## Sample Test Scenarios

### Test Scenario 1: Complete Product Lifecycle

1. **Create** a new product (POST /api/v1/product)
2. **Retrieve** the product (GET /api/v1/product/:id)
3. **Search** for the product (GET /api/v1/search/product)
4. **Update** the product (PUT /api/v1/product/:id)
5. **Delete** the product (DELETE /api/v1/product/:id)

### Test Scenario 2: Search Flow

1. **Get categories** (GET /api/v1/product/categories)
2. **Basic search** (GET /api/v1/search/product?q=smartphone)
3. **Get filters** for results (GET /api/v1/search/filters)
4. **Advanced search** with filters (POST /api/v1/search/advanced)
5. **Get suggestions** (GET /api/v1/search/suggestions)

### Test Scenario 3: Performance Testing

1. **Health check** (GET /health)
2. **Bulk create** 1000 products (POST /api/v1/product/bulk)
3. **Search performance** test (multiple concurrent searches)
4. **Analytics check** (GET /api/v1/search/analytics)

---

## Error Handling Examples

### 404 - Product Not Found

```http
GET /api/v1/product/nonexistent
```

**Expected Response:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found"
  },
  "timestamp": "2026-01-27T12:00:00.000Z",
  "path": "/api/v1/product/nonexistent",
  "method": "GET"
}
```

### 400 - Validation Error

```http
POST /api/v1/product
Content-Type: application/json

{
  "name": "",
  "price": -100
}
```

**Expected Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation Error",
    "details": {
      "name": "Name is required",
      "price": "Price must be positive"
    }
  },
  "timestamp": "2026-01-27T12:00:00.000Z",
  "path": "/api/v1/product",
  "method": "POST"
}
```

### 429 - Rate Limit Exceeded

```http
GET /api/v1/search/product?query=test
# (After exceeding rate limit)
```

**Expected Response:**

```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

---

## Testing Tools

### cURL Examples

```bash
# Health check
curl -X GET http://localhost:3000/health

# Basic search
curl -X GET "http://localhost:3000/api/v1/search/product?query=iPhone&limit=5"

# Create product
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","category":"test","price":99.99}'

# Advanced search
curl -X POST http://localhost:3000/api/v1/search/advanced \
  -H "Content-Type: application/json" \
  -d '{"query":"smartphone","filters":{"priceRange":{"min":500,"max":1000}}}'
```

### Postman Collection

Import these endpoints into Postman for easy testing:

- Create a new collection "Jumbotail API"
- Add all endpoints above as requests
- Set up environment variables for baseUrl
- Create test scripts for automated validation

---

## Performance Benchmarks

Expected performance metrics:

- **Response Time**: < 300ms for search queries
- **Throughput**: > 1000 requests/second
- **Memory Usage**: < 80% of allocated memory
- **Error Rate**: < 1% under normal load

Use tools like Apache Bench or Artillery for load testing:

```bash
# Load test search endpoint
ab -n 1000 -c 10 "http://localhost:3000/api/v1/search/product?query=iPhone"
```
