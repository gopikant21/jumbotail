const performanceMonitor = require("../utils/performanceMonitor");
const logger = require("../utils/logger");

/**
 * Performance monitoring middleware
 */
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime();

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;
    const [seconds, nanoseconds] = process.hrtime(startHrTime);
    const durationMs = seconds * 1000 + nanoseconds * 1e-6;

    // Track API performance
    performanceMonitor.trackApiCall(
      req.route ? req.route.path : req.path,
      req.method,
      Math.round(durationMs),
      res.statusCode,
    );

    // Track search-specific metrics
    if (req.path.includes("/search")) {
      const query = req.query.query || "";
      const resultCount = res.locals.resultCount || 0;
      const cacheHit = res.locals.cacheHit || false;

      performanceMonitor.trackSearchPerformance(
        query,
        Math.round(durationMs),
        resultCount,
        cacheHit,
      );
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = performanceMiddleware;
