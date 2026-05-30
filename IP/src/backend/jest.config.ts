import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/*.spec.ts'],
  maxWorkers: 1,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts'],
  coveragePathIgnorePatterns: ['src/server\\.ts$', 'src/database/migrate\\.ts$'],
  clearMocks: true,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
  }
};

export default config;
