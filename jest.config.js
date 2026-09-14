module.exports = {
  testEnvironment: "node",
  // roots: ["<rootDir>/test", "<rootDir>/models", "<rootDir>/pages"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  watchPathIgnorePatterns: [
    "node_modules",
    "dist",
    "build",
    "public",
    ".next",
    ".swc",
  ],

  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/tests/**",
    "!**/jest.config.js",
  ],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
