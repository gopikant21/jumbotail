# E-Commerce Search Engine for Electronics

## Overview

A microservice-based search engine designed for an electronics e-commerce platform targeting Tier-2 and Tier-3 cities in India. The platform specializes in mobile phones, phone accessories, laptops, headphones, and other electronic gadgets with sophisticated ranking algorithms for product discovery.

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [System Architecture](#system-architecture)
- [API Specifications](#api-specifications)
- [Search Ranking Algorithm](#search-ranking-algorithm)
- [Data Model](#data-model)
- [Setup and Installation](#setup-and-installation)
- [Usage Examples](#usage-examples)
- [Performance Requirements](#performance-requirements)
- [Contributing](#contributing)

## Project Description

This search engine handles complex customer queries in multiple languages and formats, including:

- **Standard queries**: "iPhone", "Samsung phone"
- **Regional language queries**: "Sasta wala iPhone" (Hinglish)
- **Typo-tolerant searches**: "Ifone 16" (misspelled iPhone)
- **Attribute-specific searches**: "iPhone 16 red color", "iPhone 16 more storage"
- **Accessory searches**: "iPhone cover strong"
- **Price-based searches**: "iPhone 50k rupees"

### Target Market

- **Primary**: Tier-2 and Tier-3 cities in India
- **Product Categories**: Electronics (mobile phones, accessories, laptops, headphones)
- **Scale**: Millions of products in catalog

## Features

### Core Features

- ✅ **Product Storage**: In-memory storage with entity design
- ✅ **Metadata Management**: Rich product attributes and specifications
- ✅ **Intelligent Search**: Multi-language, typo-tolerant search
- ✅ **Dynamic Ranking**: Advanced scoring algorithms
- ✅ **Real-time Results**: Sub-1000ms API response times
- ✅ **Graceful Error Handling**: Comprehensive exception management

### Advanced Features

- 🔄 **LLM Data Enrichment**: AI-powered product attribute enhancement
- 🔄 **Database Persistence**: Scalable data storage solutions
- 🔄 **Analytics Integration**: Search behavior tracking
- 🔄 **Recommendation Engine**: Related product suggestions

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │────│   API Gateway   │────│  Search Service │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Data Store    │────│  Ranking Engine │
                       └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │ Analytics Store │
                       └─────────────────┘
```

## API Specifications

### 1. Store Product in Catalog

**Endpoint**: `POST /api/v1/product`

**Description**: Adds a new product to the catalog with basic information.

**Request Body**:

```json
{
  "title": "iPhone 17",
  "description": "6.3-inch 120Hz ProMotion OLED display with 3,000 nits peak brightness, powered by the A19 chip. It includes a new 18MP front camera with Center Stage, 48MP dual rear cameras, 8GB of RAM, and a 3692mAh battery",
  "rating": 4.2,
  "stock": 1000,
  "price": 81999,
  "mrp": 82999,
  "currency": "Rupee"
}
```

**Response**:

```json
{
  "productId": 101,
  "status": "success",
  "message": "Product added successfully"
}
```

### 2. Update Product Metadata

**Endpoint**: `PUT /api/v1/product/meta-data`

**Description**: Updates or adds metadata attributes for an existing product.

**Request Body**:

```json
{
  "productId": 101,
  "metadata": {
    "ram": "8GB",
    "screenSize": "6.3 inches",
    "model": "iPhone 17",
    "storage": "128GB",
    "brightness": "3000 nits",
    "processor": "A19 chip",
    "camera": "48MP dual rear",
    "frontCamera": "18MP",
    "battery": "3692mAh",
    "displayType": "ProMotion OLED",
    "refreshRate": "120Hz"
  }
}
```

**Response**:

```json
{
  "productId": 101,
  "metadata": {
    "ram": "8GB",
    "screenSize": "6.3 inches",
    "model": "iPhone 17",
    "storage": "128GB",
    "brightness": "3000 nits",
    "processor": "A19 chip",
    "camera": "48MP dual rear",
    "frontCamera": "18MP",
    "battery": "3692mAh",
    "displayType": "ProMotion OLED",
    "refreshRate": "120Hz"
  },
  "status": "success"
}
```

### 3. Search Products

**Endpoint**: `GET /api/v1/search/product?query={searchQuery}&limit={limit}&offset={offset}&sortBy={sortBy}`

**Description**: Searches and returns ranked products based on the query.

**Query Parameters**:

- `query` (required): Search term
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort criteria (relevance, price_low, price_high, rating, popularity)

**Example Request**: `GET /api/v1/search/product?query=Sasta iPhone&limit=10`

**Response**:

```json
{
  "data": [
    {
      "productId": 80,
      "title": "iPhone 13",
      "description": "This is an iPhone 13 64GB white colour",
      "mrp": 62999,
      "sellingPrice": 35000,
      "rating": 4.3,
      "stock": 10,
      "discount": 44.4,
      "metadata": {
        "ram": "4GB",
        "storage": "64GB",
        "color": "White",
        "model": "iPhone 13"
      },
      "relevanceScore": 0.95
    },
    {
      "productId": 102,
      "title": "iPhone 17",
      "description": "This is an iPhone 17 256GB blue colour",
      "mrp": 79999,
      "sellingPrice": 60000,
      "rating": 4.2,
      "stock": 100,
      "discount": 25.0,
      "metadata": {
        "ram": "8GB",
        "storage": "256GB",
        "color": "Blue",
        "model": "iPhone 17"
      },
      "relevanceScore": 0.87
    }
  ],
  "totalResults": 156,
  "query": "Sasta iPhone",
  "executionTime": "245ms"
}
```

### 4. Additional APIs

#### Get Product Details

**Endpoint**: `GET /api/v1/product/{productId}`

#### Bulk Product Upload

**Endpoint**: `POST /api/v1/product/bulk`

#### Search Suggestions

**Endpoint**: `GET /api/v1/search/suggestions?query={partialQuery}`

#### Popular Searches

**Endpoint**: `GET /api/v1/search/trending`

#### Product Analytics

**Endpoint**: `GET /api/v1/analytics/product/{productId}`

## Search Ranking Algorithm

### Multi-Factor Scoring System

The ranking algorithm combines multiple signals to compute a relevance score:

#### 1. Text Relevance Score (40% weight)

```
textScore = (
  exactMatch * 1.0 +
  titleMatch * 0.8 +
  descriptionMatch * 0.5 +
  metadataMatch * 0.3
) / queryTerms.length
```

#### 2. Quality Score (25% weight)

```
qualityScore = (
  rating / 5.0 * 0.6 +
  (1 - returnRate) * 0.4
)
```

#### 3. Popularity Score (20% weight)

```
popularityScore = (
  log(unitsSold + 1) / log(maxUnitsSold + 1) * 0.7 +
  log(reviews + 1) / log(maxReviews + 1) * 0.3
)
```

#### 4. Business Score (15% weight)

```
businessScore = (
  stockAvailability * 0.5 +
  (1 - priceRatio) * 0.3 +
  profitMargin * 0.2
)

where priceRatio = sellingPrice / maxPrice
```

#### Final Ranking Formula

```
finalScore = (
  textScore * 0.40 +
  qualityScore * 0.25 +
  popularityScore * 0.20 +
  businessScore * 0.15
) * boostFactors
```

### Special Handling

#### Regional Language Support

- **Hinglish Detection**: "Sasta" → "Cheap", "Accha" → "Good"
- **Phonetic Matching**: "Ifone" → "iPhone"
- **Regional Synonyms**: Price-related terms mapping

#### Query Understanding

- **Intent Recognition**: Price queries, color queries, storage queries
- **Spell Correction**: Levenshtein distance-based correction
- **Query Expansion**: Synonym expansion and related terms

#### Dynamic Boosts

- **Trending Products**: +0.1 multiplier
- **Flash Sales**: +0.15 multiplier
- **Low Stock**: +0.05 multiplier (urgency factor)
- **High Margin**: +0.1 multiplier (business preference)

## Data Model

### Product Entity

```json
{
  "productId": "number",
  "title": "string",
  "description": "string",
  "category": "string",
  "subcategory": "string",
  "brand": "string",
  "model": "string",
  "price": "number",
  "mrp": "number",
  "currency": "string",
  "rating": "number",
  "ratingCount": "number",
  "stock": "number",
  "isActive": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "metadata": {
    "technical_specs": {},
    "features": [],
    "dimensions": {},
    "warranty": "string"
  },
  "analytics": {
    "unitsSold": "number",
    "returnRate": "number",
    "viewCount": "number",
    "conversionRate": "number",
    "profitMargin": "number"
  },
  "searchableText": "string",
  "tags": ["string"]
}
```

### Search Index Structure

```json
{
  "productId": "number",
  "titleTokens": ["string"],
  "descriptionTokens": ["string"],
  "brandTokens": ["string"],
  "categoryTokens": ["string"],
  "priceRange": "string",
  "ratingBucket": "string",
  "stockStatus": "string",
  "boost": "number"
}
```

## Setup and Installation

### Prerequisites

- Node.js 18+ or Python 3.8+
- Redis (for caching)
- PostgreSQL (for persistence)
- Elasticsearch (for advanced search)

### Installation Steps

1. **Clone the Repository**

```bash
git clone https://github.com/your-org/ecommerce-search-engine.git
cd ecommerce-search-engine
```

2. **Install Dependencies**

```bash
# For Node.js
npm install

# For Python
pip install -r requirements.txt
```

3. **Environment Configuration**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database Setup**

```bash
# Run migrations
npm run migrate
# or
python manage.py migrate
```

5. **Seed Sample Data**

```bash
npm run seed
# or
python scripts/seed_data.py
```

6. **Start the Service**

```bash
npm start
# or
python app.py
```

### Environment Variables

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
LOG_LEVEL=info
ENABLE_ANALYTICS=true
```

## Usage Examples

### Basic Search

```javascript
// Search for iPhones
const response = await fetch("/api/v1/search/product?query=iPhone");
const results = await response.json();
```

### Advanced Search with Filters

```javascript
// Search with price range and sorting
const response = await fetch(
  "/api/v1/search/product?query=iPhone&minPrice=20000&maxPrice=50000&sortBy=price_low",
);
```

### Bulk Product Upload

```javascript
const products = [
  { title: "iPhone 15", price: 75000 /* ... */ },
  { title: "Samsung Galaxy S24", price: 65000 /* ... */ },
];

const response = await fetch("/api/v1/product/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ products }),
});
```

## Performance Requirements

### Latency Targets

- **Search API**: < 1000ms (99th percentile)
- **Product Storage**: < 500ms
- **Metadata Update**: < 300ms

### Throughput Targets

- **Search QPS**: 1000+ queries per second
- **Product Writes**: 100+ products per second
- **Concurrent Users**: 10,000+

### Optimization Strategies

1. **In-Memory Caching**: Redis for frequent queries
2. **Database Indexing**: Optimized B-tree and text indexes
3. **Query Optimization**: Prepared statements and query planning
4. **Result Pagination**: Efficient offset-based pagination
5. **Connection Pooling**: Database connection management

## Data Sources and Bootstrapping

### Initial Catalog (1000+ Products)

The system will be bootstrapped with products scraped from:

- **Mobile Phones**: iPhone 5-16, Samsung Galaxy series, OnePlus, Xiaomi, Realme
- **Laptops**: Dell, HP, Lenovo, Asus, Acer across different price ranges
- **Accessories**: Phone covers, screen guards, chargers, headphones
- **Audio**: Wireless earbuds, wired headphones, speakers

### Generated Data Points

For each product, the following attributes will be generated:

- **Sales Data**: Units sold (100-10000), monthly sales trends
- **Quality Metrics**: Return rate (1-15%), customer complaints (0-50)
- **Reviews**: Rating (2.5-5.0), review count (10-5000)
- **Business Metrics**: Profit margin (5-40%), procurement cost
- **Technical Specs**: Detailed specifications based on product category

## Testing

### Unit Tests

```bash
npm test
# or
python -m pytest
```

### Integration Tests

```bash
npm run test:integration
# or
python -m pytest tests/integration/
```

### Performance Tests

```bash
npm run test:performance
# or
python scripts/load_test.py
```

## Monitoring and Analytics

### Key Metrics

- **Search Performance**: Query latency, success rate
- **Business Metrics**: Click-through rate, conversion rate
- **System Health**: CPU, memory, database performance
- **User Behavior**: Popular queries, search patterns

### Logging

- **Structured Logging**: JSON format with correlation IDs
- **Query Logging**: All search queries with metadata
- **Performance Logging**: Response times and resource usage
- **Error Tracking**: Comprehensive error monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow language-specific style guides (ESLint for JS, PEP8 for Python)
- Write comprehensive tests for new features
- Update documentation for API changes
- Use meaningful commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Project Lead**: [Your Name](mailto:your.email@domain.com)
- **Team**: [team@domain.com](mailto:team@domain.com)
- **Documentation**: [Wiki Link](https://github.com/your-org/ecommerce-search-engine/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/ecommerce-search-engine/issues)
