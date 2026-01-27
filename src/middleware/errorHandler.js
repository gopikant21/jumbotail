const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

const errorHandler = (error, req, res, next) => {
  // Default to 500 server error
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";
  let code = error.code || "INTERNAL_ERROR";

  // Log error
  if (statusCode >= 500) {
    logger.error("Internal server error:", {
      error: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn("Client error:", {
      error: error.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid data format";
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  } else if (error.code === "ECONNREFUSED") {
    statusCode = 503;
    message = "Service temporarily unavailable";
    code = "SERVICE_UNAVAILABLE";
  }

  // Prepare error response
  const errorResponse = {
    error: {
      code,
      message,
      ...(error.details && { details: error.details }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === "development" && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
};
