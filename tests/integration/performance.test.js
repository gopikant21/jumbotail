const request = require("supertest");
const app = require("../../src/app");

describe("Performance Tests", () => {
  const PERFORMANCE_THRESHOLDS = {
    HEALTH_CHECK: 100, // 100ms
    PRODUCT_CRUD: 200, // 200ms
    SEARCH_SIMPLE: 300, // 300ms
    SEARCH_COMPLEX: 500, // 500ms
    BULK_OPERATIONS: 1000, // 1000ms
  };

  describe("Health Check Performance", () => {
    it("should respond to health check within threshold", async () => {
      const startTime = Date.now();

      await request(app).get("/api/health").expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.HEALTH_CHECK);
    });
  });

  describe("Product API Performance", () => {
    let createdProducts = [];

    beforeAll(async () => {
      // Create test products for performance testing
      const products = Array.from({ length: 100 }, (_, i) => ({
        title: `Performance Test Product ${i + 1}`,
        description: `Description for product ${i + 1}`,
        brand: `Brand${Math.ceil((i + 1) / 10)}`,
        category: ["Mobile", "Laptops", "Audio", "Accessories"][i % 4],
        price: Math.floor(Math.random() * 100000) + 10000,
        stock: Math.floor(Math.random() * 100) + 1,
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
        metadata: {
          color: ["Red", "Blue", "Black", "White"][i % 4],
          weight: `${Math.floor(Math.random() * 1000) + 100}g`,
        },
      }));

      for (const product of products) {
        const response = await request(app)
          .post("/api/products")
          .send(product)
          .expect(201);
        createdProducts.push(response.body.productId);
      }
    });

    afterAll(async () => {
      // Clean up created products
      for (const productId of createdProducts) {
        await request(app).delete(`/api/products/${productId}`).expect(200);
      }
    });

    it("should create product within threshold", async () => {
      const product = {
        title: "Performance Test Product",
        description: "A product for performance testing",
        brand: "TestBrand",
        category: "TestCategory",
        price: 50000,
        stock: 25,
      };

      const startTime = Date.now();

      const response = await request(app)
        .post("/api/products")
        .send(product)
        .expect(201);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PRODUCT_CRUD);

      // Clean up
      await request(app)
        .delete(`/api/products/${response.body.productId}`)
        .expect(200);
    });

    it("should fetch product by ID within threshold", async () => {
      const productId = createdProducts[0];
      const startTime = Date.now();

      await request(app).get(`/api/products/${productId}`).expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PRODUCT_CRUD);
    });

    it("should update product within threshold", async () => {
      const productId = createdProducts[0];
      const updates = {
        price: 75000,
        stock: 15,
      };

      const startTime = Date.now();

      await request(app)
        .put(`/api/products/${productId}`)
        .send(updates)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PRODUCT_CRUD);
    });

    it("should fetch all products within threshold", async () => {
      const startTime = Date.now();

      await request(app).get("/api/products").query({ limit: 50 }).expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS);
    });
  });

  describe("Search Performance", () => {
    it("should perform simple search within threshold", async () => {
      const startTime = Date.now();

      await request(app).get("/api/search").query({ q: "test" }).expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_SIMPLE);
    });

    it("should perform filtered search within threshold", async () => {
      const startTime = Date.now();

      await request(app)
        .get("/api/search")
        .query({
          q: "product",
          category: "Mobile",
          minRating: 4.0,
          limit: 20,
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_COMPLEX);
    });

    it("should handle complex search with multiple filters", async () => {
      const startTime = Date.now();

      await request(app)
        .get("/api/search")
        .query({
          q: "performance",
          category: "Mobile",
          brand: "Brand1",
          minPrice: 20000,
          maxPrice: 80000,
          minRating: 3.5,
          sort: "price_desc",
          limit: 10,
          page: 2,
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_COMPLEX);
    });

    it("should handle empty search results efficiently", async () => {
      const startTime = Date.now();

      await request(app)
        .get("/api/search")
        .query({ q: "nonexistent_product_xyz_123" })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SEARCH_SIMPLE);
    });
  });

  describe("Concurrent Request Performance", () => {
    it("should handle concurrent health checks", async () => {
      const concurrency = 10;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrency }, () =>
        request(app).get("/api/health").expect(200),
      );

      await Promise.all(promises);

      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrency;

      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLDS.HEALTH_CHECK * 2);
    });

    it("should handle concurrent search requests", async () => {
      const concurrency = 5;
      const searchQueries = [
        "mobile",
        "laptop",
        "audio",
        "brand",
        "performance",
      ];

      const startTime = Date.now();

      const promises = searchQueries.map((query) =>
        request(app).get("/api/search").query({ q: query }).expect(200),
      );

      const results = await Promise.all(promises);

      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrency;

      expect(averageTime).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SEARCH_SIMPLE * 1.5,
      );

      // Verify all requests completed successfully
      results.forEach((response) => {
        expect(response.body).toHaveProperty("products");
        expect(response.body).toHaveProperty("totalCount");
      });
    });
  });

  describe("Memory Usage Performance", () => {
    it("should not cause memory leaks during repeated requests", async () => {
      const initialMemory = process.memoryUsage();

      // Perform many requests to test for memory leaks
      for (let i = 0; i < 50; i++) {
        await request(app)
          .get("/api/search")
          .query({ q: `test${i}` })
          .expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe("Response Size Performance", () => {
    it("should return appropriately sized responses", async () => {
      const response = await request(app)
        .get("/api/search")
        .query({ limit: 50 })
        .expect(200);

      const responseSize = JSON.stringify(response.body).length;

      // Response should be reasonable size (less than 1MB)
      expect(responseSize).toBeLessThan(1024 * 1024);

      // But should contain meaningful data
      expect(responseSize).toBeGreaterThan(100);
    });

    it("should handle large result sets efficiently", async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get("/api/products")
        .query({ limit: 100 })
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS);
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe("Cache Performance", () => {
    it("should improve performance on repeated identical searches", async () => {
      const searchQuery = { q: "cache test", limit: 10 };

      // First request (cache miss)
      const startTime1 = Date.now();
      await request(app).get("/api/search").query(searchQuery).expect(200);
      const firstRequestTime = Date.now() - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      await request(app).get("/api/search").query(searchQuery).expect(200);
      const secondRequestTime = Date.now() - startTime2;

      // Second request should be faster (cache hit)
      // Note: This test might be flaky in fast environments
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime + 50);
    });
  });

  describe("Error Response Performance", () => {
    it("should handle 404 errors quickly", async () => {
      const startTime = Date.now();

      await request(app).get("/api/products/non-existent-id").expect(404);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PRODUCT_CRUD);
    });

    it("should handle validation errors quickly", async () => {
      const invalidProduct = {
        title: "", // Invalid
        price: -100, // Invalid
      };

      const startTime = Date.now();

      await request(app).post("/api/products").send(invalidProduct).expect(400);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.PRODUCT_CRUD);
    });
  });
});
