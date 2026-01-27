module.exports = {
  // Test environment configuration
  testEnvironment: "node",

  // Test file patterns
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: ["src/**/*.js", "!src/app.js", "!src/**/index.js"],

  // Setup and teardown
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Test timeout
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,
};
