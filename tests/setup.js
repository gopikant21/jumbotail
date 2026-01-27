// Global test setup
global.console = {
  ...console,
  // Suppress console.log during tests unless needed
  log: process.env.DEBUG_TESTS ? console.log : () => {},
  info: process.env.DEBUG_TESTS ? console.info : () => {},
  warn: console.warn,
  error: console.error,
};

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error";
process.env.PORT = 3001;

// Mock external dependencies if needed
jest.setTimeout(10000);
