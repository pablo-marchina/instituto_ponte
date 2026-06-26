import type { Config } from "jest";
const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testTimeout: 30_000,
  setupFiles: ["<rootDir>/src/tests/setup-env.ts"],
  extensionsToTreatAsEsm: [".ts"],
  testMatch: ["**/*.test.ts"],
  maxWorkers: 1,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/tests/setup-env.ts",
    "!src/database/migrate.ts",
    "!src/server.ts",
  ],
  coverageReporters: ["text", "json-summary", "lcov"],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  clearMocks: true,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },
};

export default config;
