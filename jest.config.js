module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  testTimeout: process.env.CI ? 15000 : 5000,
  globalSetup: './scripts/jestGlobalSetup.js',
  globalTeardown: './scripts/jestGlobalTeardown.js',
  testEnvironment: './scripts/jestEnv.js',
  setupFilesAfterEnv: ['./scripts/jestPerTestSetup.ts'],
  watchPathIgnorePatterns: ['<rootDir>/temp'],
  moduleNameMapper: {
    testUtils: '<rootDir>/packages/playground/testUtils.ts'
  },
  globals: {
    'ts-jest': {
      tsconfig: './packages/playground/tsconfig.json'
    }
  }
}
