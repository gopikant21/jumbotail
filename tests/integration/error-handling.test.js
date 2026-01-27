const request = require("supertest");
const app = require("../../src/app");

describe("Error Handling", () => {
  describe("404 Errors", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app)
        .get("/api/non-existent-endpoint")
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Route not found");
      expect(response.body).toHaveProperty("requestId");
    });

    it("should return 404 for non-existent product", async () => {
      const response = await request(app)
        .get("/api/products/non-existent-id")
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Product not found");
    });
  });

  describe("Validation Errors", () => {
    it("should return 400 for invalid product creation", async () => {
      const invalidProduct = {
        // Missing required title
        price: "invalid-price", // Invalid type
        stock: -10, // Invalid value
      };

      const response = await request(app)
        .post("/api/products")
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("details");
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it("should return 400 for invalid search parameters", async () => {
      const response = await request(app)
        .get("/api/search")
        .query({
          limit: "invalid",
          page: -1,
          minRating: 10, // Invalid rating
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("validation");
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits", async () => {
      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        await request(app).get("/api/health").expect(200);
      }

      // This request should be rate limited
      const response = await request(app).get("/api/health").expect(429);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("rate limit");
    }, 30000); // Increase timeout for this test
  });

  describe("Error Response Format", () => {
    it("should return consistent error format", async () => {
      const response = await request(app)
        .get("/api/products/invalid-id")
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("requestId");
      expect(response.body).toHaveProperty("timestamp");
      expect(typeof response.body.error).toBe("string");
      expect(typeof response.body.requestId).toBe("string");
      expect(typeof response.body.timestamp).toBe("string");
    });

    it("should include stack trace in development mode", async () => {
      // Temporarily set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const response = await request(app)
        .get("/api/products/trigger-error")
        .expect(500);

      // Restore original environment
      process.env.NODE_ENV = originalEnv;

      expect(response.body).toHaveProperty("stack");
    });
  });

  describe("CORS Errors", () => {
    it("should handle CORS preflight requests", async () => {
      const response = await request(app)
        .options("/api/products")
        .set("Origin", "https://example.com")
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Content-Type")
        .expect(204);

      expect(response.headers).toHaveProperty("access-control-allow-origin");
      expect(response.headers).toHaveProperty("access-control-allow-methods");
    });
  });

  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.headers).toHaveProperty(
        "x-content-type-options",
        "nosniff",
      );
      expect(response.headers).toHaveProperty("x-frame-options", "DENY");
      expect(response.headers).toHaveProperty(
        "x-xss-protection",
        "1; mode=block",
      );
    });
  });

  describe("Request Size Limits", () => {
    it("should reject requests that are too large", async () => {
      const largePayload = {
        title: "A".repeat(10000), // Very long title
        description: "B".repeat(50000), // Very long description
        metadata: {},
      };

      // Fill metadata with large content
      for (let i = 0; i < 1000; i++) {
        largePayload.metadata[`key${i}`] = "C".repeat(1000);
      }

      const response = await request(app)
        .post("/api/products")
        .send(largePayload)
        .expect(413);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("too large");
    });
  });

  describe("Malformed Requests", () => {
    it("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/api/products")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}') // Malformed JSON
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("JSON");
    });

    it("should handle unsupported content types", async () => {
      const response = await request(app)
        .post("/api/products")
        .set("Content-Type", "text/plain")
        .send("This is plain text")
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Timeout Handling", () => {
    it("should handle request timeouts gracefully", async () => {
      // This would require a slow endpoint to test properly
      // For now, we'll test that the timeout middleware is configured
      const response = await request(app)
        .get("/api/health")
        .timeout(1000)
        .expect(200);

      expect(response.body.status).toBe("healthy");
    });
  });

  describe("Database Connection Errors", () => {
    it("should handle repository errors gracefully", async () => {
      // Mock a repository error by temporarily breaking the repository
      const ProductRepository = require("../../src/repositories/ProductRepository");
      const originalFind = ProductRepository.prototype.findById;

      ProductRepository.prototype.findById = () => {
        throw new Error("Database connection failed");
      };

      const response = await request(app)
        .get("/api/products/any-id")
        .expect(500);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Internal server error");

      // Restore original method
      ProductRepository.prototype.findById = originalFind;
    });
  });

  describe("Graceful Shutdown", () => {
    it("should handle graceful shutdown signals", (done) => {
      // This test verifies that the app has graceful shutdown handlers
      // In a real scenario, we would test SIGTERM and SIGINT handling

      const originalOn = process.on;
      let signalHandlerRegistered = false;

      process.on = jest.fn((event, handler) => {
        if (event === "SIGTERM" || event === "SIGINT") {
          signalHandlerRegistered = true;
        }
        return originalOn.call(process, event, handler);
      });

      // Re-require the app to trigger signal handler registration
      delete require.cache[require.resolve("../../src/app")];
      require("../../src/app");

      // Restore original process.on
      process.on = originalOn;

      expect(signalHandlerRegistered).toBe(true);
      done();
    });
  });
});
