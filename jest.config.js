module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  globalSetup: './packages/test-utils/globalSetup.js',
  globalTeardown: './packages/test-utils/globalTeardown.js',
  testEnvironment: './packages/test-utils/playwrightEnv.js',
  moduleNameMapper: {
    '@vitejs/test-utils': '<rootDir>/packages/test-utils/setup.ts'
  },
  globals: {
    'ts-jest': {
      tsconfig: './packages/playground/tsconfig.json'
    }
  }
}
