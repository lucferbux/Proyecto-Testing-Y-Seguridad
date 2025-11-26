module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // MongoDB Memory Server
  globalSetup: './src/tests/setup.ts',
  globalTeardown: './src/tests/teardown.ts',
  
  // Run tests sequentially to avoid shared DB conflicts
  maxWorkers: 1,
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/tests/**'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
