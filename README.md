# E-commerce Search Engine

A fast in-memory search microservice for electronics e-commerce.

## Quick Start

```bash
npm install
npm run bootstrap
npm run dev
```

Server runs on `http://localhost:3000`

## Features

- **Fast Search**: In-memory storage with O(1) lookups
- **Smart Ranking**: Multi-factor algorithm (relevance, rating, popularity)
- **Filtering**: Category, brand, price, rating filters
- **Hinglish Support**: Mixed Hindi-English queries
- **REST API**: Complete CRUD operations
- **Performance**: <300ms response times
- **Monitoring**: Built-in analytics and logging

## API Endpoints

```
# Root and Health
GET  /                        # Welcome message
GET  /health                  # Health check

# API v1
GET  /api/v1/                 # API info and documentation
GET  /api/v1/product          # Product operations
GET  /api/v1/search           # Search products
```

### Available Routes

- **Root**: `GET /` - Welcome message with API information
- **Health**: `GET /health` - Service health status and metrics
- **API Info**: `GET /api/v1/` - API version and endpoint documentation
- **Products**: `GET /api/v1/product` - Product management endpoints
- **Search**: `GET /api/v1/search` - Product search with advanced filtering

## Test

```bash
npm test
```

Built with Node.js + Express
