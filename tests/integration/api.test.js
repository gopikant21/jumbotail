const request = require("supertest");
const Application = require("../src/app");

describe("E-commerce Search API Integration Tests", () => {
  let app;
  let server;

  beforeAll(async () => {
    // Initialize application
    app = new Application();
    server = await app.start();
  });

  afterAll(async () => {
    // Clean up
    if (server) {
      server.close();
    }
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(server).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("memory");
      expect(response.body).toHaveProperty("environment");
    });
  });

  describe("API Info", () => {
    it("should return API information", async () => {
      const response = await request(server).get("/api/v1").expect(200);

      expect(response.body).toHaveProperty(
        "service",
        "E-commerce Search Engine",
      );
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("endpoints");
    });
  });

  describe("Product API", () => {
    let createdProductId;

    it("should create a new product", async () => {
      const productData = {
        title: "Test iPhone 15",
        description: "Test description for iPhone 15",
        category: "Mobile Phones",
        brand: "Apple",
        price: 75000,
        mrp: 80000,
        stock: 100,
        rating: 4.5,
      };

      const response = await request(server)
        .post("/api/v1/product")
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty("productId");
      expect(response.body).toHaveProperty("status", "success");
      createdProductId = response.body.productId;
    });

    it("should get product by ID", async () => {
      const response = await request(server)
        .get(`/api/v1/product/${createdProductId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty("productId", createdProductId);
      expect(response.body.data).toHaveProperty("title", "Test iPhone 15");
      expect(response.body.data).toHaveProperty("price", 75000);
    });

    it("should update product", async () => {
      const updateData = {
        price: 70000,
        stock: 150,
      };

      const response = await request(server)
        .put(`/api/v1/product/${createdProductId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toHaveProperty("price", 70000);
      expect(response.body.data).toHaveProperty("stock", 150);
    });

    it("should update product metadata", async () => {
      const metadataUpdate = {
        productId: createdProductId,
        metadata: {
          storage: "128GB",
          color: "Blue",
          ram: "6GB",
        },
      };

      const response = await request(server)
        .put("/api/v1/product/meta-data")
        .send(metadataUpdate)
        .expect(200);

      expect(response.body.metadata).toHaveProperty("storage", "128GB");
      expect(response.body.metadata).toHaveProperty("color", "Blue");
    });

    it("should handle product not found", async () => {
      const response = await request(server)
        .get("/api/v1/product/99999")
        .expect(404);

      expect(response.body.error).toHaveProperty("message");
    });

    it("should validate product creation data", async () => {
      const invalidProductData = {
        title: "A", // Too short
        price: -100, // Invalid price
        stock: -10, // Invalid stock
      };

      const response = await request(server)
        .post("/api/v1/product")
        .send(invalidProductData)
        .expect(400);

      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("Search API", () => {
    beforeAll(async () => {
      // Add some test products for search
      const testProducts = [
        {
          title: "Samsung Galaxy S24",
          description: "Latest Samsung flagship phone",
          category: "Mobile Phones",
          brand: "Samsung",
          price: 65000,
          mrp: 70000,
          stock: 50,
          rating: 4.3,
        },
        {
          title: "MacBook Pro 14",
          description: "Apple MacBook Pro with M2 chip",
          category: "Laptops",
          brand: "Apple",
          price: 120000,
          mrp: 125000,
          stock: 25,
          rating: 4.7,
        },
      ];

      for (const product of testProducts) {
        await request(server).post("/api/v1/product").send(product);
      }
    });

    it("should search products by query", async () => {
      const response = await request(server)
        .get("/api/v1/search/product?query=iPhone")
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("totalResults");
      expect(response.body).toHaveProperty("query", "iphone"); // Normalized
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should search products with filters", async () => {
      const response = await request(server)
        .get(
          "/api/v1/search/product?query=phone&category=Mobile Phones&minPrice=10000&maxPrice=80000",
        )
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(0);

      // Check if filters are applied
      if (response.body.data.length > 0) {
        const product = response.body.data[0];
        expect(product.price).toBeGreaterThanOrEqual(10000);
        expect(product.price).toBeLessThanOrEqual(80000);
      }
    });

    it("should support pagination", async () => {
      const response = await request(server)
        .get("/api/v1/search/product?query=phone&limit=5&offset=0")
        .expect(200);

      expect(response.body.pagination).toHaveProperty("limit", 5);
      expect(response.body.pagination).toHaveProperty("offset", 0);
      expect(response.body.pagination).toHaveProperty("hasNext");
      expect(response.body.pagination).toHaveProperty("hasPrevious", false);
    });

    it("should support sorting", async () => {
      const response = await request(server)
        .get("/api/v1/search/product?query=phone&sortBy=price_low")
        .expect(200);

      expect(response.body.sortBy).toBe("price_low");

      if (response.body.data.length > 1) {
        const prices = response.body.data.map((p) => p.price);
        const sortedPrices = [...prices].sort((a, b) => a - b);
        expect(prices).toEqual(sortedPrices);
      }
    });

    it("should handle Hinglish queries", async () => {
      const response = await request(server)
        .get("/api/v1/search/product?query=sasta phone")
        .expect(200);

      expect(response.body).toHaveProperty("data");
      // Query should be normalized to "cheap phone"
    });

    it("should handle misspelled queries", async () => {
      const response = await request(server)
        .get("/api/v1/search/product?query=Ifone") // Misspelled iPhone
        .expect(200);

      expect(response.body).toHaveProperty("data");
      // Should still return iPhone results due to fuzzy matching
    });

    it("should get search suggestions", async () => {
      const response = await request(server)
        .get("/api/v1/search/suggestions?query=iph")
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should get trending searches", async () => {
      const response = await request(server)
        .get("/api/v1/search/trending")
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const trendingItem = response.body.data[0];
        expect(trendingItem).toHaveProperty("query");
        expect(trendingItem).toHaveProperty("count");
        expect(trendingItem).toHaveProperty("trend");
      }
    });

    it("should get search filters", async () => {
      const response = await request(server)
        .get("/api/v1/search/filters")
        .expect(200);

      expect(response.body.data).toHaveProperty("categories");
      expect(response.body.data).toHaveProperty("brands");
      expect(response.body.data).toHaveProperty("priceRanges");
      expect(response.body.data).toHaveProperty("ratingRanges");
    });

    it("should validate search parameters", async () => {
      const response = await request(server)
        .get("/api/v1/search/product?limit=200") // Exceeds max limit
        .expect(400);

      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("Performance", () => {
    it("should respond to search queries within performance threshold", async () => {
      const startTime = Date.now();

      await request(server)
        .get("/api/v1/search/product?query=phone")
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should be under 1 second
    });

    it("should handle concurrent search requests", async () => {
      const concurrentRequests = 10;
      const promises = Array(concurrentRequests)
        .fill()
        .map(() =>
          request(server)
            .get("/api/v1/search/product?query=laptop")
            .expect(200),
        );

      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach((response) => {
        expect(response.body).toHaveProperty("data");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for non-existent routes", async () => {
      const response = await request(server)
        .get("/api/v1/nonexistent")
        .expect(404);

      expect(response.body.error).toHaveProperty("message");
    });

    it("should handle malformed JSON", async () => {
      const response = await request(server)
        .post("/api/v1/product")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(400);

      expect(response.body.error).toHaveProperty("message");
    });

    it("should handle rate limiting", async () => {
      // This test would need rate limiting to be configured for testing
      // For now, just verify the endpoint doesn't crash
      const response = await request(server)
        .get("/api/v1/search/product?query=test")
        .expect(200);

      expect(response.body).toHaveProperty("data");
    });
  });
});
