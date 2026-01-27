const PerformanceMonitor = require("../../src/utils/performanceMonitor");

describe("PerformanceMonitor", () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe("Basic Timing", () => {
    it("should start and end timing correctly", async () => {
      monitor.startTiming("test_operation");

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 100));

      const duration = monitor.endTiming("test_operation");

      expect(duration).toBeGreaterThan(90);
      expect(duration).toBeLessThan(200);
    });

    it("should handle multiple concurrent timings", async () => {
      monitor.startTiming("operation1");
      monitor.startTiming("operation2");

      await new Promise((resolve) => setTimeout(resolve, 50));
      const duration2 = monitor.endTiming("operation2");

      await new Promise((resolve) => setTimeout(resolve, 50));
      const duration1 = monitor.endTiming("operation1");

      expect(duration2).toBeLessThan(duration1);
      expect(duration1).toBeGreaterThan(90);
    });

    it("should return null for non-existent timing", () => {
      const duration = monitor.endTiming("non_existent");
      expect(duration).toBeNull();
    });
  });

  describe("Request Tracking", () => {
    it("should track request performance", () => {
      const requestData = {
        method: "GET",
        path: "/api/search",
        statusCode: 200,
        responseTime: 150,
        contentLength: 2048,
      };

      monitor.trackRequest(requestData);
      const stats = monitor.getRequestStats();

      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBe(150);
      expect(stats.statusCodes["200"]).toBe(1);
    });

    it("should calculate correct averages for multiple requests", () => {
      const requests = [
        {
          method: "GET",
          path: "/api/search",
          statusCode: 200,
          responseTime: 100,
        },
        {
          method: "GET",
          path: "/api/search",
          statusCode: 200,
          responseTime: 200,
        },
        {
          method: "GET",
          path: "/api/search",
          statusCode: 404,
          responseTime: 50,
        },
      ];

      requests.forEach((req) => monitor.trackRequest(req));
      const stats = monitor.getRequestStats();

      expect(stats.totalRequests).toBe(3);
      expect(stats.averageResponseTime).toBe(116.67); // (100+200+50)/3
      expect(stats.statusCodes["200"]).toBe(2);
      expect(stats.statusCodes["404"]).toBe(1);
    });

    it("should track request paths separately", () => {
      const requests = [
        {
          method: "GET",
          path: "/api/search",
          statusCode: 200,
          responseTime: 100,
        },
        {
          method: "GET",
          path: "/api/products",
          statusCode: 200,
          responseTime: 150,
        },
        {
          method: "GET",
          path: "/api/search",
          statusCode: 200,
          responseTime: 120,
        },
      ];

      requests.forEach((req) => monitor.trackRequest(req));
      const pathStats = monitor.getPathStats();

      expect(pathStats["/api/search"].count).toBe(2);
      expect(pathStats["/api/search"].averageTime).toBe(110);
      expect(pathStats["/api/products"].count).toBe(1);
      expect(pathStats["/api/products"].averageTime).toBe(150);
    });
  });

  describe("Memory Monitoring", () => {
    it("should track memory usage", () => {
      monitor.trackMemoryUsage();
      const memStats = monitor.getMemoryStats();

      expect(memStats.heapUsed).toBeGreaterThan(0);
      expect(memStats.heapTotal).toBeGreaterThan(memStats.heapUsed);
      expect(memStats.rss).toBeGreaterThan(0);
    });

    it("should calculate memory trends", () => {
      monitor.trackMemoryUsage();

      // Simulate memory increase
      const largeArray = new Array(100000).fill("memory test");
      monitor.trackMemoryUsage();

      const trends = monitor.getMemoryTrends();
      expect(trends.measurements).toHaveLength(2);
      expect(trends.trend).toBeGreaterThan(0); // Memory should have increased

      // Clean up
      largeArray.length = 0;
    });
  });

  describe("Alert System", () => {
    it("should trigger alerts for high response times", () => {
      const alerts = [];
      monitor.onAlert((alert) => alerts.push(alert));

      // Simulate high response time
      monitor.trackRequest({
        method: "GET",
        path: "/api/slow-endpoint",
        statusCode: 200,
        responseTime: 2000, // 2 seconds
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("HIGH_RESPONSE_TIME");
      expect(alerts[0].value).toBe(2000);
    });

    it("should trigger alerts for high error rates", () => {
      const alerts = [];
      monitor.onAlert((alert) => alerts.push(alert));

      // Generate requests with 50% error rate
      for (let i = 0; i < 20; i++) {
        monitor.trackRequest({
          method: "GET",
          path: "/api/test",
          statusCode: i % 2 === 0 ? 200 : 500,
          responseTime: 100,
        });
      }

      const errorRateAlerts = alerts.filter(
        (a) => a.type === "HIGH_ERROR_RATE",
      );
      expect(errorRateAlerts.length).toBeGreaterThan(0);
    });

    it("should trigger alerts for high memory usage", () => {
      const alerts = [];
      monitor.onAlert((alert) => alerts.push(alert));

      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn(() => ({
        rss: 1024 * 1024 * 1024, // 1GB
        heapTotal: 512 * 1024 * 1024,
        heapUsed: 500 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0,
      }));

      monitor.trackMemoryUsage();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("HIGH_MEMORY_USAGE");

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe("Statistics Export", () => {
    it("should export comprehensive statistics", () => {
      // Generate some test data
      monitor.trackRequest({
        method: "GET",
        path: "/api/search",
        statusCode: 200,
        responseTime: 100,
      });
      monitor.trackRequest({
        method: "POST",
        path: "/api/products",
        statusCode: 201,
        responseTime: 200,
      });
      monitor.trackMemoryUsage();

      const stats = monitor.getAllStats();

      expect(stats).toHaveProperty("requests");
      expect(stats).toHaveProperty("memory");
      expect(stats).toHaveProperty("paths");
      expect(stats).toHaveProperty("timestamp");

      expect(stats.requests.totalRequests).toBe(2);
      expect(stats.memory).toHaveProperty("heapUsed");
      expect(stats.paths).toHaveProperty("/api/search");
      expect(stats.paths).toHaveProperty("/api/products");
    });

    it("should reset statistics correctly", () => {
      // Generate some test data
      monitor.trackRequest({
        method: "GET",
        path: "/api/test",
        statusCode: 200,
        responseTime: 100,
      });
      monitor.trackMemoryUsage();

      expect(monitor.getRequestStats().totalRequests).toBe(1);

      monitor.reset();

      const stats = monitor.getRequestStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
      expect(Object.keys(stats.statusCodes)).toHaveLength(0);
    });
  });

  describe("Performance Middleware Integration", () => {
    it("should integrate with Express middleware pattern", () => {
      const mockReq = {
        method: "GET",
        path: "/api/test",
        ip: "127.0.0.1",
      };

      const mockRes = {
        statusCode: 200,
        get: jest.fn(() => "1024"),
      };

      const next = jest.fn();

      // Simulate middleware behavior
      const startTime = Date.now();

      // Simulate response completion
      setTimeout(() => {
        const responseTime = Date.now() - startTime;

        monitor.trackRequest({
          method: mockReq.method,
          path: mockReq.path,
          statusCode: mockRes.statusCode,
          responseTime: responseTime,
          contentLength: parseInt(mockRes.get("content-length") || "0"),
        });

        const stats = monitor.getRequestStats();
        expect(stats.totalRequests).toBe(1);
        expect(stats.averageResponseTime).toBeGreaterThan(0);
      }, 10);
    });
  });

  describe("Resource Monitoring", () => {
    it("should monitor system resources", () => {
      const resources = monitor.getSystemResources();

      expect(resources).toHaveProperty("memory");
      expect(resources).toHaveProperty("uptime");
      expect(resources).toHaveProperty("loadAverage");
      expect(resources.memory).toHaveProperty("used");
      expect(resources.memory).toHaveProperty("total");
      expect(typeof resources.uptime).toBe("number");
    });

    it("should calculate resource utilization percentages", () => {
      const resources = monitor.getSystemResources();

      expect(resources.memory.utilizationPercent).toBeGreaterThan(0);
      expect(resources.memory.utilizationPercent).toBeLessThan(100);
    });
  });
});
