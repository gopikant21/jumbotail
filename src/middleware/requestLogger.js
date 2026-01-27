const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log incoming request
  logger.info("Request received", {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    query: req.query,
    body: req.method !== "GET" ? req.body : undefined,
  });

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - startTime;

    // Log request completion
    logger.request(req, res, duration, {
      responseSize: res.get("Content-Length") || 0,
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;
