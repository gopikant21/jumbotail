const logger = require("../../src/utils/logger");

describe("Logger Utility", () => {
  let logSpy;

  beforeEach(() => {
    // Mock console methods to capture log output
    logSpy = {
      error: jest.spyOn(console, "error").mockImplementation(() => {}),
      warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
      info: jest.spyOn(console, "info").mockImplementation(() => {}),
      debug: jest.spyOn(console, "debug").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // Restore original console methods
    Object.values(logSpy).forEach((spy) => spy.mockRestore());
  });

  describe("Log Levels", () => {
    it("should log error messages", () => {
      const errorMessage = "Test error message";
      const errorMeta = { code: "TEST_ERROR" };

      logger.error(errorMessage, errorMeta);

      // Winston will use console transport in test environment
      expect(logSpy.error).toHaveBeenCalled();
    });

    it("should log warning messages", () => {
      const warnMessage = "Test warning message";
      const warnMeta = { component: "TestComponent" };

      logger.warn(warnMessage, warnMeta);

      expect(logSpy.warn).toHaveBeenCalled();
    });

    it("should log info messages", () => {
      const infoMessage = "Test info message";
      const infoMeta = { operation: "test" };

      logger.info(infoMessage, infoMeta);

      expect(logSpy.info).toHaveBeenCalled();
    });

    it("should log debug messages in test environment", () => {
      const debugMessage = "Test debug message";
      const debugMeta = { step: "initialization" };

      logger.debug(debugMessage, debugMeta);

      expect(logSpy.debug).toHaveBeenCalled();
    });
  });

  describe("Metadata Handling", () => {
    it("should handle complex metadata objects", () => {
      const complexMeta = {
        user: { id: "123", name: "testuser" },
        request: {
          url: "/api/search",
          method: "GET",
          params: { q: "test" },
        },
        performance: {
          duration: 150,
          timestamp: new Date().toISOString(),
        },
      };

      logger.info("Complex metadata test", complexMeta);

      expect(logSpy.info).toHaveBeenCalled();
    });

    it("should handle Error objects", () => {
      const error = new Error("Test error");
      error.code = "TEST_ERROR";
      error.statusCode = 500;

      logger.error("Error object test", { error });

      expect(logSpy.error).toHaveBeenCalled();
    });

    it("should handle circular references in metadata", () => {
      const circularObj = { name: "test" };
      circularObj.self = circularObj;

      // Should not throw error
      expect(() => {
        logger.info("Circular reference test", { data: circularObj });
      }).not.toThrow();
    });
  });

  describe("Performance Logging", () => {
    it("should support performance timing logs", () => {
      const startTime = Date.now();

      // Simulate some operation
      setTimeout(() => {
        const duration = Date.now() - startTime;

        logger.info("Operation completed", {
          operation: "test_operation",
          duration: `${duration}ms`,
          performance: true,
        });

        expect(logSpy.info).toHaveBeenCalled();
      }, 10);
    });
  });

  describe("Request Logging", () => {
    it("should format HTTP request logs consistently", () => {
      const requestLog = {
        method: "GET",
        url: "/api/products/search",
        query: { q: "iPhone", limit: 10 },
        userAgent: "Jest Test Runner",
        ip: "127.0.0.1",
        responseTime: 45,
        statusCode: 200,
      };

      logger.info("HTTP Request", requestLog);

      expect(logSpy.info).toHaveBeenCalled();
    });

    it("should handle request errors appropriately", () => {
      const errorLog = {
        method: "POST",
        url: "/api/products",
        statusCode: 400,
        error: "Validation failed",
        validationErrors: [
          { field: "title", message: "Title is required" },
          { field: "price", message: "Price must be positive" },
        ],
      };

      logger.error("HTTP Request Error", errorLog);

      expect(logSpy.error).toHaveBeenCalled();
    });
  });

  describe("Application Events", () => {
    it("should log application startup events", () => {
      logger.info("Application starting", {
        event: "app_start",
        port: 3000,
        environment: "test",
        timestamp: new Date().toISOString(),
      });

      expect(logSpy.info).toHaveBeenCalled();
    });

    it("should log application shutdown events", () => {
      logger.info("Application shutting down", {
        event: "app_shutdown",
        reason: "SIGTERM",
        uptime: "00:05:30",
        timestamp: new Date().toISOString(),
      });

      expect(logSpy.info).toHaveBeenCalled();
    });
  });

  describe("Data Operations", () => {
    it("should log search operations", () => {
      logger.info("Search executed", {
        operation: "search",
        query: "iPhone 15",
        filters: {
          category: "Mobile",
          priceRange: { min: 50000, max: 100000 },
        },
        resultCount: 5,
        duration: 25,
        cached: false,
      });

      expect(logSpy.info).toHaveBeenCalled();
    });

    it("should log product operations", () => {
      logger.info("Product created", {
        operation: "product_create",
        productId: "prod_123",
        title: "iPhone 15 Pro",
        category: "Mobile",
        price: 100000,
      });

      expect(logSpy.info).toHaveBeenCalled();
    });
  });

  describe("Security Events", () => {
    it("should log rate limiting events", () => {
      logger.warn("Rate limit exceeded", {
        event: "rate_limit_exceeded",
        ip: "192.168.1.100",
        endpoint: "/api/search",
        limit: 100,
        current: 101,
        resetTime: Date.now() + 3600000,
      });

      expect(logSpy.warn).toHaveBeenCalled();
    });

    it("should log validation errors", () => {
      logger.warn("Input validation failed", {
        event: "validation_error",
        endpoint: "/api/products",
        errors: [
          { field: "price", value: -100, message: "Price must be positive" },
        ],
      });

      expect(logSpy.warn).toHaveBeenCalled();
    });
  });
});
