module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  globalSetup: './scripts/jestGlobalSetup.js',
  globalTeardown: './scripts/jestGlobalTeardown.js',
  testEnvironment: './scripts/jestEnv.js',
  setupFilesAfterEnv: ['./scripts/jestPerTestSetup.ts'],
  moduleNameMapper: {
    testUtils: '<rootDir>/packages/playground/testUtils.ts'
  },
  globals: {
    'ts-jest': {
      tsconfig: './packages/playground/tsconfig.json'
    }
  }
}
