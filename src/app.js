require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const routes = require('./routes');
const { initializeStore } = require('./services/dataService');

class Application {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.host = process.env.HOST || 'localhost';
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] 
        : true,
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 1000, // limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(requestLogger);

    // Request timeout
    this.app.use((req, res, next) => {
      req.setTimeout(parseInt(process.env.REQUEST_TIMEOUT) || 30000, () => {
        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process'
        });
      });
      next();
    });
  }

  setupRoutes() {
    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Welcome to Jumbotail E-commerce Search Engine API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api/v1',
          documentation: '/api/v1/docs' // if you have API docs
        },
        timestamp: new Date().toISOString()
      });
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 60)} minutes`,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api/v1', routes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        suggestion: 'Check the API documentation for available endpoints'
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use(errorHandler);

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Graceful shutdown signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  async initialize() {
    try {
      // Initialize in-memory data store
      logger.info('Initializing in-memory data store...');
      await initializeStore();
      logger.info('Data store initialized successfully');

      return true;
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(this.port, this.host, () => {
        logger.info(`🚀 E-commerce Search Engine started`);
        logger.info(`📍 Server running at http://${this.host}:${this.port}`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`💾 Memory limit: ${process.env.MAX_MEMORY_USAGE || 80}%`);
        logger.info(`📦 Product cache size: ${process.env.PRODUCT_CACHE_SIZE || 50000}`);
      });

      return this.server;
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new Application();
  app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = Application;