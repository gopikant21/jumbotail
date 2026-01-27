const winston = require("winston");

// Custom format for console logging
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(meta).length) {
      log += "\n" + JSON.stringify(meta, null, 2);
    }

    return log;
  }),
);

// Custom format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: fileFormat,
  defaultMeta: {
    service: "ecommerce-search",
    environment: process.env.NODE_ENV || "development",
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // File transport for errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Create logs directory if it doesn't exist
const fs = require("fs");
const path = require("path");
const logsDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Performance logging helper
logger.performance = (message, startTime, metadata = {}) => {
  const duration = Date.now() - startTime;
  logger.info(message, {
    duration: `${duration}ms`,
    ...metadata,
  });

  if (duration > 1000) {
    logger.warn(`Slow operation detected: ${message}`, {
      duration: `${duration}ms`,
      ...metadata,
    });
  }
};

// Request logging helper
logger.request = (req, res, duration, metadata = {}) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    duration: `${duration}ms`,
    statusCode: res.statusCode,
    ...metadata,
  };

  if (res.statusCode >= 400) {
    logger.error("Request failed", logData);
  } else if (duration > 1000) {
    logger.warn("Slow request", logData);
  } else {
    logger.info("Request completed", logData);
  }
};

module.exports = logger;
