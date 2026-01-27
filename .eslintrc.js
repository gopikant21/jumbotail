module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ["standard"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    // Allow console statements (for debugging)
    "no-console": "off",

    // Prefer const for variables that are never reassigned
    "prefer-const": "error",

    // Require semicolons
    semi: ["error", "always"],

    // Allow trailing commas
    "comma-dangle": ["error", "only-multiline"],

    // Enforce consistent spacing
    "space-before-function-paren": ["error", "never"],

    // Allow unused variables if they start with underscore
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
  overrides: [
    {
      // Test files can have additional flexibility
      files: ["**/*.test.js", "**/*.spec.js"],
      rules: {
        "no-unused-expressions": "off",
      },
    },
  ],
};
