const logger = require("./logger");

/**
 * Performance monitoring utility
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      searchLatency: 1000, // 1 second
      memoryUsage: 80, // 80%
      errorRate: 5, // 5%
      cacheHitRate: 60, // 60%
    };
  }

  /**
   * Track API response time
   */
  trackApiCall(endpoint, method, responseTime, statusCode) {
    const key = `${method}_${endpoint}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        totalCalls: 0,
        totalTime: 0,
        errors: 0,
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
      });
    }

    const metric = this.metrics.get(key);
    metric.totalCalls++;
    metric.totalTime += responseTime;
    metric.avgResponseTime = metric.totalTime / metric.totalCalls;
    metric.minResponseTime = Math.min(metric.minResponseTime, responseTime);
    metric.maxResponseTime = Math.max(metric.maxResponseTime, responseTime);

    if (statusCode >= 400) {
      metric.errors++;
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(key, metric, responseTime);
  }

  /**
   * Track search performance
   */
  trackSearchPerformance(query, responseTime, resultCount, cacheHit = false) {
    const searchMetric = this.getOrCreateMetric("search_performance");

    searchMetric.totalSearches++;
    searchMetric.totalTime += responseTime;
    searchMetric.avgResponseTime =
      searchMetric.totalTime / searchMetric.totalSearches;
    searchMetric.totalResults += resultCount;

    if (cacheHit) {
      searchMetric.cacheHits++;
    }

    searchMetric.cacheHitRate =
      (searchMetric.cacheHits / searchMetric.totalSearches) * 100;

    // Alert on slow searches
    if (responseTime > this.thresholds.searchLatency) {
      this.triggerAlert("slow_search", {
        query,
        responseTime,
        threshold: this.thresholds.searchLatency,
      });
    }

    // Log search analytics
    logger.info("Search performance tracked", {
      query: query.substring(0, 50),
      responseTime: `${responseTime}ms`,
      resultCount,
      cacheHit,
      avgResponseTime: `${Math.round(searchMetric.avgResponseTime)}ms`,
    });
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    const memUsage = process.memoryUsage();
    const memoryMetric = this.getOrCreateMetric("memory_usage");

    memoryMetric.heapUsed = memUsage.heapUsed;
    memoryMetric.heapTotal = memUsage.heapTotal;
    memoryMetric.external = memUsage.external;
    memoryMetric.rss = memUsage.rss;
    memoryMetric.usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // Alert on high memory usage
    if (memoryMetric.usagePercent > this.thresholds.memoryUsage) {
      this.triggerAlert("high_memory", {
        usagePercent: memoryMetric.usagePercent,
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        threshold: this.thresholds.memoryUsage,
      });
    }

    return memoryMetric;
  }

  /**
   * Track error rates
   */
  trackError(type, endpoint, error) {
    const errorMetric = this.getOrCreateMetric("errors");

    if (!errorMetric.byType) {
      errorMetric.byType = new Map();
      errorMetric.byEndpoint = new Map();
    }

    // Track by error type
    const typeCount = errorMetric.byType.get(type) || 0;
    errorMetric.byType.set(type, typeCount + 1);

    // Track by endpoint
    const endpointCount = errorMetric.byEndpoint.get(endpoint) || 0;
    errorMetric.byEndpoint.set(endpoint, endpointCount + 1);

    errorMetric.totalErrors = (errorMetric.totalErrors || 0) + 1;

    logger.error("Error tracked in monitoring", {
      type,
      endpoint,
      error: error.message,
      totalErrors: errorMetric.totalErrors,
    });
  }

  /**
   * Get or create metric
   */
  getOrCreateMetric(key) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        totalCalls: 0,
        totalTime: 0,
        errors: 0,
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        totalSearches: 0,
        totalResults: 0,
        cacheHits: 0,
        cacheHitRate: 0,
        totalErrors: 0,
      });
    }
    return this.metrics.get(key);
  }

  /**
   * Check for performance alerts
   */
  checkPerformanceAlerts(endpoint, metric, responseTime) {
    const errorRate = (metric.errors / metric.totalCalls) * 100;

    // High error rate alert
    if (errorRate > this.thresholds.errorRate && metric.totalCalls > 10) {
      this.triggerAlert("high_error_rate", {
        endpoint,
        errorRate: Math.round(errorRate),
        totalCalls: metric.totalCalls,
        errors: metric.errors,
        threshold: this.thresholds.errorRate,
      });
    }

    // Slow response alert
    if (responseTime > this.thresholds.searchLatency) {
      this.triggerAlert("slow_response", {
        endpoint,
        responseTime,
        avgResponseTime: Math.round(metric.avgResponseTime),
        threshold: this.thresholds.searchLatency,
      });
    }
  }

  /**
   * Trigger performance alert
   */
  triggerAlert(type, data) {
    const alertKey = `${type}_${Date.now()}`;
    const alert = {
      type,
      data,
      timestamp: new Date(),
      severity: this.getAlertSeverity(type),
    };

    this.alerts.set(alertKey, alert);

    // Log alert
    logger.warn("Performance alert triggered", alert);

    // In production, you would send this to monitoring service
    // Example: sendToMonitoringService(alert);
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const severities = {
      slow_search: "medium",
      high_memory: "high",
      high_error_rate: "high",
      slow_response: "medium",
    };
    return severities[type] || "low";
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    const metrics = {};

    for (const [key, value] of this.metrics) {
      metrics[key] = {
        ...value,
        byType: value.byType ? Object.fromEntries(value.byType) : undefined,
        byEndpoint: value.byEndpoint
          ? Object.fromEntries(value.byEndpoint)
          : undefined,
      };
    }

    return {
      metrics,
      alerts: Array.from(this.alerts.values()).slice(-10), // Last 10 alerts
      thresholds: this.thresholds,
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }

  /**
   * Health check
   */
  getHealthStatus() {
    const memoryMetric = this.trackMemoryUsage();
    const searchMetric = this.metrics.get("search_performance") || {};
    const recentAlerts = Array.from(this.alerts.values())
      .filter((alert) => Date.now() - alert.timestamp.getTime() < 300000) // Last 5 minutes
      .filter((alert) => alert.severity === "high");

    const isHealthy =
      memoryMetric.usagePercent < this.thresholds.memoryUsage &&
      recentAlerts.length === 0 &&
      (searchMetric.avgResponseTime || 0) < this.thresholds.searchLatency;

    return {
      status: isHealthy ? "healthy" : "degraded",
      checks: {
        memory: {
          status:
            memoryMetric.usagePercent < this.thresholds.memoryUsage
              ? "pass"
              : "fail",
          usage: `${Math.round(memoryMetric.usagePercent)}%`,
          threshold: `${this.thresholds.memoryUsage}%`,
        },
        search: {
          status:
            (searchMetric.avgResponseTime || 0) < this.thresholds.searchLatency
              ? "pass"
              : "warn",
          avgResponseTime: `${Math.round(searchMetric.avgResponseTime || 0)}ms`,
          threshold: `${this.thresholds.searchLatency}ms`,
        },
        alerts: {
          status: recentAlerts.length === 0 ? "pass" : "fail",
          recentHighSeverityAlerts: recentAlerts.length,
        },
      },
      uptime: Math.floor(process.uptime()),
      timestamp: new Date(),
    };
  }

  /**
   * Clear old metrics and alerts
   */
  cleanup() {
    // Keep only recent alerts (last hour)
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, alert] of this.alerts) {
      if (alert.timestamp.getTime() < oneHourAgo) {
        this.alerts.delete(key);
      }
    }

    logger.info("Performance monitor cleanup completed", {
      activeAlerts: this.alerts.size,
      totalMetrics: this.metrics.size,
    });
  }
}

// Create singleton instance
const monitor = new PerformanceMonitor();

// Schedule periodic cleanup
setInterval(() => {
  monitor.cleanup();
}, 3600000); // Every hour

module.exports = monitor;
